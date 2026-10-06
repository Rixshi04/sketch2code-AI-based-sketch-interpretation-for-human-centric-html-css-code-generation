# 🗄️ Database Setup Guide

This guide will help you set up and manage the PostgreSQL database for your SketchMaster application.

## 📋 Prerequisites

- Node.js 18+ installed
- SQLite database (file-based, no external server required)
- Prisma CLI installed (`npm install -g prisma`)

## 🚀 Quick Setup

### 1. Database Options

#### Option A: Local PostgreSQL
1. **Install PostgreSQL** on your machine
2. **Create a database**:
   ```sql
   CREATE DATABASE sketchmaster;
   ```

#### Option B: Cloud Database (Recommended for Production)

**Neon (Free PostgreSQL)**
1. Visit [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Copy the connection string

**Supabase (Free PostgreSQL)**
1. Visit [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string

**Railway (Easy Setup)**
1. Visit [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Copy the connection string

### 2. Environment Configuration

Create a `.env.local` file in your project root:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/sketchmaster"

# For cloud databases, use the provided connection string
# DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Other required variables
OPENAI_API_KEY=your_openai_api_key_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 3. Database Setup Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or create and run migrations (for production)
npm run db:migrate

# Seed the database with sample data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 🏗️ Database Schema

The database includes the following main tables:

### Users
- Authentication and profile information
- Subscription and plan details
- User preferences and settings

### Projects
- User-generated projects from sketches
- Generated code and metadata
- Analytics and engagement metrics

### Templates
- Pre-built templates for different platforms
- Code content and features
- Commercial information (pricing, premium status)

### Social Features
- **Comments**: User feedback and ratings
- **Likes**: User engagement tracking
- **Favorites**: User bookmarking
- **Shares**: Social sharing analytics

### Analytics
- User behavior tracking
- Event logging for insights
- Performance metrics

### File Uploads
- Sketch images and assets
- File metadata and relationships

## 🔧 Database Management

### Development Commands

```bash
# View database in browser
npm run db:studio

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Generate new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy
```

### Production Deployment

1. **Set up production database** (Neon, Supabase, Railway, etc.)
2. **Update DATABASE_URL** in your hosting platform
3. **Run migrations**:
   ```bash
   npm run db:migrate
   ```
4. **Generate Prisma client**:
   ```bash
   npm run db:generate
   ```

## 📊 Sample Data

The database comes with sample templates:

- **Modern Landing Page** (React)
- **E-commerce Store** (Vue.js)
- **Admin Dashboard** (React)

To add more sample data:

```bash
# Run the seed script
npm run db:seed

# Or manually add data through Prisma Studio
npm run db:studio
```

## 🔐 Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use different databases for development and production
- Rotate database passwords regularly

### Database Access
- Use connection pooling for production
- Implement proper user authentication
- Set up database backups

### Data Protection
- Encrypt sensitive user data
- Implement proper data retention policies
- Follow GDPR compliance guidelines

## 🚨 Troubleshooting

### Common Issues

#### Connection Errors
```bash
# Check database connection
npx prisma db pull

# Verify environment variables
echo $DATABASE_URL
```

#### Migration Issues
```bash
# Reset migrations
npm run db:reset

# Check migration status
npx prisma migrate status
```

#### Prisma Client Issues
```bash
# Regenerate Prisma client
npm run db:generate

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Performance Optimization

#### Indexing
The schema includes proper indexes for:
- User email lookups
- Project and template searches
- Analytics queries

#### Connection Pooling
For production, consider using connection pooling:

```env
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=5&pool_timeout=2"
```

## 📈 Monitoring

### Database Metrics
- Monitor query performance
- Track connection usage
- Set up alerts for errors

### Application Metrics
- User registration rates
- Project creation frequency
- Template usage statistics

## 🔄 Backup Strategy

### Automated Backups
- Set up daily automated backups
- Test backup restoration regularly
- Store backups in multiple locations

### Manual Backups
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Import database
psql $DATABASE_URL < backup.sql
```

## 🎯 Next Steps

1. **Set up your database** using the local SQLite database configuration
2. **Configure environment variables**
3. **Run the setup commands**
4. **Test the application**
5. **Deploy to production**

## 📞 Support

- **Prisma Documentation**: [prisma.io/docs](https://prisma.io/docs)
- **Database Issues**: Check the troubleshooting section above
- **Application Issues**: Review the main README.md

---

🎉 **Your database is now ready!** 

Start building amazing AI-powered UI components with persistent data storage! 