import { prisma } from "./db";

export async function initDB() {
  try {
    // These PRAGMAs can return a row in SQLite, so use $queryRawUnsafe
    await prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`);
    await prisma.$queryRawUnsafe(`PRAGMA synchronous = NORMAL;`);
    await prisma.$queryRawUnsafe(`PRAGMA busy_timeout = 5000;`);
  } catch (e) {
    console.warn("DB PRAGMA init warning:", e);
  }
}
