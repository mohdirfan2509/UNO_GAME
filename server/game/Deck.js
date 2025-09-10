const Card = require('./Card');
const { shuffleArray } = require('../utils/helpers');

/**
 * Manages a deck of UNO cards
 */
class Deck {
  constructor() {
    this.cards = [];
    this.discardPile = [];
    this.initializeDeck();
  }

  /**
   * Initialize the deck with all 108 UNO cards
   */
  initializeDeck() {
    this.cards = Card.createDeck();
    this.shuffle();
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm
   */
  shuffle() {
    this.cards = shuffleArray(this.cards);
  }

  /**
   * Draw a card from the top of the deck
   * @returns {Card|null} The drawn card or null if deck is empty
   */
  drawCard() {
    if (this.cards.length === 0) {
      return null;
    }
    return this.cards.pop();
  }

  /**
   * Draw multiple cards from the deck
   * @param {number} count - Number of cards to draw
   * @returns {Array<Card>} Array of drawn cards
   */
  drawCards(count) {
    const drawnCards = [];
    for (let i = 0; i < count; i++) {
      const card = this.drawCard();
      if (card) {
        drawnCards.push(card);
      } else {
        break; // No more cards available
      }
    }
    return drawnCards;
  }

  /**
   * Add a card to the discard pile
   * @param {Card} card - Card to add to discard pile
   */
  addToDiscardPile(card) {
    this.discardPile.push(card);
  }

  /**
   * Get the top card from the discard pile
   * @returns {Card|null} Top card or null if discard pile is empty
   */
  getTopDiscardCard() {
    if (this.discardPile.length === 0) {
      return null;
    }
    return this.discardPile[this.discardPile.length - 1];
  }

  /**
   * Reshuffle discard pile back into deck (except top card)
   * This happens when the draw pile is empty
   */
  reshuffleFromDiscard() {
    if (this.discardPile.length <= 1) {
      return; // Can't reshuffle with 0 or 1 cards
    }

    // Keep the top card in discard pile
    const topCard = this.discardPile.pop();
    
    // Move all other cards back to deck
    this.cards = [...this.discardPile];
    this.discardPile = [topCard];
    
    // Shuffle the deck
    this.shuffle();
  }

  /**
   * Deal initial cards to players
   * @param {Array<Player>} players - Array of players
   * @param {number} cardsPerPlayer - Number of cards to deal to each player
   * @returns {Object} Result object with success status and any errors
   */
  dealInitialCards(players, cardsPerPlayer = 7) {
    const result = { success: true, errors: [] };

    if (!players || players.length === 0) {
      result.success = false;
      result.errors.push('No players provided');
      return result;
    }

    if (this.cards.length < players.length * cardsPerPlayer) {
      result.success = false;
      result.errors.push('Not enough cards in deck');
      return result;
    }

    // Deal cards to each player
    players.forEach(player => {
      const playerCards = this.drawCards(cardsPerPlayer);
      player.addCards(playerCards);
    });

    return result;
  }

  /**
   * Check if deck needs reshuffling
   * @returns {boolean} True if deck is empty and needs reshuffling
   */
  needsReshuffle() {
    return this.cards.length === 0 && this.discardPile.length > 1;
  }

  /**
   * Get the number of cards remaining in the deck
   * @returns {number} Number of cards in deck
   */
  getRemainingCards() {
    return this.cards.length;
  }

  /**
   * Get the number of cards in the discard pile
   * @returns {number} Number of cards in discard pile
   */
  getDiscardPileSize() {
    return this.discardPile.length;
  }

  /**
   * Get deck statistics
   * @returns {Object} Deck statistics
   */
  getStats() {
    return {
      deckSize: this.cards.length,
      discardPileSize: this.discardPile.length,
      totalCards: this.cards.length + this.discardPile.length,
      needsReshuffle: this.needsReshuffle()
    };
  }

  /**
   * Reset the deck to initial state
   */
  reset() {
    this.cards = [];
    this.discardPile = [];
    this.initializeDeck();
  }

  /**
   * Convert deck to JSON representation
   * @param {boolean} includeCards - Whether to include card details
   * @returns {Object} JSON representation of the deck
   */
  toJSON(includeCards = false) {
    const json = {
      deckSize: this.cards.length,
      discardPileSize: this.discardPile.length,
      topDiscardCard: this.getTopDiscardCard()?.toJSON() || null,
      needsReshuffle: this.needsReshuffle()
    };

    if (includeCards) {
      json.cards = this.cards.map(card => card.toJSON());
      json.discardPile = this.discardPile.map(card => card.toJSON());
    }

    return json;
  }

  /**
   * Create a deck from JSON representation
   * @param {Object} json - JSON representation of the deck
   * @returns {Deck} Deck instance
   */
  static fromJSON(json) {
    const deck = new Deck();
    deck.cards = [];
    deck.discardPile = [];

    if (json.cards) {
      deck.cards = json.cards.map(cardJson => Card.fromJSON(cardJson));
    }

    if (json.discardPile) {
      deck.discardPile = json.discardPile.map(cardJson => Card.fromJSON(cardJson));
    }

    return deck;
  }

  /**
   * Validate deck integrity
   * @returns {Object} Validation result
   */
  validate() {
    const result = { isValid: true, errors: [] };
    const expectedTotal = 108; // Standard UNO deck size
    const actualTotal = this.cards.length + this.discardPile.length;

    if (actualTotal !== expectedTotal) {
      result.isValid = false;
      result.errors.push(`Expected ${expectedTotal} cards, found ${actualTotal}`);
    }

    // Check for duplicate card IDs
    const allCards = [...this.cards, ...this.discardPile];
    const cardIds = allCards.map(card => card.id);
    const uniqueIds = new Set(cardIds);

    if (cardIds.length !== uniqueIds.size) {
      result.isValid = false;
      result.errors.push('Duplicate card IDs found');
    }

    return result;
  }
}

module.exports = Deck;
