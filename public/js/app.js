/**
 * UNO Multiplayer - Main Application
 */

class UnoApp {
  constructor() {
    this.isInitialized = false;
    this.gameState = window.gameState;
    this.socketClient = window.socketClient;
    this.gameUI = window.gameUI;
    this.cardRenderer = window.cardRenderer;
    
    this.initialize();
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('Initializing UNO Multiplayer...');
      
      // Show loading screen
      this.gameUI.showLoadingScreen();
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Setup socket event handlers
      this.setupSocketEventHandlers();
      
      // Check for URL parameters
      this.handleUrlParameters();
      
      // Initialize game state
      this.initializeGameState();
      
      // Hide loading screen
      setTimeout(() => {
        this.gameUI.hideLoadingScreen();
      }, 1000);
      
      this.isInitialized = true;
      console.log('UNO Multiplayer initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.gameUI.showError('Failed to initialize application');
    }
  }

  /**
   * Setup socket event handlers
   */
  setupSocketEventHandlers() {
    // Connection events
    this.socketClient.on('connected', (data) => {
      console.log('Connected to server:', data);
      this.gameUI.showSuccess('Connected to server');
    });

    this.socketClient.on('disconnected', (data) => {
      console.log('Disconnected from server:', data);
      this.gameUI.showWarning('Disconnected from server');
    });

    this.socketClient.on('connection-error', (data) => {
      console.error('Connection error:', data);
      this.gameUI.showError('Connection error: ' + data.error);
    });

    // Room events
    this.socketClient.on('room-created', (data) => {
      console.log('Room created:', data);
      this.handleRoomCreated(data);
    });

    this.socketClient.on('room-joined', (data) => {
      console.log('Room joined:', data);
      this.handleRoomJoined(data);
    });

    this.socketClient.on('player-joined', (data) => {
      console.log('Player joined:', data);
      this.handlePlayerJoined(data);
    });

    this.socketClient.on('player-left', (data) => {
      console.log('Player left:', data);
      this.handlePlayerLeft(data);
    });

    // Game events
    this.socketClient.on('game-started', (data) => {
      console.log('Game started:', data);
      this.handleGameStarted(data);
    });

    this.socketClient.on('game-state-update', (data) => {
      console.log('Game state update:', data);
      this.handleGameStateUpdate(data);
    });

    this.socketClient.on('card-played', (data) => {
      console.log('Card played:', data);
      this.handleCardPlayed(data);
    });

    this.socketClient.on('card-drawn', (data) => {
      console.log('Card drawn:', data);
      this.handleCardDrawn(data);
    });

    this.socketClient.on('turn-changed', (data) => {
      console.log('Turn changed:', data);
      this.handleTurnChanged(data);
    });

    this.socketClient.on('uno-called', (data) => {
      console.log('UNO called:', data);
      this.handleUnoCalled(data);
    });

    this.socketClient.on('color-chosen', (data) => {
      console.log('Color chosen:', data);
      this.handleColorChosen(data);
    });

    this.socketClient.on('game-ended', (data) => {
      console.log('Game ended:', data);
      this.handleGameEnded(data);
    });

    this.socketClient.on('invalid-move', (data) => {
      console.log('Invalid move:', data);
      this.handleInvalidMove(data);
    });

    this.socketClient.on('error', (data) => {
      console.error('Server error:', data);
      this.handleServerError(data);
    });

    // Connection status events
    this.socketClient.on('room-full', (data) => {
      console.log('Room full:', data);
      this.gameUI.showError('Room is full');
    });

    this.socketClient.on('room-not-found', (data) => {
      console.log('Room not found:', data);
      this.gameUI.showError('Room not found');
    });

    this.socketClient.on('player-disconnected', (data) => {
      console.log('Player disconnected:', data);
      this.handlePlayerDisconnected(data);
    });

    this.socketClient.on('player-reconnected', (data) => {
      console.log('Player reconnected:', data);
      this.handlePlayerReconnected(data);
    });
  }

  /**
   * Handle URL parameters
   */
  handleUrlParameters() {
    const params = Utils.getUrlParams();
    
    if (params.room) {
      // Auto-join room if room ID is provided
      const roomId = params.room.toUpperCase();
      if (Utils.isValidRoomId(roomId)) {
        this.autoJoinRoom(roomId);
      }
    }
  }

