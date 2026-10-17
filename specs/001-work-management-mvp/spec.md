# Feature Specification: Personal Work Management Application — MVP

**Feature Branch**: `001-work-management-mvp`

**Created**: 2026-09-29

**Status**: Approved

**Input**: User description: "Create a personal work-management application for managing tasks and work items across multiple projects, responsibilities, and areas of work."

## Clarifications

### Session 2026-09-29

- Q: Does the application require the user to authenticate (log in) before accessing it, or is it a localhost-only tool with no login step? → A: No authentication — localhost-only, trusted by local environment.
- Q: When a reminder becomes due, must the web application be open in a browser for the notification to appear, or should the system notify the user even when the browser is closed? → A: In-app only — reminders fire only while the app is open in the browser.
- Q: When a snoozed work item's snooze period expires automatically, which status should it return to? → A: Return to previous status — the status the item had before it was snoozed.
- Q: Can a user change the status of a work item that has already been marked as Done or Cancelled, or are those terminal states that cannot be reversed? → A: Both reversible — Done and Cancelled items can be re-opened by changing status.
- Q: Where is the SQL Server database expected to run — on the developer's local machine, in Docker, or in a cloud service? → A: Local SQL Server install on the developer's machine.

### Session 2026-10-05

- Q: Which timezone defines "today", "overdue", and "completed today"? → A: The user's local timezone, which is the machine's timezone (the app is localhost-only); optionally overridable via configuration.
- Q: Since statuses are user-editable, how does built-in behaviour (completion, snooze, postpone, views) identify the statuses it depends on? → A: The six default statuses are system statuses with a fixed system role; users may rename and reorder them but not deactivate them. Logic keys off the system role, never the display name.
- Q: Which lookup types support user-defined ordering? → A: All five (priorities, statuses, projects, categories, tags), per Constitution Principle V.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Manage Work Items (Priority: P1)

A professional user creates a new work item, fills in its title, description, priority, project, category, and due date, then saves it. Later they return to update its status, change the priority, and add tags. When the work is done, they mark it as completed.

**Why this priority**: Work item creation and management is the fundamental value of the application. All other features depend on work items existing and being accurately maintained.

**Independent Test**: Can be fully tested by creating, editing, and completing a single work item through the main interface, delivering a functional personal task tracker.

**Acceptance Scenarios**:

1. **Given** the user is on the main screen, **When** they create a new work item with a title, description, priority, project, category, due date, and tags, **Then** the work item is saved and appears in the work item list.
2. **Given** a saved work item, **When** the user edits its title, priority, status, or tags, **Then** all changes are persisted and reflected immediately.
3. **Given** a saved work item, **When** the user marks it as completed, **Then** its status changes to Done, the completion date is recorded automatically, and it no longer appears in active work views.
4. **Given** a saved work item, **When** the user deletes it, **Then** it is permanently removed and no longer appears in any view.
5. **Given** a work item exists, **When** the user views it, **Then** all fields (title, description, priority, status, project, category, tags, due date, reminder, created date, updated date) are visible and accurate.

---

### User Story 2 - Configure Organizational Lookup Values (Priority: P2)

A user sets up their workspace by creating projects that reflect their areas of work (e.g., internal projects, client engagements, learning), configuring categories that describe the type of activity (e.g., document review, meeting, development), creating meaningful tags, and adjusting the available priorities and statuses to match their workflow.

**Why this priority**: Organization structures (projects, categories, tags, priorities, statuses) must be configurable before work items can be meaningfully organized. Default values should be provided but users must be able to tailor them.

**Independent Test**: Can be fully tested by navigating to the configuration area and successfully creating, editing, and archiving a project, category, tag, priority, and status without creating any work items.

**Acceptance Scenarios**:

1. **Given** the configuration area, **When** the user creates a new project with a name, **Then** it becomes available for assignment to work items.
2. **Given** a project exists, **When** the user edits its name or archives it, **Then** the change is reflected immediately and archived projects are no longer offered for new work items.
3. **Given** the configuration area, **When** the user creates, edits, reorders, or deactivates a priority level, **Then** the changes affect how priorities are displayed and ordered throughout the application.
4. **Given** the configuration area, **When** the user creates or modifies a status, **Then** the new status becomes selectable on work items.
5. **Given** the configuration area, **When** the user creates, edits, or archives a category or tag, **Then** the change is immediately reflected across the application.

