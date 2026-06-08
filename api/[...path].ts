import { app } from '../server/app.js';
import { initDb } from '../server/db.js';

let dbReady = false;

export default async function handler(req: any, res: any) {
  if (!dbReady) {
    try {
      await initDb();
      dbReady = true;
    } catch (err: any) {
      console.error('[init] DB init error (continuing):', err.message);
      // Tables may already exist from a previous deploy — continue
    }
  }

  // Keep the Lambda alive until Express sends the response
  await new Promise<void>((resolve) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    app(req, res);
  });
}
