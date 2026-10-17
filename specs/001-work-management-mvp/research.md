# Research: Personal Work Management Application — MVP

**Feature**: `001-work-management-mvp` | **Date**: 2026-09-29

All technical context was fully resolved from the spec and clarification session. No external research was required to resolve blocking unknowns. This document records the decisions and rationale for each significant technical choice.

---

## Decision 1: .NET Version

**Decision**: .NET 9 (LTS successor, current stable as of late 2025)

**Rationale**: .NET 9 is the current stable release with long-term support. ASP.NET Core 9 and EF Core 9 are compatible and mature. No breaking changes affect the MVP feature set.

**Alternatives considered**: .NET 8 LTS — viable but one generation behind; .NET 10 preview — too early for production.

---

## Decision 2: Backend Project Layering

**Decision**: Four-project solution — `WorkManager.Api`, `WorkManager.Application`, `WorkManager.Domain`, `WorkManager.Infrastructure`

**Rationale**: Clean separation of concerns enforced by project references (not just folders):
- `Domain` has zero external dependencies — pure C# entities and enums.
- `Application` depends only on `Domain` — services, DTOs, interfaces.
- `Infrastructure` depends on `Application` and `Domain` — EF Core DbContext, repositories, migrations.
- `Api` depends on `Application` — controllers, DI wiring, configuration.

This layering supports future integration adapters (Phase 4) by allowing new `Infrastructure` adapters (e.g., an email or calendar adapter) without touching `Domain` or `Application`.

**Alternatives considered**: Single-project monolith — faster to scaffold but blurs boundaries and makes future extension harder; two-project (Api + Data) — insufficient separation for the planned Phase 2–4 roadmap.

---

## Decision 3: Repository Pattern

**Decision**: Use lightweight repository interfaces in `Application` implemented in `Infrastructure`, but do not use a generic `IRepository<T>` pattern.

**Rationale**: Typed repositories (e.g., `IWorkItemRepository`) keep query logic close to the domain and avoid leaking EF Core `IQueryable` into `Application`. The generic repository pattern adds abstraction without benefit at MVP scale. Unit tests for `Application` services mock the typed interfaces.

**Alternatives considered**: Direct DbContext in services — simpler but tightly couples Application to Infrastructure, making testing harder; Generic repository — over-engineered for single-developer MVP.

---

## Decision 4: DTO Strategy

**Decision**: DTOs defined in `Application` layer. Mapping from Domain entity to DTO done manually (no AutoMapper in MVP).

**Rationale**: Manual mapping is explicit and easy to debug. AutoMapper adds a dependency and magic that slows onboarding. At MVP scale, the mapping code is small. DTOs are kept separate from EF entities — EF entities are never serialised directly through the API.

**Alternatives considered**: AutoMapper — reduces boilerplate but adds dependency and implicit behaviour; Mapster — similar tradeoff.

---

## Decision 5: Frontend State Management

**Decision**: TanStack Query (React Query) v5 for all server state. No global state library (no Redux, Zustand, or Context for data).

**Rationale**: All meaningful state in this app is server state (work items, configuration lists). React Query handles caching, background refresh, optimistic updates, and invalidation — removing the need for a separate global store. Component-local state (form state, UI open/closed) is handled with React `useState`.

**Alternatives considered**: Redux Toolkit — overkill for a server-state-only app; Zustand — lighter but still unnecessary given React Query; SWR — comparable but React Query has better DevTools and mutation support.

---

## Decision 6: Frontend Routing

**Decision**: React Router v6 with file-organized page components per view.

**Rationale**: React Router v6 is the standard for React SPAs. Each predefined view (Inbox, Today, Upcoming, etc.) maps to a named route. Navigation between views is instant (client-side routing). The router also handles the configuration section sub-routes.

**Alternatives considered**: TanStack Router — modern but still maturing; Next.js — server-side rendering is unnecessary for a localhost personal tool and adds complexity.

---

## Decision 7: Reminder Delivery Mechanism

