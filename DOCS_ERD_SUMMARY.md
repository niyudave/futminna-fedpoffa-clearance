# Entity-Relationship Diagram (ERD) & Database Architecture Summary

**System:** Electronic Clearance Management System (ECMS)  
**Institutions:** Federal University of Technology, Minna (FUTMINNA) & Federal Polytechnic Offa (FEDPOFFA)  
**Reference Schema:** `prisma/schema.prisma`  
**Database Engine:** Relational Database (MySQL / PostgreSQL / Prisma In-Memory Engine)

---

## 1. Architectural Overview & Design Philosophy

The database architecture is designed as a third-normal-form (3NF) relational schema that enforces strict institutional governance, immutable auditability, and role-based access control (RBAC). The schema cleanly decouples:

1. **Authentication Identity (`User`)** from **Academic Profile (`Student`)** via a normalized 1-to-1 relationship, preventing duplicate identity records while supporting both students and administrative officers.
2. **Clearance Workflow Definition (`ClearanceWorkflow`, `WorkflowStage`)** from **Runtime Execution State (`ClearanceRequest`, `ClearanceStageProgress`)**, enabling configurable multi-session academic workflows without schema migrations.
3. **Operational State (`ClearanceRequest`)** from **Tamper-Evident Evidence (`ApprovalDecision`, `ClearanceCertificate`, `AuditLog`)**, ensuring that approvals, signatures, and issued credentials remain verifiable even if operational records are archived.

---

## 2. Logical Entity Classification & Descriptions

The 16 core entities are categorized into four cohesive functional domains:

### Category 1: Identity, Authentication & Role-Based Access Control (RBAC)

* **`User`**: Central authentication record capturing credentials, full names, institutional contact information, account status, and optional department/faculty administrative affiliations.
* **`Role`**: Canonical security personas governing system capabilities (e.g., `STUDENT`, `HOD`, `DEAN`, `LIBRARIAN`, `BURSAR`, `STUDENT_AFFAIRS`, `ICT_DIRECTOR`, `REGISTRY`, `SUPER_ADMIN`).
* **`Permission`**: Granular operational privileges organized by functional module (e.g., `CLEARANCE_STAGE_APPROVE`, `CERTIFICATE_GENERATE`, `AUDIT_VIEW`).
* **`UserRole`**: Normalized junction entity establishing a many-to-many relationship between users and their assigned administrative roles.
* **`RolePermission`**: Normalized junction entity mapping granular permissions to specific system roles.
* **`PasswordResetToken`**: Secure, time-bounded SHA-256 cryptographic hash tokens enabling self-service credential recovery.

### Category 2: Academic & Institutional Structure

* **`Faculty`**: Top-level academic division grouping related departments across the polytechnic and affiliate university structure.
* **`Department`**: Primary academic unit responsible for student degree curricula, lab handovers, project hardcovers, and Stage 1 HOD clearance sign-off.
* **`Student`**: Normalized student academic ledger storing institutional matriculation numbers, JAMB registration codes, degree programme types, academic sessions, cumulative grade point averages (CGPA), and clearance eligibility flags.

### Category 3: Clearance Workflow, Requests & Endorsement

* **`ClearanceWorkflow`**: Workflow template header defining the active clearance session, academic cycle, and programme scope (e.g., Affiliate B.Tech Degree vs. National Diploma).
* **`WorkflowStage`**: Template configuration defining the 7 sequential clearance checkpoints (`DEPT`, `FACULTY`, `LIBRARY`, `BURSARY`, `STUDENT_AFFAIRS`, `ICT_PORTAL`, `REGISTRY`), required officer roles, and document upload requirements.
* **`ClearanceRequest`**: Primary clearance application initiated by a student, maintaining overall lifecycle status (`SUBMITTED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED`) and tracking the currently active sequential stage number.
* **`ClearanceStageProgress`**: Runtime state record tracking each of the 7 stages for a specific clearance request, recording individual stage status (`NOT_STARTED`, `PENDING`, `APPROVED`, `REJECTED`), assigned officers, and timestamp logs.
* **`ApprovalDecision`**: Formal immutable endorsement or corrective rejection logged by a stage officer, capturing signature hashes, digital stamps, officer remarks, client IP addresses, and user-agent strings.
* **`ClearanceCertificate`**: Legally binding electronic clearance certificate generated automatically upon completion of Stage 7, storing the canonical certificate number, verification QR code token, Academic Registry signature hash, and validity status.

