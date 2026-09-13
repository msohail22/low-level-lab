import { asc, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { createAuth } from './auth.js'
import { question, topic } from './db/schema.js'
import { createDatabase } from './db/client.js'

export const questionTypes = ['single_choice', 'multiple_choice', 'true_false', 'math', 'ai', 'code_output'] as const
export const difficulties = ['beginner', 'intermediate', 'advanced'] as const
export const questionStatuses = ['draft', 'archived'] as const

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

function createId() {
	return crypto.randomUUID()
}

function toJsonResponse(data: unknown, status = 200) {
	return Response.json(data, { status })
}

async function requireUser(request: Request, env: Env) {
	const session = await createAuth(env, request).api.getSession({
		headers: request.headers,
	})
	return session?.user ?? null
}

async function parseBody<T>(request: Request, schema: z.ZodType<T>) {
	const body: unknown = await request.json()
	const result = schema.safeParse(body)

	if (!result.success) {
		return { error: toJsonResponse({ error: 'Invalid request', issues: result.error.issues }, 400) }
	}

	return { data: result.data }
}

export async function handleTopicRequest(request: Request, env: Env, topicId?: string): Promise<Response> {
	const db = createDatabase(env)
	const method = request.method

	if (method === 'GET') {
		if (topicId) {
			const item = await db.query.topic.findFirst({ where: eq(topic.id, topicId) })
			return item ? toJsonResponse(item) : toJsonResponse({ error: 'Topic not found' }, 404)
		}

		const items = await db.query.topic.findMany({
			where: isNull(topic.archivedAt),
			orderBy: asc(topic.name),
		})
		return toJsonResponse(items)
	}

	if (!topicId && method === 'POST') {
		const user = await requireUser(request, env)
		if (!user) return toJsonResponse({ error: 'Authentication required' }, 401)
		const parsed = await parseBody(request, topicInputSchema)
		if ('error' in parsed) return parsed.error ?? toJsonResponse({ error: 'Invalid request' }, 400)
		const [created] = await db.insert(topic).values({ id: createId(), ...parsed.data }).returning()
		return toJsonResponse(created, 201)
	}

	if (topicId && method === 'PUT') {
		const user = await requireUser(request, env)
		if (!user) return toJsonResponse({ error: 'Authentication required' }, 401)
		const parsed = await parseBody(request, topicInputSchema)
		if ('error' in parsed) return parsed.error ?? toJsonResponse({ error: 'Invalid request' }, 400)
		const [updated] = await db.update(topic).set({ ...parsed.data, updatedAt: new Date() }).where(eq(topic.id, topicId)).returning()
		return updated ? toJsonResponse(updated) : toJsonResponse({ error: 'Topic not found' }, 404)
	}

	if (topicId && method === 'DELETE') {
		const user = await requireUser(request, env)
		if (!user) return toJsonResponse({ error: 'Authentication required' }, 401)
		const [archived] = await db.update(topic).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(topic.id, topicId)).returning()
		return archived ? toJsonResponse(archived) : toJsonResponse({ error: 'Topic not found' }, 404)
	}

	return toJsonResponse({ error: 'Method not allowed' }, 405)
}

export async function handleQuestionRequest(request: Request, env: Env, questionId?: string): Promise<Response> {
	const db = createDatabase(env)
	const method = request.method

	if (method === 'GET') {
		if (questionId) {
			const item = await db.query.question.findFirst({
				where: eq(question.id, questionId),
			})
			return item ? toJsonResponse(item) : toJsonResponse({ error: 'Question not found' }, 404)
		}

		const items = await db.query.question.findMany({
			where: eq(question.status, 'draft'),
			orderBy: [desc(question.updatedAt), asc(question.title)],
		})
		return toJsonResponse(items)
	}

	if (!questionId && method === 'POST') {
		const user = await requireUser(request, env)
		if (!user) return toJsonResponse({ error: 'Authentication required' }, 401)
		const parsed = await parseBody(request, questionInputSchema)
		if ('error' in parsed) return parsed.error ?? toJsonResponse({ error: 'Invalid request' }, 400)
		const [created] = await db.insert(question).values({
			id: createId(),
			authorId: user.id,
			...parsed.data,
		}).returning()
		return toJsonResponse(created, 201)
	}

	if (questionId && method === 'PUT') {
		const user = await requireUser(request, env)
		if (!user) return toJsonResponse({ error: 'Authentication required' }, 401)
		const parsed = await parseBody(request, questionInputSchema)
		if ('error' in parsed) return parsed.error ?? toJsonResponse({ error: 'Invalid request' }, 400)
		const [updated] = await db.update(question).set({ ...parsed.data, updatedAt: new Date() }).where(eq(question.id, questionId)).returning()
		return updated ? toJsonResponse(updated) : toJsonResponse({ error: 'Question not found' }, 404)
	}

	if (questionId && method === 'DELETE') {
		const user = await requireUser(request, env)
		if (!user) return toJsonResponse({ error: 'Authentication required' }, 401)
		const [archived] = await db.update(question).set({ status: 'archived', archivedAt: new Date(), updatedAt: new Date() }).where(eq(question.id, questionId)).returning()
		return archived ? toJsonResponse(archived) : toJsonResponse({ error: 'Question not found' }, 404)
	}

	return toJsonResponse({ error: 'Method not allowed' }, 405)
}
