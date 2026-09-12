# Fix Summary: In-Memory / Database Wiring Issue

This documents the fix for the critical finding in the grading report: Chapter 3
claims the system "runs exclusively against the live MySQL/MariaDB instance"
for persistence, but the clearance workflow, admin panel, and audit trail were
actually running entirely on an in-memory store that reset on every restart.

## What changed

### 1. Schema fixes (had to happen first)
- **`prisma/schema.prisma`**: expanded the `AuditAction` enum (11 → 33 values)
  and `NotificationType` enum (6 → 8 values) to include ~24 action/type
  strings the application actually emits at runtime but which were missing
  from the original MySQL `ENUM` columns. Without this, the very first real
  write to either table would have thrown a database error.
- **New migration**: `prisma/migrations/20260909010000_expand_audit_and_notification_enums/`
  widens both columns (backward compatible — no existing data is touched).
- Fixed two pre-existing Prisma hygiene issues: removed a stray empty
  `prisma/migrations/init.sql`, added the missing `migration_lock.toml`.

### 2. Data-access layer
- **`src/server/db/prismaRepository.ts`**: fixed two existing methods
  (`createDocument`, `updateDocumentStatus`) that silently skipped updating
  the in-memory cache on a successful live-database write. Added a full set
  of new `mirror*` methods (`mirrorUpsertClearanceRequest`,
  `mirrorUpsertStageProgress`, `mirrorCreateApprovalDecision`,
  `mirrorMarkStageDocumentsStatus`, `mirrorCreateCertificate`,
  `mirrorCreateNotification`, `mirrorCreateDocument`,
  `mirrorReplaceDocumentsForStage`, `mirrorDeleteNotification`, etc.) that
  mirror an in-memory write into the live database when one is configured,
  without altering the existing in-memory business logic at all.
- **`src/server/db/seedDatabase.ts`** (new file): extracted the institutional
  data seeding logic (roles, permissions, faculties, departments, workflow,
  demo accounts) into a single shared function, so both the CLI seed command
  and the server's own startup bootstrap use identical, non-duplicated logic.
- **`src/server/db/client.ts`**: added `hydrateFromDatabase()`, called once at
  server startup. When a live database is configured and reachable, it loads
  all real data into the in-memory cache (instead of the static demo seed)
  and auto-bootstraps a fresh empty database on first connect. `createAuditLogEntry`
  now also mirrors every audit entry to the live database (fire-and-forget,
  so none of its ~25 existing call sites needed to change).
- **`server.ts`**: now calls `dbStore.hydrateFromDatabase()` after verifying
  database connectivity, in both strict-MySQL and auto-detect startup modes.

### 3. Workflow engine — the core of Objective 4
- **`src/server/workflow/workflowEngine.ts`**: `submitClearance`, `approveStage`,
  `rejectStage`, and `resubmitStageDocuments` now call the new mirror methods
  at every mutation point (creating a request, creating/advancing stage
  progress, recording an approval decision, marking documents verified/rejected,
  issuing a certificate, creating notifications). The in-memory logic itself
  is untouched — this only adds a parallel, real write to MySQL/MariaDB when
  one is configured.

### 4. Routes
- **`src/server/routes/clearanceRoutes.ts`**: the certificate auto-issue path,
  the explicit `/generate-certificate` endpoint, the document upload endpoint,
  and the document status PATCH endpoint now persist through the fixed
  `prismaRepo` methods instead of only pushing into the in-memory array.
- **`src/server/routes/notificationRoutes.ts`**: the notification DELETE
  endpoint now mirrors the deletion to the live database too.

### 5. Documentation
- **`README.md`**: corrected "16-entity schema" → "19-entity schema", and
  added a new "Persistence Architecture: Dual-Mode Data Layer" section
  describing exactly what is and isn't live-database-backed today.

## What's still in-memory-only (documented, not silently broken)

Admin-panel CRUD for faculties, departments, and workflow-stage configuration,
the "clearance units" list (which has no backing Prisma model at all), and
evaluation survey responses. These don't affect the Objective 4 claim (which
is specifically about clearance records/audit trail) but would be the natural
next scope, using the exact same `mirror*` pattern already established.

## How this was verified

No live MySQL instance was available in the environment this fix was written
in, so verification was done at three levels:

1. **`npx tsc --noEmit`** — zero errors across the whole project, including
   every new/edited file.
2. **A manual end-to-end smoke test** — ran `submitClearance` then `approveStage`
   directly against the in-memory fallback path and confirmed the request,
   7 stage-progress records, and audit log entry were created correctly, and
   the request correctly advanced from stage 1 to stage 2.
3. **The existing automated test suite** (`npx vitest run`) — all 35 tests
   across all 4 test files still pass unchanged.

**Before your defense, you should still do what I could not do here:** point
`DATABASE_URL` at a real MySQL/MariaDB instance, run `npx prisma generate`
and `npx prisma migrate deploy`, start the server, submit and approve a
clearance request through the actual UI, then independently query the
database (e.g. via MySQL Workbench or `npx prisma studio`) to confirm the
`clearance_requests`, `clearance_stage_progresses`, `approval_decisions`, and
`audit_logs` tables are populated. That is the concrete demonstration this
fix was written to make possible.
