import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('users')
    .addColumn("stripe_customer_id", "text")
    .execute()

  await db.schema.createTable('products')
    .addColumn("id", "uuid", col => col.notNull().unique())
    .addColumn("name", "text")
    .addColumn("stripe_product_id", "text")
    .addColumn("stripe_price_id", "text")
    .addColumn("interval", "text")
    .addColumn("price", "float4")
    .addColumn("currency", "text")
    .execute()

  await db.schema.createTable('subscriptions')
    .addColumn("id", "uuid", col => col.notNull().unique())
    .addColumn("user_id", "uuid", col => col.references('users.id').onDelete('cascade'))
    .addColumn("product_id", "text", col => col.references('products.id').onDelete('cascade'))
    .addColumn("stripe_subscription_id", "text")
    .addColumn("status", "text")
    .addColumn('current_period_start', 'timestamptz')
    .addColumn('current_period_end', 'timestamptz')
    .addColumn('cancel_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz')
    .addColumn('updated_at', 'timestamptz')
    .execute()

  await db.schema.createTable('payments')
    .addColumn("id", "uuid", col => col.notNull().unique())
    .addColumn("subscription_id", "text", col => col.references('subscriptions.id').onDelete('cascade'))
    .addColumn("stripe_payment_intent_id", "text")
    .addColumn("amount", "float4")
    .addColumn("currency", "text")
    .addColumn('created_at', 'timestamptz')
    .execute()

}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('payments').ifExists().execute()
  await db.schema.dropTable('subscriptions').ifExists().execute()
  await db.schema.dropTable('products').ifExists().execute()
  await db.schema.alterTable('users')
    .dropColumn('stripe_customer_id')
    .execute()
}

// TODO: list use cases; sus out data model
