const { generatePlayerId } = require('../utils/helpers');
const { PLAYER_STATUS } = require('../utils/constants');

/**
 * Represents a player in the UNO game
 */
class Player {
  constructor(socketId, name, isHost = false) {
    this.id = generatePlayerId();
    this.socketId = socketId;
    this.name = name;
    this.isHost = isHost;
    this.status = PLAYER_STATUS.CONNECTED;
    this.hand = [];
    this.unoCalled = false;
    this.ready = false;
    this.score = 0;
    this.gamesPlayed = 0;
    this.gamesWon = 0;
    this.lastActivity = Date.now();
    this.disconnectedAt = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Add cards to player's hand
   * @param {Array<Card>} cards - Cards to add
   */
  addCards(cards) {
    if (Array.isArray(cards)) {
      this.hand.push(...cards);
    } else {
      this.hand.push(cards);
    }
    this.updateLastActivity();
  }

  /**
   * Remove a card from player's hand
   * @param {number} cardIndex - Index of card to remove
   * @returns {Card|null} The removed card or null if invalid index
   */
  removeCard(cardIndex) {
    if (cardIndex >= 0 && cardIndex < this.hand.length) {
      const card = this.hand.splice(cardIndex, 1)[0];
      this.updateLastActivity();
      return card;
    }
    return null;
  }

  /**
   * Get a card from player's hand without removing it
   * @param {number} cardIndex - Index of card to get
   * @returns {Card|null} The card or null if invalid index
   */
  getCard(cardIndex) {
    if (cardIndex >= 0 && cardIndex < this.hand.length) {
      return this.hand[cardIndex];
    }
    return null;
  }

  /**
   * Check if player has a specific card
   * @param {Card} card - Card to check for
   * @returns {boolean} True if player has the card
   */
  hasCard(card) {
    return this.hand.some(playerCard => playerCard.equals(card));
  }

  /**
   * Get cards that can be played on top of the given card
   * @param {Card} topCard - The card currently on top of discard pile
   * @param {string} currentColor - Current color in play
   * @returns {Array<number>} Array of indices of playable cards
   */
  getPlayableCards(topCard, currentColor) {
    const playableIndices = [];
    
    this.hand.forEach((card, index) => {
      if (card.canPlayOn(topCard, currentColor)) {
        playableIndices.push(index);
      }
    });

    return playableIndices;
  }

  /**
   * Check if player can play any card
   * @param {Card} topCard - The card currently on top of discard pile
   * @param {string} currentColor - Current color in play
   * @returns {boolean} True if player can play a card
   */
  canPlayCard(topCard, currentColor) {
    return this.getPlayableCards(topCard, currentColor).length > 0;
  }

  /**
   * Call UNO (when player has 1 card left)
   * @returns {boolean} True if UNO was successfully called
   */
  callUno() {
    if (this.hand.length === 1 && !this.unoCalled) {
      this.unoCalled = true;
      this.updateLastActivity();
      return true;
    }
    return false;
  }

  /**
   * Reset UNO call status
   */
  resetUnoCall() {
    this.unoCalled = false;
  }

  /**
   * Check if player should be penalized for not calling UNO
   * @returns {boolean} True if player should be penalized
   */
  shouldBePenalizedForUno() {
    return this.hand.length === 1 && !this.unoCalled;
  }

  /**
   * Check if player has won (no cards left)
   * @returns {boolean} True if player has won
   */
  hasWon() {
    return this.hand.length === 0;
  }

  /**
   * Calculate hand score (sum of card values)
   * @returns {number} Total score of cards in hand
   */
  calculateHandScore() {
    return this.hand.reduce((total, card) => {
      if (card.isNumber()) {
        return total + parseInt(card.value);
      } else if (card.isSpecial()) {
        switch (card.value) {
          case 'skip':
          case 'reverse':
          case 'draw2':
            return total + 20;
          case 'wild':
          case 'wild-draw4':
            return total + 50;
          default:
            return total;
        }
      }
      return total;
    }, 0);
  }

  /**
   * Set player ready status
   * @param {boolean} ready - Ready status
   */
  setReady(ready) {
    this.ready = ready;
    this.updateLastActivity();
  }

  /**
   * Mark player as disconnected
   */
  disconnect() {
    this.status = PLAYER_STATUS.DISCONNECTED;
    this.disconnectedAt = Date.now();
  }

  /**
   * Mark player as reconnected
   */
  reconnect(socketId) {
    this.socketId = socketId;
    this.status = PLAYER_STATUS.CONNECTED;
    this.disconnectedAt = null;
    this.reconnectAttempts = 0;
    this.updateLastActivity();
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Check if player is inactive (no activity for specified time)
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {boolean} True if player is inactive
   */
  isInactive(timeoutMs = 30000) {
    return Date.now() - this.lastActivity > timeoutMs;
  }

  /**
   * Increment reconnect attempts
   */
  incrementReconnectAttempts() {
    this.reconnectAttempts++;
  }

  /**
   * Check if player has exceeded max reconnect attempts
   * @param {number} maxAttempts - Maximum allowed attempts
   * @returns {boolean} True if exceeded max attempts
   */
  hasExceededReconnectAttempts(maxAttempts = 3) {
    return this.reconnectAttempts >= maxAttempts;
  }

  /**
   * Add game statistics
   * @param {boolean} won - Whether the player won the game
   * @param {number} score - Final score
   */
  addGameStats(won, score = 0) {
    this.gamesPlayed++;
    if (won) {
      this.gamesWon++;
    }
    this.score += score;
  }

  /**
   * Get player statistics
   * @returns {Object} Player statistics
   */
  getStats() {
    return {
      gamesPlayed: this.gamesPlayed,
      gamesWon: this.gamesWon,
      winRate: this.gamesPlayed > 0 ? (this.gamesWon / this.gamesPlayed * 100).toFixed(1) : 0,
      totalScore: this.score,
      averageScore: this.gamesPlayed > 0 ? (this.score / this.gamesPlayed).toFixed(1) : 0
    };
  }

  /**
   * Reset player for new game
   */
  resetForNewGame() {
    this.hand = [];
    this.unoCalled = false;
    this.ready = false;
    this.updateLastActivity();
  }

  /**
   * Convert player to JSON representation
   * @param {boolean} includeHand - Whether to include hand details
   * @returns {Object} JSON representation of the player
   */
  toJSON(includeHand = false) {
    const json = {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      isHost: this.isHost,
      status: this.status,
      handSize: this.hand.length,
      unoCalled: this.unoCalled,
      ready: this.ready,
      score: this.score,
      gamesPlayed: this.gamesPlayed,
      gamesWon: this.gamesWon,
      lastActivity: this.lastActivity,
      isInactive: this.isInactive()
    };

    if (includeHand) {
      json.hand = this.hand.map(card => card.toJSON());
    }

    return json;
  }

  /**
   * Create a player from JSON representation
   * @param {Object} json - JSON representation of the player
   * @returns {Player} Player instance
   */
  static fromJSON(json) {
    const player = new Player(json.socketId, json.name, json.isHost);
    player.id = json.id;
    player.status = json.status;
    player.unoCalled = json.unoCalled;
    player.ready = json.ready;
    player.score = json.score;
    player.gamesPlayed = json.gamesPlayed;
    player.gamesWon = json.gamesWon;
    player.lastActivity = json.lastActivity;
    
    if (json.hand) {
      const Card = require('./Card');
      player.hand = json.hand.map(cardJson => Card.fromJSON(cardJson));
    }

    return player;
  }

  /**
   * Get a string representation of the player
   * @returns {string} String representation
   */
  toString() {
    return `${this.name} (${this.hand.length} cards)`;
  }
}

module.exports = Player;
