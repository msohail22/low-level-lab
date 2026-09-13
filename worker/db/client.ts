import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { authSchema } from './schema.js'

let cachedConnectionString: string | undefined
let cachedPool: Pool | undefined

export function createDatabase(env: Env) {
	const connectionString =
		env.DATABASE_URL ?? env.LOW_LEVEL_LAB_DB.connectionString

	if (!cachedPool || cachedConnectionString !== connectionString) {
		cachedConnectionString = connectionString
		cachedPool = new Pool({ connectionString, max: 1 })
	}

	return drizzle(cachedPool, { schema: authSchema })
}
