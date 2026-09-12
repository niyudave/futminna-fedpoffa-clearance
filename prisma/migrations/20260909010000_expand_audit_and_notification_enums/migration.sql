-- Fix: the application logs several audit actions and one notification-type
-- pair that were never added to the original MySQL ENUM columns. Any attempt
-- to persist those values (e.g. 'CERTIFICATE_GENERATED', 'LOGIN_SUCCESS',
-- 'ACTION_REQUIRED') would fail with a MySQL enum-constraint / data-truncation
-- error. This migration widens both ENUM columns to match schema.prisma.
--
-- Widening a MySQL ENUM's allowed value list is backward compatible: all
-- existing rows keep their current value, no data is rewritten or lost.

ALTER TABLE `audit_logs`
  MODIFY COLUMN `action` ENUM(
    'USER_LOGIN',
    'USER_CREATE',
    'USER_ROLE_ASSIGNED',
    'CLEARANCE_SUBMITTED',
    'STAGE_APPROVED',
    'STAGE_REJECTED',
    'STAGE_WAIVED',
    'CERTIFICATE_ISSUED',
    'CERTIFICATE_REVOKED',
    'SYSTEM_SETTING_UPDATED',
    'SECURITY_BREACH_ATTEMPT',
    'LOGIN_SUCCESS',
    'LOGIN_FAILED_PASSWORD_MISMATCH',
    'LOGIN_FAILED_UNKNOWN_USER',
    'LOGOUT',
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'USER_PROFILE_UPDATED',
    'PASSWORD_RESET',
    'PASSWORD_RESET_REQUESTED',
    'CERTIFICATE_GENERATED',
    'TRANSACTION_ROLLBACK',
    'STAGE_DOCUMENTS_RESUBMITTED',
    'DOCUMENT_UPLOADED',
    'DOCUMENT_STATUS_UPDATED',
    'FACULTY_CREATED',
    'WORKFLOW_STAGE_UPDATED',
    'WORKFLOW_STAGES_REORDERED',
    'EVALUATION_TRANSACTION_PROBE',
    'EMAIL_DELIVERY_FAILED'
  ) NOT NULL;

ALTER TABLE `notifications`
  MODIFY COLUMN `type` ENUM(
    'CLEARANCE_STATUS',
    'APPROVAL_REQUIRED',
    'REJECTION_NOTICE',
    'CERTIFICATE_READY',
    'SYSTEM_ALERT',
    'SECURITY_WARNING',
    'ACTION_REQUIRED',
    'SYSTEM'
  ) NOT NULL DEFAULT 'CLEARANCE_STATUS';
