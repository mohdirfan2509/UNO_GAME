/**
 * UNO Multiplayer - Game State Management
 */

class GameState {
  constructor() {
    this.reset();
  }

  /**
   * Reset game state
   */
  reset() {
    this.roomId = null;
    this.playerId = null;
    this.socketId = null;
    this.playerName = null;
    this.isHost = false;
    
    this.players = [];
    this.currentPlayerIndex = 0;
    this.direction = 1; // 1 for clockwise, -1 for counterclockwise
    this.currentColor = null;
    this.topCard = null;
    this.chosenColor = null;
    this.turnNumber = 0;
    
    this.myHand = [];
    this.gamePhase = 'waiting'; // waiting, playing, ended
    this.unoCallers = new Set();
    this.winner = null;
    
    this.gameStartTime = null;
    this.lastUpdate = Date.now();
  }

  /**
   * Update game state from server data
   * @param {Object} serverState - Server game state
   */
  updateFromServer(serverState) {
    if (!serverState) return;

    this.players = serverState.players || [];
    this.currentPlayerIndex = serverState.currentPlayerIndex || 0;
    this.direction = serverState.direction || 1;
    this.currentColor = serverState.currentColor;
    this.topCard = serverState.topCard;
    this.chosenColor = serverState.chosenColor;
    this.turnNumber = serverState.turnNumber || 0;
    this.gamePhase = serverState.phase || 'waiting';
    this.winner = serverState.winner;
    this.gameStartTime = serverState.gameStartTime;
    this.maxPlayers = serverState.maxPlayers || 4;
    this.lastUpdate = Date.now();

    // Update my hand
    const myPlayer = this.players.find(p => p.id === this.playerId);
    if (myPlayer && myPlayer.hand) {
      this.myHand = myPlayer.hand;
    }

    // Update UNO callers
    this.unoCallers.clear();
    this.players.forEach(player => {
      if (player.unoCalled) {
        this.unoCallers.add(player.id);
      }
    });
  }

  /**
   * Set player information
   * @param {string} playerId - Player ID
   * @param {string} socketId - Socket ID
   * @param {string} playerName - Player name
   * @param {boolean} isHost - Whether player is host
   */
  setPlayerInfo(playerId, socketId, playerName, isHost = false) {
    this.playerId = playerId;
    this.socketId = socketId;
    this.playerName = playerName;
    this.isHost = isHost;
  }

  /**
   * Set room information
   * @param {string} roomId - Room ID
   */
  setRoomInfo(roomId) {
    this.roomId = roomId;
  }

  /**
   * Check if it's my turn
   * @returns {boolean} True if it's my turn
   */
  isMyTurn() {
    if (!this.playerId || this.players.length === 0) return false;
    const currentPlayer = this.players[this.currentPlayerIndex];
    return currentPlayer && currentPlayer.id === this.playerId;
  }

  /**
   * Get current player
   * @returns {Object|null} Current player object
   */
  getCurrentPlayer() {
    if (this.players.length === 0) return null;
    return this.players[this.currentPlayerIndex];
  }

  /**
   * Get my player object
   * @returns {Object|null} My player object
   */
  getMyPlayer() {
    if (!this.playerId) return null;
    return this.players.find(p => p.id === this.playerId);
  }

  /**
   * Get other players (excluding me)
   * @returns {Array} Array of other players
   */
  getOtherPlayers() {
    if (!this.playerId) return this.players;
    return this.players.filter(p => p.id !== this.playerId);
  }

  /**
   * Check if I can play a card
   * @param {number} cardIndex - Card index in my hand
   * @returns {boolean} True if card can be played
   */
  canPlayCard(cardIndex) {
    if (!this.isMyTurn() || this.gamePhase !== 'playing') return false;
    if (cardIndex < 0 || cardIndex >= this.myHand.length) return false;

    const card = this.myHand[cardIndex];
    if (!card || !this.topCard) return false;

    // Wild cards can always be played
    if (card.isWild) return true;

    // If top card is wild, check against current color
    if (this.topCard.isWild) {
      return card.color === this.currentColor;
    }

    // Same color or same value
    return card.color === this.topCard.color || card.value === this.topCard.value;
  }

