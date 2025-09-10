const { CARD_COLORS, CARD_VALUES, WILD_CARDS, GAME_RULES } = require('../utils/constants');
const { getNextPlayerIndex } = require('../utils/helpers');

/**
 * Handles UNO game rules and validation
 */
class GameRules {
  constructor() {
    this.validColors = CARD_COLORS;
    this.validValues = [...CARD_VALUES, ...WILD_CARDS];
  }

  /**
   * Check if a card can be played on top of another card
   * @param {Card} cardToPlay - Card being played
   * @param {Card} topCard - Card currently on top of discard pile
   * @param {string} currentColor - Current color in play (for wild cards)
   * @returns {boolean} True if card can be played
   */
  canPlayCard(cardToPlay, topCard, currentColor) {
    if (!cardToPlay || !topCard) {
      return false;
    }

    // Wild cards can always be played
    if (cardToPlay.isWild()) {
      return true;
    }

    // If top card is wild, check against current color
    if (topCard.isWild()) {
      return cardToPlay.color === currentColor;
    }

    // Same color or same value
    return cardToPlay.color === topCard.color || cardToPlay.value === topCard.value;
  }

  /**
   * Execute the action of a played card
   * @param {Card} card - Card that was played
   * @param {Object} gameState - Current game state
   * @returns {Object} Action result with effects
   */
  executeCardAction(card, gameState) {
    const action = {
      type: 'none',
      cardsToDraw: 0,
      skipNextPlayer: false,
      reverseDirection: false,
      colorChange: null,
      requiresChallenge: false,
      challengeFailed: false
    };

    switch (card.value) {
      case 'skip':
        action.type = 'skip';
        action.skipNextPlayer = true;
        break;

      case 'reverse':
        action.type = 'reverse';
        action.reverseDirection = true;
        break;

      case 'draw2':
        action.type = 'draw';
        action.cardsToDraw = 2;
        break;

      case 'wild':
        action.type = 'color_change';
        action.colorChange = gameState.chosenColor || 'red';
        break;

      case 'wild-draw4':
        action.type = 'draw';
        action.cardsToDraw = 4;
        action.requiresChallenge = true;
        action.colorChange = gameState.chosenColor || 'red';
        break;

      default:
        // Number cards have no special action
        action.type = 'none';
        break;
    }

    return action;
  }

  /**
   * Validate Wild Draw 4 challenge
   * @param {Array<Card>} playerHand - Player's hand
   * @param {Card} topCard - Card before the Wild Draw 4
   * @param {string} currentColor - Current color in play
   * @returns {boolean} True if challenge is valid (player has playable cards)
   */
  validateWildDraw4Challenge(playerHand, topCard, currentColor) {
    // Check if player has any cards that could have been played
    return playerHand.some(card => {
      if (card.isWild()) {
        return true; // Wild cards can always be played
      }
      return card.color === currentColor || card.value === topCard.value;
    });
  }

  /**
   * Calculate the next player index
   * @param {number} currentPlayerIndex - Current player index
   * @param {number} direction - Game direction (1 for clockwise, -1 for counterclockwise)
   * @param {number} playerCount - Total number of players
   * @param {boolean} skipNext - Whether to skip the next player
   * @returns {number} Next player index
   */
  calculateNextPlayer(currentPlayerIndex, direction, playerCount, skipNext = false) {
    let nextIndex = getNextPlayerIndex(currentPlayerIndex, direction, playerCount);
    
    if (skipNext) {
      nextIndex = getNextPlayerIndex(nextIndex, direction, playerCount);
    }
    
    return nextIndex;
  }

  /**
   * Handle special card effects
   * @param {Card} card - Card that was played
   * @param {Object} gameState - Current game state
   * @returns {Object} Updated game state
   */
  handleSpecialCards(card, gameState) {
    const newState = { ...gameState };
    const action = this.executeCardAction(card, gameState);

    // Handle direction change
    if (action.reverseDirection) {
      newState.direction *= -1;
      
      // In 2-player games, reverse acts like skip
      if (newState.players.length === 2) {
        action.skipNextPlayer = true;
      }
    }

    // Handle color change for wild cards
    if (action.colorChange) {
      newState.currentColor = action.colorChange;
    } else if (!card.isWild()) {
      newState.currentColor = card.color;
    }

    // Update top card
    newState.topCard = card;

    return { newState, action };
  }

