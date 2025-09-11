# Neon Database Setup for LO2S Admin

This guide will help you set up your LO2S admin system with Neon PostgreSQL database.

## Prerequisites

- Node.js 18+ installed
- A Neon account (free tier available)

## Step 1: Create Neon Database

1. Go to [neon.tech](https://neon.tech/) and sign up/login
2. Create a new project
3. Choose a project name (e.g., "lo2s-admin")
4. Select a region close to your users
5. Copy the connection string from the dashboard

## Step 2: Configure Environment Variables

1. Update your `.env.local` file in the `admin/` directory:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"

# Cloudinary (existing config)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="jlago"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="portfolio_preset"
CLOUDINARY_CLOUD_NAME="jlago"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Static site paths
STATIC_SITE_PATH="../"
WORK_PAGES_PATH="../work"
ASSETS_PATH="../d2csodhem33bqt.cloudfront.net/uploads"

# Admin app
NEXTAUTH_SECRET="lo2s-admin-secret-2024"
NEXTAUTH_URL="http://localhost:3001"
```

## Step 3: Run Database Setup

```bash
cd admin
npm run setup-neon
```

This will:
- Generate the Prisma client for PostgreSQL
- Create all database tables in Neon
- Seed the database with initial categories
- Verify the connection

## Step 4: Start the Admin System

```bash
npm run dev
```

Your admin system will be available at [http://localhost:3001](http://localhost:3001)

## Database Schema

The system includes these main tables:

- **projects** - Portfolio projects with media and metadata
- **categories** - Project categorization (3D Mapping, Creative Direction, etc.)
- **project_categories** - Many-to-many relationship between projects and categories
- **media_blocks** - Additional media content for projects
- **team_members** - Project team information
- **clients** - Client information and logos
- **settings** - System configuration

## Benefits of Neon

- ✅ **Serverless** - Scales to zero when not in use
- ✅ **PostgreSQL** - Full SQL database with advanced features
- ✅ **Branching** - Create database branches for development
- ✅ **Backup** - Automatic backups and point-in-time recovery
- ✅ **Global** - Deploy in multiple regions
- ✅ **Free Tier** - Generous free usage limits

## Troubleshooting

### Connection Issues
- Verify your DATABASE_URL is correct
- Check that your IP is whitelisted in Neon console
- Ensure the database exists and is accessible

### Migration Issues
- Run `npx prisma db push --force-reset` to reset the schema
- Check Prisma logs for specific error messages

### Performance
- Neon may have cold start delays on free tier
- Consider upgrading to paid tier for production use

## Production Deployment

When deploying to production:

1. Create a production Neon database
2. Set the production DATABASE_URL in your hosting platform
3. Run migrations: `npx prisma db push`
4. Deploy your application

## Support

- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [LO2S Admin Issues](https://github.com/mycloudclinic/jordan-lago/issues)
