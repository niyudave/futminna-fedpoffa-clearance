import { beforeEach } from 'vitest';
import { dbStore } from '../src/server/db/client';

process.env.NODE_ENV = 'test';
process.env.DB_MODE = 'IN_MEMORY';
process.env.DATABASE_URL = '';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-futminna-fedpoffa-32chars';

beforeEach(() => {
  // Re-seed dbStore relations before each test for clean deterministic state
  dbStore.initRelations();
});
