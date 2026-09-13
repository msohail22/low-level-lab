import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { authSchema } from './auth-schema.js'
import { authorizationSchema } from './authorization-schema.js'
import { contentSchema } from './content-schema.js'

let cachedConnectionString: string | undefined
let cachedPool: Pool | undefined

export function createDatabase(env: Env) {
	const connectionString =
		env.DATABASE_URL ?? env.LOW_LEVEL_LAB_DB.connectionString

	if (!cachedPool || cachedConnectionString !== connectionString) {
		cachedConnectionString = connectionString
		cachedPool = new Pool({ connectionString, max: 1 })
	}

	return drizzle(cachedPool, { schema: { ...authSchema, ...authorizationSchema, ...contentSchema } })
}
