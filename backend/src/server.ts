import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

const server = app.listen(config.port, () => {
  logger.info(`NetGuard AI backend started`, {
    port: config.port,
    environment: config.nodeEnv,
    url: `http://localhost:${config.port}`,
  });
});

// Handle server-level errors (e.g., EADDRINUSE)
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${config.port} is already in use. Another instance may be running.`, {
      port: config.port,
      code: error.code,
    });
    process.exit(1);
  }
  logger.error('Server error', { error: error.message, code: error.code });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
