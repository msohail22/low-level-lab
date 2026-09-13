import { z } from 'zod'

export const questionTypes = ['single_choice', 'multiple_choice', 'true_false', 'math', 'ai', 'code_output'] as const
export const difficulties = ['beginner', 'intermediate', 'advanced'] as const

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
