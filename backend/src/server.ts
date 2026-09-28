import { app } from './app.js';
import { db } from './config/database.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => console.log(`StudyMate API listening on http://localhost:${env.PORT}`));

const shutdown = async () => {
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
