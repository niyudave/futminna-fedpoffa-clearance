# Clearance Workflow Engine & Sequential Pipeline Architecture
## Chapter 3 System Design Specification: FUTMINNA-FEDPOFFA Student E-Clearance Management System

This document provides a formal, comprehensive architectural description of the clearance workflow engine as implemented in `src/server/workflow/workflowEngine.ts` and seeded in `src/server/db/seedData.ts`. It replaces earlier conceptual models that assumed independent or parallel per-department clearance processing with the authoritative, strictly sequential 7-stage state machine architecture.

---

## 1. Strictly Sequential 7-Stage Clearance Pipeline

Unlike decoupled systems where clearance departments operate concurrently without coordination, the FUTMINNA-FEDPOFFA E-Clearance Management System implements a **strictly sequential 7-stage pipeline**. The clearance workflow enforces mathematical precedence constraints ($Stage_{N}$ must be validated and approved before $Stage_{N+1}$ can be activated or reviewed).

### The 7 Authoritative Workflow Stages

The table below details each stage in order, utilizing the exact identifiers, stage codes, and authorized roles defined in `src/server/db/seedData.ts`:

| Sequence | Stage Code | Official Stage Name | Authorized Role (`requiredRoleName`) | Mandatory Document Upload | Required Evidence / Submission Proofs | Stage Objective & Institutional Scope |
|---|---|---|---|:---:|---|---|
| **Stage 1** | `DEPT` | **Departmental Clearance** | `HOD` | **Yes** | 1. Final Project CD / Hardcover Copy Proof<br>2. Departmental Association Dues Receipt | Departmental project submission, laboratory equipment return, seminar defense sign-off, and Head of Department academic clearance. |
| **Stage 2** | `FACULTY` | **Faculty Office Clearance** | `DEAN` | **Yes** | 1. Faculty Dues Payment Remita Receipt | School / Faculty Dean verification of cumulative academic standing, faculty dues settlement, and examination board clearance. |
| **Stage 3** | `LIBRARY` | **University & Polytechnic Library Clearance** | `LIBRARIAN` | **No** | 1. Library Borrower Card / ID Proof | Verification of borrowed textbook returns, inter-library loan reconciliation, archive deposit, and electronic library registration check. |
| **Stage 4** | `BURSARY` | **Bursary Department Clearance** | `BURSAR` | **Yes** | 1. All Sessions School Fees Remita Receipts<br>2. Graduation & Convocation Fee Teller | Comprehensive financial audit: verification of full tuition fees, development levies, acceptance fees, and graduation charges. |
| **Stage 5** | `HOSTEL_STUDENT_AFFAIRS` | **Hostel & Student Affairs Clearance** | `STUDENT_AFFAIRS` | **No** | 1. Hostel Accommodation Slip / Off-Campus Undertaking | Hall of residence room key surrender, damage inspection assessment, hall dues check, and student disciplinary records audit. |
| **Stage 6** | `ICT_PORTAL` | **ICT & E-Portal Clearance** | `ICT_DIRECTOR` | **No** | 1. E-Portal Biodata Printout | Student bio-data validation, institutional portal profile lock, and FUTMINNA affiliation matriculation number synchronization. |
| **Stage 7** | `REGISTRY` | **Academic Registry Final Clearance** | `REGISTRY` | **No** | 1. Consolidated Stage 1-6 Endorsement Sheet | Final institutional audit by Registrar / Academic Secretary. Validates Stages 1–6 and mints the official tamper-evident QR Certificate. |

---

## 2. Step-by-Step Execution Lifecycle in `workflowEngine.ts`

The clearance lifecycle is orchestrated by `CentralWorkflowEngine`, which manages four core operational transitions:

```
[Student Initiation] ──> [Stage Review Loop] ──> [Officer Decision: Approve | Reject] ──> [Stage 7 Completion & Minting]
                                ▲                               │
                                └─── [Student Resubmission] ────┘ (if rejected)
```

---

### 2.1 Student Submits a Clearance Request (`submitClearance`)

When an eligible student initiates clearance through the client interface, the engine executes the following transactional sequence:

1. **Eligibility & Identity Verification**:
   - Queries `Student` table using the authenticated user's ID.
   - Enforces the `isClearanceEligible` boolean flag. If the student has outstanding academic probation or unapproved results, initiation halts immediately (`NOT_ELIGIBLE`).
   - Verifies whether an existing clearance request exists. If an existing request has `status: 'COMPLETED'`, re-initiation is prevented to safeguard previously minted certificates (`ALREADY_COMPLETED`).
2. **Master Request Initialization**:
   - Creates (or resets) a `ClearanceRequest` entity with `status: 'IN_PROGRESS'`, `currentStageNumber: 1`, and timestamps the current date as `submissionDate`.
   - Assigns a unique institutional request tracking identifier (e.g., `CLR-2026-FUT-XXXXX`).
3. **Dynamic Stage Instantiation & Gating**:
   - Retrieves the active sequence definitions from `WorkflowStage`.
   - Instantiates 7 corresponding `ClearanceStageProgress` records linked to the request:
     - **Stage 1 (Departmental)** is set to status **`PENDING`** (`initiatedAt: Date.now()`).
     - **Stages 2 through 7** are set to status **`NOT_STARTED`** with `initiatedAt: null`, preventing premature access or out-of-order reviews.
   - Identifies the specific reviewing officer for Stage 1 by matching the `HOD` role to the student's `departmentId`.
4. **Notification Dispatch**:
   - Dispatches an asynchronous in-app notification and email to the assigned Head of Department informing them of a pending departmental review.
   - Emits a real-time WebSocket event (`broadcastClearanceUpdate`) and notifies the student.
5. **Security Audit Logging**:
   - Appends an immutable `AuditLog` entry with action `CLEARANCE_SUBMITTED`, capturing initial parameters and network metadata.

---

### 2.2 Officer Approves a Stage (`approveStage`)

When an authorized desk officer reviews and endorses a student's clearance checkpoint:

1. **Target Identification & Gating Validation**:
   - Resolves the target `ClearanceStageProgress` record and its parent `ClearanceRequest`.
   - Enforces **Sequence State Machine Validation**:
     - Rejects approval if the stage is already `APPROVED` (`STAGE_ALREADY_APPROVED`).
     - Rejects approval if the stage is `NOT_STARTED` (`STAGE_NOT_ACTIVE`), ensuring officers cannot approve a checkpoint until all preceding stages have completed.
2. **Role-Based & Contextual Boundary Enforcement**:
   - Confirms the officer possesses the exact required role (`stageDef.requiredRoleName`) or `SUPER_ADMIN`.
   - Enforces **Organizational Isolation**:
     - *Departmental Check*: An HOD assigned to Department $A$ is blocked from approving clearance for a student enrolled in Department $B$ (`FORBIDDEN_DEPARTMENT_MISMATCH`).
     - *Faculty Check*: A Dean assigned to School $X$ is blocked from approving clearance for a student enrolled in School $Y$ (`FORBIDDEN_FACULTY_MISMATCH`).
3. **Cryptographic Endorsement Generation**:
   - Generates a SHA-256 digital signature hash:
     $$\text{Signature} = \text{SHA256}(\text{OfficerID} + \text{":"} + \text{StageProgressID} + \text{":APPROVED:"} + \text{Timestamp})$$
   - Formulates a standardized institutional digital stamp:
     $$\text{Stamp} = \text{"FUTMINNA-FEDPOFFA/"} + \text{Role} + \text{"/APPROVED/"} + \text{YYYY-MM-DD}$$
   - Inserts an immutable `ApprovalDecision` record linked to the stage progress.
4. **Stage Completion & Document Verification**:
   - Transitions `ClearanceStageProgress.status` to `APPROVED`, records `completedAt`, and saves officer remarks.
   - Marks all `Document` entities uploaded for that stage number as `VERIFIED`.
5. **Sequential Handshake & Advancement**:
   - Inspects the workflow sequence for the subsequent stage ($N+1$):
     - **For Intermediate Stages (Stages 1 through 6)**:
       - Increments `ClearanceRequest.currentStageNumber` to $N+1$.
       - Transitions Stage $N+1$ progress status from `NOT_STARTED` to **`PENDING`** (`initiatedAt: Date.now()`).
       - Resolves the next stage's responsible officers (e.g., Dean for Stage 2, Librarian for Stage 3) and dispatches real-time alerts and pending emails.
       - Notifies the student that Stage $N$ has been cleared and Stage $N+1$ is now active.
     - **For Final Stage (Stage 7 - Academic Registry)**:
       - Transitions `ClearanceRequest.status` to **`COMPLETED`** and records `completionDate`.
       - Automatically triggers the **Certificate Generation Subsystem** (see Section 2.4).
