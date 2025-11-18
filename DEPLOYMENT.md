# Deployment Guide - GitHub Pages

This guide will help you deploy the Airport Task Management Application to GitHub Pages.

## Prerequisites

1. The database schema must be set up in Supabase (see SETUP.md)
2. Your code must be pushed to GitHub

## Step 1: Configure GitHub Secrets

You need to add your Supabase credentials as GitHub secrets so the build process can access them.

1. Go to your GitHub repository: `https://github.com/eotto2014/Claude_Airport_Task_App`
2. Click on **Settings** (in the top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add the first secret:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://qpfhynhqdubjbloboqmk.supabase.com`
   - Click **Add secret**
6. Click **New repository secret** again
7. Add the second secret:
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: `sb_publishable_I5lOpEBZm8iTAKhdBgiquw_z3ZBy2IW`
   - Click **Add secret**

## Step 2: Enable GitHub Pages

1. Still in **Settings**, scroll down the left sidebar to **Pages**
2. Under **Source**, select:
   - Source: **GitHub Actions**
3. Click **Save**

## Step 3: Deploy

The deployment will happen automatically whenever you push to the `main` branch.

To trigger the first deployment:

1. Push your code to GitHub (already done!)
2. Go to the **Actions** tab in your repository
3. You should see a workflow running called "Deploy to GitHub Pages"
4. Wait for it to complete (usually 2-3 minutes)

## Step 4: Access Your App

Once deployment is complete:

1. Go to the **Actions** tab
2. Click on the latest successful workflow run
3. You'll see a deployment URL, or go directly to:
   - `https://eotto2014.github.io/Claude_Airport_Task_App/`

## Manual Deployment

You can also manually trigger a deployment:

1. Go to the **Actions** tab
2. Click on **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select the `main` branch
5. Click **Run workflow**

## Troubleshooting

### Deployment fails with "secrets not found"
- Go back to Step 1 and verify both secrets are added correctly
- Make sure the secret names match exactly (case-sensitive)

### App loads but shows "Missing Supabase environment variables"
- The secrets aren't being passed correctly
- Check that secret names in `.github/workflows/deploy.yml` match the secrets you created

### App shows but nothing loads / database errors
- Make sure you ran the SQL schema in Supabase (see SETUP.md)
- Verify your Supabase project is active and running
- Check browser console for errors

### 404 error when accessing the deployed app
- Make sure GitHub Pages is enabled (Step 2)
- Check that the `base` path in `vite.config.js` matches your repository name
- Wait a few minutes after the first deployment

## Updating Your App

Whenever you make changes to the code:

1. Commit your changes: `git add . && git commit -m "Your message"`
2. Push to GitHub: `git push`
3. The deployment will automatically run
4. Your site will update in 2-3 minutes

## Custom Domain (Optional)

To use a custom domain:

1. In GitHub Settings → Pages
2. Enter your custom domain
3. Follow GitHub's instructions to configure DNS
4. Update the `base` in `vite.config.js` to `/`

## Important Notes

- The app will be publicly accessible once deployed
- Your Supabase credentials are stored securely as GitHub secrets
- The `.env` file is NOT uploaded to GitHub (protected by `.gitignore`)
- The deployed app will use the secrets you configured in Step 1

## Security Considerations

For production use, consider:
- Enabling Supabase Row Level Security with authentication
- Using Supabase Auth for user login
- Restricting who can access the database
- Setting up proper user roles and permissions