---

### User Story 3 - Schedule Work with Due Dates and Reminders (Priority: P3)

A user assigns a due date (and optionally a specific due time) to a work item. They configure a reminder for a date/time before the due date. The system notifies them when the reminder is due. If a work item is not completed by its due date, it appears in the Overdue view until resolved.

**Why this priority**: Deadline visibility and proactive reminders are core to managing professional work — without them, important tasks can be missed.

**Independent Test**: Can be fully tested by creating a work item with a due date and reminder, verifying the overdue indicator appears after the due date passes, and confirming the reminder notification fires at the configured time.

**Acceptance Scenarios**:

1. **Given** a work item, **When** the user sets a due date with an optional due time, **Then** the due date/time is saved and the item appears correctly in date-based views.
2. **Given** a work item with a reminder configured, **When** the reminder date/time arrives, **Then** the user receives a notification exactly once.
3. **Given** a work item whose due date has passed without completion, **When** the user views the work item list, **Then** the item is clearly marked as overdue and appears in the Overdue view.
4. **Given** an overdue work item, **When** the user postpones it by setting a new due date, **Then** the overdue indicator is removed and the new due date is recorded.
5. **Given** an active work item, **When** the user snoozes it by specifying a future date/time, **Then** the item is hidden from active views until that date/time and its status is set to Snoozed.

---

### User Story 4 - Find Work Quickly via Search, Filter, and Sort (Priority: P4)

A user wants to find specific work items quickly. They use full-text search to find items by keyword, filter the list by project, category, status, or priority, and sort by due date or priority to focus on what matters most.

**Why this priority**: As the number of work items grows, discovery becomes critical. Users must be able to navigate large volumes of work efficiently.

**Independent Test**: Can be fully tested with a populated set of work items by verifying that search, filtering, and sorting each independently produce correct and expected results.

**Acceptance Scenarios**:

1. **Given** work items exist, **When** the user searches for a keyword, **Then** all work items whose title, description, project, category, or tags contain that keyword are returned.
2. **Given** work items exist, **When** the user filters by one or more of: priority, status, project, category, tags, or due date, **Then** only matching work items are shown.
3. **Given** work items exist, **When** the user sorts by priority, due date, creation date, updated date, project, or status, **Then** the list is reordered accordingly.
4. **Given** active filters or a search query, **When** the user clears them, **Then** the full unfiltered list is restored.

---

### User Story 5 - Navigate Predefined Work Views (Priority: P5)

A user switches between predefined views — Inbox, Today, Upcoming, Overdue, In Progress, Snoozed, and Completed Today — to get an immediate contextual picture of their workload without manual filtering.

**Why this priority**: Predefined views provide fast situational awareness. They reduce the cognitive overhead of filtering and give users a reliable daily workflow anchor.

**Independent Test**: Can be fully tested by creating work items with various statuses and due dates, then verifying each predefined view shows only the appropriate items.

**Acceptance Scenarios**:

1. **Given** the Inbox/All Open Work view, **When** accessed, **Then** all non-completed, non-cancelled work items are shown.
2. **Given** the Today view, **When** accessed, **Then** only work items due today are shown.
3. **Given** the Upcoming view, **When** accessed, **Then** work items due in the future (excluding today) are shown.
4. **Given** the Overdue view, **When** accessed, **Then** all work items whose due date has passed and are not completed or cancelled are shown.
5. **Given** the In Progress view, **When** accessed, **Then** only work items with status "In Progress" are shown.
6. **Given** the Snoozed view, **When** accessed, **Then** only work items with status "Snoozed" that have not yet reached their snooze-until date are shown.
7. **Given** the Completed Today view, **When** accessed, **Then** a summary is shown with count of items completed today, items grouped by project, and items grouped by category.
8. **Given** any predefined view, **When** the user selects it, **Then** navigation is immediate and requires no additional configuration.

