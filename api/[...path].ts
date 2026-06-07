import { app } from '../server/app.js';
import { initDb } from '../server/db.js';

let dbReady = false;

export default async function handler(req: any, res: any) {
  if (!dbReady) {
    await initDb();
    dbReady = true;
  }
  app(req, res);
}
