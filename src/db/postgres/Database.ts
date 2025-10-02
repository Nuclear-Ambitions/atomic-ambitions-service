import { Kysely, PostgresDialect, CamelCasePlugin } from 'kysely'
import { Pool, PoolConfig } from 'pg'
import { DB } from './types'
import * as dotenv from 'dotenv'

dotenv.config()

// Environment-specific database configuration
const getDatabaseConfig = (): PoolConfig => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isStaging = process.env.NODE_ENV === 'staging'

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  const config: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    // SSL configuration for production/staging
    ssl: isProduction || isStaging ? { rejectUnauthorized: false } : false,
    // Connection pool settings
    min: isProduction ? 5 : 2,
    max: isProduction ? 20 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    // Additional production settings
    ...(isProduction && {
      statement_timeout: 30000,
      query_timeout: 30000,
    })
  }

  return config
}

export const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool(getDatabaseConfig()),
  }),
  // plugins: [new CamelCasePlugin()]
});