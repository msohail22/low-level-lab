import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { drizzle } from 'drizzle-orm/pglite'

import { authSchema } from '../../worker/db/auth-schema'
import { contentSchema } from '../../worker/db/content-schema'

/**
 * A real Postgres (PGlite: Postgres compiled to WebAssembly) running inside the test process.
 *
 * It is migrated with the same hand-written SQL in worker/migrations/ that the deployed database
 * ran, so the schema under test is the applied history, not what drizzle thinks it should be.
 * Each test file gets its own instance; `resetDatabase` empties every table between tests.
 *
 * This module must not import anything from worker/ that touches worker/db/client.ts, because the
 * integration tests mock that module with a factory that imports this one.
 */

const migrationsDir = fileURLToPath(new URL('../../worker/migrations/', import.meta.url))

let client: PGlite | undefined
let database: ReturnType<typeof createDrizzle> | undefined

function createDrizzle(pg: PGlite) {
	return drizzle(pg, { schema: { ...authSchema, ...contentSchema } })
}

export async function startDatabase() {
	if (database) return database
	client = new PGlite({ extensions: { pg_trgm } })
	for (const file of readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort()) {
		await client.exec(readFileSync(migrationsDir + file, 'utf8'))
	}
	database = createDrizzle(client)
	return database
}

/** The drizzle client the mocked `createDatabase` hands to the Worker. */
export function testDatabase() {
	if (!database) throw new Error('startDatabase() must run in beforeAll before any request')
	return database
}

/** Raw SQL, for assertions on what actually landed in the tables. */
export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
	if (!client) throw new Error('startDatabase() has not run')
	return (await client.query<T>(sql, params)).rows
}

/** Stands in for worker/db/client.ts: every request gets the one test database. */
export const clientMock = {
	createDatabase: () => testDatabase(),
	closeDatabases: async () => {},
}

export async function resetDatabase() {
	await query(`TRUNCATE question_progress, question_attempt, question_workflow_event, question_revision,
		question, topic, user_role, verification, account, session, "user" CASCADE`)
}

export async function stopDatabase() {
	await client?.close()
	client = undefined
	database = undefined
}
