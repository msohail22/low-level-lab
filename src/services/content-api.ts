import type { QuestionResponse, TopicResponse } from '@low-level-lab/shared/content'

export type ApiQuestion = QuestionResponse
export type ApiTopic = TopicResponse

async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, { credentials: 'include', ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } })
	if (!response.ok) {
		const body = await response.json().catch(() => null) as { error?: string } | null
		throw new Error(body?.error ?? `Request failed (${response.status})`)
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
