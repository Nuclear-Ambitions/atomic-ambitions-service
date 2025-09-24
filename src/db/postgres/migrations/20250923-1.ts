import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createTable('profile')
    .addColumn('alias', 'text')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
}
