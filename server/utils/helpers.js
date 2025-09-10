const { GAME_CONFIG } = require('./constants');

/**
 * Generate a random room ID
 * @returns {string} 6-character alphanumeric room ID
 */
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < GAME_CONFIG.ROOM_ID_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique player ID
 * @returns {string} Unique player ID
 */
function generatePlayerId() {
  return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Validate room ID format
 * @param {string} roomId - Room ID to validate
 * @returns {boolean} True if valid
 */
function isValidRoomId(roomId) {
  return typeof roomId === 'string' && 
         roomId.length === GAME_CONFIG.ROOM_ID_LENGTH && 
         /^[A-Z0-9]+$/.test(roomId);
}

/**
 * Validate player name
 * @param {string} name - Player name to validate
 * @returns {boolean} True if valid
 */
function isValidPlayerName(name) {
  return typeof name === 'string' && 
         name.trim().length > 0 && 
         name.trim().length <= GAME_CONFIG.MAX_PLAYER_NAME_LENGTH &&
         /^[a-zA-Z0-9\s_-]+$/.test(name.trim());
}

/**
 * Sanitize player name
 * @param {string} name - Player name to sanitize
 * @returns {string} Sanitized player name
 */
function sanitizePlayerName(name) {
  return name.trim().substring(0, GAME_CONFIG.MAX_PLAYER_NAME_LENGTH);
}

/**
 * Calculate next player index considering game direction
 * @param {number} currentIndex - Current player index
 * @param {number} direction - Game direction (1 for clockwise, -1 for counterclockwise)
 * @param {number} playerCount - Total number of players
 * @returns {number} Next player index
 */
function getNextPlayerIndex(currentIndex, direction, playerCount) {
  return (currentIndex + direction + playerCount) % playerCount;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
}

/**
 * Check if two objects are deeply equal
 * @param {any} obj1 - First object
 * @param {any} obj2 - Second object
 * @returns {boolean} True if equal
 */
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (let key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }
  
  return false;
}

/**
 * Create a delay promise
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i === maxRetries) break;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Format time duration in human readable format
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Generate QR code data URL for room joining
 * @param {string} roomId - Room ID
 * @param {string} serverUrl - Server URL
 * @returns {string} QR code data URL
 */
function generateQRCodeData(roomId, serverUrl) {
  const joinUrl = `${serverUrl}?room=${roomId}`;
  // In a real implementation, you would use a QR code library
  // For now, return the URL that would be encoded
  return joinUrl;
}

/**
 * Validate game settings
 * @param {Object} settings - Game settings to validate
 * @returns {Object} Validation result with isValid and errors
 */
function validateGameSettings(settings) {
  const errors = [];
  
  if (!settings || typeof settings !== 'object') {
    errors.push('Settings must be an object');
    return { isValid: false, errors };
  }
  
  // Add more validation rules as needed
  if (settings.maxPlayers && (settings.maxPlayers < 2 || settings.maxPlayers > 4)) {
    errors.push('Max players must be between 2 and 4');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  generateRoomId,
  generatePlayerId,
  isValidRoomId,
  isValidPlayerName,
  sanitizePlayerName,
  getNextPlayerIndex,
  shuffleArray,
  deepClone,
  deepEqual,
  delay,
  retryWithBackoff,
  formatDuration,
  generateQRCodeData,
  validateGameSettings
};
