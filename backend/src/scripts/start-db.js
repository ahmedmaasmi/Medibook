import EmbeddedPostgres from 'embedded-postgres'

const pg = new EmbeddedPostgres({
  databaseDir: './.embedded-db',
  user: 'postgres',
  password: 'postgres',
  port: 5432,
  persistent: true,
})

try {
  await pg.initialise()
  await pg.start()
  await pg.createDatabase('doctor_appointments')
  console.log('✅ Embedded PostgreSQL running on port 5432')
  console.log('   Database: doctor_appointments')
  console.log('   Press Ctrl+C to stop')

  process.on('SIGINT', async () => {
    await pg.stop()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await pg.stop()
    process.exit(0)
  })

  // Keep process alive
  await new Promise(() => {})
} catch (error) {
  if (error.message?.includes('already exists')) {
    console.log('✅ Embedded PostgreSQL already running')
    await new Promise(() => {})
  } else {
    console.error('Failed to start embedded PostgreSQL:', error)
    process.exit(1)
  }
}
