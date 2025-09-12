const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const os = require('os');
const cors = require('cors');

// Import our custom modules
const socketHandler = require('./socket/socketHandler');
const logger = require('./utils/logger');

class UnoServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.port = process.env.PORT || 3000;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Enable CORS for LAN access
    this.app.use(cors());
    
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // Parse JSON bodies
    this.app.use(express.json());
    
    // Logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Get server info for LAN discovery
    this.app.get('/server-info', (req, res) => {
      const networkInterfaces = os.networkInterfaces();
      const addresses = [];
      
      Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(netInterface => {
          if (netInterface.family === 'IPv4' && !netInterface.internal) {
            addresses.push({
              interface: interfaceName,
              address: netInterface.address,
              url: `http://${netInterface.address}:${this.port}`
            });
          }
        });
      });

      res.json({
        port: this.port,
        addresses: addresses,
        timestamp: new Date().toISOString()
      });
    });

    // Catch-all handler for SPA routing
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  setupSocketHandlers() {
    socketHandler.initialize(this.io);
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      this.gracefulShutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown();
    });

    // Graceful shutdown on SIGTERM/SIGINT
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  gracefulShutdown() {
    logger.info('Shutting down server gracefully...');
    
    this.server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  }

  start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      logger.info(`🚀 UNO Multiplayer Server running on port ${this.port}`);
      
      // Display server info
      console.log('\n📡 Server accessible via:');
      console.log(`   Local: http://localhost:${this.port}`);
      
      // Only show LAN info in development
      if (process.env.NODE_ENV !== 'production') {
        const networkInterfaces = os.networkInterfaces();
        Object.keys(networkInterfaces).forEach(interfaceName => {
          networkInterfaces[interfaceName].forEach(netInterface => {
            if (netInterface.family === 'IPv4' && !netInterface.internal) {
              console.log(`   LAN:   http://${netInterface.address}:${this.port}`);
            }
          });
        });
        console.log('\n🎮 Players can join by visiting the LAN URLs above\n');
      } else {
        console.log('\n🌐 Production server ready!\n');
      }
    });
  }
}

// Start the server
const server = new UnoServer();
server.start();

module.exports = UnoServer;