---

### User Story 6 - Review Completed Work (Priority: P6)

A user wants to reflect on what they have accomplished. They open the completed work view and browse tasks completed today, on a specific past date, or across a date range.

**Why this priority**: Reviewing completed work supports productivity habits, reporting, and the sense of accomplishment. It is also referenced explicitly in the MVP success criteria.

**Independent Test**: Can be fully tested by completing several work items across different days and verifying that the completed work view correctly filters by today, a specific date, and a date range.

**Acceptance Scenarios**:

1. **Given** completed work items, **When** the user views completed work for today, **Then** only items completed today are shown.
2. **Given** completed work items, **When** the user selects a specific past date, **Then** only items completed on that date are shown.
3. **Given** completed work items, **When** the user selects a date range, **Then** items completed within that range are shown.
4. **Given** the Completed Today summary, **When** the user views it, **Then** a count of completed items, a breakdown by project, and a breakdown by category are displayed.

---

### User Story 7 - View Work Item Activity History (Priority: P7)

A user opens a work item and reviews its change history to understand when it was created, how its status or priority changed over time, and when it was postponed or snoozed.

**Why this priority**: Activity history supports accountability and decision-making. It is a secondary feature that adds value after core functionality is in place.

**Independent Test**: Can be fully tested on a single work item by making several status, priority, and due date changes and then verifying that all changes appear in the history log with accurate timestamps.

**Acceptance Scenarios**:

1. **Given** a work item that has been modified, **When** the user views its history, **Then** a log of key changes (creation, status change, priority change, due date change, project change, snooze, postpone, completion) is shown with date and time.
2. **Given** a newly created work item, **When** the history is viewed, **Then** a "Created" entry appears with the creation timestamp.
3. **Given** a work item, **When** its status or priority is changed, **Then** a history entry recording the old and new values and the time of change appears.

---

### Edge Cases

