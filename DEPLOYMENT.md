# Deployment Guide: Render + Netlify

This guide will help you deploy the URL Shortener application using Render for the backend/database and Netlify for the frontend.

## Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Netlify Account** - Sign up at [netlify.com](https://netlify.com)
4. **Upstash Account** - For Redis caching (free tier available)

## Step 1: Set Up Upstash Redis (for Caching)

1. Go to [upstash.com](https://upstash.com) and create an account
2. Create a new Redis database:
    - Click "Create Database"
    - Choose a name (e.g., "url-shortener-cache")
    - Select a region (preferably same as your Render region)
    - Click "Create"
3. Get credentials:
    - Copy the **REST URL** (starts with `https://`)
    - Copy the **REST TOKEN** (long string)
    - Keep these for setting up environment variables later

## Step 2: Deploy Backend on Render

### 2.1 Create PostgreSQL Database

1. Log in to [dashboard.render.com](https://dashboard.render.com)
2. Click "New +" and select "PostgreSQL"
3. Configure your database:
    - **Name**: url-shortener-db
    - **Database**: url_shortener
    - **User**: url_shortener
    - **Region**: Choose the closest to your users
    - **PostgreSQL Version**: 15
    - **Plan**: Free ($0/month, available for 90 days)
4. Click "Create Database"
5. Once created, note the **Internal Database URL** and **External Database URL**

### 2.2 Deploy Backend Web Service

1. Click "New +" and select "Web Service"
2. Connect your GitHub repository
3. Configure the service:

    - **Name**: url-shortener-api
    - **Root Directory**: server (important! - this should be set to "server")
    - **Runtime**: Node
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm run start:prod`

    > **IMPORTANT TROUBLESHOOTING**: If Render has trouble finding package.json, try one of these solutions:
    >
    > - Verify "Root Directory" is set to "server" in your Render settings
    > - If that fails, remove the "Root Directory" setting completely and use the root package.json instead

    - **Plan**: Free ($0/month)

4. Add environment variables:
    - `NODE_ENV`: production
    - `PORT`: 10000 (Render uses this port internally)
    - `DATABASE_URL`: (Copy the Internal Database URL from step 2.1)
    - `BASE_URL`: (Will be your Render service URL, can add later)
    - `UPSTASH_REDIS_REST_URL`: (Your Upstash Redis REST URL)
    - `UPSTASH_REDIS_REST_TOKEN`: (Your Upstash Redis REST Token)
5. Click "Create Web Service"
6. After deployment, note the service URL (e.g., `https://url-shortener-api.onrender.com`)

## Step 3: Deploy Frontend on Netlify

### 3.1 Prepare Frontend for Deployment

1. Make sure your frontend's API URL is configurable via environment variable:

    - Check if `client/src/services/api.ts` uses `import.meta.env.VITE_API_URL`

2. Push your code to GitHub if you haven't already

### 3.2 Deploy to Netlify

1. Log in to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure the build settings:
    - **Base directory**: client
    - **Build command**: npm run deploy
    - **Publish directory**: client/dist
5. Add environment variables:
    - `VITE_API_URL`: https://url-shortener-0jr9.onrender.com (your actual backend URL)
6. Click "Deploy site"
7. Once deployed, you can set up a custom domain if desired

> **Note**: A `netlify.toml` configuration file has been added to the client directory to simplify the deployment process. This includes build settings and redirects for the SPA.

## Step 4: Set Up Continuous Deployment

### 4.1 Render CD

Render automatically deploys whenever you push to the branch you selected during setup (usually `main`).

### 4.2 Netlify CD

Netlify automatically deploys whenever you push to the branch you selected during setup (usually `main`).

## Step 5: Database Migration Strategy

When deploying updates that include database schema changes:

1. **Add Migration**: Create a new migration with `npm run migration:new -- migration_name`
2. **Update Code**: Modify your backend code to use the new schema
3. **Test Locally**: Ensure migrations work correctly
4. **Deploy**: Push changes to GitHub - Render will run migrations automatically during deployment

## Step 6: Verify Deployment

### Backend Verification:

1. Visit your Render backend URL (e.g., `https://url-shortener-api.onrender.com`)
2. Check if the API returns a valid response
3. Test API endpoints with a tool like Postman or cURL

### Frontend Verification:

1. Visit your Netlify URL
2. Test URL shortening functionality
3. Verify redirects are working
4. Check if cache statistics are displayed correctly

## Step 7: Production Considerations

### Performance Optimization

1. **Render Sleep Mode**: Free tier services on Render sleep after 15 minutes of inactivity

    - First request after inactivity will be slow (~30 seconds)
    - Consider upgrading to a paid plan ($7/month) to avoid this
    - Or set up a cron job to ping the service every 14 minutes

2. **Database Optimization**:

    - Add appropriate indexes to frequently queried columns
    - Consider using prepared statements for frequent queries
    - Set up a database backup strategy

3. **Redis Cache**:
    - Monitor cache hit rates and adjust TTL values accordingly
    - Consider increasing cache size if hit rates are low

### Security Considerations

1. **CORS Configuration**:

    - Ensure proper CORS headers are set in `server/src/rest-api.ts`
    - Limit allowed origins to your Netlify domain

2. **Rate Limiting**:

    - Implement rate limiting to prevent abuse

3. **Environment Variables**:
    - Never expose sensitive environment variables in client code
    - Regularly rotate Redis tokens and database credentials

## Troubleshooting

### Common Issues:

1. **Build Failures**:

    - Check build logs in Render dashboard
    - Ensure all dependencies are in package.json

2. **Database Connection Issues**:

    - Verify DATABASE_URL is correct
    - Check if migrations ran successfully

3. **CORS Issues**:

    - Update backend CORS settings to include Netlify domain
    - Ensure BASE_URL matches your actual domain

4. **Environment Variables**:
    - Double-check all required variables are set
    - Verify Upstash credentials are correct

## Cost Considerations

This deployment setup leverages free tiers which may have limitations:

-   **Render Free Tier**:

    -   Web services sleep after 15 minutes of inactivity
    -   PostgreSQL free for 90 days, then $7/month
    -   500 build minutes per month

-   **Netlify Free Tier**:

    -   100GB bandwidth per month
    -   300 build minutes per month

-   **Upstash Free Tier**:
    -   10,000 commands per day
    -   256MB database size

If you need to scale beyond these limits, consider:

1. Upgrading to paid tiers
2. Exploring alternative providers like Fly.io or DigitalOcean

## Monitoring and Maintenance

1. **Render Dashboard**: Monitor service health, logs, and metrics
2. **Netlify Analytics**: Monitor frontend traffic and performance
3. **Upstash Console**: Monitor Redis usage and performance
4. **Database Backups**: Set up regular database backups
5. **Security Updates**: Keep dependencies up-to-date with security patches

---

## Summary

After following this guide, you'll have:

-   ✅ Backend API running on Render
-   ✅ PostgreSQL database on Render
-   ✅ Redis caching with Upstash
-   ✅ Frontend hosted on Netlify
-   ✅ Continuous deployment from GitHub
-   ✅ SSL certificates and custom domains
-   ✅ Monitoring and logging

Your URL shortener will be live and automatically update whenever you push changes to your main branch!
