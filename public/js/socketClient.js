/**
 * UNO Multiplayer - Socket.IO Client
 */

class SocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.eventHandlers = new Map();
    this.connectionStatus = 'disconnected';
    
    this.initialize();
  }

  /**
   * Initialize socket connection
   */
  initialize() {
    try {
      this.socket = io({
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventHandlers();
      this.setupConnectionHandlers();
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      this.handleConnect();
    });

    this.socket.on('disconnect', (reason) => {
      this.handleDisconnect(reason);
    });

    this.socket.on('connect_error', (error) => {
      this.handleConnectionError(error);
    });

    // Game events
    this.socket.on('room-created', (data) => {
      this.emitLocal('room-created', data);
    });

    this.socket.on('room-joined', (data) => {
      this.emitLocal('room-joined', data);
    });

    this.socket.on('player-joined', (data) => {
      this.emitLocal('player-joined', data);
    });

    this.socket.on('player-left', (data) => {
      this.emitLocal('player-left', data);
    });

    this.socket.on('game-started', (data) => {
      this.emitLocal('game-started', data);
    });

    this.socket.on('game-state-update', (data) => {
      this.emitLocal('game-state-update', data);
    });

    this.socket.on('card-played', (data) => {
      this.emitLocal('card-played', data);
    });

    this.socket.on('card-drawn', (data) => {
      this.emitLocal('card-drawn', data);
    });

    this.socket.on('turn-changed', (data) => {
      this.emitLocal('turn-changed', data);
    });

    this.socket.on('player-ready', (data) => {
      this.emitLocal('player-ready', data);
    });

    this.socket.on('uno-called', (data) => {
      this.emitLocal('uno-called', data);
    });

    this.socket.on('color-chosen', (data) => {
      this.emitLocal('color-chosen', data);
    });

    this.socket.on('game-ended', (data) => {
      this.emitLocal('game-ended', data);
    });

    this.socket.on('invalid-move', (data) => {
      this.emitLocal('invalid-move', data);
    });

    this.socket.on('error', (data) => {
      this.emitLocal('error', data);
    });

    this.socket.on('connection-status', (data) => {
      this.emitLocal('connection-status', data);
    });

    this.socket.on('room-full', (data) => {
      this.emitLocal('room-full', data);
    });

    this.socket.on('room-not-found', (data) => {
      this.emitLocal('room-not-found', data);
    });

    this.socket.on('player-disconnected', (data) => {
      this.emitLocal('player-disconnected', data);
    });

    this.socket.on('player-reconnected', (data) => {
      this.emitLocal('player-reconnected', data);
    });
  }

  /**
   * Setup connection handlers
   */
  setupConnectionHandlers() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
      this.handleBeforeUnload();
    });
  }

  /**
   * Handle successful connection
   */
  handleConnect() {
    console.log('Socket connected:', this.socket.id);
    this.connected = true;
    this.connectionStatus = 'connected';
    this.reconnectAttempts = 0;
    
    this.updateConnectionStatus();
    this.emitLocal('connected', { socketId: this.socket.id });
    
    Utils.showToast('Connected to server', 'success');
  }

  /**
   * Handle disconnection
   * @param {string} reason - Disconnection reason
   */
  handleDisconnect(reason) {
    console.log('Socket disconnected:', reason);
    this.connected = false;
    this.connectionStatus = 'disconnected';
    
    this.updateConnectionStatus();
    this.emitLocal('disconnected', { reason });
    
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, don't reconnect
      Utils.showToast('Disconnected from server', 'warning');
    } else {
      // Client initiated disconnect, attempt to reconnect
      this.attemptReconnect();
    }
  }

  /**
   * Handle connection error
   * @param {Error} error - Connection error
   */
  handleConnectionError(error) {
    console.error('Socket connection error:', error);
    this.connectionStatus = 'error';
    
    this.updateConnectionStatus();
    this.emitLocal('connection-error', { error: error.message });
    
    Utils.showToast('Connection error: ' + error.message, 'error');
    this.attemptReconnect();
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.connectionStatus = 'failed';
      this.updateConnectionStatus();
      Utils.showToast('Failed to reconnect. Please refresh the page.', 'error');
      return;
    }

    this.reconnectAttempts++;
    this.connectionStatus = 'reconnecting';
    this.updateConnectionStatus();
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Handle page becoming hidden
   */
  handlePageHidden() {
    console.log('Page hidden, maintaining connection');
    // Keep connection alive but reduce activity
  }

  /**
   * Handle page becoming visible
   */
  handlePageVisible() {
    console.log('Page visible, checking connection');
    if (!this.connected) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    console.log('Network online');
    if (!this.connected) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    console.log('Network offline');
    this.connectionStatus = 'offline';
    this.updateConnectionStatus();
    Utils.showToast('Network connection lost', 'warning');
  }

  /**
   * Handle before unload
   */
  handleBeforeUnload() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Update connection status in UI
   */
  updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;

    const statusConfig = {
      connected: {
        class: 'bg-success',
        icon: 'fa-wifi',
        text: 'Connected'
      },
      disconnected: {
        class: 'bg-warning',
        icon: 'fa-wifi',
        text: 'Disconnected'
      },
      reconnecting: {
        class: 'bg-warning animate-connection-pulse',
        icon: 'fa-wifi',
        text: 'Reconnecting...'
      },
      error: {
        class: 'bg-danger',
        icon: 'fa-exclamation-triangle',
        text: 'Error'
      },
      failed: {
        class: 'bg-danger',
        icon: 'fa-times',
        text: 'Failed'
      },
      offline: {
        class: 'bg-secondary',
        icon: 'fa-wifi-slash',
        text: 'Offline'
      }
    };

    const config = statusConfig[this.connectionStatus] || statusConfig.disconnected;
    
    statusElement.className = `badge ${config.class}`;
    statusElement.innerHTML = `<i class="fas ${config.icon} me-1"></i>${config.text}`;
  }

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data = {}) {
    if (!this.connected) {
      console.warn('Cannot emit event, socket not connected:', event);
      Utils.showToast('Not connected to server', 'error');
      return false;
    }

    try {
      this.socket.emit(event, data);
      console.log('Emitted event:', event, data);
      return true;
    } catch (error) {
      console.error('Error emitting event:', event, error);
      Utils.showToast('Failed to send message', 'error');
      return false;
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  off(event, handler) {
    if (!this.eventHandlers.has(event)) return;
    
    const handlers = this.eventHandlers.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit event to local handlers
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emitLocal(event, data) {
    if (!this.eventHandlers.has(event)) return;
    
    this.eventHandlers.get(event).forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in event handler:', event, error);
      }
    });
  }

  /**
   * Create room
   * @param {string} playerName - Player name
   * @param {Object} settings - Room settings
   */
  createRoom(playerName, settings = {}) {
    return this.emit('create-room', {
      playerName: Utils.sanitizePlayerName(playerName),
      settings
    });
  }

  /**
   * Join room
   * @param {string} roomId - Room ID
   * @param {string} playerName - Player name
   */
  joinRoom(roomId, playerName) {
    return this.emit('join-room', {
      roomId: roomId.toUpperCase(),
      playerName: Utils.sanitizePlayerName(playerName)
    });
  }

  /**
   * Leave room
   * @param {string} roomId - Room ID
   */
  leaveRoom(roomId) {
    return this.emit('leave-room', { roomId });
  }

  /**
   * Start game
   * @param {string} roomId - Room ID
   */
  startGame(roomId) {
    return this.emit('start-game', { roomId });
  }

  /**
   * Play card
   * @param {string} roomId - Room ID
   * @param {number} cardIndex - Card index
   * @param {string} chosenColor - Chosen color for wild cards
   */
  playCard(roomId, cardIndex, chosenColor = null) {
    return this.emit('play-card', {
      roomId,
      cardIndex,
      chosenColor
    });
  }

  /**
   * Draw card
   * @param {string} roomId - Room ID
   */
  drawCard(roomId) {
    return this.emit('draw-card', { roomId });
  }

  /**
   * Call UNO
   * @param {string} roomId - Room ID
   */
  callUno(roomId) {
    return this.emit('call-uno', { roomId });
  }

  /**
   * Choose color
   * @param {string} roomId - Room ID
   * @param {string} color - Chosen color
   */
  chooseColor(roomId, color) {
    return this.emit('choose-color', {
      roomId,
      color
    });
  }

  /**
   * Set ready status
   * @param {string} roomId - Room ID
   * @param {boolean} ready - Ready status
   */
  setReady(roomId, ready) {
    return this.emit('ready-status', {
      roomId,
      ready
    });
  }

  /**
   * Challenge wild draw 4
   * @param {string} roomId - Room ID
   * @param {boolean} challenge - Whether to challenge
   */
  challengeWildDraw4(roomId, challenge) {
    return this.emit('challenge-wild-draw4', {
      roomId,
      challenge
    });
  }

  /**
   * Reconnect with old socket ID
   * @param {string} oldSocketId - Old socket ID
   */
  reconnect(oldSocketId) {
    return this.emit('reconnect', { oldSocketId });
  }

  /**
   * Get connection status
   * @returns {string} Connection status
   */
  getConnectionStatus() {
    return this.connectionStatus;
  }

  /**
   * Check if connected
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  /**
   * Get socket ID
   * @returns {string} Socket ID
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Destroy socket client
   */
  destroy() {
    this.disconnect();
    this.eventHandlers.clear();
    this.socket = null;
  }
}

// Create global instance
window.socketClient = new SocketClient();
