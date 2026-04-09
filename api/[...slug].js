// Vercel API catch-all route — wraps the Express backend as a serverless function.
// All requests to /api/* are handled here by the Express app.
import app from '../backend/server.js';

export default app;
