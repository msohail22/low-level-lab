import { z } from 'zod'

export const questionTypes = ['single_choice', 'multiple_choice', 'true_false', 'math', 'ai', 'code_output'] as const
export const difficulties = ['beginner', 'intermediate', 'advanced'] as const
export const questionStatuses = ['draft', 'submitted', 'in_review', 'approved', 'published', 'changes_requested', 'rejected', 'archived'] as const
export const workflowTransitions = ['submit', 'start_review', 'request_changes', 'reject', 'approve', 'publish'] as const

const nonEmptyText = z.string().trim().min(1)

export const topicInputSchema = z.object({
	name: nonEmptyText.max(120),
	slug: nonEmptyText.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	description: z.string().trim().max(500).nullable().optional(),
})

export const questionInputSchema = z.object({
	title: nonEmptyText.max(240),
	slug: nonEmptyText.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	body: nonEmptyText.max(20_000),
	type: z.enum(questionTypes),
	topicId: nonEmptyText,
	subtopic: z.string().trim().max(120).nullable().optional(),
	difficulty: z.enum(difficulties),
	options: z.array(nonEmptyText.max(500)).max(10).default([]),
	correctAnswer: z.union([nonEmptyText.max(500), z.array(nonEmptyText.max(500)).min(1).max(10)]),
	explanation: z.string().trim().max(5_000).nullable().optional(),
}).superRefine((value, context) => {
	if (value.type === 'single_choice' && (value.options.length < 2 || typeof value.correctAnswer !== 'string' || !value.options.includes(value.correctAnswer))) {
		context.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'Single-choice questions need at least two options and one selected option.' })
	}

	if (value.type === 'multiple_choice' && (value.options.length < 2 || !Array.isArray(value.correctAnswer) || value.correctAnswer.some((answer) => !value.options.includes(answer)))) {
		context.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'Multiple-choice questions need at least two options and selected options from that list.' })
	}

	if (value.type === 'true_false' && (value.correctAnswer !== 'true' && value.correctAnswer !== 'false')) {
		context.addIssue({ code: 'custom', path: ['correctAnswer'], message: 'True/false questions must use true or false as the answer.' })
	}
})

export type QuestionInput = z.infer<typeof questionInputSchema>
export type TopicInput = z.infer<typeof topicInputSchema>

export const questionSearchSchema = z.object({
	search: z.string().trim().max(200).optional(),
	topicId: z.string().trim().optional(),
	subtopic: z.string().trim().optional(),
	type: z.enum(questionTypes).optional(),
	status: z.enum(['published', 'solved', 'unsolved']).optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

export const answerSubmissionSchema = z.object({
	answer: z.union([nonEmptyText.max(5_000), z.array(nonEmptyText.max(500)).max(10)]),
})

export const workflowTransitionSchema = z.object({
	reason: z.string().trim().max(1_000).nullable().optional(),
})

export type QuestionSearch = z.infer<typeof questionSearchSchema>
export type AnswerSubmission = z.infer<typeof answerSubmissionSchema>

export const questionResponseSchema = z.object({
	id: z.string(),
	slug: z.string(),
	title: z.string(),
	body: z.string(),
	type: z.enum(questionTypes),
	topicId: z.string(),
	subtopic: z.string().nullable().optional(),
	difficulty: z.enum(difficulties),
	options: z.array(z.string()),
	explanation: z.string().nullable().optional(),
	status: z.enum(questionStatuses),
	solved: z.boolean().optional(),
})

export const questionListResponseSchema = z.object({
	items: z.array(questionResponseSchema),
	total: z.number(),
})

export const topicResponseSchema = z.object({
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	total: z.number(),
	solved: z.number(),
	subtopics: z.array(z.string()).optional(),
	questions: z.array(questionResponseSchema).optional(),
})

export type QuestionResponse = z.infer<typeof questionResponseSchema>
export type TopicResponse = z.infer<typeof topicResponseSchema>