  /**
   * Check if UNO call is valid
   * @param {Player} player - Player calling UNO
   * @returns {Object} Validation result
   */
  checkUnoValidity(player) {
    const result = {
      isValid: false,
      shouldPenalize: false,
      message: ''
    };

    if (player.hand.length === 1 && !player.unoCalled) {
      result.isValid = true;
      result.message = `${player.name} called UNO!`;
    } else if (player.hand.length === 1 && player.unoCalled) {
      result.message = `${player.name} already called UNO`;
    } else if (player.hand.length > 1) {
      result.shouldPenalize = true;
      result.message = `${player.name} called UNO with ${player.hand.length} cards!`;
    }

    return result;
  }

  /**
   * Check if a player should be penalized for not calling UNO
   * @param {Player} player - Player to check
   * @returns {boolean} True if player should be penalized
   */
  shouldPenalizeForUno(player) {
    return player.hand.length === 1 && !player.unoCalled;
  }

  /**
   * Calculate penalty for not calling UNO
   * @param {Player} player - Player to penalize
   * @returns {number} Number of cards to draw as penalty
   */
  calculateUnoPenalty(player) {
    if (this.shouldPenalizeForUno(player)) {
      return GAME_RULES.UNO_PENALTY_CARDS;
    }
    return 0;
  }

  /**
   * Check if game has a winner
   * @param {Array<Player>} players - Array of players
   * @returns {Player|null} Winning player or null if no winner
   */
  checkWinCondition(players) {
    return players.find(player => player.hasWon()) || null;
  }

  /**
   * Calculate final scores for all players
   * @param {Array<Player>} players - Array of players
   * @returns {Array<Object>} Array of player scores
   */
  calculateFinalScores(players) {
    return players.map(player => ({
      playerId: player.id,
      playerName: player.name,
      handScore: player.calculateHandScore(),
      hasWon: player.hasWon()
    }));
  }

  /**
   * Validate game move
   * @param {Object} gameState - Current game state
   * @param {Player} player - Player making the move
   * @param {number} cardIndex - Index of card being played
   * @param {string} chosenColor - Color chosen for wild cards
   * @returns {Object} Validation result
   */
  validateMove(gameState, player, cardIndex, chosenColor = null) {
    const result = {
      isValid: false,
      error: null,
      card: null
    };

    // Check if it's player's turn
    if (gameState.currentPlayerIndex !== gameState.players.findIndex(p => p.id === player.id)) {
      result.error = 'Not your turn';
      return result;
    }

    // Check if game is in playing phase
    if (gameState.phase !== 'playing') {
      result.error = 'Game not in playing phase';
      return result;
    }

    // Get the card
    const card = player.getCard(cardIndex);
    if (!card) {
      result.error = 'Invalid card index';
      return result;
    }

    result.card = card;

    // Check if card can be played
    if (!this.canPlayCard(card, gameState.topCard, gameState.currentColor)) {
      result.error = 'Cannot play this card';
      return result;
    }

    // Validate wild card color choice
    if (card.isWild() && !chosenColor) {
      result.error = 'Must choose a color for wild card';
      return result;
    }

    if (chosenColor && !this.validColors.includes(chosenColor)) {
      result.error = 'Invalid color choice';
      return result;
    }

    result.isValid = true;
    return result;
  }

  /**
   * Process a game action
   * @param {Object} gameState - Current game state
   * @param {string} actionType - Type of action
   * @param {Object} actionData - Action data
   * @returns {Object} Updated game state and result
   */
  processGameAction(gameState, actionType, actionData) {
    const result = {
      success: false,
      newGameState: null,
      message: '',
      effects: []
    };

    try {
      let newState = { ...gameState };

      switch (actionType) {
        case 'play_card':
          result.newGameState = this.handlePlayCard(newState, actionData);
          result.success = true;
          break;

        case 'draw_card':
          result.newGameState = this.handleDrawCard(newState, actionData);
          result.success = true;
          break;

        case 'call_uno':
          result.newGameState = this.handleCallUno(newState, actionData);
          result.success = true;
          break;

        case 'choose_color':
          result.newGameState = this.handleChooseColor(newState, actionData);
          result.success = true;
          break;

        default:
          result.message = 'Unknown action type';
          break;
      }
    } catch (error) {
      result.message = error.message;
    }

    return result;
  }

