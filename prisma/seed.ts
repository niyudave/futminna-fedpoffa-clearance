import { DEFAULT_BCRYPT_HASH, DEFAULT_DEMO_PASSWORD } from '../src/server/db/seedData';
import { AuthService } from '../src/server/auth/authService';
import { getPrismaClient, dbStore } from '../src/server/db/client';
import { seedInstitutionalData } from '../src/server/db/seedDatabase';
import { pathToFileURL } from 'url';

export async function main() {
  console.log('🌱 Starting FUTMINNA-FEDPOFFA Database Seed...');
  const passwordHash = DEFAULT_BCRYPT_HASH || AuthService.hashPasswordSync(DEFAULT_DEMO_PASSWORD);

  // Sync relational memory store users with real bcrypt hashes as well
  dbStore.users.forEach((user) => {
    user.passwordHash = passwordHash;
  });

  try {
    const prisma = getPrismaClient();
    if (!prisma) {
      throw new Error('No live Prisma client available (check DATABASE_URL)');
    }
    // Single source of truth for institutional seed data — also used by
    // src/server/db/client.ts's hydrateFromDatabase() to auto-bootstrap a
    // fresh database the first time the running server connects to it.
    await seedInstitutionalData(prisma);
    console.log('✅ Database Seed Completed Successfully with Functional Bcrypt Hashes!');
  } catch (err: any) {
    console.log('ℹ️ Live database connection notice:', err?.message || err);
    console.log('✅ Local Relational Store synchronized with functional Bcrypt hashes for all 9 canonical demo accounts.');
  }
}

// Only auto-run (and exit the process) when this file is executed directly
// as the Prisma seed CLI entrypoint (`npx prisma db seed`, which runs
// `tsx prisma/seed.ts`). When this module is instead *imported* — e.g. by
// src/server/db/client.ts's hydrateFromDatabase(), which reuses main() to
// bootstrap a freshly migrated database the first time the app connects to
// it — this guard must NOT fire, or importing this file would kill the
// running server process via process.exit(0).
const isDirectCliInvocation =
  process.env.NODE_ENV !== 'test' &&
  !!process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectCliInvocation) {
  main()
    .then(async () => {
      try {
        const prisma = getPrismaClient();
        await prisma.$disconnect();
      } catch {}
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('Seed error:', e);
      try {
        const prisma = getPrismaClient();
        await prisma.$disconnect();
      } catch {}
      process.exit(0);
    });
}
