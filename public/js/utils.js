/**
 * UNO Multiplayer - Utility Functions
 */

// Utility class for common functions
class Utils {
  /**
   * Generate a random ID
   * @param {number} length - Length of the ID
   * @returns {string} Random ID
   */
  static generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function calls
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Format time duration
   * @param {number} ms - Milliseconds
   * @returns {string} Formatted duration
   */
  static formatDuration(ms) {
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
   * Format timestamp
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted time
   */
  static formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  /**
   * Validate room ID format
   * @param {string} roomId - Room ID to validate
   * @returns {boolean} True if valid
   */
  static isValidRoomId(roomId) {
    return typeof roomId === 'string' && 
           roomId.length === 6 && 
           /^[A-Z0-9]+$/.test(roomId);
  }

  /**
   * Validate player name
   * @param {string} name - Player name to validate
   * @returns {boolean} True if valid
   */
  static isValidPlayerName(name) {
    return typeof name === 'string' && 
           name.trim().length > 0 && 
           name.trim().length <= 15 &&
           /^[a-zA-Z0-9\s_-]+$/.test(name.trim());
  }

  /**
   * Sanitize player name
   * @param {string} name - Player name to sanitize
   * @returns {string} Sanitized player name
   */
  static sanitizePlayerName(name) {
    return name.trim().substring(0, 15);
  }

  /**
   * Get URL parameters
   * @returns {Object} URL parameters
   */
  static getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Set URL parameter
   * @param {string} key - Parameter key
   * @param {string} value - Parameter value
   */
  static setUrlParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url);
  }

  /**
   * Remove URL parameter
   * @param {string} key - Parameter key
   */
  static removeUrlParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url);
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  }

  /**
   * Show toast notification
   * @param {string} message - Message to show
   * @param {string} type - Toast type (success, error, info, warning)
   * @param {number} duration - Duration in milliseconds
   */
  static showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toastId = Utils.generateId();
    const toastHtml = `
      <div class="toast animate-notification-slide-in" id="toast-${toastId}" role="alert">
        <div class="toast-header">
          <i class="fas fa-${Utils.getToastIcon(type)} me-2"></i>
          <strong class="me-auto">${Utils.getToastTitle(type)}</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(`toast-${toastId}`);
    const toast = new bootstrap.Toast(toastElement, {
      autohide: true,
      delay: duration
    });

    toast.show();

    // Remove element after hiding
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  /**
   * Get toast icon based on type
   * @param {string} type - Toast type
   * @returns {string} Icon class
   */
  static getToastIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  /**
   * Get toast title based on type
   * @param {string} type - Toast type
   * @returns {string} Title
   */
  static getToastTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info'
    };
    return titles[type] || 'Info';
  }

  /**
   * Animate element
   * @param {Element} element - Element to animate
   * @param {string} animation - Animation class
   * @param {number} duration - Animation duration
   */
  static animateElement(element, animation, duration = 1000) {
    if (!element) return;

    element.classList.add(animation);
    
    setTimeout(() => {
      element.classList.remove(animation);
    }, duration);
  }

  /**
   * Add loading state to element
   * @param {Element} element - Element to add loading state to
   */
  static setLoading(element, loading = true) {
    if (!element) return;

    if (loading) {
      element.classList.add('loading');
      element.disabled = true;
    } else {
      element.classList.remove('loading');
      element.disabled = false;
    }
  }

  /**
   * Shuffle array
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Deep clone object
   * @param {any} obj - Object to clone
   * @returns {any} Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = Utils.deepClone(obj[key]);
      });
      return cloned;
    }
  }

  /**
   * Check if two objects are equal
   * @param {any} obj1 - First object
   * @param {any} obj2 - Second object
   * @returns {boolean} True if equal
   */
  static deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      for (let key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!Utils.deepEqual(obj1[key], obj2[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Get device type
   * @returns {string} Device type (mobile, tablet, desktop)
   */
  static getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Check if device is touch
   * @returns {boolean} True if touch device
   */
  static isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get browser info
   * @returns {Object} Browser information
   */
  static getBrowserInfo() {
    const ua = navigator.userAgent;
    const browsers = {
      chrome: /Chrome/.test(ua),
      firefox: /Firefox/.test(ua),
      safari: /Safari/.test(ua) && !/Chrome/.test(ua),
      edge: /Edg/.test(ua),
      opera: /Opera/.test(ua)
    };
    
    return {
      userAgent: ua,
      browsers,
      isMobile: /Mobile/.test(ua),
      isTablet: /Tablet/.test(ua)
    };
  }

  /**
   * Generate QR code data URL
   * @param {string} text - Text to encode
   * @param {number} size - QR code size
   * @returns {string} Data URL
   */
  static generateQRCode(text, size = 200) {
    // Simple QR code generation using a library would be better
    // For now, return a placeholder
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw a simple placeholder
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', size / 2, size / 2 - 10);
    ctx.fillText('Placeholder', size / 2, size / 2 + 10);
    
    return canvas.toDataURL();
  }

  /**
   * Vibrate device (if supported)
   * @param {number|Array} pattern - Vibration pattern
   */
  static vibrate(pattern = 100) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Test vibration patterns for special cards
   * This function can be called from browser console for testing
   */
  static testVibrationPatterns() {
    console.log('Testing vibration patterns for special cards...');
    
    const patterns = {
      'wild': [200, 100, 200],
      'wild-draw4': [300, 100, 300],
      'skip': [150, 50, 150],
      'reverse': [100, 50, 100, 50, 100],
      'wild-activation': [200, 100, 200]
    };

    let index = 0;
    const testPattern = () => {
      if (index < Object.keys(patterns).length) {
        const cardType = Object.keys(patterns)[index];
        const pattern = patterns[cardType];
        
        console.log(`Testing ${cardType}:`, pattern);
        Utils.vibrate(pattern);
        
        index++;
        setTimeout(testPattern, 2000); // Wait 2 seconds between tests
      } else {
        console.log('Vibration pattern testing complete!');
      }
    };

    testPattern();
  }

  /**
   * Play sound effect
   * @param {string} sound - Sound name
   * @param {number} volume - Volume (0-1)
   */
  static playSound(sound, volume = 0.5) {
    // Sound implementation would go here
    // For now, just log the sound
    console.log(`Playing sound: ${sound} at volume ${volume}`);
  }

  /**
   * Get local storage with fallback
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value
   * @returns {any} Stored value or default
   */
  static getStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  /**
   * Set local storage with error handling
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {boolean} Success status
   */
  static setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
      return false;
    }
  }

  /**
   * Remove from local storage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  static removeStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
      return false;
    }
  }

  /**
   * Format number with commas
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  static formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Capitalize first letter
   * @param {string} str - String to capitalize
   * @returns {string} Capitalized string
   */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Truncate text
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @returns {string} Truncated text
   */
  static truncate(text, length = 50) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create element with attributes
   * @param {string} tag - HTML tag
   * @param {Object} attributes - Element attributes
   * @param {string} content - Element content
   * @returns {Element} Created element
   */
  static createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'innerHTML') {
        element.innerHTML = attributes[key];
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    if (content) {
      element.textContent = content;
    }
    
    return element;
  }

  /**
   * Wait for element to exist
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Element>} Element when found
   */
  static waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }
}

// Export for use in other modules
window.Utils = Utils;