  /**
   * Get playable cards in my hand
   * @returns {Array<number>} Array of playable card indices
   */
  getPlayableCards() {
    const playableCards = [];
    for (let i = 0; i < this.myHand.length; i++) {
      if (this.canPlayCard(i)) {
        playableCards.push(i);
      }
    }
    return playableCards;
  }

  /**
   * Check if I have any playable cards
   * @returns {boolean} True if I have playable cards
   */
  hasPlayableCards() {
    return this.getPlayableCards().length > 0;
  }

  /**
   * Check if I should call UNO
   * @returns {boolean} True if I should call UNO
   */
  shouldCallUno() {
    const myPlayer = this.getMyPlayer();
    return myPlayer && myPlayer.handSize === 1 && !myPlayer.unoCalled;
  }

  /**
   * Check if I can call UNO
   * @returns {boolean} True if I can call UNO
   */
  canCallUno() {
    const myPlayer = this.getMyPlayer();
    return myPlayer && myPlayer.handSize === 1 && !this.unoCallers.has(this.playerId);
  }

  /**
   * Check if game is in playing phase
   * @returns {boolean} True if game is playing
   */
  isPlaying() {
    return this.gamePhase === 'playing';
  }

  /**
   * Check if game has ended
   * @returns {boolean} True if game has ended
   */
  isGameEnded() {
    return this.gamePhase === 'ended';
  }

  /**
   * Check if I won the game
   * @returns {boolean} True if I won
   */
  didIWin() {
    return this.winner && this.winner.id === this.playerId;
  }

  /**
   * Get game duration
   * @returns {number} Game duration in milliseconds
   */
  getGameDuration() {
    if (!this.gameStartTime) return 0;
    return Date.now() - this.gameStartTime;
  }

  /**
   * Get formatted game duration
   * @returns {string} Formatted duration
   */
  getFormattedGameDuration() {
    return Utils.formatDuration(this.getGameDuration());
  }

