import { describe, expect, it } from 'vitest'

import {
	answerSubmissionSchema,
	difficulties,
	moderationQueues,
	questionInputSchema,
	questionListResponseSchema,
	questionResponseSchema,
	questionSearchSchema,
	questionStatuses,
	questionTypes,
	roleAssignmentSchema,
	roles,
	topicInputSchema,
	topicResponseSchema,
	workflowTransitions,
} from '../../types'

const baseQuestion = {
	title: 'Why does a linked-list traversal miss cache?',
	slug: 'linked-list-cache-miss',
	body: 'Work it out before you scroll.',
	type: 'single_choice' as const,
	topicId: 'topic-caches',
	difficulty: 'intermediate' as const,
	options: ['Pointer chasing defeats the prefetcher', 'Arrays are shorter'],
	correctAnswer: 'Pointer chasing defeats the prefetcher',
}

describe('enums', () => {
	it('exposes the question types the UI offers', () => {
		expect(questionTypes).toEqual([
			'single_choice', 'multiple_choice', 'true_false', 'math', 'ai', 'code_output',
		])
	})

	it('exposes the three difficulties', () => {
		expect(difficulties).toEqual(['beginner', 'intermediate', 'advanced'])
	})

	it('covers every workflow status including the terminal ones', () => {
		expect(questionStatuses).toContain('draft')
		expect(questionStatuses).toContain('published')
		expect(questionStatuses).toContain('changes_requested')
		expect(questionStatuses).toContain('rejected')
		expect(questionStatuses).toContain('archived')
	})

	it('names the six workflow transitions', () => {
		expect(workflowTransitions).toEqual([
			'submit', 'start_review', 'request_changes', 'reject', 'approve', 'publish',
		])
	})

	it('names the four roles and two moderation queues', () => {
		expect(roles).toEqual(['super_admin', 'admin', 'reviewer', 'member'])
		expect(moderationQueues).toEqual(['reviewer', 'admin'])
	})
})

describe('topicInputSchema', () => {
	it('accepts a well-formed topic', () => {
		const result = topicInputSchema.safeParse({
			name: 'Caches and locality', slug: 'caches-and-locality', description: 'Why work costs what it costs.',
		})
		expect(result.success).toBe(true)
	})

	it('accepts a null description', () => {
		expect(topicInputSchema.safeParse({ name: 'Caches', slug: 'caches', description: null }).success).toBe(true)
	})

	it('accepts an omitted description', () => {
		expect(topicInputSchema.safeParse({ name: 'Caches', slug: 'caches' }).success).toBe(true)
	})

	it.each([
		['uppercase', 'Caches'],
		['leading hyphen', '-caches'],
		['trailing hyphen', 'caches-'],
		['double hyphen', 'caches--locality'],
		['spaces', 'caches locality'],
		['underscore', 'caches_locality'],
	])('rejects a slug with %s', (_label, slug) => {
		expect(topicInputSchema.safeParse({ name: 'Caches', slug }).success).toBe(false)
	})

	it('rejects a blank name', () => {
		expect(topicInputSchema.safeParse({ name: '   ', slug: 'caches' }).success).toBe(false)
	})

	it('trims surrounding whitespace from the name', () => {
		const result = topicInputSchema.parse({ name: '  Caches  ', slug: 'caches' })
		expect(result.name).toBe('Caches')
	})

	it('rejects a name beyond 120 characters', () => {
		expect(topicInputSchema.safeParse({ name: 'x'.repeat(121), slug: 'caches' }).success).toBe(false)
	})

	it('rejects a description beyond 500 characters', () => {
		expect(topicInputSchema.safeParse({ name: 'Caches', slug: 'caches', description: 'x'.repeat(501) }).success).toBe(false)
	})
})

describe('questionInputSchema — single choice', () => {
	it('accepts a valid single-choice question', () => {
		expect(questionInputSchema.safeParse(baseQuestion).success).toBe(true)
	})

	it('rejects one with fewer than two options', () => {
		const result = questionInputSchema.safeParse({ ...baseQuestion, options: ['Only one'], correctAnswer: 'Only one' })
		expect(result.success).toBe(false)
	})

	it('rejects an answer that is not among the options', () => {
		const result = questionInputSchema.safeParse({ ...baseQuestion, correctAnswer: 'Something else entirely' })
		expect(result.success).toBe(false)
	})

	it('reports the failure against correctAnswer so the form can point at it', () => {
		const result = questionInputSchema.safeParse({ ...baseQuestion, correctAnswer: 'Nope' })
		expect(result.success).toBe(false)
		if (!result.success) expect(result.error.issues[0].path).toEqual(['correctAnswer'])
	})

	it('rejects an array answer for a single-choice question', () => {
		const result = questionInputSchema.safeParse({ ...baseQuestion, correctAnswer: [baseQuestion.options[0]] })
		expect(result.success).toBe(false)
	})
})

describe('questionInputSchema — multiple choice', () => {
	const multi = {
		...baseQuestion,
		type: 'multiple_choice' as const,
		options: ['False sharing', 'Prefetch distance', 'TLB pressure'],
		correctAnswer: ['False sharing', 'TLB pressure'],
	}

	it('accepts several answers drawn from the options', () => {
		expect(questionInputSchema.safeParse(multi).success).toBe(true)
	})

	it('rejects an answer outside the option list', () => {
		expect(questionInputSchema.safeParse({ ...multi, correctAnswer: ['False sharing', 'Not listed'] }).success).toBe(false)
	})

	it('rejects a string answer where an array is required', () => {
		expect(questionInputSchema.safeParse({ ...multi, correctAnswer: 'False sharing' }).success).toBe(false)
	})

	it('rejects an empty answer array', () => {
		expect(questionInputSchema.safeParse({ ...multi, correctAnswer: [] }).success).toBe(false)
	})
})

