# Implementation Plan: Personal Work Management Application — MVP

**Branch**: `001-work-management-mvp` | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-work-management-mvp/spec.md`

## Summary

A single-user personal work management web application (modular monolith) consisting of a React + TypeScript frontend built with Vite and an ASP.NET Core Web API backend in C#, backed by a locally installed SQL Server database managed through Entity Framework Core. The application enables a professional user to create, organise, track, and complete work items across configurable projects, categories, priorities, statuses, and tags — with due-date visibility, in-app reminders, predefined views, completed-work review, and per-item activity history. No authentication is required; the API is accessed from localhost only. All lookup values are user-configurable and persisted; no values are hard-coded.

## Technical Context

**Language/Version**: C# (.NET 9) — backend; TypeScript 5.x — frontend

**Primary Dependencies**:
- Backend: ASP.NET Core 9 Web API, Entity Framework Core 9, Microsoft.EntityFrameworkCore.SqlServer
- Frontend: React 18, Vite 5, TypeScript, TanStack Query (React Query) v5, React Router v6

**Storage**: Microsoft SQL Server (local install), EF Core code-first migrations

**Testing**:
- Backend: xUnit, FluentAssertions, Microsoft.AspNetCore.Mvc.Testing (integration)
- Frontend: Vitest, React Testing Library

**Target Platform**: Web application, localhost (developer's machine, Windows)

**Project Type**: Web application — modular monolith with separate React frontend and ASP.NET Core backend

**Performance Goals**:
- Work item creation end-to-end: < 60 seconds (user interaction)
- Keyword search across 500 items: results visible in < 5 seconds
- View navigation: < 2 seconds per switch
- Reminder delivery: within 1 minute of configured time (polling-based)

**Constraints**:
- No authentication or session management
- In-app reminders only (app must be open); no browser push or OS notifications
- No microservices, no distributed infrastructure
- Secrets never committed to source control
- EF Core migrations only — no manual schema changes

**Scale/Scope**: Single user, ~500 work items, 7 predefined views, ~5 configuration entity types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simple Core Workflow | ✅ Pass | API is thin; create/edit/complete paths are single-endpoint operations. No multi-step wizards. |
| II. Strong Organization | ✅ Pass | Project, Category, Tag, Priority, Status are distinct entities with separate endpoints and tables. |
| III. Clear Deadlines | ✅ Pass | DueDate, DueTime stored on WorkItem; overdue logic computed server-side; dedicated view endpoints. |
| IV. User Control | ✅ Pass | No AI/automation in MVP. All status changes are explicit user actions. |
| V. Configurable | ✅ Pass | All lookup values (priorities, statuses, projects, categories, tags) are database-backed and fully CRUD-manageable. |
| VI. Extensible | ✅ Pass | Layered architecture (Api → Application → Domain → Infrastructure) supports future integration adapters without core rewrites. |
| VII. Incremental Development | ✅ Pass | All Phase 2+ features (AI, recurring tasks, integrations) are absent from this plan. |

No gate violations. Complexity Tracking section not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-work-management-mvp/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output (/speckit-plan)
├── data-model.md        # Phase 1 output (/speckit-plan)
├── quickstart.md        # Phase 1 output (/speckit-plan)
├── contracts/
│   ├── api-work-items.md
│   ├── api-configuration.md
│   └── api-views.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/
├── WorkManager.sln
├── src/
│   ├── WorkManager.Api/                  # ASP.NET Core Web API entry point
│   │   ├── Controllers/
│   │   │   ├── WorkItemsController.cs
│   │   │   ├── PrioritiesController.cs
│   │   │   ├── StatusesController.cs
│   │   │   ├── ProjectsController.cs
│   │   │   ├── CategoriesController.cs
│   │   │   ├── TagsController.cs
│   │   │   └── ViewsController.cs
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── appsettings.Development.json
│   ├── WorkManager.Application/          # Business logic, use cases, DTOs
│   │   ├── Services/
│   │   │   ├── WorkItemService.cs
│   │   │   ├── PriorityService.cs
│   │   │   ├── StatusService.cs
│   │   │   ├── ProjectService.cs
│   │   │   ├── CategoryService.cs
│   │   │   ├── TagService.cs
│   │   │   ├── ReminderService.cs
│   │   │   └── DueStateCalculator.cs     # Single source of overdue / due-state rules
│   │   ├── DTOs/
│   │   └── Interfaces/                   # Repository interfaces, ILocalClock
│   ├── WorkManager.Domain/               # Entities, enums, domain interfaces
│   │   ├── Entities/
│   │   └── Enums/
│   └── WorkManager.Infrastructure/       # EF Core, repositories, data access
│       ├── Persistence/
│       │   ├── WorkManagerDbContext.cs
│       │   └── Migrations/
│       ├── Repositories/
│       └── Time/                         # LocalClock (TimeProvider + App:TimeZoneId)
└── tests/
    ├── WorkManager.Application.Tests/    # Unit tests for services
    ├── WorkManager.Api.Tests/            # Controller / integration tests
    └── WorkManager.Integration.Tests/    # End-to-end API tests

frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/                              # Typed API client functions
    ├── components/                       # Reusable UI components
    ├── pages/                            # View-level page components
    │   ├── InboxPage.tsx
    │   ├── TodayPage.tsx
    │   ├── UpcomingPage.tsx
    │   ├── OverduePage.tsx
    │   ├── InProgressPage.tsx
    │   ├── SnoozedPage.tsx
    │   ├── CompletedTodayPage.tsx
    │   ├── CompletedPage.tsx
    │   └── configuration/
    ├── hooks/                            # Custom React hooks
    ├── types/                            # TypeScript interfaces mirroring DTOs
    └── utils/
```

**Structure Decision**: Option 2 (Web application). Backend is a .NET solution with four layered projects (Api, Application, Domain, Infrastructure) under `backend/`. Frontend is a Vite + React app under `frontend/`. The two are independent deployable units communicating over HTTP on localhost.
