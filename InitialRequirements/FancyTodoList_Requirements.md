Create a personal work-management application for managing tasks and work items across multiple projects, responsibilities, and areas of work.

The application should be more capable than a basic Todo list while remaining simple and fast to use. It should help a user manage professional work, learning activities, reviews, follow-ups, presales activities, documents, and project-related tasks.

The project must be developed incrementally. The **MVP must remain focused and should not implement the future features described later in this specification**.

# MVP SCOPE

## 1. Work Items

The core entity is a Work Item.

Each work item should support:

* Title
* Description / notes
* Priority
* Status
* Project
* Category
* Multiple tags
* Due date
* Optional due time
* Optional reminder
* Created date
* Updated date
* Completed date

The user must be able to:

* Create a work item
* View a work item
* Edit a work item
* Delete a work item
* Mark a work item as completed
* Change its priority, status, project, category, and tags
* Set or change its due date
* Set or change its reminder

## 2. Priorities

The MVP should provide configurable priorities such as:

* Immediate
* Critical
* High
* Medium
* Low
* Very Low

The user should be able to:

* Add priorities
* Edit priorities
* Deactivate/archive priorities
* Reorder priorities

Priority should be associated with a clear ordering so work items can be sorted by priority.

## 3. Statuses

The MVP should support:

* Open
* In Progress
* Done
* Postponed
* Snoozed
* Cancelled

The user should be able to configure statuses.

Snoozing a work item should allow the user to specify a future date/time when it should become visible or active again.

Postponing should allow the user to move the work item's due date.

## 4. Projects

A work item may belong to one project.

Example projects:

* ServeBig
* EDA
* MOTA
* Presales
* CSF
* AML
* Learning

Projects must be configurable.

The user should be able to:

* Create projects
* Edit projects
* Archive projects
* Assign work items to projects

## 5. Categories

Each work item may have one category.

Example categories:

* Presales
* Learning
* Code Review
* Document Review
* Follow-up
* Meeting
* Development
* Architecture
* Administration
* Personal

Categories must be configurable.

Project and Category are separate concepts.

For example:

Project = EDA
Category = Document Review

## 6. Tags

A work item can have multiple tags.

Example tags:

* Azure
* Architecture
* Client
* RabbitMQ
* .NET
* Urgent
* Documentation

Tags should be reusable across work items.

The user should be able to:

* Create tags
* Edit tags
* Archive tags
* Assign multiple tags to a work item
* Remove tags from a work item

## 7. Due Dates

The user should be able to assign a due date and optional due time.

The system should clearly distinguish:

* Upcoming work
* Due today
* Overdue work
* Completed work

Overdue work items should remain identifiable until they are completed, cancelled, postponed, or otherwise changed.

## 8. Reminders

The user should be able to configure a reminder for a work item.

The MVP should support reminders based on a specific date/time.

The system should notify the user when a reminder becomes due.

Reminder behavior should not create duplicate notifications for the same reminder.

## 9. Sorting, Filtering and Search

The user should be able to sort work items by:

* Priority
* Due date
* Creation date
* Updated date
* Project
* Status

The user should be able to filter by:

* Priority
* Status
* Project
* Category
* Tags
* Due date

The application should provide search across:

* Title
* Description
* Project
* Category
* Tags

## 10. Predefined Views

The MVP should provide these views:

* Inbox / All Open Work
* Today
* Upcoming
* Overdue
* In Progress
* Snoozed
* Completed Today

The user should be able to move quickly between these views.

## 11. Completed Work

The application should provide a dedicated view for completed work.

The user should be able to see tasks completed:

* Today
* On a selected date
* During a selected date range

The system should record the completion date automatically when a work item is marked Done.

The Completed Today view should provide a simple summary such as:

* Number of completed work items
* Completed items grouped by project
* Completed items grouped by category

## 12. Basic Activity History

The MVP should maintain basic history for important work-item changes.

Examples:

* Created
* Status changed
* Priority changed
* Due date changed
* Project changed
* Completed
* Postponed
* Snoozed

The history should include the date/time of the change.

## 13. Configuration