  /**
   * Get player by ID
   * @param {string} playerId - Player ID
   * @returns {Object|null} Player object
   */
  getPlayerById(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  /**
   * Get player by socket ID
   * @param {string} socketId - Socket ID
   * @returns {Object|null} Player object
   */
  getPlayerBySocketId(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  /**
   * Get player count
   * @returns {number} Number of players
   */
  getPlayerCount() {
    return this.players.length;
  }

  /**
   * Check if room is full
   * @param {number} maxPlayers - Maximum players (default 4)
   * @returns {boolean} True if room is full
   */
  isRoomFull(maxPlayers = 4) {
    return this.players.length >= maxPlayers;
  }

  /**
   * Check if game can start
   * @returns {boolean} True if game can start
   */
  canStartGame() {
    // Host can start game with at least 2 players, regardless of ready status
    return this.isHost && 
           this.players.length >= 2 && 
           this.gamePhase === 'waiting';
  }

  /**
   * Get next player index
   * @returns {number} Next player index
   */
  getNextPlayerIndex() {
    if (this.players.length === 0) return 0;
    return (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
  }

  /**
   * Get previous player index
   * @returns {number} Previous player index
   */
  getPreviousPlayerIndex() {
    if (this.players.length === 0) return 0;
    return (this.currentPlayerIndex - this.direction + this.players.length) % this.players.length;
  }

  /**
   * Get player position relative to me
   * @param {string} playerId - Player ID
   * @returns {number} Position (0 = me, 1 = next, 2 = across, 3 = previous)
   */
  getPlayerPosition(playerId) {
    if (playerId === this.playerId) return 0;
    
    const myIndex = this.players.findIndex(p => p.id === this.playerId);
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    
    if (myIndex === -1 || playerIndex === -1) return -1;
    
    const diff = (playerIndex - myIndex + this.players.length) % this.players.length;
    return diff;
  }

  /**
   * Get deck statistics
   * @returns {Object} Deck statistics
   */
  getDeckStats() {
    // This would come from server state
    return {
      deckSize: 0,
      discardPileSize: 0,
      needsReshuffle: false
    };
  }

  /**
   * Check if deck needs reshuffling
   * @returns {boolean} True if deck needs reshuffling
   */
  needsDeckReshuffle() {
    const stats = this.getDeckStats();
    return stats.needsReshuffle;
  }

  /**
   * Get game statistics
   * @returns {Object} Game statistics
   */
  getGameStats() {
    return {
      playerCount: this.getPlayerCount(),
      turnNumber: this.turnNumber,
      gameDuration: this.getGameDuration(),
      currentPlayer: this.getCurrentPlayer()?.name || 'Unknown',
      direction: this.direction === 1 ? 'clockwise' : 'counterclockwise',
      currentColor: this.currentColor,
      topCard: this.topCard,
      phase: this.gamePhase,
      winner: this.winner
    };
  }

  /**
   * Validate game state
   * @returns {Object} Validation result
   */
  validate() {
    const errors = [];

    if (!this.roomId) {
      errors.push('Room ID is missing');
    }

    if (!this.playerId) {
      errors.push('Player ID is missing');
    }

    if (this.players.length === 0) {
      errors.push('No players in game');
    }

    if (this.currentPlayerIndex < 0 || this.currentPlayerIndex >= this.players.length) {
      errors.push('Invalid current player index');
    }

    if (this.gamePhase === 'playing' && !this.topCard) {
      errors.push('No top card in playing phase');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Export game state
   * @returns {Object} Exported game state
   */
  export() {
    return {
      roomId: this.roomId,
      playerId: this.playerId,
      socketId: this.socketId,
      playerName: this.playerName,
      isHost: this.isHost,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      direction: this.direction,
      currentColor: this.currentColor,
      topCard: this.topCard,
      chosenColor: this.chosenColor,
      turnNumber: this.turnNumber,
      myHand: this.myHand,
      gamePhase: this.gamePhase,
      unoCallers: Array.from(this.unoCallers),
      winner: this.winner,
      gameStartTime: this.gameStartTime,
      lastUpdate: this.lastUpdate
    };
  }

  /**
   * Import game state
   * @param {Object} data - Game state data
   */
  import(data) {
    if (!data) return;

    this.roomId = data.roomId;
    this.playerId = data.playerId;
    this.socketId = data.socketId;
    this.playerName = data.playerName;
    this.isHost = data.isHost;
    this.players = data.players || [];
    this.currentPlayerIndex = data.currentPlayerIndex || 0;
    this.direction = data.direction || 1;
    this.currentColor = data.currentColor;
    this.topCard = data.topCard;
    this.chosenColor = data.chosenColor;
    this.turnNumber = data.turnNumber || 0;
    this.myHand = data.myHand || [];
    this.gamePhase = data.gamePhase || 'waiting';
    this.unoCallers = new Set(data.unoCallers || []);
    this.winner = data.winner;
    this.gameStartTime = data.gameStartTime;
    this.lastUpdate = data.lastUpdate || Date.now();
  }

  /**
   * Create a snapshot of current state
   * @returns {Object} State snapshot
   */
  createSnapshot() {
    return {
      timestamp: Date.now(),
      state: this.export()
    };
  }

  /**
   * Restore from snapshot
   * @param {Object} snapshot - State snapshot
   */
  restoreFromSnapshot(snapshot) {
    if (snapshot && snapshot.state) {
      this.import(snapshot.state);
    }
  }

  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      ...this.export(),
      validation: this.validate(),
      stats: this.getGameStats(),
      canPlayCards: this.getPlayableCards(),
      isMyTurn: this.isMyTurn(),
      shouldCallUno: this.shouldCallUno(),
      canCallUno: this.canCallUno()
    };
  }
}

// Create global instance
window.gameState = new GameState();
