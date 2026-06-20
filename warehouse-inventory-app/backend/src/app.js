const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const assortmentRoutes = require('./routes/assortment.routes');
const shelfRoutes = require('./routes/shelf.routes');
const userRoutes = require('./routes/user.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const exportRoutes = require('./routes/export.routes');
const documentRoutes = require('./routes/document.routes');
const errorHandler = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 300 }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/asortyment', assortmentRoutes);
  app.use('/api/regal', shelfRoutes);
  app.use('/api/uzytkownik', userRoutes);
  app.use('/api/stan', inventoryRoutes);
app.use('/api/dokument', documentRoutes);
  app.use('/api/export', exportRoutes);
app.use('/api/document', documentRoutes);

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
