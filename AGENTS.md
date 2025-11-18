# Airport Task Management Application

## Overview
A React-based web application for managing airport operations, maintenance, and administrative tasks.

## Tech Stack
- React with TypeScript
- Tailwind CSS for styling
- lucide-react for icons
- Browser localStorage for data persistence
- Supabase integration (configured but not yet implemented)

## Features

### Task Management
- Full CRUD operations for tasks
- Task categories:
  - Fuel Quality Control
  - Scheduled Services
  - Faults and Repairs
  - Capital Improvement Projects
  - Administrative Tasks

### Priority System
- None
- Low
- Medium
- High
- Mission Critical

### Team Management
- Assign tasks to team members
- Add/remove team members dynamically
- Default team: Pat, Evan, Cody, Wyatt, Carlos

### Equipment Tracking
- Manage airport equipment and facilities
- Default equipment includes:
  - Jet Fuel Trucks
  - Avgas Truck
  - Fire Truck
  - Hangars 1-4
  - Terminal
  - Fuel Storage Tanks
  - Runway Lighting System
  - AWOS Station

### Recurring Tasks
- Automatic task regeneration
- Intervals: Daily, Weekly, Monthly, Quarterly, Annually
- Preserves completed task history

### Filtering & Views
- Filter by category, priority, assignee, status, equipment, due date
- Tab-based navigation (Active Tasks / Completed Tasks)
- Print support for reports

### Remarks System
- Add timestamped comments to tasks
- Track task progress and notes

## Data Storage
All data stored in browser localStorage:
- `airportTasksV2` - Task list
- `airportTeamMembers` - Team members
- `airportEquipment` - Equipment/facilities

## Future Enhancements
- Supabase backend integration for multi-user sync
- User authentication
- Real-time collaboration
- Mobile app version
- Advanced reporting and analytics

## Development
Built with Claude Code assistance for rapid prototyping and development.