### Category 4: Supporting Records, Evidence & Governance

* **`Document`**: Electronic artifacts and payment evidence (e.g., Remita receipts, project CDs, bursary waivers) uploaded by students and tied to specific clearance stages.
* **`Notification`**: Real-time asynchronous alerts dispatched to students and officers regarding stage endorsements, corrective feedback, or certificate readiness.
* **`AuditLog`**: Append-only security ledger capturing system transactions with before/after state snapshots, user metadata, and SHA-256 integrity checksums.
* **`SystemSetting`**: Dynamic key-value configuration table controlling institutional naming, strict sequential workflow enforcement flags, and QR verification endpoints.

---

## 3. Entity Relationships & Foreign Key Matrix

| Source Entity | Relationship | Target Entity | Foreign Key Field | Cardinality | Business Description |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `User` | $\rightarrow$ | `Department` | `departmentId` | $N:1$ | Assigns officer to an academic department |
| `User` | $\rightarrow$ | `Faculty` | `facultyId` | $N:1$ | Assigns dean to an academic faculty |
| `User` | $\leftrightarrow$ | `Student` | `userId` | $1:1$ | Links login identity to student academic profile |
| `UserRole` | $\rightarrow$ | `User` | `userId` | $N:1$ | Maps user to role assignment |
| `UserRole` | $\rightarrow$ | `Role` | `roleId` | $N:1$ | Maps role to user assignment |
| `RolePermission` | $\rightarrow$ | `Role` | `roleId` | $N:1$ | Associates permission with role |
| `RolePermission` | $\rightarrow$ | `Permission` | `permissionId` | $N:1$ | Associates role with privilege |
| `Department` | $\rightarrow$ | `Faculty` | `facultyId` | $N:1$ | Establishes department faculty hierarchy |
| `Student` | $\rightarrow$ | `Faculty` | `facultyId` | $N:1$ | Associates student with faculty |
| `Student` | $\rightarrow$ | `Department` | `departmentId` | $N:1$ | Associates student with major department |
| `WorkflowStage` | $\rightarrow$ | `ClearanceWorkflow` | `workflowId` | $N:1$ | Binds stage definitions to master workflow |
| `ClearanceRequest`| $\rightarrow$ | `Student` | `studentId` | $N:1$ | Tracks student clearance request ownership |
| `ClearanceRequest`| $\rightarrow$ | `ClearanceWorkflow` | `workflowId` | $N:1$ | Governs request by active workflow rules |
| `ClearanceStageProgress` | $\rightarrow$ | `ClearanceRequest` | `clearanceRequestId` | $N:1$ | Tracks 7 individual stage records per request |
| `ClearanceStageProgress` | $\rightarrow$ | `WorkflowStage` | `stageId` | $N:1$ | Links stage progress to template configuration |
| `ClearanceStageProgress` | $\rightarrow$ | `User` | `assignedOfficerId` | $N:1$ | Records officer assigned to review stage |
| `ApprovalDecision` | $\rightarrow$ | `ClearanceStageProgress` | `stageProgressId` | $N:1$ | Records officer decision on stage progress |
| `ApprovalDecision` | $\rightarrow$ | `User` | `officerId` | $N:1$ | Identifies officer who signed decision |
| `Document` | $\rightarrow$ | `ClearanceRequest` | `clearanceRequestId` | $N:1$ | Associates evidence document with request |
| `ClearanceCertificate` | $\leftrightarrow$ | `ClearanceRequest` | `clearanceRequestId` | $1:1$ | Grants certificate to cleared request |
| `ClearanceCertificate` | $\rightarrow$ | `Student` | `studentId` | $N:1$ | Links certificate to student profile |
| `ClearanceCertificate` | $\rightarrow$ | `User` | `verifiedByRegistryId` | $N:1$ | Records registry officer issuing certificate |
| `Notification` | $\rightarrow$ | `User` | `userId` | $N:1$ | Routes notification to specific user |
| `AuditLog` | $\rightarrow$ | `User` | `userId` | $N:1$ | Captures actor responsible for audit event |
| `PasswordResetToken` | $\rightarrow$ | `User` | `userId` | $N:1$ | Issues password reset token to user |

