# Christos Cakes — Setup Guide

## What You Are Setting Up
A bespoke luxury cake ordering and management platform. The stack includes a React frontend, a Supabase database for real-time data, and n8n for automated WhatsApp notifications via Twilio.

## Prerequisites
- **Supabase Account:** For database and RLS.
- **n8n Instance:** For automation workflows.
- **Twilio Account:** For sending WhatsApp messages.
- **GitHub Account:** For repository hosting and CI/CD.
- **Vercel Account:** For frontend deployment.

## Step 1 — Supabase Setup
1. **Use your existing Supabase project** or create a new one if you haven't already.
2. Open the **SQL Editor** in your Supabase dashboard.
3. Run the content of `database/schema.sql`. This creates the required tables and sets up Row Level Security (RLS).
4. Run the content of `database/dummy_data.sql` to populate the initial gallery and settings.
5. **Pre-Migration Setup:** Run this SQL to create the `exec_sql` function required for automated migrations:
   ```sql
   CREATE OR REPLACE FUNCTION exec_sql(sql text)
   RETURNS void LANGUAGE plpgsql SECURITY DEFINER
   AS $$ BEGIN EXECUTE sql; END; $$;
   ```
6. Copy your **Project URL** and **Service Role Key** from **Project Settings > API**.

## Step 2 — Create Admin Account
1. Go to your **Supabase Dashboard**.
2. Click on **Authentication** (user icon) in the left sidebar.
3. Click **Add User** > **Create New User**.
4. Enter an email and password for your admin account.
5. **Important:** Uncheck "Send invite email" to set the password manually without an email confirmation.
6. Once created, copy the **User ID** (e.g., `a1b2c3d4...`).
7. Go to the **SQL Editor** and run this SQL (replace with your copied ID):
   ```sql
   INSERT INTO admin_users (id, role) 
   VALUES ('YOUR_AUTH_USER_ID', 'admin');
   ```
8. You can now log into the Admin Portal at `/admin` using this email and password.

## Step 3 — GitHub Secrets
In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add:
- `N8N_BASE_URL`: Your n8n instance URL.
- `N8N_API_KEY`: Your n8n API key.
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key.

## Step 4 — First Push to GitHub
1. **Open your terminal** in the root directory of your project.
2. **Stage your changes:** Run `git add .` to prepare all files for the commit.
3. **Commit your changes:** Run `git commit -m "Initial build with secure admin portal"` to save your changes locally.
4. **Push to GitHub:** Run `git push origin main` to upload your code to the remote repository.
5. Check the **Actions** tab in your GitHub repository. Both `Run Database Migrations` and `Sync to n8n` should run automatically.
6. Find the n8n workflow ID in the `Sync to n8n` action log and add it to `n8n/workflow.json` if it was a new creation.

## Step 5 — n8n Setup
1. Open your n8n instance.
2. Find the **Christos Cakes Automation** workflow.
3. Open the **Secrets** node and enter your Twilio and Supabase credentials.
4. Activate the workflow.

## Step 6 — Deploy to Vercel
1. Connect your GitHub repo to Vercel.
2. Add the following environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_N8N_WEBHOOK_URL`
3. Deploy.

## Step 7 — Verify Everything Works
□ App loads at deployment URL.
□ Admin dashboard login works.
□ Submit a test order — check n8n executions.
□ Check Supabase — order row appears.
□ WhatsApp notification received.

## Step 8 — Going Live
1. Log into your owner dashboard at `/admin`.
2. Go to **Data Management**.
3. Click **Wipe Demo Data**.
4. Type `CONFIRM` and execute.
5. Your studio is now live and ready for real customers!

## Troubleshooting
- **Migration failed:** Ensure the `exec_sql` function was created in Step 1.
- **n8n sync failed:** Check your `N8N_API_KEY` and ensure the workflow JSON is valid.
- **WhatsApp not sending:** Verify Twilio sandbox settings or live credentials.