6. **Audit & Real-Time Broadcast**:
   - Emits real-time WebSocket clearance updates and logs an immutable `STAGE_APPROVED` audit event with SHA-256 state tracking.

---

### 2.3 Officer Rejects a Stage (`rejectStage`) & The Resubmission Loop

If a reviewing officer discovers missing fees, unreturned library materials, academic discrepancies, or unsubmitted required evidence:

1. **Mandatory Reason Enforcement**:
   - Validates that the officer provides a comprehensive, actionable explanation (minimum 5 characters). Rejections without clear justification are rejected (`MISSING_REASON`).
2. **Authorization & Departmental Checks**:
   - Validates officer RBAC and organizational boundaries identically to the approval path.
3. **State Transition to Rejected**:
   - Transitions `ClearanceStageProgress.status` to **`REJECTED`** and records the officer's remarks.
   - Sets `ClearanceRequest.status` to **`REJECTED`** and updates `ClearanceRequest.rejectionReason`.
   - Marks attached evidence documents for that stage as `REJECTED`.
4. **Student Notification & Guidance**:
   - Transmits an actionable alert (`ACTION_REQUIRED`) to the student detailing the officer's exact rejection notes and required corrective steps.
   - Halts all downstream stage progression; Stage $N+1$ remains locked in `NOT_STARTED`.
5. **Student Document Resubmission (`resubmitStageDocuments`)**:
   - The student uploads updated documentation or payment receipts specifically targeting the rejected stage.
   - Enforces that already `APPROVED` stages cannot be re-opened for document modifications (`STAGE_ALREADY_APPROVED`).
   - Replaces stale documents with newly uploaded records marked `PENDING`.
   - Resets `ClearanceStageProgress.status` back to **`PENDING`**.
   - Resets `ClearanceRequest.status` from `REJECTED` back to **`IN_PROGRESS`**.
   - Alerts the reviewing officer that corrected documents have been submitted and await re-evaluation.

---

### 2.4 Completion of Stage 7 & Certificate Generation Trigger

When Stage 7 (Academic Registry Final Clearance) is approved by the authorized Registry officer:

1. **Final Status Seal**:
   - `ClearanceRequest.status` transitions permanently to **`COMPLETED`**.
   - `ClearanceRequest.completionDate` is stamped with the final approval timestamp.
   - `ClearanceRequest.overallRemarks` is updated to record 100% clearance across all 7 checkpoints.
2. **Cryptographic Certificate Minting**:
   - Verifies whether a certificate already exists for the clearance request (preventing duplicate issuance).
   - Mints an official `ClearanceCertificate` containing:
     - **Certificate Number**: Institutional tracking number in the format `FUT-FP-CLR-2026-XXXX`.
     - **Anti-Counterfeit QR Token**: A high-entropy cryptographic token (`QR_FUTMINNA_FEDPOFFA_{32-hex-bytes}`) encoded into a verification QR code for public validation.
     - **Digital Registry Signature**: Captures the signing Registry officer's user ID and cryptographic signature hash.
     - **Status**: Set to `VALID`.
3. **Institutional Distribution**:
   - Logs a `CERTIFICATE_GENERATED` audit record.
   - Dispatches a system notification to institutional Super Administrators.
   - Sends a celebratory notification and congratulatory email to the student with download links and verification instructions.

---

## 3. Workflow Engine State Machine & Process Flow Diagram

Below is the Mermaid state diagram representing the 7 sequential stages, the review decisions, and the corrective resubmission loop.