  /**
   * Auto-join room
   * @param {string} roomId - Room ID
   */
  autoJoinRoom(roomId) {
    // Get player name from storage or prompt
    const savedName = Utils.getStorage('playerName');
    if (savedName) {
      this.socketClient.joinRoom(roomId, savedName);
    } else {
      // Show join room page with pre-filled room ID
      this.gameUI.showPage('joinRoom');
      const roomIdInput = document.getElementById('roomId');
      if (roomIdInput) {
        roomIdInput.value = roomId;
      }
    }
  }

  /**
   * Initialize game state
   */
  initializeGameState() {
    // Load saved player name
    const savedName = Utils.getStorage('playerName');
    if (savedName) {
      const nameInputs = document.querySelectorAll('input[name="playerName"], input[id*="Name"]');
      nameInputs.forEach(input => {
        input.value = savedName;
      });
    }
  }

  /**
   * Handle room created
   * @param {Object} data - Room data
   */
  handleRoomCreated(data) {
    this.gameState.setRoomInfo(data.roomId);
    this.gameState.setPlayerInfo(data.room.host.id, data.room.host.socketId, data.room.host.name, true);
    this.gameState.updateFromServer({ players: data.room.players });
    
    this.gameUI.showPage('lobby');
    this.gameUI.showSuccess('Room created successfully!');
    
    // Save player name
    Utils.setStorage('playerName', data.room.host.name);
    
    // Reset loading state
    const createBtn = document.querySelector('#createRoomForm button[type="submit"]');
    if (createBtn) Utils.setLoading(createBtn, false);
  }

  /**
   * Handle room joined
   * @param {Object} data - Room data
   */
  handleRoomJoined(data) {
    this.gameState.setRoomInfo(data.room.id);
    this.gameState.setPlayerInfo(data.player.id, data.player.socketId, data.player.name, false);
    this.gameState.updateFromServer({ players: data.room.players });
    
    this.gameUI.showPage('lobby');
    this.gameUI.showSuccess('Joined room successfully!');
    
    // Save player name
    Utils.setStorage('playerName', data.player.name);
    
    // Reset loading state
    const joinBtn = document.querySelector('#joinRoomForm button[type="submit"]');
    if (joinBtn) Utils.setLoading(joinBtn, false);
  }

  /**
   * Handle player joined
   * @param {Object} data - Player data
   */
  handlePlayerJoined(data) {
    this.gameState.updateFromServer({ players: data.room.players });
    this.gameUI.updatePlayersList();
    this.gameUI.updateRoomInfo();
    
    this.gameUI.showInfo(`${data.player.name} joined the room`);
    
    // Play sound
    Utils.playSound('player-join');
  }

  /**
   * Handle player left
   * @param {Object} data - Player data
   */
  handlePlayerLeft(data) {
    this.gameState.updateFromServer({ players: data.room.players });
    this.gameUI.updatePlayersList();
    this.gameUI.updateRoomInfo();
    
    // Check if room is empty
    if (data.room.players.length === 0) {
      this.gameUI.showPage('landing');
      this.gameUI.showInfo('Room is empty');
    }
  }

  /**
   * Handle game started
   * @param {Object} data - Game data
   */
  handleGameStarted(data) {
    this.gameState.updateFromServer(data.gameState);
    this.gameUI.showPage('game');
    this.gameUI.showSuccess('Game started!');
    
    // Play sound
    Utils.playSound('game-start');
    
    // Vibrate
    Utils.vibrate([200, 100, 200]);
  }

  /**
   * Handle game state update
   * @param {Object} data - Game state data
   */
  handleGameStateUpdate(data) {
    this.gameState.updateFromServer(data);
    this.gameUI.updateGameState();
    this.gameUI.updatePlayerHands();
    this.gameUI.updateGameBoard();
  }

  /**
   * Handle card played
   * @param {Object} data - Card data
   */
  handleCardPlayed(data) {
    this.gameState.updateFromServer(data.gameState);
    this.gameUI.updateGameState();
    this.gameUI.updatePlayerHands();
    this.gameUI.updateGameBoard();
    
    // Animate card play
    if (data.playedCard) {
      this.animateCardPlay(data.playedCard);
    }
    
    // Play sound
    Utils.playSound('card-play');
  }

