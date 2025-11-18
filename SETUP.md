# Setup Guide - Airport Task Management Application

Follow these steps to get your application up and running with Supabase.

## Step 1: Run the Database Schema

Before running the application, you need to set up the database tables in Supabase.

1. Open your web browser and go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: **qpfhynhqdubjbloboqmk** (URL: https://qpfhynhqdubjbloboqmk.supabase.co)
4. In the left sidebar, click on the **SQL Editor** icon (looks like a terminal/console)
5. Click **New Query**
6. Open the file `supabase-schema.sql` from this project
7. Copy ALL the contents of that file
8. Paste it into the SQL Editor in Supabase
9. Click the **Run** button (or press Ctrl+Enter / Cmd+Enter)
10. You should see a success message indicating all tables were created

## Step 2: Verify the Database Setup

After running the schema, verify everything was created correctly:

1. In Supabase, click on the **Table Editor** icon in the left sidebar
2. You should see 4 tables:
   - `tasks` - For storing all tasks
   - `task_remarks` - For storing comments on tasks
   - `team_members` - For storing team member names
   - `equipment` - For storing equipment/facility names
3. Click on `team_members` - you should see 5 default members (Pat, Evan, Cody, Wyatt, Carlos)
4. Click on `equipment` - you should see 14 default equipment items

## Step 3: Install Dependencies and Run

1. Open a terminal/command prompt in the project directory
2. Run: `npm install` (if you haven't already)
3. Run: `npm run dev`
4. Open your browser to `http://localhost:5173`

## Step 4: Test the Application

1. Click **Add Task** to create a new task
2. Fill in the details and save
3. The task should appear in the list
4. Try adding a remark to a task
5. Try updating the status of a task
6. Open the Settings to add/remove team members or equipment

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Check that `.env` file exists in the project root
- Verify it contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

### Error: "relation 'tasks' does not exist"
- You haven't run the SQL schema yet
- Go back to Step 1 and run the `supabase-schema.sql` file

### Tasks not showing up / Real-time not working
- Check your Supabase project status
- Verify the API key is correct
- Check browser console for errors

### Can't add team members or equipment (duplicate error)
- This is expected if the name already exists
- The database has a unique constraint on names

## Database Structure

### Tables Created:
1. **tasks** - Main task storage with all task properties
2. **task_remarks** - Comments/notes on tasks (one-to-many with tasks)
3. **team_members** - List of all team members
4. **equipment** - List of all airport equipment and facilities

### Features Enabled:
- Row Level Security (RLS) on all tables
- Public access policies (modify for production use)
- Real-time subscriptions enabled
- Automatic timestamps
- Cascading deletes for task remarks

## Next Steps

Once everything is working:
1. Consider adding Supabase Authentication for user login
2. Modify RLS policies for production security
3. Customize team members and equipment for your airport
4. Set up automated backups in Supabase dashboard

## Support

If you encounter issues:
1. Check the browser console for JavaScript errors
2. Check the Supabase logs in your dashboard
3. Verify your API keys are correct
4. Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)