---

## 4. Complete Mermaid Entity-Relationship Diagram

The following Mermaid diagram visualizes the complete database schema with primary keys (`PK`), foreign keys (`FK`), unique attributes (`UK`), and normalized relationship cardinalities:

```mermaid
erDiagram

    %% ---------------------------------------------
    %% 1. IDENTITY & RBAC
    %% ---------------------------------------------
    USER ||--o{ USER_ROLE : "has assigned"
    ROLE ||--o{ USER_ROLE : "granted to"
    ROLE ||--o{ ROLE_PERMISSION : "contains"
    PERMISSION ||--o{ ROLE_PERMISSION : "associated with"
    USER ||--o{ PASSWORD_RESET_TOKEN : "requests"

    USER {
        string id PK
        string email UK
        string passwordHash
        string firstName
        string lastName
        string middleName
        string phoneNumber
        string avatarUrl
        string status
        string departmentId FK
        string facultyId FK
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
    }

    ROLE {
        string id PK
        string name UK
        string displayName
        string description
        boolean isSystem
        datetime createdAt
        datetime updatedAt
    }

    PERMISSION {
        string id PK
        string code UK
        string name
        string module
        string description
        datetime createdAt
        datetime updatedAt
    }

    USER_ROLE {
        string id PK
        string userId FK
        string roleId FK
        datetime assignedAt
    }

    ROLE_PERMISSION {
        string id PK
        string roleId FK
        string permissionId FK
        datetime grantedAt
    }

    PASSWORD_RESET_TOKEN {
        string id PK
        string userId FK
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
        datetime createdAt
        datetime updatedAt
    }

    %% ---------------------------------------------
    %% 2. ACADEMIC STRUCTURE & STUDENT
    %% ---------------------------------------------
    FACULTY ||--o{ DEPARTMENT : "supervises"
    FACULTY ||--o{ STUDENT : "enrolls"
    DEPARTMENT ||--o{ STUDENT : "admits"
    USER ||--o| STUDENT : "has profile"
    FACULTY ||--o{ USER : "employs dean"
    DEPARTMENT ||--o{ USER : "employs HOD"

    FACULTY {
        string id PK
        string code UK
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }

    DEPARTMENT {
        string id PK
        string facultyId FK
        string code UK
        string name
        string description
        datetime createdAt
        datetime updatedAt
    }

    STUDENT {
        string id PK
        string userId FK, UK
        string matricNumber UK
        string jambRegNumber UK
        string facultyId FK
        string departmentId FK
        string programmeType
        string level
        int entryYear
        int graduationYear
        string academicSession
        decimal cgpa
        boolean isClearanceEligible
        datetime createdAt
        datetime updatedAt
    }

    %% ---------------------------------------------
    %% 3. CLEARANCE WORKFLOW & EXECUTION
    %% ---------------------------------------------
    CLEARANCE_WORKFLOW ||--o{ WORKFLOW_STAGE : "defines stages"
    CLEARANCE_WORKFLOW ||--o{ CLEARANCE_REQUEST : "governs requests"
    STUDENT ||--o{ CLEARANCE_REQUEST : "initiates"
    DEPARTMENT ||--o{ WORKFLOW_STAGE : "hosts stage 1"

    CLEARANCE_REQUEST ||--o{ CLEARANCE_STAGE_PROGRESS : "tracks progress"
    WORKFLOW_STAGE ||--o{ CLEARANCE_STAGE_PROGRESS : "instantiated by"
    USER ||--o{ CLEARANCE_STAGE_PROGRESS : "assigned to evaluate"

    CLEARANCE_STAGE_PROGRESS ||--o{ APPROVAL_DECISION : "receives"
    USER ||--o{ APPROVAL_DECISION : "endorses / rejects"

    CLEARANCE_REQUEST ||--o| CLEARANCE_CERTIFICATE : "produces upon stage 7"
    STUDENT ||--o{ CLEARANCE_CERTIFICATE : "receives"
    USER ||--o{ CLEARANCE_CERTIFICATE : "sealed by registry"

    CLEARANCE_WORKFLOW {
        string id PK
        string name
        string academicSession
        string programmeType
        boolean isActive
        string description
        datetime createdAt
        datetime updatedAt
    }

    WORKFLOW_STAGE {
        string id PK
        string workflowId FK
        int stageNumber
        string stageCode
        string name
        string description
        string requiredRoleName
        string departmentId FK
        boolean requiresDocumentUpload
        string requiredDocumentNames
        boolean isSequential
        boolean isFinalStage
        datetime createdAt
        datetime updatedAt
    }

    CLEARANCE_REQUEST {
        string id PK
        string requestId UK
        string studentId FK
        string workflowId FK
        string status
        int currentStageNumber
        datetime submissionDate
        datetime completionDate
        string rejectionReason
        string overallRemarks
        datetime createdAt
        datetime updatedAt
    }

    CLEARANCE_STAGE_PROGRESS {
        string id PK
        string clearanceRequestId FK
        string stageId FK
        int stageNumber
        string status
        string assignedOfficerId FK
        string submittedDocuments
        string remarks
        datetime initiatedAt
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }

    APPROVAL_DECISION {
        string id PK
        string stageProgressId FK
        string officerId FK
        string decision
        string remarks
        string signatureHash
        string digitalStamp
        string ipAddress
        string userAgent
        datetime createdAt
    }

    CLEARANCE_CERTIFICATE {
        string id PK
        string certificateNumber UK
        string clearanceRequestId FK, UK
        string studentId FK
        string qrCodeToken UK
        datetime issuanceDate
        datetime expiryDate
        string verifiedByRegistryId FK
        string registrySignatureHash
        string status
        string fileUrl
        string securityMetadata
        datetime createdAt
        datetime updatedAt
    }

    %% ---------------------------------------------
    %% 4. SUPPORTING RECORDS, EVIDENCE & AUDIT
    %% ---------------------------------------------
    CLEARANCE_REQUEST ||--o{ DOCUMENT : "contains uploaded evidence"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ AUDIT_LOG : "triggers audit entry"

    DOCUMENT {
        string id PK
        string clearanceRequestId FK
        int stageNumber
        string fileName
        string filePath
        string fileType
        int fileSizeBytes
        string status
        datetime uploadedAt
        datetime createdAt
        datetime updatedAt
    }

    NOTIFICATION {
        string id PK
        string userId FK
        string title
        string message
        string type
        boolean isRead
        datetime readAt
        string linkUrl
        datetime createdAt
    }

    AUDIT_LOG {
        string id PK
        string userId FK
        string userEmail
        string action
        string entityType
        string entityId
        string previousState
        string newState
        string ipAddress
        string userAgent
        string checksumHash
        datetime createdAt
    }

    SYSTEM_SETTING {
        string id PK
        string key UK
        string value
        string category
        boolean isEncrypted
        string description
        datetime updatedAt
    }
```

---

## 5. Architectural Alignment with Dissertation Methodology

1. **Strict 7-Stage Enforcement via Schema Constraints**:
   - `ClearanceStageProgress` records are uniquely indexed by `(clearanceRequestId, stageId)`, ensuring that exactly 7 stage progress nodes exist per clearance application.
   - The sequential pointer `ClearanceRequest.currentStageNumber` guarantees that out-of-order transitions are rejected by the application and verified against `WorkflowStage.stageNumber`.

2. **Immutable Academic Audit Trail**:
   - Every approval or rejection is permanently stored in `ApprovalDecision` with an SHA-256 digital signature hash, originating IP address, and browser/system user agent.
   - The global `AuditLog` table maintains an unbroken chain of operational state transitions (`previousState` $\rightarrow$ `newState`) linked by checksums.

3. **Tamper-Evident Certificate Verification**:
   - `ClearanceCertificate` is cryptographically tied to the student's unique identity (`studentId`), master clearance request (`clearanceRequestId`), and unique offline/online validation QR code (`qrCodeToken`).
   - The Academic Registry officer's signature hash is captured directly on the certificate record and embedded into both the visual certificate and the downloadable server-generated PDF document.