describe('questionInputSchema — true/false', () => {
	const tf = { ...baseQuestion, type: 'true_false' as const, options: [], correctAnswer: 'true' }

	it.each(['true', 'false'])('accepts %s', (answer) => {
		expect(questionInputSchema.safeParse({ ...tf, correctAnswer: answer }).success).toBe(true)
	})

	it.each(['True', 'yes', 'TRUE', '1'])('rejects %s', (answer) => {
		expect(questionInputSchema.safeParse({ ...tf, correctAnswer: answer }).success).toBe(false)
	})
})

describe('questionInputSchema — limits and defaults', () => {
	it('defaults options to an empty array', () => {
		const { options, ...withoutOptions } = baseQuestion
		void options
		const result = questionInputSchema.safeParse({ ...withoutOptions, type: 'math', correctAnswer: '42' })
		expect(result.success).toBe(true)
		if (result.success) expect(result.data.options).toEqual([])
	})

	it('rejects a body beyond 20,000 characters', () => {
		expect(questionInputSchema.safeParse({ ...baseQuestion, body: 'x'.repeat(20_001) }).success).toBe(false)
	})

	it('rejects more than ten options', () => {
		const options = Array.from({ length: 11 }, (_, index) => `Option ${index}`)
		expect(questionInputSchema.safeParse({ ...baseQuestion, options, correctAnswer: options[0] }).success).toBe(false)
	})

	it('rejects an unknown difficulty', () => {
		expect(questionInputSchema.safeParse({ ...baseQuestion, difficulty: 'expert' }).success).toBe(false)
	})

	it('rejects an unknown type', () => {
		expect(questionInputSchema.safeParse({ ...baseQuestion, type: 'essay' }).success).toBe(false)
	})
})

describe('questionSearchSchema', () => {
	it('defaults to the first page of twenty', () => {
		const result = questionSearchSchema.parse({})
		expect(result.page).toBe(1)
		expect(result.pageSize).toBe(20)
	})

	it('coerces numeric strings, since they arrive as query parameters', () => {
		const result = questionSearchSchema.parse({ page: '3', pageSize: '50' })
		expect(result.page).toBe(3)
		expect(result.pageSize).toBe(50)
	})

	it('rejects a page below one', () => {
		expect(questionSearchSchema.safeParse({ page: '0' }).success).toBe(false)
	})

	it('caps pageSize at fifty so a caller cannot ask for the whole bank', () => {
		expect(questionSearchSchema.safeParse({ pageSize: '51' }).success).toBe(false)
	})

	it('rejects a status outside the workflow', () => {
		expect(questionSearchSchema.safeParse({ status: 'solved' }).success).toBe(false)
	})
})

describe('answerSubmissionSchema', () => {
	it('accepts a single answer', () => {
		expect(answerSubmissionSchema.safeParse({ answer: 'L1' }).success).toBe(true)
	})

	it('accepts several answers', () => {
		expect(answerSubmissionSchema.safeParse({ answer: ['L1', 'L2'] }).success).toBe(true)
	})

	it('rejects an empty string', () => {
		expect(answerSubmissionSchema.safeParse({ answer: '' }).success).toBe(false)
	})

	it('rejects an answer beyond 5,000 characters', () => {
		expect(answerSubmissionSchema.safeParse({ answer: 'x'.repeat(5_001) }).success).toBe(false)
	})
})

describe('roleAssignmentSchema', () => {
	it('accepts an organization-scoped role', () => {
		expect(roleAssignmentSchema.safeParse({ userId: 'u1', role: 'super_admin' }).success).toBe(true)
	})

	it('accepts a topic-scoped role', () => {
		expect(roleAssignmentSchema.safeParse({ userId: 'u1', role: 'admin', topicId: 't1' }).success).toBe(true)
	})

	it('rejects an unknown role', () => {
		expect(roleAssignmentSchema.safeParse({ userId: 'u1', role: 'owner' }).success).toBe(false)
	})

	it('rejects a blank user id', () => {
		expect(roleAssignmentSchema.safeParse({ userId: '  ', role: 'admin' }).success).toBe(false)
	})
})

describe('response schemas', () => {
	const question = {
		id: 'q1', slug: 'q1', title: 'T', body: 'B', type: 'single_choice',
		topicId: 't1', difficulty: 'beginner', options: ['a', 'b'], status: 'published',
	}

	it('accepts a published question without the answer key', () => {
		expect(questionResponseSchema.safeParse(question).success).toBe(true)
	})

	it('does not carry correctAnswer through to the client', () => {
		const parsed = questionResponseSchema.parse({ ...question, correctAnswer: 'a' })
		expect(parsed).not.toHaveProperty('correctAnswer')
	})

	it('validates a paginated list', () => {
		expect(questionListResponseSchema.safeParse({ items: [question], total: 1 }).success).toBe(true)
	})

	it('validates a topic with counts', () => {
		expect(topicResponseSchema.safeParse({
			id: 't1', slug: 'caches', name: 'Caches', total: 62, solved: 24,
		}).success).toBe(true)
	})

	it('rejects a topic missing its counts', () => {
		expect(topicResponseSchema.safeParse({ id: 't1', slug: 'caches', name: 'Caches' }).success).toBe(false)
	})
})
