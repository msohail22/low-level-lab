import type { QuestionResponse, TopicResponse } from '../../types'

export type ApiQuestion = QuestionResponse
export type ApiTopic = TopicResponse

export class ApiError extends Error {
	readonly status: number
	constructor(message: string, status: number) {
		super(message)
		this.status = status
	}
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, { credentials: 'include', ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } })
	if (!response.ok) {
		const body = await response.json().catch(() => null) as { error?: string } | null
		throw new ApiError(body?.error ?? `Request failed (${response.status})`, response.status)
	}
	return response.json() as Promise<T>
}

export function listQuestions(params: Record<string, string | number | undefined> = {}) {
	const query = new URLSearchParams()
	for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(key, String(value))
	return api<{ items: ApiQuestion[]; total: number }>(`/api/questions?${query}`)
}

export function getQuestion(id: string) {
	return api<ApiQuestion>(`/api/questions/${id}`)
}

export function submitAnswer(id: string, answer: string | string[]) {
	return api<{ correct: boolean; explanation?: string | null }>(`/api/questions/${id}/answer`, { method: 'POST', body: JSON.stringify({ answer }) })
}

export function listTopics() {
	return api<ApiTopic[]>('/api/topics')
}

export function getTopic(id: string, page = 1) {
	return api<ApiTopic>(`/api/topics/${id}?page=${page}`)
}

export function createTopic(input: unknown) {
	return api<ApiTopic>('/api/topics', { method: 'POST', body: JSON.stringify(input) })
}

export function createQuestion(input: unknown) {
	return api<ApiQuestion>('/api/questions', { method: 'POST', body: JSON.stringify(input) })
}

export function getProgress() {
	return api<{ solved: number; total: number; topics: Array<{ topicId: string; total: number; solved: number }> }>('/api/progress')
}

export type AttemptHistory = {
	id: string
	questionId: string
	questionTitle: string
	correct: boolean
	answer: unknown
	createdAt: string
}

export function getProgressHistory() {
	return api<{ items: AttemptHistory[] }>('/api/progress/history')
}

export function getRevisions(id: string) {
	return api<Array<ApiQuestion & { revision: number; createdAt: string; createdBy: string }>>(`/api/questions/${id}/revisions`)
}

export function restoreRevision(id: string, revision: number) {
	return api<ApiQuestion>(`/api/questions/${id}/restore?revision=${revision}`, { method: 'POST', body: JSON.stringify({}) })
}

export function transitionQuestion(id: string, action: string, reason?: string) {
	return api<ApiQuestion>(`/api/questions/${id}/${action}`, { method: 'POST', body: JSON.stringify({ reason: reason || null }) })
}

export function listModeration(queue: 'reviewer' | 'admin') {
	return api<{ items: ApiQuestion[]; total: number }>(`/api/moderation/${queue}`)
}

export type RoleTuple = { user: string; relation: string; object: string }

export function listRoleTuples() {
	return api<{ items: RoleTuple[] }>('/api/admin/roles')
}

export function assignRole(input: { userId: string; role: string; organizationId?: string; topicId?: string }) {
	return api<{ item: RoleTuple }>('/api/admin/roles', { method: 'POST', body: JSON.stringify(input) })
}

export function removeRole(input: { userId: string; role: string; organizationId?: string; topicId?: string }) {
	return api<{ item: RoleTuple }>('/api/admin/roles', { method: 'DELETE', body: JSON.stringify(input) })
}