  /**
   * Handle card drawn
   * @param {Object} data - Card data
   */
  handleCardDrawn(data) {
    this.gameState.updateFromServer(data.gameState);
    this.gameUI.updateGameState();
    this.gameUI.updatePlayerHands();
    this.gameUI.updateGameBoard();
    
    // Animate card draw
    if (data.drawnCard) {
      this.animateCardDraw(data.drawnCard);
    }
    
    // Play sound
    Utils.playSound('card-draw');
  }

  /**
   * Handle turn changed
   * @param {Object} data - Turn data
   */
  handleTurnChanged(data) {
    this.gameState.updateFromServer(data);
    this.gameUI.updateGameState();
    this.gameUI.updatePlayerHands();
    
    // Highlight current player
    this.highlightCurrentPlayer();
    
    // Play sound
    Utils.playSound('turn-change');
  }

  /**
   * Handle UNO called
   * @param {Object} data - UNO data
   */
  handleUnoCalled(data) {
    this.gameState.updateFromServer(data.gameState);
    this.gameUI.updateGameState();
    this.gameUI.updatePlayerHands();
    
    // Show UNO message
    this.gameUI.showInfo(data.message);
    
    // Animate UNO call
    this.animateUnoCall();
    
    // Play sound
    Utils.playSound('uno-call');
    
    // Vibrate
    Utils.vibrate([100, 50, 100, 50, 100]);
  }

  /**
   * Handle color chosen
   * @param {Object} data - Color data
   */
  handleColorChosen(data) {
    this.gameState.updateFromServer(data);
    this.gameUI.updateGameBoard();
    
    // Show color change message
    this.gameUI.showInfo(`Color changed to ${data.color}`);
    
    // Play sound
    Utils.playSound('color-change');
  }

  /**
   * Handle game ended
   * @param {Object} data - Game end data
   */
  handleGameEnded(data) {
    this.gameState.updateFromServer(data.gameState);
    this.gameUI.showPage('gameOver');
    
    // Show winner message
    if (data.winner) {
      this.gameUI.showSuccess(`${data.winner.name} wins!`);
    }
    
    // Play sound
    Utils.playSound('game-end');
    
    // Vibrate
    Utils.vibrate([300, 100, 300, 100, 300]);
  }

  /**
   * Handle invalid move
   * @param {Object} data - Error data
   */
  handleInvalidMove(data) {
    this.gameUI.showError(data.message);
    
    // Play sound
    Utils.playSound('error');
    
    // Vibrate
    Utils.vibrate([100, 50, 100]);
  }

  /**
   * Handle server error
   * @param {Object} data - Error data
   */
  handleServerError(data) {
    this.gameUI.showError(data.message || 'Server error occurred');
    
    // Reset loading states
    const createBtn = document.querySelector('#createRoomForm button[type="submit"]');
    const joinBtn = document.querySelector('#joinRoomForm button[type="submit"]');
    if (createBtn) Utils.setLoading(createBtn, false);
    if (joinBtn) Utils.setLoading(joinBtn, false);
    Utils.setLoading(document.getElementById('startGameBtn'), false);
    
    // Play sound
    Utils.playSound('error');
  }

  /**
   * Handle player disconnected
   * @param {Object} data - Player data
   */
  handlePlayerDisconnected(data) {
    this.gameUI.showWarning(`${data.playerName} disconnected`);
    
    // Play sound
    Utils.playSound('player-disconnect');
  }

  /**
   * Handle player reconnected
   * @param {Object} data - Player data
   */
  handlePlayerReconnected(data) {
    this.gameState.updateFromServer(data.gameState);
    this.gameUI.updateGameState();
    this.gameUI.updatePlayerHands();
    this.gameUI.updateGameBoard();
    
    this.gameUI.showSuccess(`${data.playerName} reconnected`);
    
    // Play sound
    Utils.playSound('player-reconnect');
  }

  /**
   * Animate card play
   * @param {Object} card - Card object
   */
  animateCardPlay(card) {
    // Find the card element and animate it
    const cardElement = this.cardRenderer.getCardElement(card.id);
    if (cardElement) {
      this.cardRenderer.animateCardPlay(cardElement);
    }
  }

