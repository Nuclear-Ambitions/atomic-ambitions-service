import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('users')
    .addColumn("handle", "text")
    .addColumn("alias", "text")
    .addColumn("full_name", "text")
    .addColumn("created_at", "timestamptz")
    .addColumn("updated_at", "timestamptz")
    .execute()

  await db.schema.createTable('memberships')
    .addColumn('id', 'serial')
    .addColumn('user_id', 'uuid', col => col.references('users.id').onDelete('cascade'))
    .addColumn('level', 'text')
    .addColumn('status', 'text')
    .addColumn('agreed_to_terms', 'timestamptz')
    .addColumn('privacy_policy_ok', 'timestamptz')
    .addColumn('joined_at', 'timestamptz')
    .addColumn('ended_at', 'timestamptz')
    .execute()

  await db.schema
    .createIndex("memberships_userId_index")
    .on("memberships")
    .column("user_id")
    .execute()

}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('memberships').execute()
  await db.schema.alterTable('users')
    .dropColumn("handle")
    .dropColumn("alias")
    .dropColumn("full_name")
    .dropColumn("created_at")
    .dropColumn("updated_at")
    .execute()
}
