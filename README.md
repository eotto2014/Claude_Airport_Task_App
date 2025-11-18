# Airport Task Management Application

A React-based web application for managing airport operations, maintenance, and administrative tasks with Supabase backend integration.

## Features

- **Task Management**: Full CRUD operations for tasks with categories, priorities, and statuses
- **Team Management**: Assign tasks to team members and manage the team roster
- **Equipment Tracking**: Track tasks related to specific airport equipment and facilities
- **Recurring Tasks**: Automatically generate tasks on daily, weekly, monthly, quarterly, or annual intervals
- **Filtering & Views**: Filter tasks by category, priority, assignee, status, equipment, and due date
- **Remarks System**: Add timestamped comments to tasks to track progress
- **Real-time Sync**: Changes are synced in real-time across all users via Supabase
- **Print Support**: Print task reports

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **Backend**: Supabase (PostgreSQL database with real-time subscriptions)
- **Build Tool**: Vite

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

The Supabase credentials are already configured in the `.env` file:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase public/anon key

### 3. Set Up Database

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Copy the contents of `supabase-schema.sql`
4. Paste and run the SQL script to create all necessary tables, indexes, and policies

This will create:
- `tasks` table for task management
- `task_remarks` table for task comments
- `team_members` table for team roster
- `equipment` table for airport equipment/facilities
- All necessary indexes and Row Level Security policies
- Default data for team members and equipment

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Database Schema

### Tasks Table
- id, title, category, priority, assignee, status, equipment
- due_date, notes, is_recurring, recurring_interval
- created_at, completed_at, updated_at

### Task Remarks Table
- id, task_id (foreign key), text, timestamp

### Team Members Table
- id, name, created_at

### Equipment Table
- id, name, created_at

## Task Categories

1. **Fuel Quality Control** - Fuel testing and quality assurance
2. **Scheduled Services** - Regular maintenance and inspections
3. **Faults and Repairs** - Emergency repairs and fault resolution
4. **Capital Improvement Projects** - Major infrastructure upgrades
5. **Administrative Tasks** - Paperwork and administrative duties

## Priority Levels

- None
- Low
- Medium
- High
- Mission Critical

## Real-time Features

The application uses Supabase real-time subscriptions to automatically sync:
- Task changes (create, update, delete)
- Task remarks
- Team member updates
- Equipment updates

Multiple users can collaborate in real-time without refreshing the page.

## Security

- All tables have Row Level Security (RLS) enabled
- Currently configured for public access (modify policies in the SQL schema for production)
- Consider adding Supabase authentication for production use

## Future Enhancements

- User authentication and authorization
- Role-based access control
- Mobile app version
- Advanced reporting and analytics
- File attachments for tasks
- Email notifications
- Task templates

## Development

Built with Claude Code assistance for rapid prototyping and development.

## License

Proprietary - Airport Operations Use Only
