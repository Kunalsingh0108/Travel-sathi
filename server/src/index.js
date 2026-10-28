/**
 * Tripora API server.
 *   node src/index.js        (or npm run dev --watch)
 *
 * Env vars (all optional, see .env.example):
 *   PORT, ADMIN_TOKEN, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, OSRM_URL, STORE_DIR
 */
import express from 'express';
import cors from 'cors';
import itineraryRoutes from './routes/itinerary.routes.js';
import tripRoutes from './routes/trips.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import metaRoutes from './routes/meta.routes.js';
import { attachUser } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import { llmConfigured } from './services/llm.js';

const app = express();

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '2mb' }));
app.use(attachUser);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'tripora-api',
    time: new Date().toISOString(),
    llm: llmConfigured() ? 'configured' : 'rule-based fallback',
  });
});

app.use('/api/itinerary', itineraryRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meta', metaRoutes);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`[tripora] API listening on http://localhost:${port}`);
    if (!process.env.ADMIN_TOKEN) {
      console.log('[tripora] ADMIN_TOKEN is not set - /api/admin stays disabled (see server/.env.example).');
    }
    if (!llmConfigured()) {
      console.log('[tripora] No LLM_API_KEY - replanning uses the transparent rule-based parser.');
    }
  });
}

export default app;