// Vercel Serverless Function entry point
// Wraps the Express app for Vercel's serverless runtime

import app from '../backend/src/app.js';
import '../backend/src/db/connection.js'; // Ensure database connection & tables initialized

export default app;
