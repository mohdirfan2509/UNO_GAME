/**
 * UNO Multiplayer - Game UI Management
 */

class GameUI {
  constructor() {
    this.currentPage = 'landing';
    this.modals = new Map();
    this.toasts = [];
    this.animations = new Map();
    
    this.initialize();
  }

  /**
   * Initialize game UI
   */
  initialize() {
    this.setupEventListeners();
    this.setupModals();
    this.setupKeyboardShortcuts();
    this.setupTouchGestures();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Page navigation
    document.getElementById('createRoomBtn')?.addEventListener('click', () => {
      this.showPage('createRoom');
    });

    document.getElementById('joinRoomBtn')?.addEventListener('click', () => {
      this.showPage('joinRoom');
    });

    // Form submissions
    document.getElementById('createRoomForm')?.addEventListener('submit', (e) => {
      this.handleCreateRoom(e);
    });

    document.getElementById('joinRoomForm')?.addEventListener('submit', (e) => {
      this.handleJoinRoom(e);
    });

    // Game actions
    document.getElementById('startGameBtn')?.addEventListener('click', () => {
      this.handleStartGame();
    });

    document.getElementById('leaveRoomBtn')?.addEventListener('click', () => {
      this.handleLeaveRoom();
    });

    document.getElementById('drawCardBtn')?.addEventListener('click', () => {
      this.handleDrawCard();
    });

    document.getElementById('callUnoBtn')?.addEventListener('click', () => {
      this.handleCallUno();
    });

    document.getElementById('gameMenuBtn')?.addEventListener('click', () => {
      this.showGameMenu();
    });

    // Game over actions
    document.getElementById('playAgainBtn')?.addEventListener('click', () => {
      this.handlePlayAgain();
    });

    document.getElementById('backToLobbyBtn')?.addEventListener('click', () => {
      this.handleBackToLobby();
    });

    // Color picker
    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleColorChoice(e.target.dataset.color);
      });
    });

    // Game menu
    document.getElementById('gameRulesBtn')?.addEventListener('click', () => {
      this.showGameRules();
    });

    document.getElementById('gameSettingsBtn')?.addEventListener('click', () => {
      this.showGameSettings();
    });

    document.getElementById('leaveGameBtn')?.addEventListener('click', () => {
      this.handleLeaveGame();
    });
  }

  /**
   * Setup modals
   */
  setupModals() {
    // Color picker modal
    const colorPickerModal = document.getElementById('colorPickerModal');
    if (colorPickerModal) {
      this.modals.set('colorPicker', new bootstrap.Modal(colorPickerModal));
    }

    // Game menu modal
    const gameMenuModal = document.getElementById('gameMenuModal');
    if (gameMenuModal) {
      this.modals.set('gameMenu', new bootstrap.Modal(gameMenuModal));
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'Escape':
          this.handleEscapeKey();
          break;
        case 'Enter':
          this.handleEnterKey();
          break;
        case ' ':
          e.preventDefault();
          this.handleSpaceKey();
          break;
        case 'u':
        case 'U':
          this.handleUnoKey();
          break;
        case 'd':
        case 'D':
          this.handleDrawKey();
          break;
      }
    });
  }

  /**
   * Setup touch gestures
   */
  setupTouchGestures() {
    if (!Utils.isTouchDevice()) return;

    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Swipe detection
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
    });
  }

  /**
   * Show page
   * @param {string} pageName - Page name
   */
  showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = pageName;
      
      // Trigger page-specific initialization
      this.initializePage(pageName);
    }
  }

  /**
   * Initialize page-specific functionality
   * @param {string} pageName - Page name
   */
  initializePage(pageName) {
    switch (pageName) {
      case 'lobby':
        this.initializeLobbyPage();
        break;
      case 'game':
        this.initializeGamePage();
        break;
      case 'gameOver':
        this.initializeGameOverPage();
        break;
    }
  }

  /**
   * Initialize lobby page
   */
  initializeLobbyPage() {
    // Update room info
    this.updateRoomInfo();
    
    // Update players list
    this.updatePlayersList();
    
    // Update QR code
    this.updateQRCode();
  }

  /**
   * Initialize game page
   */
  initializeGamePage() {
    // Update game state
    this.updateGameState();
    
    // Update player hands
    this.updatePlayerHands();
    
    // Update game board
    this.updateGameBoard();
  }

  /**
   * Initialize game over page
   */
  initializeGameOverPage() {
    // Update winner information
    this.updateWinnerInfo();
    
    // Update final scores
    this.updateFinalScores();
  }

  /**
   * Handle create room form submission
   * @param {Event} e - Form event
   */
  handleCreateRoom(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const playerName = formData.get('hostName') || document.getElementById('hostName').value;
    const maxPlayers = parseInt(document.getElementById('maxPlayers').value);
    
    if (!playerName || playerName.trim() === '') {
      Utils.showToast('Please enter your name', 'error');
      return;
    }
    
    if (!Utils.isValidPlayerName(playerName)) {
      Utils.showToast('Please enter a valid player name (letters, numbers, spaces, hyphens, underscores only)', 'error');
      return;
    }
    
    const createBtn = document.getElementById('createRoomBtn');
    Utils.setLoading(createBtn, true);
    
    const settings = {
      maxPlayers,
      gameMode: 'classic',
      allowSpectators: false
    };
    
    console.log('Creating room with:', { playerName, settings });
    
    if (window.socketClient && window.socketClient.isConnected()) {
      window.socketClient.createRoom(playerName, settings);
    } else {
      Utils.showToast('Not connected to server. Please refresh the page.', 'error');
      Utils.setLoading(createBtn, false);
    }
  }

  /**
   * Handle join room form submission
   * @param {Event} e - Form event
   */
  handleJoinRoom(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const roomId = formData.get('roomId') || document.getElementById('roomId').value;
    const playerName = formData.get('playerName') || document.getElementById('playerName').value;
    
    if (!roomId || roomId.trim() === '') {
      Utils.showToast('Please enter a room ID', 'error');
      return;
    }
    
    if (!playerName || playerName.trim() === '') {
      Utils.showToast('Please enter your name', 'error');
      return;
    }
    
    if (!Utils.isValidRoomId(roomId)) {
      Utils.showToast('Please enter a valid 6-character room ID', 'error');
      return;
    }
    
    if (!Utils.isValidPlayerName(playerName)) {
      Utils.showToast('Please enter a valid player name (letters, numbers, spaces, hyphens, underscores only)', 'error');
      return;
    }
    
    const joinBtn = document.getElementById('joinRoomBtn');
    Utils.setLoading(joinBtn, true);
    
    console.log('Joining room with:', { roomId: roomId.toUpperCase(), playerName });
    
    if (window.socketClient && window.socketClient.isConnected()) {
      window.socketClient.joinRoom(roomId.toUpperCase(), playerName);
    } else {
      Utils.showToast('Not connected to server. Please refresh the page.', 'error');
      Utils.setLoading(joinBtn, false);
    }
  }

  /**
   * Handle start game
   */
  handleStartGame() {
    if (!window.gameState.canStartGame()) {
      Utils.showToast('Cannot start game', 'error');
      return;
    }
    
    Utils.setLoading(document.getElementById('startGameBtn'), true);
    
    if (window.socketClient && window.gameState.roomId) {
      window.socketClient.startGame(window.gameState.roomId);
    }
  }

  /**
   * Handle leave room
   */
  handleLeaveRoom() {
    if (window.socketClient && window.gameState.roomId) {
      window.socketClient.leaveRoom(window.gameState.roomId);
    }
    
    this.showPage('landing');
  }

  /**
   * Handle draw card
   */
  handleDrawCard() {
    if (!window.gameState.isMyTurn()) {
      Utils.showToast('Not your turn', 'warning');
      return;
    }
    
    if (window.socketClient && window.gameState.roomId) {
      window.socketClient.drawCard(window.gameState.roomId);
    }
  }

  /**
   * Handle call UNO
   */
  handleCallUno() {
    if (!window.gameState.canCallUno()) {
      Utils.showToast('Cannot call UNO', 'warning');
      return;
    }
    
    if (window.socketClient && window.gameState.roomId) {
      window.socketClient.callUno(window.gameState.roomId);
    }
    
    // Animate UNO button
    const unoBtn = document.getElementById('callUnoBtn');
    if (unoBtn) {
      Utils.animateElement(unoBtn, 'animate-uno-call');
    }
  }

  /**
   * Handle color choice
   * @param {string} color - Chosen color
   */
  handleColorChoice(color) {
    if (window.socketClient && window.gameState.roomId) {
      window.socketClient.chooseColor(window.gameState.roomId, color);
    }
    
    // Hide color picker modal
    const modal = this.modals.get('colorPicker');
    if (modal) {
      modal.hide();
    }
  }

  /**
   * Handle play again
   */
  handlePlayAgain() {
    // Reset game state
    window.gameState.reset();
    
    // Show lobby page
    this.showPage('lobby');
  }

  /**
   * Handle back to lobby
   */
  handleBackToLobby() {
    this.showPage('lobby');
  }

  /**
   * Handle leave game
   */
  handleLeaveGame() {
    if (window.socketClient && window.gameState.roomId) {
      window.socketClient.leaveRoom(window.gameState.roomId);
    }
    
    this.showPage('landing');
  }

  /**
   * Show game menu
   */
  showGameMenu() {
    const modal = this.modals.get('gameMenu');
    if (modal) {
      modal.show();
    }
  }

  /**
   * Show game rules
   */
  showGameRules() {
    // This would show a modal with game rules
    Utils.showToast('Game rules modal would open here', 'info');
  }

  /**
   * Show game settings
   */
  showGameSettings() {
    // This would show a modal with game settings
    Utils.showToast('Game settings modal would open here', 'info');
  }

  /**
   * Update room information
   */
  updateRoomInfo() {
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    const playerCount = document.getElementById('playerCount');
    const hostName = document.getElementById('hostName');
    
    if (roomIdDisplay) {
      roomIdDisplay.textContent = window.gameState.roomId || '-';
    }
    
    if (playerCount) {
      const count = window.gameState.getPlayerCount();
      playerCount.textContent = `${count}/4`;
    }
    
    if (hostName) {
      const host = window.gameState.players.find(p => p.isHost);
      hostName.textContent = host ? host.name : '-';
    }
  }

  /**
   * Update players list
   */
  updatePlayersList() {
    const playersList = document.getElementById('playersList');
    if (!playersList) return;
    
    playersList.innerHTML = '';
    
    window.gameState.players.forEach(player => {
      const playerItem = this.createPlayerItem(player);
      playersList.appendChild(playerItem);
    });
  }

  /**
   * Create player item element
   * @param {Object} player - Player object
   * @returns {HTMLElement} Player item element
   */
  createPlayerItem(player) {
    const playerItem = document.createElement('div');
    playerItem.className = 'player-item';
    
    if (player.isHost) {
      playerItem.classList.add('is-host');
    }
    
    if (player.id === window.gameState.playerId) {
      playerItem.classList.add('is-current');
    }
    
    playerItem.innerHTML = `
      <div class="player-info">
        <div class="player-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="player-details">
          <span class="player-name">${Utils.escapeHtml(player.name)}</span>
          <span class="player-status ${player.ready ? 'ready' : 'not-ready'}">
            ${player.ready ? 'Ready' : 'Not Ready'}
          </span>
        </div>
      </div>
      <div class="player-actions">
        ${player.isHost ? '<span class="badge bg-primary">Host</span>' : ''}
      </div>
    `;
    
    return playerItem;
  }

  /**
   * Update QR code
   */
  updateQRCode() {
    const qrCode = document.getElementById('qrCode');
    if (!qrCode || !window.gameState.roomId) return;
    
    const joinUrl = `${window.location.origin}?room=${window.gameState.roomId}`;
    const qrDataUrl = Utils.generateQRCode(joinUrl, 120);
    
    qrCode.innerHTML = `<img src="${qrDataUrl}" alt="QR Code for room ${window.gameState.roomId}">`;
  }

  /**
   * Update game state display
   */
  updateGameState() {
    const gameRoomId = document.getElementById('gameRoomId');
    const currentTurn = document.getElementById('currentTurn');
    
    if (gameRoomId) {
      gameRoomId.textContent = window.gameState.roomId || '-';
    }
    
    if (currentTurn) {
      const currentPlayer = window.gameState.getCurrentPlayer();
      currentTurn.textContent = currentPlayer ? currentPlayer.name : '-';
    }
  }

  /**
   * Update player hands
   */
  updatePlayerHands() {
    // Update my hand
    const playerHand = document.getElementById('playerHand');
    if (playerHand && window.cardRenderer) {
      const playableCards = window.gameState.getPlayableCards();
      window.cardRenderer.renderPlayerHand(
        window.gameState.myHand,
        playerHand,
        { playableCards }
      );
    }
    
    // Update other players
    this.updateOtherPlayers();
  }

  /**
   * Update other players display
   */
  updateOtherPlayers() {
    const otherPlayers = window.gameState.getOtherPlayers();
    
    otherPlayers.forEach((player, index) => {
      const playerSlot = document.getElementById(`playerSlot${index + 1}`);
      if (playerSlot) {
        this.updatePlayerSlot(playerSlot, player, index);
      }
    });
  }

  /**
   * Update player slot
   * @param {HTMLElement} slot - Player slot element
   * @param {Object} player - Player object
   * @param {number} index - Player index
   */
  updatePlayerSlot(slot, player, index) {
    const playerName = slot.querySelector('.player-name');
    const cardCount = slot.querySelector('.card-count');
    const playerCards = slot.querySelector('.player-cards');
    
    if (playerName) {
      playerName.textContent = player.name;
    }
    
    if (cardCount) {
      cardCount.textContent = `${player.handSize} cards`;
    }
    
    if (playerCards && window.cardRenderer) {
      window.cardRenderer.renderOtherPlayerCards(player.handSize, playerCards);
    }
    
    // Update current player indicator
    if (player.id === window.gameState.players[window.gameState.currentPlayerIndex]?.id) {
      slot.classList.add('is-current');
    } else {
      slot.classList.remove('is-current');
    }
  }

  /**
   * Update game board
   */
  updateGameBoard() {
    // Update top card
    const discardPile = document.getElementById('discardPile');
    if (discardPile && window.cardRenderer) {
      window.cardRenderer.renderTopCard(window.gameState.topCard, discardPile);
    }
    
    // Update draw pile
    const drawPile = document.getElementById('drawPile');
    if (drawPile && window.cardRenderer) {
      window.cardRenderer.renderDrawPile(drawPile);
    }
    
    // Update current color
    this.updateCurrentColor();
  }

  /**
   * Update current color indicator
   */
  updateCurrentColor() {
    const currentColor = document.getElementById('currentColor');
    if (!currentColor) return;
    
    const colorIndicator = currentColor.querySelector('.color-indicator');
    if (colorIndicator && window.gameState.currentColor) {
      colorIndicator.className = `color-indicator ${window.gameState.currentColor}`;
    }
  }

  /**
   * Update winner information
   */
  updateWinnerInfo() {
    const winnerName = document.getElementById('winnerName');
    if (winnerName && window.gameState.winner) {
      winnerName.textContent = `${window.gameState.winner.name} wins!`;
    }
  }

  /**
   * Update final scores
   */
  updateFinalScores() {
    const finalScores = document.getElementById('finalScores');
    if (!finalScores) return;
    
    finalScores.innerHTML = '';
    
    window.gameState.players.forEach(player => {
      const scoreItem = document.createElement('div');
      scoreItem.className = 'score-item';
      
      if (player.id === window.gameState.winner?.id) {
        scoreItem.classList.add('winner');
      }
      
      scoreItem.innerHTML = `
        <span class="score-player">${Utils.escapeHtml(player.name)}</span>
        <span class="score-value">${player.handScore || 0}</span>
      `;
      
      finalScores.appendChild(scoreItem);
    });
  }

  /**
   * Handle escape key
   */
  handleEscapeKey() {
    // Close any open modals
    this.modals.forEach(modal => {
      if (modal._isShown) {
        modal.hide();
      }
    });
  }

  /**
   * Handle enter key
   */
  handleEnterKey() {
    // Submit current form or trigger primary action
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === 'BUTTON') {
      activeElement.click();
    }
  }

  /**
   * Handle space key
   */
  handleSpaceKey() {
    // Draw card if it's my turn
    if (window.gameState.isMyTurn() && window.gameState.isPlaying()) {
      this.handleDrawCard();
    }
  }

  /**
   * Handle UNO key
   */
  handleUnoKey() {
    // Call UNO if possible
    if (window.gameState.canCallUno()) {
      this.handleCallUno();
    }
  }

  /**
   * Handle draw key
   */
  handleDrawKey() {
    // Draw card if it's my turn
    if (window.gameState.isMyTurn() && window.gameState.isPlaying()) {
      this.handleDrawCard();
    }
  }

  /**
   * Handle swipe right
   */
  handleSwipeRight() {
    // Previous page or action
    if (this.currentPage === 'game') {
      this.showGameMenu();
    }
  }

  /**
   * Handle swipe left
   */
  handleSwipeLeft() {
    // Next page or action
    if (this.currentPage === 'lobby') {
      this.handleStartGame();
    }
  }

  /**
   * Show loading screen
   */
  showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.remove('hidden');
    }
  }

  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
  }

  /**
   * Update connection status
   */
  updateConnectionStatus() {
    // This is handled by SocketClient
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    Utils.showToast(message, 'error');
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    Utils.showToast(message, 'success');
  }

  /**
   * Show info message
   * @param {string} message - Info message
   */
  showInfo(message) {
    Utils.showToast(message, 'info');
  }

  /**
   * Show warning message
   * @param {string} message - Warning message
   */
  showWarning(message) {
    Utils.showToast(message, 'warning');
  }

  /**
   * Destroy game UI
   */
  destroy() {
    // Remove all event listeners
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchend', this.handleTouchEnd);
    
    // Hide all modals
    this.modals.forEach(modal => {
      modal.hide();
    });
    
    // Clear animations
    this.animations.clear();
  }
}

// Create global instance
window.gameUI = new GameUI();
