# Supabase Setup Guide

This guide will help you set up Supabase for your BirdieLab API project.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new Supabase project created

## Setup Steps

### 1. Create Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=4000
NODE_ENV=development
```

### 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `database/schema.sql`
3. Run the SQL script to create the users table and necessary policies

### 4. Test the Connection

Start your development server:

```bash
npm run dev
```

The server should start without errors. You can test the GraphQL endpoint at `http://localhost:4000/graphql`.

### 5. Test GraphQL Operations

You can test the following operations in the GraphQL playground:

#### Get current user's profile:
```graphql
query {
  getCurrentProfile {
    id
    name
    location
    handicap
  }
}
```

#### Update/Create profile:
```graphql
mutation {
  updateProfile(name: "John Doe", location: "San Francisco, CA", handicap: 12) {
    id
    name
    location
    handicap
  }
}
```

#### Get current user ID:
```graphql
query {
  getCurrentUserId
}
```


## Security Notes

- The current setup uses Row Level Security (RLS) with policies for authenticated users
- The service role key has full access to bypass RLS for server-side operations
- Make sure to keep your service role key secure and never expose it in client-side code
- Consider implementing proper authentication and authorization based on your application's needs

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables" error**
   - Make sure your `.env` file is in the project root
   - Verify all required environment variables are set

2. **Database connection errors**
   - Check that your Supabase URL and keys are correct
   - Ensure your Supabase project is active and not paused

3. **Permission denied errors**
   - Verify that the database schema was created successfully
   - Check that RLS policies are set up correctly

4. **GraphQL schema errors**
   - Make sure all dependencies are installed: `npm install`
   - Check that TypeScript compilation is successful: `npm run type-check`

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review the [TypeGraphQL documentation](https://typegraphql.com/)
- Check the console logs for detailed error messages
