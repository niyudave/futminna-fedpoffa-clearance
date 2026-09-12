-- Migration: 20260830000000_add_document_model
-- Add Document table for normalized relational clearance document storage

-- CreateTable: documents
CREATE TABLE `documents` (
    `id` VARCHAR(36) NOT NULL,
    `clearanceRequestId` VARCHAR(36) NOT NULL,
    `stageNumber` INTEGER NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `filePath` VARCHAR(500) NOT NULL,
    `fileType` VARCHAR(100) NOT NULL,
    `fileSizeBytes` INTEGER NOT NULL DEFAULT 0,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `documents_clearanceRequestId_idx`(`clearanceRequestId`),
    INDEX `documents_stageNumber_idx`(`stageNumber`),
    INDEX `documents_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_clearanceRequestId_fkey` FOREIGN KEY (`clearanceRequestId`) REFERENCES `clearance_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
