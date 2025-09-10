class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
  }

  log(level, message, ...args) {
    if (this.levels[level] <= this.levels[this.logLevel]) {
      console.log(this.formatMessage(level, message, ...args));
    }
  }

  error(message, ...args) {
    this.log('error', message, ...args);
  }

  warn(message, ...args) {
    this.log('warn', message, ...args);
  }

  info(message, ...args) {
    this.log('info', message, ...args);
  }

  debug(message, ...args) {
    this.log('debug', message, ...args);
  }

  // Game-specific logging methods
  gameEvent(event, roomId, playerId, details = {}) {
    this.info(`GAME_EVENT: ${event}`, {
      roomId,
      playerId,
      ...details
    });
  }

  socketEvent(event, socketId, details = {}) {
    this.debug(`SOCKET_EVENT: ${event}`, {
      socketId,
      ...details
    });
  }

  roomEvent(event, roomId, details = {}) {
    this.info(`ROOM_EVENT: ${event}`, {
      roomId,
      ...details
    });
  }
}

module.exports = new Logger();