```mermaid
flowchart TD
    %% Global Styling
    classDef startEnd fill:#1E293B,stroke:#0F172A,stroke-width:2px,color:#FFFFFF;
    classDef stageNode fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px,color:#1E3A8A;
    classDef decisionNode fill:#FEF3C7,stroke:#D97706,stroke-width:2px,color:#92400E;
    classDef rejectNode fill:#FEF2F2,stroke:#EF4444,stroke-width:2px,color:#991B1B;
    classDef successNode fill:#F0FDF4,stroke:#16A34A,stroke-width:2px,color:#166534;

    Start([Student Initiates Clearance]) :::startEnd
    CheckEligibility{Is Student Eligible<br/>& Not Already Completed?} :::decisionNode
    HaltEligibility[Clearance Terminated / Blocked] :::rejectNode

    Start --> CheckEligibility
    CheckEligibility -- No --> HaltEligibility
    CheckEligibility -- Yes --> InitRequest[Initialize ClearanceRequest<br/>Create 7 Stages: Stage 1 PENDING, Stages 2-7 NOT_STARTED]

    %% STAGE 1: DEPARTMENT
    InitRequest --> S1[Stage 1: Departmental Clearance<br/>Role: HOD | Requires Upload] :::stageNode
    S1 --> D1{HOD Decision} :::decisionNode
    D1 -- Reject --> R1[Stage 1 REJECTED<br/>Request: REJECTED] :::rejectNode
    R1 --> Resubmit1[Student Resubmits Corrected Documents]
    Resubmit1 --> S1
    D1 -- Approve --> Pass1[Stage 1 APPROVED<br/>Digital Stamp & SHA-256 Hash]

    %% STAGE 2: FACULTY
    Pass1 --> S2[Stage 2: Faculty Office Clearance<br/>Role: DEAN | Requires Upload] :::stageNode
    S2 --> D2{Dean Decision} :::decisionNode
    D2 -- Reject --> R2[Stage 2 REJECTED<br/>Request: REJECTED] :::rejectNode
    R2 --> Resubmit2[Student Resubmits Corrected Documents]
    Resubmit2 --> S2
    D2 -- Approve --> Pass2[Stage 2 APPROVED<br/>Digital Stamp & SHA-256 Hash]

    %% STAGE 3: LIBRARY
    Pass2 --> S3[Stage 3: University Library Clearance<br/>Role: LIBRARIAN] :::stageNode
    S3 --> D3{Librarian Decision} :::decisionNode
    D3 -- Reject --> R3[Stage 3 REJECTED<br/>Request: REJECTED] :::rejectNode
    R3 --> Resubmit3[Student Reconciles Overdue Books / Dues]
    Resubmit3 --> S3
    D3 -- Approve --> Pass3[Stage 3 APPROVED<br/>Digital Stamp & SHA-256 Hash]

    %% STAGE 4: BURSARY
    Pass3 --> S4[Stage 4: Bursary Department Clearance<br/>Role: BURSAR | Requires Upload] :::stageNode
    S4 --> D4{Bursar Decision} :::decisionNode
    D4 -- Reject --> R4[Stage 4 REJECTED<br/>Request: REJECTED] :::rejectNode
    R4 --> Resubmit4[Student Uploads Missing Remita Receipts]
    Resubmit4 --> S4
    D4 -- Approve --> Pass4[Stage 4 APPROVED<br/>Digital Stamp & SHA-256 Hash]

    %% STAGE 5: HOSTEL
    Pass4 --> S5[Stage 5: Hostel & Student Affairs Clearance<br/>Role: STUDENT_AFFAIRS] :::stageNode
    S5 --> D5{Student Affairs Decision} :::decisionNode
    D5 -- Reject --> R5[Stage 5 REJECTED<br/>Request: REJECTED] :::rejectNode
    R5 --> Resubmit5[Student Clears Room Key / Dues]
    Resubmit5 --> S5
    D5 -- Approve --> Pass5[Stage 5 APPROVED<br/>Digital Stamp & SHA-256 Hash]

    %% STAGE 6: ICT PORTAL
    Pass5 --> S6[Stage 6: ICT & E-Portal Clearance<br/>Role: ICT_DIRECTOR] :::stageNode
    S6 --> D6{ICT Director Decision} :::decisionNode
    D6 -- Reject --> R6[Stage 6 REJECTED<br/>Request: REJECTED] :::rejectNode
    R6 --> Resubmit6[Student Corrects Portal Biodata]
    Resubmit6 --> S6
    D6 -- Approve --> Pass6[Stage 6 APPROVED<br/>Digital Stamp & SHA-256 Hash]

    %% STAGE 7: REGISTRY
    Pass6 --> S7[Stage 7: Academic Registry Final Clearance<br/>Role: REGISTRY] :::stageNode
    S7 --> D7{Registrar Decision} :::decisionNode
    D7 -- Reject --> R7[Stage 7 REJECTED<br/>Request: REJECTED] :::rejectNode
    R7 --> Resubmit7[Student Rectifies Graduation File]
    Resubmit7 --> S7
    D7 -- Approve --> Complete[Clearance 100% COMPLETED<br/>Auto-Mint ClearanceCertificate with QR Token] :::successNode

    Complete --> EndState([Digital Clearance Certificate Issued & Active]) :::startEnd
```