  /**
   * Animate card draw
   * @param {Object} card - Card object
   */
  animateCardDraw(card) {
    // Animate the draw pile
    const drawPile = document.getElementById('drawPile');
    if (drawPile) {
      Utils.animateElement(drawPile, 'animate-card-draw');
    }
  }

  /**
   * Animate UNO call
   */
  animateUnoCall() {
    // Animate UNO button
    const unoBtn = document.getElementById('callUnoBtn');
    if (unoBtn) {
      Utils.animateElement(unoBtn, 'animate-uno-call');
    }
    
    // Animate UNO text
    const unoText = document.createElement('div');
    unoText.className = 'uno-animation';
    unoText.textContent = 'UNO!';
    unoText.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 4rem;
      font-weight: bold;
      color: #fbbf24;
      z-index: 9999;
      pointer-events: none;
      animation: unoCall 1s ease-out;
    `;
    
    document.body.appendChild(unoText);
    
    setTimeout(() => {
      document.body.removeChild(unoText);
    }, 1000);
  }

  /**
   * Highlight current player
   */
  highlightCurrentPlayer() {
    // Remove previous highlights
    document.querySelectorAll('.player-slot').forEach(slot => {
      slot.classList.remove('is-current');
    });
    
    // Highlight current player
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (currentPlayer) {
      const playerPosition = this.gameState.getPlayerPosition(currentPlayer.id);
      const playerSlot = document.getElementById(`playerSlot${playerPosition}`);
      if (playerSlot) {
        playerSlot.classList.add('is-current');
        Utils.animateElement(playerSlot, 'animate-turn-indicator');
      }
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Update card sizes based on screen size
    const deviceType = Utils.getDeviceType();
    const cardSize = deviceType === 'mobile' ? 'small' : 'normal';
    
    // Update card renderer size
    if (this.cardRenderer) {
      this.cardRenderer.cardWidth = deviceType === 'mobile' ? 50 : 60;
      this.cardRenderer.cardHeight = deviceType === 'mobile' ? 70 : 84;
    }
  }

  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, reduce activity
      console.log('Page hidden, reducing activity');
    } else {
      // Page is visible, resume normal activity
      console.log('Page visible, resuming activity');
      
      // Check connection status
      if (!this.socketClient.isConnected()) {
        this.gameUI.showWarning('Connection lost, attempting to reconnect...');
      }
    }
  }

  /**
   * Handle before unload
   */
  handleBeforeUnload() {
    // Save current state
    if (this.gameState.roomId) {
      Utils.setStorage('gameState', this.gameState.export());
    }
  }

  /**
   * Restore game state
   */
  restoreGameState() {
    const savedState = Utils.getStorage('gameState');
    if (savedState) {
      this.gameState.import(savedState);
      
      // Attempt to reconnect
      if (this.gameState.roomId && this.gameState.socketId) {
        this.socketClient.reconnect(this.gameState.socketId);
      }
    }
  }

  /**
   * Get application statistics
   * @returns {Object} Application statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      connectionStatus: this.socketClient.getConnectionStatus(),
      gamePhase: this.gameState.gamePhase,
      playerCount: this.gameState.getPlayerCount(),
      roomId: this.gameState.roomId,
      deviceType: Utils.getDeviceType(),
      browserInfo: Utils.getBrowserInfo()
    };
  }

  /**
   * Destroy application
   */
  destroy() {
    // Save state
    this.handleBeforeUnload();
    
    // Destroy components
    if (this.gameUI) {
      this.gameUI.destroy();
    }
    
    if (this.cardRenderer) {
      this.cardRenderer.destroy();
    }
    
    if (this.socketClient) {
      this.socketClient.destroy();
    }
    
    // Clear state
    this.gameState.reset();
    
    this.isInitialized = false;
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.unoApp = new UnoApp();
});

// Handle window events
window.addEventListener('resize', () => {
  if (window.unoApp) {
    window.unoApp.handleResize();
  }
});

window.addEventListener('visibilitychange', () => {
  if (window.unoApp) {
    window.unoApp.handleVisibilityChange();
  }
});

window.addEventListener('beforeunload', () => {
  if (window.unoApp) {
    window.unoApp.handleBeforeUnload();
  }
});

// Handle page load
window.addEventListener('load', () => {
  if (window.unoApp) {
    window.unoApp.restoreGameState();
  }
});

// Export for debugging
window.UnoApp = UnoApp;
