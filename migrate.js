import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔄 Running database migrations...')

const db = new Database(join(__dirname, 'database.db'))

// Read and execute all migration files
const migrations = [
  '0001_initial_schema.sql',
  '0002_update_schema_roloove.sql',
  '0003_add_photo_fields.sql'
]

for (const migration of migrations) {
  console.log(`📝 Applying ${migration}...`)
  const sql = readFileSync(join(__dirname, 'migrations', migration), 'utf-8')
  
  // Split by semicolon and execute each statement
  const statements = sql.split(';').filter(s => s.trim())
  
  for (const statement of statements) {
    try {
      db.exec(statement)
    } catch (error) {
      // Ignore "already exists" errors
      if (!error.message.includes('already exists')) {
        console.error(`Error in ${migration}:`, error.message)
      }
    }
  }
}

db.close()
console.log('✅ Database migrations completed!')