**Decision**: Client-side polling via `GET /api/work-items/reminders/pending` on a 60-second interval using React Query's `refetchInterval`. Server returns work items whose `ReminderAt` has passed and `ReminderAcknowledgedAt` is null. Client shows an in-app notification (toast/banner). On acknowledgement, client calls `PATCH /api/work-items/{id}/reminder/acknowledge`.

**Rationale**: In-app only delivery was decided during clarification (FR-027 updated). Polling every 60 seconds meets the SC-005 criterion (delivered within 1 minute). No WebSockets, Server-Sent Events, or browser push infrastructure needed. The `ReminderAcknowledgedAt` field on the server prevents re-delivery across browser refreshes (FR-028).

**Alternatives considered**: WebSockets/SignalR — real-time but over-engineered for a 1-minute tolerance; Browser Push API — requires service worker and permission, excluded by clarification; Frontend-only timer — loses state on page refresh, risks duplicate delivery.

---

## Decision 8: Snooze Mechanism

**Decision**: When a work item is snoozed: set `Status = Snoozed`, set `SnoozeUntil = <user-specified datetime>`, set `PreSnoozeStatusId = <current status id before snooze>`. When the client polls `GET /api/views/snoozed` or the work item list, the server checks if `SnoozeUntil <= now` for any Snoozed item — if so, it automatically restores `Status = PreSnoozeStatus`, clears `SnoozeUntil` and `PreSnoozeStatusId`, and records an `ActivityRecord` (EventType = Snoozed resolution). Alternatively, a background check on the API side can run at request time.

**Rationale**: Clarification Q3 resolved: snooze restores to pre-snooze status. The `PreSnoozeStatusId` field on `WorkItem` stores this. Restoration happens lazily (on next API request that loads the item) — acceptable for a personal tool with 60-second polling cadence. No background job scheduler needed for MVP.

**Alternatives considered**: Hangfire / Quartz.NET background job — real-time but adds scheduler infrastructure excluded by constitution; Frontend timer — loses state on refresh.

---

## Decision 9: Status Transitions

**Decision**: No status is terminal (clarification Q4). Any work item in any status (including Done and Cancelled) can transition to any other valid status. When transitioning away from Done, `CompletedAt` is cleared server-side. All status changes produce an `ActivityRecord`.

**Rationale**: Clarification Q4 resolved: Done and Cancelled are reversible. The API enforces this by allowing any status update on any work item regardless of current status.

**Alternatives considered**: State machine enforcement (e.g., Stateless library) — adds overhead and contradicts the "no terminal state" decision; Client-side only validation — insufficient, server must enforce.

---

## Decision 10: Testing Strategy

**Decision**:
- `WorkManager.Application.Tests` — xUnit unit tests for services with mocked repository interfaces. FluentAssertions for readable assertions.
- `WorkManager.Api.Tests` — xUnit integration tests using `WebApplicationFactory<Program>` with an in-memory or test SQL Server database.
- `WorkManager.Integration.Tests` — end-to-end tests exercising full API against a real local SQL Server.
- Frontend: Vitest + React Testing Library for component and hook tests. No E2E browser tests in MVP (defer Playwright to Phase 2).

**Rationale**: Layer-appropriate testing. Unit tests validate business rules fast. Integration tests validate EF Core + SQL Server behaviour. Frontend component tests validate rendering and interaction logic.

**Alternatives considered**: NUnit — viable but xUnit is more idiomatic for modern .NET; Moq — viable mock library (can be used instead of NSubstitute); Jest — React Testing Library works with both Jest and Vitest; Vitest is faster with Vite projects.

---

## Decision 11: CORS Configuration

**Decision**: ASP.NET Core CORS policy allowing `http://localhost:5173` (Vite dev server default) with all methods and headers permitted. In production config, the allowed origin is updated via `appsettings.Production.json`.

**Rationale**: Since both frontend and backend run on localhost but on different ports, CORS must be configured. Restricting to the Vite origin prevents accidental cross-site access while keeping development frictionless.

**Alternatives considered**: Wildcard CORS (`*`) — simpler but overly permissive even for localhost; Proxy through Vite dev server — eliminates CORS but adds config complexity.
