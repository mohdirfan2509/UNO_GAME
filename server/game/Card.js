const { CARD_COLORS, CARD_VALUES, WILD_CARDS } = require('../utils/constants');

/**
 * Represents a single UNO card
 */
class Card {
  constructor(color, value) {
    this.color = color; // 'red', 'green', 'blue', 'yellow', or 'black' for wild cards
    this.value = value; // '0'-'9', 'skip', 'reverse', 'draw2', 'wild', 'wild-draw4'
    this.id = this.generateId();
  }

  /**
   * Generate unique card ID
   * @returns {string} Unique card identifier
   */
  generateId() {
    return `${this.color}_${this.value}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if this is a wild card
   * @returns {boolean} True if wild card
   */
  isWild() {
    return this.color === 'black' || WILD_CARDS.includes(this.value);
  }

  /**
   * Check if this is a special action card
   * @returns {boolean} True if special card
   */
  isSpecial() {
    return ['skip', 'reverse', 'draw2', 'wild', 'wild-draw4'].includes(this.value);
  }

  /**
   * Check if this is a number card
   * @returns {boolean} True if number card
   */
  isNumber() {
    return /^[0-9]$/.test(this.value);
  }

  /**
   * Get the display name of the card
   * @returns {string} Human-readable card name
   */
  getDisplayName() {
    if (this.isWild()) {
      return this.value === 'wild' ? 'Wild' : 'Wild Draw 4';
    }
    
    const valueNames = {
      'skip': 'Skip',
      'reverse': 'Reverse',
      'draw2': 'Draw 2'
    };
    
    const valueName = valueNames[this.value] || this.value;
    return `${this.color.charAt(0).toUpperCase() + this.color.slice(1)} ${valueName}`;
  }

  /**
   * Get the CSS class for styling
   * @returns {string} CSS class name
   */
  getCssClass() {
    if (this.isWild()) {
      return `card-wild card-${this.value.replace('-', '-')}`;
    }
    return `card-${this.color} card-${this.value}`;
  }

  /**
   * Check if this card can be played on top of another card
   * @param {Card} topCard - The card currently on top of the discard pile
   * @param {string} currentColor - The current color in play (for wild cards)
   * @returns {boolean} True if this card can be played
   */
  canPlayOn(topCard, currentColor) {
    // Wild cards can always be played
    if (this.isWild()) {
      return true;
    }

    // If the top card is a wild card, check against the current color
    if (topCard.isWild()) {
      return this.color === currentColor;
    }

    // Same color or same value
    return this.color === topCard.color || this.value === topCard.value;
  }

  /**
   * Get the action this card performs
   * @returns {Object} Action object with type and parameters
   */
  getAction() {
    switch (this.value) {
      case 'skip':
        return { type: 'skip', cardsToDraw: 0 };
      case 'reverse':
        return { type: 'reverse', cardsToDraw: 0 };
      case 'draw2':
        return { type: 'draw', cardsToDraw: 2 };
      case 'wild-draw4':
        return { type: 'draw', cardsToDraw: 4, requiresChallenge: true };
      case 'wild':
        return { type: 'color_change', cardsToDraw: 0 };
      default:
        return { type: 'none', cardsToDraw: 0 };
    }
  }

  /**
   * Convert card to JSON representation
   * @returns {Object} JSON representation of the card
   */
  toJSON() {
    return {
      id: this.id,
      color: this.color,
      value: this.value,
      displayName: this.getDisplayName(),
      cssClass: this.getCssClass(),
      isWild: this.isWild(),
      isSpecial: this.isSpecial(),
      isNumber: this.isNumber()
    };
  }

  /**
   * Create a card from JSON representation
   * @param {Object} json - JSON representation of the card
   * @returns {Card} Card instance
   */
  static fromJSON(json) {
    const card = new Card(json.color, json.value);
    card.id = json.id;
    return card;
  }

  /**
   * Create a complete UNO deck
   * @returns {Array<Card>} Array of all 108 UNO cards
   */
  static createDeck() {
    const deck = [];

    // Add number cards (0-9) for each color
    CARD_COLORS.forEach(color => {
      // One 0 card per color
      deck.push(new Card(color, '0'));
      
      // Two of each 1-9 per color
      for (let i = 1; i <= 9; i++) {
        deck.push(new Card(color, i.toString()));
        deck.push(new Card(color, i.toString()));
      }
      
      // Two of each special card per color
      ['skip', 'reverse', 'draw2'].forEach(value => {
        deck.push(new Card(color, value));
        deck.push(new Card(color, value));
      });
    });

    // Add wild cards (4 of each)
    for (let i = 0; i < 4; i++) {
      deck.push(new Card('black', 'wild'));
      deck.push(new Card('black', 'wild-draw4'));
    }

    return deck;
  }

  /**
   * Compare two cards for equality
   * @param {Card} other - Other card to compare
   * @returns {boolean} True if cards are equal
   */
  equals(other) {
    return other instanceof Card && 
           this.color === other.color && 
           this.value === other.value;
  }

  /**
   * Get a string representation of the card
   * @returns {string} String representation
   */
  toString() {
    return `${this.color} ${this.value}`;
  }
}

module.exports = Card;
