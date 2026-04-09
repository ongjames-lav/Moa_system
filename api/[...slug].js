// Vercel Serverless Function entry point
import './register-backend.js'; // Helper to ensure dependencies are found
import app from '../backend/server.js';

export default app;