The MVP should provide a configuration area where the user can manage:

* Priorities
* Statuses
* Projects
* Categories
* Tags

The application should avoid hard-coding these lookup values wherever practical.

# MVP OUT OF SCOPE

The following features should explicitly NOT be implemented in the MVP:

* AI functionality
* AI task creation
* AI task decomposition
* AI daily planning
* AI summarization
* Recurring tasks
* Task dependencies
* Complex "Waiting For" workflows
* Advanced follow-up workflows
* Custom dashboards
* Custom views
* External integrations
* Email integration
* Calendar integration
* Slack integration
* Microsoft Teams integration
* MCP integration
* Claude Code integration
* Multi-user collaboration
* Teams
* Role-based permissions
* Advanced analytics
* Advanced reporting
* Mobile applications

These features may be considered in future versions but should not increase MVP scope.

# FUTURE FEATURES

The following are potential future capabilities and should be considered when designing the system so that they can be added later without unnecessarily complicating the MVP.

## Phase 2 — Workflow Improvements

Potential features:

* Recurring work items
* Task dependencies
* Blocked-by relationships
* Waiting For status
* Person/entity being waited for
* Expected response date
* Dedicated follow-up dates
* Related work items
* Estimated effort
* Time tracking
* Weekly review
* Advanced dashboards
* Custom saved views

## Phase 3 — AI Capabilities

Potential AI functionality:

### Natural Language Work Item Creation

Example:

"I need to review the EDA API specification by Wednesday. It is important and I need to follow up with Ahmed if I don't finish it."

AI could identify:

* Title
* Project
* Category
* Priority
* Due date
* Tags
* Follow-up information

The user must remain in control and approve the generated work item before creation.

### AI Task Decomposition

For example:

"Prepare the EDA Azure architecture proposal."

AI could suggest smaller work items such as:

* Review requirements
* Identify Azure services
* Design architecture
* Estimate infrastructure
* Document architecture
* Review security
* Review cost
* Prepare proposal
* Internal review
* Send proposal

The user should be able to edit, accept, or reject suggestions.

### AI Daily Planning

AI could use:

* Priorities
* Due dates
* Status
* Dependencies
* Estimated effort
* Open work
* Project context

to help the user organize their workday.

### AI Summaries

Potential summaries:

* What was accomplished today
* What remains outstanding
* What became overdue
* What is waiting
* What changed during the week

## Phase 4 — Integrations and AI Development Platform

Potential future integrations:

* Claude
* Claude Code
* MCP
* Calendar
* Email
* Slack
* Microsoft Teams
* GitHub
* Azure DevOps
* Other productivity systems

The application may eventually expose an API and MCP server so AI tools can interact with work items.

# Product Principles

The application should follow these principles:

1. **Simple core workflow** — creating and updating a work item should be fast.
2. **Strong organization** — Projects, Categories, Tags, Priorities, and Statuses should have distinct purposes.
3. **Clear deadlines** — overdue and approaching work should be immediately visible.
4. **User control** — future AI functionality should assist the user rather than automatically changing important work data without confirmation.
5. **Configurable** — lookup values should not be unnecessarily hard-coded.
6. **Extensible** — the MVP architecture should allow future workflow, AI, and integration features without requiring a fundamental rewrite.
7. **Incremental development** — implement and validate the MVP before expanding into future phases.

# MVP Success Criteria

The MVP should allow a user to:

1. Create a project.
2. Create categories, priorities, statuses, and tags.
3. Create a work item.
4. Assign it to a project.
5. Assign a category.
6. Assign a priority.
7. Assign multiple tags.
8. Set a due date.
9. Set a reminder.
10. Change its status.
11. Snooze or postpone it.
12. Search for it.
13. Filter and sort work items.
14. See overdue work.
15. See today's work.
16. See completed work.
17. Review what was accomplished today.
18. View basic work-item history.

The MVP should be considered complete when these workflows are reliable, intuitive, and tested.

The primary purpose of the initial release is to create a useful personal work-management application while providing a clean foundation for future workflow automation, AI capabilities, and integrations.