---

## 4. Transactional Integrity & Rollback Mechanism (`TransactionResult`)

In enterprise clearance management, partial or orphaned mutations (e.g., a stage status advancing while document verification fails, or an approval decision saving without updating the next stage progress) constitute catastrophic data integrity failures. 

To guarantee ACID (Atomicity, Consistency, Isolation, Durability) semantics across all workflow operations, the engine implements a dedicated transaction wrapper: `CentralWorkflowEngine.runTransaction<T>()`.

### 4.1 Type Definition

```typescript
export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  rollbackOccurred?: boolean;
}
```

### 4.2 Snapshot and Automatic Rollback Execution

The transaction lifecycle operates as follows:

```
[Incoming Operation] 
         │
         ├── 1. DEEP SNAPSHOT: Deep clones 10 workflow tables via JSON serialization
         │
         ├── 2. ATOMIC EXECUTION: Executes state transition within try-catch block
         │          │
         │          ├── [Success] ──> Returns { success: true, data: result }
         │          │
         │          └── [Exception / Failure]
         │                     │
         │                     ├── 3. AUTOMATIC ROLLBACK: Restores all 10 tables from snapshot
         │                     │
         │                     ├── 4. AUDIT TRAIL: Logs 'TRANSACTION_ROLLBACK' event
         │                     │
         │                     └── 5. ERROR RESPONSE: Returns { success: false, rollbackOccurred: true, code, error }
```

1. **Pre-Mutation Deep Snapshotting**:
   Prior to executing mutations, the engine serializes an in-memory deep snapshot of all collections participating in clearance transactions:
   - `clearanceRequests`
   - `clearanceStageProgresses`
   - `approvalDecisions`
   - `documents`
   - `passwordResetTokens`
   - `notifications`
   - `auditLogs`
   - `certificates`
   - `students`
   - `workflowStages`
2. **Guaranteed Rollback on Exception**:
   If an unexpected runtime error, referential validation failure, cross-department boundary check, or database exception is thrown:
   - The engine catches the exception.
   - Iterates through all 10 snapshot arrays and re-hydrates the active store with exact deep clones, faithfully restoring all `Date` objects and foreign key associations to their exact pre-transaction state.
   - Any half-written records (e.g., partial stage decisions or unlinked documents) are purged.
3. **Transaction Rollback Audit Logging**:
   The engine generates an immutable system audit record capturing the error event:
   ```json
   {
     "action": "TRANSACTION_ROLLBACK",
     "entityType": "WORKFLOW_ENGINE",
     "previousState": { "error": "Cross-Department Clearance Violation: ..." },
     "newState": { "status": "ROLLED_BACK_SAFE" }
   }
   ```
4. **Structured Error Return**:
   The caller receives an explicit `TransactionResult` object with `rollbackOccurred: true` and a standardized machine-readable error code (`FORBIDDEN_DEPARTMENT_MISMATCH`, `STAGE_NOT_ACTIVE`, `STAGE_ALREADY_APPROVED`, etc.), enabling the API layer to deliver clean HTTP status codes (e.g., `400 Bad Request`, `403 Forbidden`, `409 Conflict`) without crashing or corrupting server memory.

### 4.3 Asynchronous Decoupling of Transport Services

A critical architectural design in `workflowEngine.ts` is the safe decoupling of external notification transports (`dispatchNotificationSafely`):
- WebSocket emissions (`socketServer.notifyUser`, `socketServer.notifyRole`) and email dispatches (`emailService.sendEmail`) are executed **outside the transaction boundary** using asynchronous, non-blocking fire-and-forget promises.
- **Academic Benefit**: Network timeouts, email gateway latency, or client socket disconnects can **never** invalidate or trigger a rollback of a valid academic clearance endorsement. The core database state transition remains atomic and authoritative.

---
*Documentation compiled for Chapter 3 System Architecture & Workflow Engine Design from the authoritative `src/server/workflow/workflowEngine.ts` and `src/server/db/seedData.ts` specifications.*