  /**
   * Handle playing a card
   * @param {Object} gameState - Current game state
   * @param {Object} actionData - Action data
   * @returns {Object} Updated game state
   */
  handlePlayCard(gameState, actionData) {
    const { player, cardIndex, chosenColor } = actionData;
    const newState = { ...gameState };

    // Remove card from player's hand
    const playedCard = player.removeCard(cardIndex);
    newState.deck.addToDiscardPile(playedCard);

    // Handle special card effects
    const { newState: updatedState, action } = this.handleSpecialCards(playedCard, newState);
    
    // Calculate next player
    const currentPlayerIndex = newState.players.findIndex(p => p.id === player.id);
    const nextPlayerIndex = this.calculateNextPlayer(
      currentPlayerIndex,
      updatedState.direction,
      newState.players.length,
      action.skipNextPlayer
    );

    updatedState.currentPlayerIndex = nextPlayerIndex;
    updatedState.turnNumber++;

    return updatedState;
  }

  /**
   * Handle drawing a card
   * @param {Object} gameState - Current game state
   * @param {Object} actionData - Action data
   * @returns {Object} Updated game state
   */
  handleDrawCard(gameState, actionData) {
    const { player, cardCount = 1 } = actionData;
    const newState = { ...gameState };

    // Check if deck needs reshuffling
    if (newState.deck.needsReshuffle()) {
      newState.deck.reshuffleFromDiscard();
    }

    // Draw cards
    const drawnCards = newState.deck.drawCards(cardCount);
    player.addCards(drawnCards);

    // Move to next player
    const currentPlayerIndex = newState.players.findIndex(p => p.id === player.id);
    const nextPlayerIndex = this.calculateNextPlayer(
      currentPlayerIndex,
      newState.direction,
      newState.players.length
    );

    newState.currentPlayerIndex = nextPlayerIndex;
    newState.turnNumber++;

    return newState;
  }

  /**
   * Handle calling UNO
   * @param {Object} gameState - Current game state
   * @param {Object} actionData - Action data
   * @returns {Object} Updated game state
   */
  handleCallUno(gameState, actionData) {
    const { player } = actionData;
    const newState = { ...gameState };

    const unoResult = this.checkUnoValidity(player);
    
    if (unoResult.isValid) {
      player.callUno();
    } else if (unoResult.shouldPenalize) {
      // Penalize player for calling UNO with more than 1 card
      const penaltyCards = newState.deck.drawCards(GAME_RULES.UNO_PENALTY_CARDS);
      player.addCards(penaltyCards);
    }

    return newState;
  }

  /**
   * Handle choosing color for wild cards
   * @param {Object} gameState - Current game state
   * @param {Object} actionData - Action data
   * @returns {Object} Updated game state
   */
  handleChooseColor(gameState, actionData) {
    const { chosenColor } = actionData;
    const newState = { ...gameState };

    if (this.validColors.includes(chosenColor)) {
      newState.currentColor = chosenColor;
      newState.chosenColor = chosenColor;
    }

    return newState;
  }

  /**
   * Get valid colors for wild cards
   * @returns {Array<string>} Array of valid colors
   */
  getValidColors() {
    return [...this.validColors];
  }

  /**
   * Get game rules summary
   * @returns {Object} Game rules summary
   */
  getRulesSummary() {
    return {
      minPlayers: 2,
      maxPlayers: 4,
      cardsPerPlayer: 7,
      unoPenalty: GAME_RULES.UNO_PENALTY_CARDS,
      wildDraw4Challenge: true,
      validColors: this.validColors,
      specialCards: {
        skip: 'Skip the next player',
        reverse: 'Reverse the direction of play',
        draw2: 'Next player draws 2 cards',
        wild: 'Choose any color',
        wildDraw4: 'Choose any color, next player draws 4 cards (challengeable)'
      }
    };
  }
}

module.exports = GameRules;
