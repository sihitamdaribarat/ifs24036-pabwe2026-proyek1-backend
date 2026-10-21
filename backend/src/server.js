import app from './app.js';
import { config } from './config/index.js';
import './db/connection.js'; // Ensure database connection & tables initialized

const server = app.listen(config.port, () => {
  console.log(`
  🌱 LangkahKecil Backend API Server
  🚀 Berjalan di http://localhost:${config.port}
  📋 Health check: http://localhost:${config.port}/health
  📡 API Base URL: http://localhost:${config.port}/api/v1
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  server.close(() => {
    console.log('\n🛑 Server dimatikan dengan aman.');
    process.exit(0);
  });
});
