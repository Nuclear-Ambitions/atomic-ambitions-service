import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('users')
    .addColumn("stripe_customer_id", "text")
    .execute()

  await db.schema.createTable('stripe_subscriptions')
    .addColumn("id", "text", col => col.notNull().unique())
    .addColumn("stripe_customer_id", "text")
    .addColumn("user_id", "uuid", col => col.references('users.id').onDelete('cascade'))
    .addColumn("customer_email", "text")
    .addColumn("plan_price_id", "int4")
    .addColumn("plan_product_id", "text")
    .addColumn("plan_amount", "int4")
    .addColumn("plan_interval", "text")
    .addColumn("payment_status", "text")
    .addColumn("status", "text")
    .addColumn('current_period_start', 'timestamptz')
    .addColumn('current_period_end', 'timestamptz')
    .addColumn('cancel_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .addColumn('updated_at', 'timestamptz', (col) => col.defaultTo(sql`now()`).notNull())
    .execute()

  await db.schema.createTable('stripe_sessions')
    .addColumn("id", "text", col => col.notNull().unique())
    .addColumn("payload", "json")
    .execute()

}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('stripe_subscriptions').ifExists().execute()
  await db.schema.dropTable('stripe_sessions').ifExists().execute()
  await db.schema.alterTable('users')
    .dropColumn('stripe_customer_id')
    .execute()
}
