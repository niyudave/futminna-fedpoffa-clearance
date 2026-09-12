-- Migration: 20260814000000_init
-- Institutional E-Clearance Database Schema for FUTMINNA in affiliation with FEDPOFFA

-- CreateTable: users
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `middleName` VARCHAR(100) NULL,
    `phoneNumber` VARCHAR(30) NULL,
    `avatarUrl` VARCHAR(255) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION') NOT NULL DEFAULT 'ACTIVE',
    `departmentId` VARCHAR(36) NULL,
    `facultyId` VARCHAR(36) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_departmentId_idx`(`departmentId`),
    INDEX `users_facultyId_idx`(`facultyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: roles
CREATE TABLE `roles` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `displayName` VARCHAR(128) NOT NULL,
    `description` VARCHAR(255) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    INDEX `roles_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: permissions
CREATE TABLE `permissions` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `module` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `permissions_code_key`(`code`),
    INDEX `permissions_code_idx`(`code`),
    INDEX `permissions_module_idx`(`module`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: user_roles
CREATE TABLE `user_roles` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `roleId` VARCHAR(36) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_roles_userId_idx`(`userId`),
    INDEX `user_roles_roleId_idx`(`roleId`),
    UNIQUE INDEX `user_roles_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: role_permissions
CREATE TABLE `role_permissions` (
    `id` VARCHAR(36) NOT NULL,
    `roleId` VARCHAR(36) NOT NULL,
    `permissionId` VARCHAR(36) NOT NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `role_permissions_roleId_idx`(`roleId`),
    INDEX `role_permissions_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: faculties
