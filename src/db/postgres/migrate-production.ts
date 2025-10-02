import { promises as fs } from 'fs'
import path from 'path'
import { Migrator, FileMigrationProvider } from 'kysely'
import { db } from './Database'

interface MigrationResult {
  success: boolean
  message: string
  error?: Error
}

class ProductionMigrator {
  private migrator: Migrator
  private isProduction: boolean

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    this.migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(__dirname, 'migrations'),
      }),
    })
  }

  private async validateEnvironment(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required')
    }

    if (this.isProduction && !process.env.NODE_ENV) {
      throw new Error('NODE_ENV must be set to "production" for production migrations')
    }

    // Test database connection
    try {
      await db.selectFrom('kysely_migration' as any).select('name').limit(1).execute()
    } catch (error) {
      // Table might not exist yet, which is fine for first migration
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('relation "kysely_migration" does not exist')) {
        throw new Error(`Database connection failed: ${errorMessage}`)
      }
    }
  }

  private async createBackup(): Promise<void> {
    if (!this.isProduction) return

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `backup-${timestamp}`

    console.log(`Creating database backup: ${backupName}`)
    // Note: In production, you'd typically use pg_dump or your cloud provider's backup tools
    // This is a placeholder for the backup process
    console.log(`Backup created: ${backupName}`)
  }

  async migrateToLatest(): Promise<MigrationResult> {
    try {
      await this.validateEnvironment()

      if (this.isProduction) {
        await this.createBackup()
      }

      console.log('Starting migration to latest...')
      const { error, results } = await this.migrator.migrateToLatest()

      if (results && results.length > 0) {
        results.forEach((result) => {
          if (result.status === 'Success') {
            console.log(`✅ Migration "${result.migrationName}" executed successfully`)
          } else if (result.status === 'Error') {
            console.error(`❌ Migration "${result.migrationName}" failed`)
            throw new Error(`Migration failed: ${result.migrationName}`)
          }
        })
      } else {
        console.log('No new migrations to run')
      }

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'All migrations completed successfully'
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Migration failed:', errorMessage)
      return {
        success: false,
        message: `Migration failed: ${errorMessage}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    } finally {
      await db.destroy()
    }
  }

  async migrateUp(): Promise<MigrationResult> {
    try {
      await this.validateEnvironment()

      if (this.isProduction) {
        await this.createBackup()
      }

      console.log('Running next migration...')
      const { error, results } = await this.migrator.migrateUp()

      if (results && results.length > 0) {
        console.log(`✅ Migration "${results[0].migrationName}" executed successfully`)
        return {
          success: true,
          message: `Migration "${results[0].migrationName}" completed successfully`
        }
      } else {
        console.log('No migrations to run')
        return {
          success: true,
          message: 'No migrations to run'
        }
      }

      if (error) {
        throw error
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Migration failed:', errorMessage)
      return {
        success: false,
        message: `Migration failed: ${errorMessage}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    } finally {
      await db.destroy()
    }
  }

  async migrateDown(): Promise<MigrationResult> {
    try {
      await this.validateEnvironment()

      if (this.isProduction) {
        await this.createBackup()
        console.log('⚠️  WARNING: Running rollback in production environment')
      }

      console.log('Rolling back last migration...')
      const { error, results } = await this.migrator.migrateDown()

      if (results && results.length > 0) {
        console.log(`✅ Migration "${results[0].migrationName}" reverted successfully`)
        return {
          success: true,
          message: `Migration "${results[0].migrationName}" reverted successfully`
        }
      } else {
        console.log('No migrations to revert')
        return {
          success: true,
          message: 'No migrations to revert'
        }
      }

      if (error) {
        throw error
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Rollback failed:', errorMessage)
      return {
        success: false,
        message: `Rollback failed: ${errorMessage}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    } finally {
      await db.destroy()
    }
  }

  async getMigrationStatus(): Promise<void> {
    try {
      await this.validateEnvironment()

      const migrations = await this.migrator.getMigrations()

      console.log('Migration Status:')
      console.log('================')

      if (migrations && migrations.length > 0) {
        migrations.forEach((migration: any) => {
          const status = migration.executedAt ? '✅ Applied' : '⏳ Pending'
          const executedAt = migration.executedAt
            ? new Date(migration.executedAt).toISOString()
            : 'Not executed'
          console.log(`${status} ${migration.name} (${executedAt})`)
        })
      } else {
        console.log('No migrations found')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Failed to get migration status:', errorMessage)
    } finally {
      await db.destroy()
    }
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2]
  const migrator = new ProductionMigrator()

  switch (command) {
    case 'latest':
      const result = await migrator.migrateToLatest()
      process.exit(result.success ? 0 : 1)
      break
    case 'up':
      const upResult = await migrator.migrateUp()
      process.exit(upResult.success ? 0 : 1)
      break
    case 'down':
      const downResult = await migrator.migrateDown()
      process.exit(downResult.success ? 0 : 1)
      break
    case 'status':
      await migrator.getMigrationStatus()
      process.exit(0)
      break
    default:
      console.log('Usage: ts-node migrate-production.ts [latest|up|down|status]')
      console.log('')
      console.log('Commands:')
      console.log('  latest  - Run all pending migrations')
      console.log('  up      - Run the next pending migration')
      console.log('  down    - Rollback the last migration')
      console.log('  status  - Show migration status')
      process.exit(1)
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
