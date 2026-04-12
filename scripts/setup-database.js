#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps you set up and verify your database connection.
 * Run: node scripts/setup-database.js
 */

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function testConnection() {
  console.log('\n🔍 Testing database connection...\n')
  
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful!\n')
    return true
  } catch (error) {
    console.error('❌ Database connection failed!\n')
    console.error('Error:', error.message)
    console.error('\n💡 Tips:')
    console.error('   1. Check your DATABASE_URL in .env.local')
    console.error('   2. Make sure MongoDB is running (if local)')
    console.error('   3. Check network access (if using Atlas)\n')
    return false
  }
}

async function checkSchema() {
  console.log('📊 Checking database schema...\n')
  
  try {
    // Try to query users collection
    const userCount = await prisma.user.count()
    console.log(`✅ Schema is set up correctly!`)
    console.log(`   Found ${userCount} user(s) in database\n`)
    return true
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('collection')) {
      console.log('⚠️  Schema not found. You need to push the schema.\n')
      console.log('   Run: npm run db:push\n')
      return false
    }
    console.error('❌ Error checking schema:', error.message)
    return false
  }
}

async function createTestUser() {
  console.log('🧪 Creating test user...\n')
  
  const email = await question('Enter test email (or press Enter to skip): ')
  if (!email) {
    console.log('   Skipped test user creation\n')
    return
  }

  const name = await question('Enter test name: ')
  const password = await question('Enter test password: ')

  try {
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existing) {
      console.log('⚠️  User already exists with this email\n')
      return
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        isPremium: false,
        planType: 'free'
      }
    })

    // Create credentials account
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'credentials',
        provider: 'credentials',
        providerAccountId: user.id,
        access_token: hashedPassword
      }
    })

    console.log('✅ Test user created successfully!')
    console.log(`   Email: ${email}`)
    console.log(`   ID: ${user.id}\n`)
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message)
    console.error('\n')
  }
}

async function showStats() {
  console.log('📈 Database Statistics:\n')
  
  try {
    const [userCount, accountCount, projectCount] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.project.count()
    ])

    console.log(`   Users: ${userCount}`)
    console.log(`   Accounts: ${accountCount}`)
    console.log(`   Projects: ${projectCount}\n`)
  } catch (error) {
    console.error('❌ Error getting stats:', error.message)
    console.error('\n')
  }
}

async function main() {
  console.log('\n🚀 Database Setup Script\n')
  console.log('=' .repeat(50))

  // Test connection
  const connected = await testConnection()
  if (!connected) {
    console.log('❌ Cannot proceed without database connection.')
    console.log('   Please fix your DATABASE_URL and try again.\n')
    rl.close()
    await prisma.$disconnect()
    process.exit(1)
  }

  // Check schema
  const schemaOk = await checkSchema()
  if (!schemaOk) {
    console.log('⚠️  Please run: npm run db:push\n')
  }

  // Show stats
  await showStats()

  // Ask to create test user
  const createUser = await question('Create a test user? (y/n): ')
  if (createUser.toLowerCase() === 'y') {
    await createTestUser()
  }

  console.log('✅ Setup complete!\n')
  console.log('Next steps:')
  console.log('   1. Test registration at /register')
  console.log('   2. Test login at /auth/signin')
  console.log('   3. View database at http://localhost:5555 (run: npm run db:studio)\n')

  rl.close()
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error('❌ Fatal error:', error)
  rl.close()
  await prisma.$disconnect()
  process.exit(1)
})
