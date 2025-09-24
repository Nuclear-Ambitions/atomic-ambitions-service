import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createTable('membership')
    .addColumn('userId', 'uuid')
    .addColumn('agreedToTermsAt', 'timestamptz')
    .addColumn('joinedAt', 'timestamptz')
    .addColumn('updatedAt', 'timestamptz')
    .addColumn('level', 'text')
    .addColumn('status', 'text')
    .execute()

  await db.schema.createTable('subscription')
    .addColumn('id', 'serial')
    .addColumn('updatedAt', 'timestamptz')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('subscription').execute()
  await db.schema.dropTable('membership').execute()
}

// TODO: list use cases; sus out data model
