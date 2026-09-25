import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { pool } from './db/index.js';
import { setupSocket } from './realtime/socket.js';
import { startScheduler } from './jobs/scheduler.js';
import authRoutes from './routes/auth.js';
import businessRoutes from './routes/businesses.js';
import staffRoutes from './routes/staff.js';
import servicesRoutes from './routes/services.js';
import availabilityRoutes from './routes/availability.js';
import appointmentsRoutes from './routes/appointments.js';
import clientsRoutes from './routes/clients.js';
import waitlistRoutes from './routes/waitlist.js';
import checkoutRoutes from './routes/checkout.js';
import paymentsRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';
import pricingRulesRoutes from './routes/pricingRules.js';
import reviewsRoutes from './routes/reviews.js';
import marketingRoutes from './routes/marketing.js';
import reportsRoutes from './routes/reports.js';
import queueRoutes from './routes/queue.js';
import marketplaceRoutes from './routes/marketplace.js';
import widgetRoutes from './routes/widget.js';
import { errorHandler } from './middleware/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = setupSocket(server);

const allowedOrigins = config.isProduction
  ? (process.env.APP_URL ? process.env.APP_URL.split(',') : [])
  : true;
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/pricing-rules', pricingRulesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/widget', widgetRoutes);

if (config.isProduction) {
  const clientDist = path.resolve(__dirname, '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  app.get('/', (req, res) => res.send('Bookly API running in development mode. Use Vite dev server for client.'));
}

app.use(errorHandler);

if (config.nodeEnv === 'production') startScheduler();

const port = config.port;
server.listen(port, '0.0.0.0', () => {
  console.log(`Bookly server running on port ${port} (0.0.0.0)`);
});

process.on('SIGTERM', async () => {
  await pool.end();
  server.close(() => process.exit(0));
});
