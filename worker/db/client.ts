import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { authSchema } from './auth-schema.js'
import { contentSchema } from './content-schema.js'

/**
 * Pools opened while handling the current request.
 *
 * A pool must NOT be cached across requests. Its socket belongs to the I/O
 * context of the request that opened it, so a later request on the same
 * isolate hangs on it until the runtime cancels the request ("your Worker's
 * code had hung and would never generate a response"). Hyperdrive does the
 * real connection pooling, so opening per request is the intended shape —
 * we just have to close what we open.
 */
const openPools = new Set<Pool>()

export function createDatabase(env: Env) {
	const connectionString = env.DATABASE_URL ?? env.LOW_LEVEL_LAB_DB.connectionString
	const pool = new Pool({ connectionString, max: 1 })
	openPools.add(pool)

	return drizzle(pool, { schema: { ...authSchema, ...contentSchema } })
}

/** Close every pool opened during this request. Call from `ctx.waitUntil`. */
export async function closeDatabases() {
	const pools = [...openPools]
	openPools.clear()
	await Promise.allSettled(pools.map((pool) => pool.end()))
}
