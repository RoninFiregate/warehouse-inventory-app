require('dotenv').config();

const { initDb } = require('./db');
const createApp = require('./app');

const port = process.env.PORT || 4000;

async function start() {
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  await initDb();
  const app = createApp();
  app.listen(port, () => console.log(`API listening on ${port}`));
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
