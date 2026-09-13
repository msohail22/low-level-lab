import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { authSchema } from './schema.js'

export function createDatabase(env: Env) {
	const pool = new Pool({
		connectionString: env.LOW_LEVEL_LAB_DB.connectionString,
		max: 1,
	})

	return drizzle(pool, { schema: authSchema })
}
