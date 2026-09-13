import type { AnswerSubmission, QuestionInput, QuestionSearch } from '@low-level-lab/shared/content'

import { createId } from '../lib/ids.js'
import { createQuestionRepository, type QuestionListFilters } from '../repositories/question-repository.js'

const transitions: Record<string, { from: string[]; to: string }> = {
	submit: { from: ['draft', 'changes_requested', 'rejected'], to: 'submitted' },
	start_review: { from: ['submitted'], to: 'in_review' },
	request_changes: { from: ['in_review'], to: 'changes_requested' },
	reject: { from: ['in_review'], to: 'rejected' },
	approve: { from: ['in_review'], to: 'approved' },
	publish: { from: ['approved'], to: 'published' },
}

async function contentHash(input: QuestionInput) {
	const bytes = new TextEncoder().encode(JSON.stringify(input))
	const digest = await crypto.subtle.digest('SHA-256', bytes)
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function revisionValues(question: QuestionInput & { id: string; revision: number; authorId: string }, hash: string) {
	return {
		id: createId(),
		questionId: question.id,
		revision: question.revision,
		title: question.title,
		body: question.body,
		type: question.type,
		topicId: question.topicId,
		subtopic: question.subtopic ?? null,
		difficulty: question.difficulty,
		options: question.options,
		correctAnswer: question.correctAnswer,
		explanation: question.explanation ?? null,
		contentHash: hash,
		createdBy: question.authorId,
	}
}

function normalizeAnswer(value: string) {
	return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function isCorrect(type: string, submitted: AnswerSubmission['answer'], expected: unknown) {
	if (type === 'multiple_choice') {
		if (!Array.isArray(submitted) || !Array.isArray(expected)) return false
		return submitted.length === expected.length
			&& submitted.every((answer) => expected.some((item) => normalizeAnswer(String(item)) === normalizeAnswer(answer)))
	}
	if (Array.isArray(submitted) || Array.isArray(expected)) return false
	return normalizeAnswer(submitted) === normalizeAnswer(String(expected))
}

export function createQuestionService(db: Parameters<typeof createQuestionRepository>[0]) {
	const repository = createQuestionRepository(db)

	return {
		list(filters: QuestionSearch & { userId?: string; includeDrafts?: boolean }) {
			return repository.findPage({
				...filters,
				page: filters.page ?? 1,
				pageSize: filters.pageSize ?? 20,
			} as QuestionListFilters)
		},
		get(id: string) {
			return repository.findById(id)
		},
		async create(input: QuestionInput, authorId: string) {
			const hash = await contentHash(input)
			const [created] = await repository.create({
				id: createId(),
				authorId,
				...input,
				subtopic: input.subtopic ?? null,
				explanation: input.explanation ?? null,
				contentHash: hash,
			})
			if (created) await repository.createRevision(revisionValues(created as QuestionInput & { id: string; revision: number; authorId: string }, hash))
			return created
		},
		async update(id: string, input: QuestionInput, actorId: string) {
			const existing = await repository.findById(id)
			if (!existing) return null
			const hash = await contentHash(input)
			const [updated] = await repository.update(id, {
				...input,
				subtopic: input.subtopic ?? null,
				explanation: input.explanation ?? null,
				revision: existing.revision + 1,
				contentHash: hash,
				updatedAt: new Date(),
				status: existing.status === 'published' ? 'draft' : existing.status,
			})
			if (updated) await repository.createRevision(revisionValues({ ...updated, authorId: actorId } as QuestionInput & { id: string; revision: number; authorId: string }, hash))
			return updated
		},
		archive(id: string) {
			return repository.update(id, { status: 'archived', archivedAt: new Date(), updatedAt: new Date() })
		},
		async transition(id: string, action: keyof typeof transitions, actorId: string, reason?: string | null) {
			const existing = await repository.findById(id)
			const transition = transitions[action]
			if (!existing || !transition || !transition.from.includes(existing.status)) {
				return { error: 'Invalid workflow transition' as const }
			}
			const now = new Date()
			const [updated] = await repository.update(id, {
				status: transition.to,
				updatedAt: now,
				submittedAt: action === 'submit' ? now : existing.submittedAt,
				approvedAt: action === 'approve' ? now : existing.approvedAt,
				publishedAt: action === 'publish' ? now : existing.publishedAt,
				rejectionReason: action === 'reject' || action === 'request_changes' ? reason ?? null : null,
			})
			await repository.createWorkflowEvent({
				id: createId(),
				questionId: id,
				actorId,
				fromStatus: existing.status,
				toStatus: transition.to,
				reason: reason ?? null,
			})
			return { item: updated }
		},
		revisions(id: string) {
			return repository.listRevisions(id)
		},
		async answer(id: string, userId: string, submission: AnswerSubmission) {
			const item = await repository.findById(id)
			if (!item || item.status !== 'published') return { error: 'Question not found' as const }
			const correct = isCorrect(item.type, submission.answer, item.correctAnswer)
			const now = new Date()
			await repository.createAttempt({ id: createId(), userId, questionId: id, answer: submission.answer, correct, createdAt: now })
			const previous = await repository.findProgressForQuestion(userId, id)
			const [progress] = await repository.upsertProgress({
				userId,
				questionId: id,
				solved: Boolean(previous?.solved || correct),
				attempts: (previous?.attempts ?? 0) + 1,
				lastAttemptAt: now,
				solvedAt: previous?.solvedAt ?? (correct ? now : null),
			})
			return { correct, explanation: item.explanation, progress }
		},
		progress(userId: string) {
			return repository.findProgress(userId)
		},
		topicCounts(userId?: string) {
			return repository.findTopicCounts(userId)
		},
	}
}
