/**
 * Auth Microservice — Standalone entry point
 * Extracted from server.js: /api/auth/* routes
 * Run: PORT=5001 node index.js
 */
require('dotenv').config({ path: '../../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.get('/health', (_, res) => res.json({ service: 'auth-service', status: 'ok' }));

const PORT = process.env.AUTH_SERVICE_PORT || 5001;
app.listen(PORT, () => console.log(`Auth service on :${PORT}`));