- What happens when a user tries to create a work item without a title? (Title should be required.)
- What happens if a reminder is set for a time that has already passed? (The system should warn the user or prevent saving.)
- What happens if a project or category is archived while work items still reference it? (Existing work items retain the reference; the archived value is displayed but cannot be assigned to new items.)
- What happens when no work items match the active filters or search? (An empty-state message is shown indicating no results.)
- What happens when the user snoozes a work item and the snooze date passes while the app is not running? (The item becomes active again the next time the app is opened or refreshed, restoring its pre-snooze status.)
- What happens if the user attempts to delete a work item that has history? (Deletion is still permitted; all associated history is also removed.)
- What happens when a user changes a Done item back to an active status? (The completion date is cleared, and the item reappears in active views. A history entry is recorded for the status change.)
- What happens when a priority is deactivated while work items still use it? (Existing work items retain the deactivated priority value; it cannot be assigned to new items.)
- What happens when the user renames a system status (e.g., "Done" → "Finished")? (Completion, snooze, postpone, and view behaviour are unchanged, because they key off the system role, not the name. System statuses cannot be deactivated.)
- What happens when a postponed item's new due date also passes? (It becomes overdue again and appears in the Overdue view.)
- What happens around local midnight? ("Today", "Overdue", and "Completed Today" switch over at local midnight in the user's timezone, not at UTC midnight.)

## Requirements *(mandatory)*

### Functional Requirements

**Work Item Management**

- **FR-001**: The system MUST allow users to create a work item with at minimum a title.
- **FR-002**: The system MUST support the following fields on a work item: title, description/notes, priority, status, project, category, tags (multiple), due date, due time (optional), reminder, created date, updated date, and completed date.
- **FR-003**: Users MUST be able to view, edit, and delete any work item.
- **FR-004**: Users MUST be able to mark a work item as completed, which automatically records the completion date and time.
- **FR-005**: Users MUST be able to change the priority, status, project, category, and tags of any work item.
- **FR-006**: Users MUST be able to set or change the due date and optional due time of a work item.
- **FR-007**: Users MUST be able to set or change a reminder for a work item.

**Priorities**

- **FR-008**: The system MUST provide configurable priority levels with a defined ordering (e.g., Immediate, Critical, High, Medium, Low, Very Low).
- **FR-009**: Users MUST be able to add, edit, reorder, and deactivate/archive priority levels.
- **FR-010**: Work items MUST be sortable by priority according to the defined ordering.

**Statuses**

- **FR-011**: The system MUST support the following statuses: Open, In Progress, Done, Postponed, Snoozed, Cancelled.
- **FR-011a**: No status is terminal. Users MUST be able to change the status of any work item — including those marked Done or Cancelled — to any other valid status. When a Done item's status is changed away from Done, the system MUST clear its recorded completion date.
- **FR-012**: Users MUST be able to add, edit, reorder, and deactivate statuses (system statuses: see FR-012a).
- **FR-012a**: The six default statuses are *system statuses* carrying a fixed system role (Open, InProgress, Done, Postponed, Snoozed, Cancelled). Users MAY rename and reorder them but MUST NOT deactivate them. All built-in behaviour (completion, snooze, postpone, views) MUST key off the system role, never the display name. User-created statuses have no system role and behave as generic active statuses.
- **FR-013**: When a user snoozes a work item, they MUST be able to specify a future date/time at which the item becomes visible/active again. When the snooze period expires, the system MUST automatically restore the work item's status to whatever it was immediately before snoozing (e.g., if it was "In Progress" before snooze, it returns to "In Progress"). The system MUST store the pre-snooze status to enable this restoration.
- **FR-014**: When a user postpones a work item, the system MUST allow the user to set a new due date for it.

**Projects**

- **FR-015**: Users MUST be able to create, edit, and archive projects.
- **FR-016**: A work item MUST be assignable to at most one project.
- **FR-017**: Archived projects MUST remain associated with existing work items but MUST NOT be assignable to new work items.

**Categories**

- **FR-018**: Users MUST be able to create, edit, and archive categories.
- **FR-019**: A work item MUST be assignable to at most one category.
- **FR-020**: Project and Category are independent classification dimensions on a work item.

**Tags**

- **FR-021**: Users MUST be able to create, edit, and archive tags.
- **FR-022**: A work item MUST support assignment of multiple tags simultaneously.
- **FR-023**: Tags MUST be reusable across multiple work items.
- **FR-024**: Users MUST be able to add and remove individual tags from a work item.

**Due Dates**

- **FR-025**: Every work item MUST display a due-state indicator with exactly one of: Overdue, Due Today, Upcoming, Completed, or none (no due date, or Cancelled). Overdue uses the rule in FR-026; Due Today = due date is today (local, FR-042) and not overdue; Upcoming = due date after today; Completed = status Done.
- **FR-026**: A work item is overdue when its due date/time has passed and its status is not Done, Cancelled, or Snoozed. Overdue items MUST remain visible and identifiable until resolved. Postponing resolves overdue only by moving the due date; if the new due date also passes, the item is overdue again.

**Reminders**

- **FR-027**: The system MUST notify the user when a reminder date/time is reached, provided the application is open in the browser. No notification is delivered if the app is closed — this is by design for the MVP.
- **FR-028**: The system MUST NOT display duplicate notifications for the same reminder within a single app session.

**Sorting, Filtering, and Search**

- **FR-029**: Users MUST be able to sort work items by: priority, due date, creation date, updated date, project, and status.
- **FR-030**: Users MUST be able to filter work items by: priority, status, project, category, tags, and due date.
- **FR-031**: The system MUST provide search across work item title, description, project, category, and tags.

**Predefined Views**

- **FR-032**: The system MUST provide the following predefined views: Inbox/All Open Work, Today, Upcoming, Overdue, In Progress, Snoozed, Completed Today.
- **FR-033**: Users MUST be able to navigate between predefined views quickly without additional configuration.

**Completed Work**

- **FR-034**: The system MUST provide a dedicated completed work view showing items completed today, on a selected date, or within a selected date range.
- **FR-035**: The system MUST automatically record the completion date/time when a work item is marked as Done.
- **FR-036**: The Completed Today view MUST display: total count of items completed today, items grouped by project, and items grouped by category.

**Activity History**

- **FR-037**: The system MUST record a history entry for the following events on a work item: created, status changed, priority changed, due date changed, project changed, completed, postponed, snoozed.
- **FR-038**: Each history entry MUST include the date and time of the change.
- **FR-039**: Users MUST be able to view the full history of a work item.

**Configuration**

- **FR-040**: The system MUST provide a dedicated configuration area for managing priorities, statuses, projects, categories, and tags.
- **FR-041**: Lookup values (priorities, statuses, projects, categories, tags) MUST NOT be hard-coded and MUST be manageable by the user.
- **FR-041a**: Every lookup type (priorities, statuses, projects, categories, tags) MUST have a user-defined display order. Configuration lists and work item selectors MUST present values in that order.

**Time Handling**

- **FR-042**: All calendar-based rules (Today, Upcoming, Overdue, Completed Today, completed-by-date/range, due state) MUST be evaluated in the user's local timezone, which defaults to the machine's timezone and may be overridden via configuration. Due date/time are local wall-clock values; event timestamps are stored in UTC and converted to local time for date comparisons and display.

### Key Entities *(include if feature involves data)*

- **Work Item**: The core entity. Represents a unit of work with a title, description, classification (project, category, tags), scheduling (due date, due time, reminder), lifecycle (status, priority, pre-snooze status), and temporal records (created, updated, completed dates). The pre-snooze status field is set when a work item is snoozed and cleared upon snooze expiry after the status is restored.
- **Priority**: A configurable ordering value assigned to work items, with a defined sort order. Can be active or archived.
- **Status**: A configurable, user-ordered lifecycle state of a work item (e.g., Open, In Progress, Done, Postponed, Snoozed, Cancelled). The six defaults are system statuses with a fixed system role (FR-012a).
- **Project**: A named grouping representing an area of work. A work item belongs to at most one project. Has a user-defined display order. Can be active or archived.
- **Category**: A named classification describing the type of activity (e.g., Meeting, Development). A work item belongs to at most one category. Has a user-defined display order. Can be active or archived.
- **Tag**: A reusable label that can be applied to multiple work items. A work item can have many tags. Has a user-defined display order. Can be active or archived.
- **Reminder**: A date/time trigger associated with a work item that generates a user notification.
- **Activity Record**: An immutable log entry recording a change event on a work item, with the event type, timestamp, and relevant before/after values.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a fully populated work item (title, description, project, category, priority, tags, due date, reminder) in under 60 seconds.
- **SC-002**: A user can locate any specific work item by searching a keyword in under 5 seconds across a library of 500 work items.
- **SC-003**: Overdue work items are visually identifiable without any user action within the first 5 seconds of opening the application.
- **SC-004**: A user can switch between any two predefined views in under 2 seconds.
- **SC-005**: Reminder notifications are delivered within 1 minute of the configured reminder time.
- **SC-006**: Reminder notifications are never sent more than once per reminder.
- **SC-007**: A user can complete all 18 workflows W01–W18 (see MVP Acceptance Workflows below) without encountering errors or dead-ends.
- **SC-008**: 90% of primary user actions (create, edit, complete, filter, search) complete without errors in normal usage.
- **SC-009**: All configuration changes (add/edit/archive of project, category, tag, priority, status) are reflected across the application immediately after saving.
- **SC-010**: The completed work summary correctly reflects all items completed in the selected time period, grouped by project and category.

### MVP Acceptance Workflows

Copied from the MVP Success Criteria in `InitialRequirements/FancyTodoList_Requirements.md`. These 18 workflows are the acceptance baseline for MVP completeness (SC-007; Constitution, Development Workflow).

| ID | Workflow | Validated by (quickstart.md) |
|----|----------|------------------------------|
| W01 | Create a project | S2 |
| W02 | Create categories, priorities, statuses, and tags | S2 |
| W03 | Create a work item | S1 |
| W04 | Assign it to a project | S1 |
| W05 | Assign a category | S1 |
| W06 | Assign a priority | S1 |
| W07 | Assign multiple tags | S1 |
| W08 | Set a due date | S3 |
| W09 | Set a reminder | S3 |
| W10 | Change its status | S8 |
| W11 | Snooze or postpone it | S4 |
| W12 | Search for it | S5 |
| W13 | Filter and sort work items | S5 |
| W14 | See overdue work | S3, S6 |
| W15 | See today's work | S3, S6 |
| W16 | See completed work | S7 |
| W17 | Review what was accomplished today | S7 (summary) |
| W18 | View basic work-item history | S9 |

## Technical and Architecture Constraints

These constraints are fixed decisions that apply across the entire MVP and all future phases. They must be respected during planning, design, and implementation. They do not alter the functional requirements or MVP scope defined above.

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React with TypeScript |
| Frontend build tool | Vite |
| Backend | ASP.NET Core Web API (C#) |
| API style | RESTful HTTP |
| Database | Microsoft SQL Server (local install on developer's machine) |
| ORM | Entity Framework Core |

### Architecture

The application MUST follow a **modular monolith** architecture for the MVP.

- The frontend (React + TypeScript) and backend (ASP.NET Core Web API) MUST be separate deployable units with a clean API boundary between them.
- The backend MUST maintain clear separation across the following layers: API (controllers/endpoints), Application/Business Logic, Domain, Infrastructure/Data Access, and Database.
- EF Core entities MUST NOT be exposed directly through the API. DTOs MUST be used at the API boundary where appropriate.
- All database schema changes MUST be managed through EF Core migrations. Ad hoc or manual schema changes are not permitted.
- Microservices MUST NOT be used in the MVP.
- Unnecessary distributed infrastructure (message brokers, external caches, service meshes) MUST NOT be introduced in the MVP.

### Authentication

The application MUST NOT require user authentication or a login step for the MVP.

- The API is accessed exclusively from the same machine (localhost). No authentication middleware, login UI, token issuance, or session management is required.
- If the application is later deployed beyond localhost, authentication MUST be added as a deliberate Phase 2 amendment.

### Configuration and Security

- The application MUST support configuration for multiple environments (e.g., development, production) without code changes.
- Secrets (connection strings, API keys, credentials) MUST NOT be committed to source control under any circumstances.

### Future Integration Readiness

The MVP architecture MUST NOT block future integration with the following systems, even though these integrations are out of scope for the MVP:

- AI platforms (e.g., Claude, OpenAI)
- MCP (Model Context Protocol)
- Calendar systems
- Email
- GitHub
- Azure DevOps
- Slack
- Microsoft Teams

These integrations MUST remain outside the MVP. The requirement here is only that the modular structure does not create unnecessary barriers to adding them later.

## Assumptions

- The application is a single-user, personal productivity tool with no authentication or login step. No multi-user, team, or collaborative features are in scope for the MVP.
- The application runs on a desktop or web environment. Mobile applications are explicitly out of scope.
- Default values for priorities (Immediate, Critical, High, Medium, Low, Very Low) and statuses (Open, In Progress, Done, Postponed, Snoozed, Cancelled) are pre-populated on first run but remain fully configurable.
- Reminders are delivered via in-application notifications only. The app must be open in the browser for a reminder to fire. Browser push notifications, OS-level notifications, and external device alerts are not in scope for the MVP.
- Data is persisted in a locally installed SQL Server instance on the developer's machine. No cloud sync, Docker-hosted database, or external data storage service is in scope for the MVP.
- The activity history records events for the changes listed in FR-037; it does not record every field edit in exhaustive detail.
- Workflows W01–W18 (MVP Acceptance Workflows, copied from the original requirements) are the acceptance baseline for MVP completeness.
- The user's local timezone is the machine's timezone (single user, localhost), unless overridden by configuration.
- Future features (AI, recurring tasks, integrations, multi-user collaboration, advanced analytics) are explicitly excluded and must not influence MVP architecture decisions in ways that increase complexity without corresponding MVP value.
- The application should be designed with future extensibility in mind, but extensibility must not add scope or complexity to the MVP itself.
