import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './server/config.js';
import { initDatabase } from './server/db.js';
import authRouter from './server/routes/auth.js';
import complaintsRouter from './server/routes/complaints.js';
import adminRouter from './server/routes/admin.js';
import publicRouter from './server/routes/public.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Basic Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static directory for uploaded complaint evidence images
  app.use('/uploads', express.static(config.uploadsDir));

  // Initialize relational database (MySQL 8 with automatic resilient local engine)
  const dbStatus = await initDatabase();
  console.log(`[Smart Civic System] Database initialized: ${dbStatus.engine.toUpperCase()} (${dbStatus.host})`);

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/complaints', complaintsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/public', publicRouter);

  // Error handling middleware for unexpected server errors
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error Handler]:', err);
    if (err.message && err.message.includes('file format')) {
      res.status(400).json({ success: false, message: err.message });
      return;
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, message: 'Uploaded file exceeds the maximum 5MB size limit.' });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'An unexpected internal server error occurred. Please try again.',
    });
  });

  // Setup Frontend: Vite middlewares in development, static build in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = config.port;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================================`);
    console.log(` Smart Civic Complaint System`);
    console.log(` Developed by: ${config.ownerName}`);
    console.log(` Server running on http://0.0.0.0:${PORT}`);
    console.log(` Database engine: ${dbStatus.engine.toUpperCase()}`);
    console.log(`========================================================`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]:', err);
  process.exit(1);
});