CREATE TABLE `faculties` (
    `id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `faculties_code_key`(`code`),
    INDEX `faculties_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: departments
CREATE TABLE `departments` (
    `id` VARCHAR(36) NOT NULL,
    `facultyId` VARCHAR(36) NOT NULL,
    `code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `departments_code_key`(`code`),
    INDEX `departments_code_idx`(`code`),
    INDEX `departments_facultyId_idx`(`facultyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: students
CREATE TABLE `students` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `matricNumber` VARCHAR(64) NOT NULL,
    `jambRegNumber` VARCHAR(64) NULL,
    `facultyId` VARCHAR(36) NOT NULL,
    `departmentId` VARCHAR(36) NOT NULL,
    `programmeType` ENUM('AFFILIATE_DEGREE', 'ND_FULL_TIME', 'HND_FULL_TIME', 'PART_TIME') NOT NULL DEFAULT 'AFFILIATE_DEGREE',
    `level` ENUM('ND_I', 'ND_II', 'HND_I', 'HND_II', 'DEGREE_100', 'DEGREE_200', 'DEGREE_300', 'DEGREE_400', 'GRADUATED') NOT NULL DEFAULT 'DEGREE_400',
    `entryYear` INTEGER NOT NULL,
    `graduationYear` INTEGER NOT NULL,
    `academicSession` VARCHAR(32) NOT NULL,
    `cgpa` DECIMAL(3, 2) NULL,
    `isClearanceEligible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `students_userId_key`(`userId`),
    UNIQUE INDEX `students_matricNumber_key`(`matricNumber`),
    UNIQUE INDEX `students_jambRegNumber_key`(`jambRegNumber`),
    INDEX `students_matricNumber_idx`(`matricNumber`),
    INDEX `students_jambRegNumber_idx`(`jambRegNumber`),
    INDEX `students_facultyId_idx`(`facultyId`),
    INDEX `students_departmentId_idx`(`departmentId`),
    INDEX `students_programmeType_idx`(`programmeType`),
    INDEX `students_academicSession_idx`(`academicSession`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: clearance_workflows
CREATE TABLE `clearance_workflows` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `academicSession` VARCHAR(32) NOT NULL,
    `programmeType` ENUM('AFFILIATE_DEGREE', 'ND_FULL_TIME', 'HND_FULL_TIME', 'PART_TIME') NOT NULL DEFAULT 'AFFILIATE_DEGREE',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `clearance_workflows_academicSession_idx`(`academicSession`),
    INDEX `clearance_workflows_programmeType_idx`(`programmeType`),
    INDEX `clearance_workflows_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: workflow_stages
CREATE TABLE `workflow_stages` (
    `id` VARCHAR(36) NOT NULL,
    `workflowId` VARCHAR(36) NOT NULL,
    `stageNumber` INTEGER NOT NULL,
    `stageCode` VARCHAR(64) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `requiredRoleName` VARCHAR(64) NOT NULL,
    `departmentId` VARCHAR(36) NULL,
    `requiresDocumentUpload` BOOLEAN NOT NULL DEFAULT false,
    `requiredDocumentNames` TEXT NULL,
    `isSequential` BOOLEAN NOT NULL DEFAULT true,
    `isFinalStage` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `workflow_stages_workflowId_idx`(`workflowId`),
    INDEX `workflow_stages_stageCode_idx`(`stageCode`),
    INDEX `workflow_stages_stageNumber_idx`(`stageNumber`),
    UNIQUE INDEX `workflow_stages_workflowId_stageNumber_key`(`workflowId`, `stageNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: clearance_requests
CREATE TABLE `clearance_requests` (
    `id` VARCHAR(36) NOT NULL,
    `requestId` VARCHAR(64) NOT NULL,
    `studentId` VARCHAR(36) NOT NULL,
    `workflowId` VARCHAR(36) NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'COMPLETED', 'REVOKED') NOT NULL DEFAULT 'SUBMITTED',
    `currentStageNumber` INTEGER NOT NULL DEFAULT 1,
    `submissionDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completionDate` DATETIME(3) NULL,
    `rejectionReason` TEXT NULL,
    `overallRemarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clearance_requests_requestId_key`(`requestId`),
    INDEX `clearance_requests_requestId_idx`(`requestId`),
    INDEX `clearance_requests_studentId_idx`(`studentId`),
    INDEX `clearance_requests_workflowId_idx`(`workflowId`),
    INDEX `clearance_requests_status_idx`(`status`),
    INDEX `clearance_requests_currentStageNumber_idx`(`currentStageNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: clearance_stage_progresses
CREATE TABLE `clearance_stage_progresses` (
    `id` VARCHAR(36) NOT NULL,
    `clearanceRequestId` VARCHAR(36) NOT NULL,
    `stageId` VARCHAR(36) NOT NULL,
    `stageNumber` INTEGER NOT NULL,
    `status` ENUM('NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WAIVED') NOT NULL DEFAULT 'NOT_STARTED',
    `assignedOfficerId` VARCHAR(36) NULL,
    `submittedDocuments` LONGTEXT NULL,
    `remarks` TEXT NULL,
    `initiatedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `clearance_stage_progresses_clearanceRequestId_idx`(`clearanceRequestId`),
    INDEX `clearance_stage_progresses_stageId_idx`(`stageId`),
    INDEX `clearance_stage_progresses_status_idx`(`status`),
    INDEX `clearance_stage_progresses_stageNumber_idx`(`stageNumber`),
    INDEX `clearance_stage_progresses_assignedOfficerId_idx`(`assignedOfficerId`),
    UNIQUE INDEX `clearance_stage_progresses_clearanceRequestId_stageId_key`(`clearanceRequestId`, `stageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: approval_decisions
CREATE TABLE `approval_decisions` (
    `id` VARCHAR(36) NOT NULL,
    `stageProgressId` VARCHAR(36) NOT NULL,
    `officerId` VARCHAR(36) NOT NULL,
    `decision` ENUM('APPROVED', 'REJECTED', 'ESCALATED', 'WAIVED') NOT NULL DEFAULT 'APPROVED',
    `remarks` TEXT NULL,
    `signatureHash` VARCHAR(255) NULL,
    `digitalStamp` VARCHAR(255) NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `approval_decisions_stageProgressId_idx`(`stageProgressId`),
    INDEX `approval_decisions_officerId_idx`(`officerId`),
    INDEX `approval_decisions_decision_idx`(`decision`),
    INDEX `approval_decisions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: clearance_certificates
CREATE TABLE `clearance_certificates` (
    `id` VARCHAR(36) NOT NULL,
    `certificateNumber` VARCHAR(64) NOT NULL,
    `clearanceRequestId` VARCHAR(36) NOT NULL,
    `studentId` VARCHAR(36) NOT NULL,
    `qrCodeToken` VARCHAR(255) NOT NULL,
    `issuanceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiryDate` DATETIME(3) NULL,
    `verifiedByRegistryId` VARCHAR(36) NULL,
    `registrySignatureHash` VARCHAR(255) NULL,
    `status` ENUM('VALID', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'VALID',
    `fileUrl` VARCHAR(255) NULL,
    `securityMetadata` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clearance_certificates_certificateNumber_key`(`certificateNumber`),
    UNIQUE INDEX `clearance_certificates_clearanceRequestId_key`(`clearanceRequestId`),
    UNIQUE INDEX `clearance_certificates_qrCodeToken_key`(`qrCodeToken`),
    INDEX `clearance_certificates_certificateNumber_idx`(`certificateNumber`),
    INDEX `clearance_certificates_studentId_idx`(`studentId`),
    INDEX `clearance_certificates_qrCodeToken_idx`(`qrCodeToken`),
    INDEX `clearance_certificates_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: notifications
CREATE TABLE `notifications` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('CLEARANCE_STATUS', 'APPROVAL_REQUIRED', 'REJECTION_NOTICE', 'CERTIFICATE_READY', 'SYSTEM_ALERT', 'SECURITY_WARNING') NOT NULL DEFAULT 'CLEARANCE_STATUS',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `linkUrl` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_isRead_idx`(`isRead`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: audit_logs
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NULL,
    `userEmail` VARCHAR(191) NULL,
    `action` ENUM('USER_LOGIN', 'USER_CREATE', 'USER_ROLE_ASSIGNED', 'CLEARANCE_SUBMITTED', 'STAGE_APPROVED', 'STAGE_REJECTED', 'STAGE_WAIVED', 'CERTIFICATE_ISSUED', 'CERTIFICATE_REVOKED', 'SYSTEM_SETTING_UPDATED', 'SECURITY_BREACH_ATTEMPT') NOT NULL,
    `entityType` VARCHAR(64) NOT NULL,
    `entityId` VARCHAR(64) NULL,
    `previousState` LONGTEXT NULL,
    `newState` LONGTEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `checksumHash` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_entityType_idx`(`entityType`),
    INDEX `audit_logs_entityId_idx`(`entityId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: system_settings
CREATE TABLE `system_settings` (
    `id` VARCHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `category` ENUM('GENERAL', 'WORKFLOW', 'NOTIFICATION', 'SECURITY', 'AFFILIATION') NOT NULL DEFAULT 'GENERAL',
    `isEncrypted` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(255) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_key_key`(`key`),
    INDEX `system_settings_key_idx`(`key`),
    INDEX `system_settings_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign Keys & Constraints
ALTER TABLE `users` ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `faculties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `departments` ADD CONSTRAINT `departments_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `students` ADD CONSTRAINT `students_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `faculties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `students` ADD CONSTRAINT `students_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `workflow_stages` ADD CONSTRAINT `workflow_stages_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `workflow_stages` ADD CONSTRAINT `workflow_stages_workflowId_fkey` FOREIGN KEY (`workflowId`) REFERENCES `clearance_workflows`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `clearance_requests` ADD CONSTRAINT `clearance_requests_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `clearance_requests` ADD CONSTRAINT `clearance_requests_workflowId_fkey` FOREIGN KEY (`workflowId`) REFERENCES `clearance_workflows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `clearance_stage_progresses` ADD CONSTRAINT `clearance_stage_progresses_assignedOfficerId_fkey` FOREIGN KEY (`assignedOfficerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `clearance_stage_progresses` ADD CONSTRAINT `clearance_stage_progresses_clearanceRequestId_fkey` FOREIGN KEY (`clearanceRequestId`) REFERENCES `clearance_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `clearance_stage_progresses` ADD CONSTRAINT `clearance_stage_progresses_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `workflow_stages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `approval_decisions` ADD CONSTRAINT `approval_decisions_stageProgressId_fkey` FOREIGN KEY (`stageProgressId`) REFERENCES `clearance_stage_progresses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `approval_decisions` ADD CONSTRAINT `approval_decisions_officerId_fkey` FOREIGN KEY (`officerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `clearance_certificates` ADD CONSTRAINT `clearance_certificates_verifiedByRegistryId_fkey` FOREIGN KEY (`verifiedByRegistryId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `clearance_certificates` ADD CONSTRAINT `clearance_certificates_clearanceRequestId_fkey` FOREIGN KEY (`clearanceRequestId`) REFERENCES `clearance_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `clearance_certificates` ADD CONSTRAINT `clearance_certificates_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
