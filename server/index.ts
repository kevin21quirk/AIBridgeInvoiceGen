import 'dotenv/config';
import { app } from './app.js';
import { initDb } from './db.js';

const PORT = process.env.PORT || 3001;

initDb().then(() => {
  app.listen(PORT, () => console.log('API server running on port ' + PORT));
}).catch(console.error);
