import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const createDb = (hyperdrive: Hyperdrive) => {
  const pool = new Pool({
    connectionString: hyperdrive.connectionString,
  });

  return drizzle(pool);
};
