const Player = require('./Player');
const Deck = require('./Deck');
const GameRules = require('./GameRules');
const { generateRoomId } = require('../utils/helpers');
const { GAME_CONFIG, GAME_PHASES, PLAYER_STATUS, ERROR_MESSAGES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Manages game rooms and game logic
 */
class GameManager {
  constructor() {
    this.rooms = new Map(); // roomId -> GameRoom
    this.players = new Map(); // socketId -> Player
    this.gameRules = new GameRules();
    this.cleanupInterval = null;
    
    // Start cleanup interval for inactive rooms
    this.startCleanupInterval();
  }

  /**
   * Create a new game room
   * @param {string} hostSocketId - Socket ID of the host
   * @param {string} hostName - Name of the host
   * @param {Object} settings - Game settings
   * @returns {Object} Result object with room info or error
   */
  createRoom(hostSocketId, hostName, settings = {}) {
    try {
      const roomId = generateRoomId();
      const host = new Player(hostSocketId, hostName, true);
      
      const room = {
        id: roomId,
        host: host,
        players: [host],
        settings: {
          maxPlayers: settings.maxPlayers || GAME_CONFIG.MAX_PLAYERS,
          gameMode: settings.gameMode || 'classic',
          allowSpectators: settings.allowSpectators || false,
          ...settings
        },
        gameState: {
          phase: GAME_PHASES.WAITING,
          currentPlayerIndex: 0,
          direction: 1, // 1 for clockwise, -1 for counterclockwise
          currentColor: null,
          topCard: null,
          chosenColor: null,
          turnNumber: 0,
          deck: new Deck(),
          winner: null,
          gameStartTime: null,
          lastActivity: Date.now()
        },
        createdAt: Date.now(),
        lastActivity: Date.now()
      };

      this.rooms.set(roomId, room);
      this.players.set(hostSocketId, host);
      
      logger.roomEvent('ROOM_CREATED', roomId, {
        hostName,
        settings: room.settings
      });

      return {
        success: true,
        roomId,
        room: this.getRoomInfo(room)
      };
    } catch (error) {
      logger.error('Error creating room:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      };
    }
  }

  /**
   * Join an existing room
   * @param {string} roomId - Room ID to join
   * @param {string} playerSocketId - Socket ID of the player
   * @param {string} playerName - Name of the player
   * @returns {Object} Result object with success status or error
   */
  joinRoom(roomId, playerSocketId, playerName) {
    try {
      const room = this.rooms.get(roomId);
      
      if (!room) {
        return {
          success: false,
          error: ERROR_MESSAGES.ROOM_NOT_FOUND
        };
      }

      if (room.players.length >= room.settings.maxPlayers) {
        return {
          success: false,
          error: ERROR_MESSAGES.ROOM_FULL
        };
      }

      if (room.gameState.phase !== GAME_PHASES.WAITING) {
        return {
          success: false,
          error: ERROR_MESSAGES.GAME_ALREADY_STARTED
        };
      }

      // Check if player name is already taken
      const nameExists = room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase());
      if (nameExists) {
        return {
          success: false,
          error: 'Player name already taken'
        };
      }

      const player = new Player(playerSocketId, playerName, false);
      room.players.push(player);
      this.players.set(playerSocketId, player);
      
      room.lastActivity = Date.now();

      logger.roomEvent('PLAYER_JOINED', roomId, {
        playerName,
        playerCount: room.players.length
      });

      return {
        success: true,
        room: this.getRoomInfo(room),
        player: player.toJSON()
      };
    } catch (error) {
      logger.error('Error joining room:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      };
    }
  }

  /**
   * Start a game in a room
   * @param {string} roomId - Room ID
   * @param {string} hostSocketId - Socket ID of the host
   * @returns {Object} Result object with success status or error
   */
  startGame(roomId, hostSocketId) {
    try {
      const room = this.rooms.get(roomId);
      
      if (!room) {
        return {
          success: false,
          error: ERROR_MESSAGES.ROOM_NOT_FOUND
        };
      }

      if (room.host.socketId !== hostSocketId) {
        return {
          success: false,
          error: 'Only the host can start the game'
        };
      }

      if (room.players.length < GAME_CONFIG.MIN_PLAYERS) {
        return {
          success: false,
          error: ERROR_MESSAGES.INSUFFICIENT_PLAYERS
        };
      }

      if (room.gameState.phase !== GAME_PHASES.WAITING) {
        return {
          success: false,
          error: ERROR_MESSAGES.GAME_ALREADY_STARTED
        };
      }

      // Initialize game
      this.initializeGame(room);
      
      room.gameState.phase = GAME_PHASES.PLAYING;
      room.gameState.gameStartTime = Date.now();
      room.lastActivity = Date.now();

      logger.roomEvent('GAME_STARTED', roomId, {
        playerCount: room.players.length,
        hostName: room.host.name
      });

      return {
        success: true,
        gameState: this.getGameState(room)
      };
    } catch (error) {
      logger.error('Error starting game:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      };
    }
  }

  /**
   * Initialize a new game
   * @param {Object} room - Room object
   */
  initializeGame(room) {
    // Reset all players
    room.players.forEach(player => {
      player.resetForNewGame();
    });

    // Create new deck and shuffle
    room.gameState.deck = new Deck();

    // Deal initial cards
    const dealResult = room.gameState.deck.dealInitialCards(room.players, GAME_CONFIG.CARDS_PER_PLAYER);
    if (!dealResult.success) {
      throw new Error('Failed to deal initial cards');
    }

    // Draw first card to start the game
    let firstCard = room.gameState.deck.drawCard();
    
    // If first card is a wild card, draw another
    while (firstCard.isWild()) {
      room.gameState.deck.addToDiscardPile(firstCard);
      firstCard = room.gameState.deck.drawCard();
    }

    room.gameState.deck.addToDiscardPile(firstCard);
    room.gameState.topCard = firstCard;
    room.gameState.currentColor = firstCard.color;
    room.gameState.currentPlayerIndex = 0;
    room.gameState.direction = 1;
    room.gameState.turnNumber = 1;
    room.gameState.winner = null;
    room.gameState.chosenColor = null;
    
    // Update players array in game state
    room.gameState.players = room.players;
  }

  /**
   * Play a card
   * @param {string} roomId - Room ID
   * @param {string} playerSocketId - Socket ID of the player
   * @param {number} cardIndex - Index of the card to play
   * @param {string} chosenColor - Color chosen for wild cards
   * @returns {Object} Result object with success status or error
   */
  playCard(roomId, playerSocketId, cardIndex, chosenColor = null) {
    try {
      const room = this.rooms.get(roomId);
      
      if (!room) {
        return {
          success: false,
          error: ERROR_MESSAGES.ROOM_NOT_FOUND
        };
      }

      if (room.gameState.phase !== GAME_PHASES.PLAYING) {
        return {
          success: false,
          error: ERROR_MESSAGES.GAME_NOT_STARTED
        };
      }

      const player = this.players.get(playerSocketId);
      if (!player) {
        return {
          success: false,
          error: ERROR_MESSAGES.PLAYER_NOT_FOUND
        };
      }

      // Validate the move
      const validation = this.gameRules.validateMove(room.gameState, player, cardIndex, chosenColor);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Execute the move
      const actionData = {
        player,
        cardIndex,
        chosenColor
      };

      room.gameState = this.gameRules.handlePlayCard(room.gameState, actionData);
      room.lastActivity = Date.now();

      // Check for winner
      const winner = this.gameRules.checkWinCondition(room.players);
      if (winner) {
        room.gameState.phase = GAME_PHASES.ENDED;
        room.gameState.winner = winner;
        this.updatePlayerStats(room.players, winner);
      }

      logger.gameEvent('CARD_PLAYED', roomId, player.id, {
        card: validation.card.toJSON(),
        chosenColor,
        turnNumber: room.gameState.turnNumber
      });

      return {
        success: true,
        gameState: this.getGameState(room),
        playedCard: validation.card.toJSON(),
        winner: winner ? winner.toJSON() : null
      };
    } catch (error) {
      logger.error('Error playing card:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      };
    }
  }

  /**
   * Draw a card
   * @param {string} roomId - Room ID
   * @param {string} playerSocketId - Socket ID of the player
   * @returns {Object} Result object with success status or error
   */
  drawCard(roomId, playerSocketId) {
    try {
      const room = this.rooms.get(roomId);
      
      if (!room) {
        return {
          success: false,
          error: ERROR_MESSAGES.ROOM_NOT_FOUND
        };
      }

      if (room.gameState.phase !== GAME_PHASES.PLAYING) {
        return {
          success: false,
          error: ERROR_MESSAGES.GAME_NOT_STARTED
        };
      }

      const player = this.players.get(playerSocketId);
      if (!player) {
        return {
          success: false,
          error: ERROR_MESSAGES.PLAYER_NOT_FOUND
        };
      }

      // Check if it's player's turn
      const currentPlayerIndex = room.players.findIndex(p => p.id === player.id);
      if (currentPlayerIndex !== room.gameState.currentPlayerIndex) {
        return {
          success: false,
          error: ERROR_MESSAGES.NOT_YOUR_TURN
        };
      }

      // Check if deck needs reshuffling
      if (room.gameState.deck.needsReshuffle()) {
        room.gameState.deck.reshuffleFromDiscard();
      }

      // Draw card
      const drawnCard = room.gameState.deck.drawCard();
      if (!drawnCard) {
        return {
          success: false,
          error: 'No cards available to draw'
        };
      }

      player.addCards([drawnCard]);

      // Move to next player
      const currentPlayerIndex = room.players.findIndex(p => p.id === player.id);
      const nextPlayerIndex = this.gameRules.calculateNextPlayer(
        currentPlayerIndex,
        room.gameState.direction,
        room.players.length
      );

      room.gameState.currentPlayerIndex = nextPlayerIndex;
      room.gameState.turnNumber++;
      room.lastActivity = Date.now();

      logger.gameEvent('CARD_DRAWN', roomId, player.id, {
        cardCount: player.hand.length,
        turnNumber: room.gameState.turnNumber
      });

      return {
        success: true,
        gameState: this.getGameState(room),
        drawnCard: drawnCard.toJSON()
      };
    } catch (error) {
      logger.error('Error drawing card:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      };
    }
  }

  /**
   * Call UNO
   * @param {string} roomId - Room ID
   * @param {string} playerSocketId - Socket ID of the player
   * @returns {Object} Result object with success status or error
   */
  callUno(roomId, playerSocketId) {
    try {
      const room = this.rooms.get(roomId);
      
      if (!room) {
        return {
          success: false,
          error: ERROR_MESSAGES.ROOM_NOT_FOUND
        };
      }

      if (room.gameState.phase !== GAME_PHASES.PLAYING) {
        return {
          success: false,
          error: ERROR_MESSAGES.GAME_NOT_STARTED
        };
      }

      const player = this.players.get(playerSocketId);
      if (!player) {
        return {
          success: false,
          error: ERROR_MESSAGES.PLAYER_NOT_FOUND
        };
      }

      const unoResult = this.gameRules.checkUnoValidity(player);
      
      if (unoResult.isValid) {
        player.callUno();
        logger.gameEvent('UNO_CALLED', roomId, player.id, {
          message: unoResult.message
        });
      } else if (unoResult.shouldPenalize) {
        // Penalize player for calling UNO with more than 1 card
        const penaltyCards = room.gameState.deck.drawCards(GAME_RULES.UNO_PENALTY_CARDS);
        player.addCards(penaltyCards);
        logger.gameEvent('UNO_PENALTY', roomId, player.id, {
          message: unoResult.message,
          penaltyCards: penaltyCards.length
        });
      }

      room.lastActivity = Date.now();

      return {
        success: true,
        gameState: this.getGameState(room),
        message: unoResult.message,
        penalized: unoResult.shouldPenalize
      };
    } catch (error) {
      logger.error('Error calling UNO:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      };
    }
  }

  /**
   * Leave a room
   * @param {string} roomId - Room ID
   * @param {string} playerSocketId - Socket ID of the player
   * @returns {Object} Result object with success status or error
   */
  leaveRoom(roomId, playerSocketId) {
    try {
      const room = this.rooms.get(roomId);
      
      if (!room) {
        return {
          success: false,
          error: ERROR_MESSAGES.ROOM_NOT_FOUND
        };
      }

      const player = this.players.get(playerSocketId);
      if (!player) {
        return {
          success: false,
          error: ERROR_MESSAGES.PLAYER_NOT_FOUND
        };
      }

      // Remove player from room
      const playerIndex = room.players.findIndex(p => p.id === player.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
      }

      // Remove player from players map
      this.players.delete(playerSocketId);

      // Handle host leaving
      if (player.isHost && room.players.length > 0) {
        // Transfer host to next player
        room.host = room.players[0];
        room.host.isHost = true;
        logger.roomEvent('HOST_TRANSFERRED', roomId, {
          newHost: room.host.name
        });
      }

      // If no players left, delete room
      if (room.players.length === 0) {
        this.rooms.delete(roomId);
        logger.roomEvent('ROOM_DELETED', roomId, {
          reason: 'No players left'
        });
      } else {
        room.lastActivity = Date.now();
        logger.roomEvent('PLAYER_LEFT', roomId, {
          playerName: player.name,
          remainingPlayers: room.players.length
        });
      }

      return {
        success: true,
        room: room.players.length > 0 ? this.getRoomInfo(room) : null
      };
    } catch (error) {
      logger.error('Error leaving room:', error);
      return {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR
      };
    }
  }

  /**
   * Handle player disconnection
   * @param {string} socketId - Socket ID of disconnected player
   */
  handleDisconnection(socketId) {
    const player = this.players.get(socketId);
    if (!player) {
      return;
    }

    // Find the room containing this player
    for (const [roomId, room] of this.rooms) {
      const roomPlayer = room.players.find(p => p.id === player.id);
      if (roomPlayer) {
        roomPlayer.disconnect();
        room.lastActivity = Date.now();
        
        logger.roomEvent('PLAYER_DISCONNECTED', roomId, {
          playerName: player.name,
          gamePhase: room.gameState.phase
        });

        // If game is in progress, pause it
        if (room.gameState.phase === GAME_PHASES.PLAYING) {
          room.gameState.phase = GAME_PHASES.PAUSED;
        }

        break;
      }
    }
  }

  /**
   * Handle player reconnection
   * @param {string} oldSocketId - Old socket ID
   * @param {string} newSocketId - New socket ID
   * @returns {Object} Result object with room info or error
   */
  handleReconnection(oldSocketId, newSocketId) {
    const player = this.players.get(oldSocketId);
    if (!player) {
      return {
        success: false,
        error: 'Player not found'
      };
    }

    // Update socket ID
    player.reconnect(newSocketId);
    this.players.delete(oldSocketId);
    this.players.set(newSocketId, player);

    // Find the room and resume game if it was paused
    for (const [roomId, room] of this.rooms) {
      const roomPlayer = room.players.find(p => p.id === player.id);
      if (roomPlayer) {
        roomPlayer.reconnect(newSocketId);
        room.lastActivity = Date.now();
        
        if (room.gameState.phase === GAME_PHASES.PAUSED) {
          room.gameState.phase = GAME_PHASES.PLAYING;
        }

        logger.roomEvent('PLAYER_RECONNECTED', roomId, {
          playerName: player.name
        });

        return {
          success: true,
          room: this.getRoomInfo(room),
          gameState: this.getGameState(room)
        };
      }
    }

    return {
      success: false,
      error: 'Room not found'
    };
  }

  /**
   * Get room information
   * @param {string} roomId - Room ID
   * @returns {Object} Room information or null
   */
  getRoom(roomId) {
    const room = this.rooms.get(roomId);
    return room ? this.getRoomInfo(room) : null;
  }

  /**
   * Get room information object
   * @param {Object} room - Room object
   * @returns {Object} Room information
   */
  getRoomInfo(room) {
    return {
      id: room.id,
      host: room.host.toJSON(),
      players: room.players.map(p => p.toJSON()),
      settings: room.settings,
      gameState: {
        phase: room.gameState.phase,
        playerCount: room.players.length,
        currentPlayer: room.players[room.gameState.currentPlayerIndex]?.toJSON() || null,
        direction: room.gameState.direction,
        currentColor: room.gameState.currentColor,
        topCard: room.gameState.topCard?.toJSON() || null,
        turnNumber: room.gameState.turnNumber,
        winner: room.gameState.winner?.toJSON() || null,
        gameStartTime: room.gameState.gameStartTime
      },
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    };
  }

  /**
   * Get game state for a room
   * @param {Object} room - Room object
   * @returns {Object} Game state
   */
  getGameState(room) {
    return {
      phase: room.gameState.phase,
      currentPlayerIndex: room.gameState.currentPlayerIndex,
      direction: room.gameState.direction,
      currentColor: room.gameState.currentColor,
      topCard: room.gameState.topCard?.toJSON() || null,
      chosenColor: room.gameState.chosenColor,
      turnNumber: room.gameState.turnNumber,
      players: room.players.map(p => p.toJSON(true)), // Include hands
      deck: room.gameState.deck.toJSON(),
      winner: room.gameState.winner?.toJSON() || null,
      gameStartTime: room.gameState.gameStartTime
    };
  }

  /**
   * Update player statistics
   * @param {Array<Player>} players - Array of players
   * @param {Player} winner - Winning player
   */
  updatePlayerStats(players, winner) {
    players.forEach(player => {
      const won = player.id === winner.id;
      const handScore = player.calculateHandScore();
      player.addGameStats(won, handScore);
    });
  }

  /**
   * Start cleanup interval for inactive rooms
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms();
    }, 60000); // Run every minute
  }

  /**
   * Clean up inactive rooms
   */
  cleanupInactiveRooms() {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [roomId, room] of this.rooms) {
      if (now - room.lastActivity > inactiveThreshold) {
        this.rooms.delete(roomId);
        logger.roomEvent('ROOM_CLEANUP', roomId, {
          reason: 'Inactive',
          lastActivity: new Date(room.lastActivity).toISOString()
        });
      }
    }
  }

  /**
   * Get all active rooms
   * @returns {Array<Object>} Array of room information
   */
  getAllRooms() {
    return Array.from(this.rooms.values()).map(room => this.getRoomInfo(room));
  }

  /**
   * Get server statistics
   * @returns {Object} Server statistics
   */
  getServerStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: this.players.size,
      activeGames: Array.from(this.rooms.values()).filter(room => 
        room.gameState.phase === GAME_PHASES.PLAYING
      ).length,
      waitingRooms: Array.from(this.rooms.values()).filter(room => 
        room.gameState.phase === GAME_PHASES.WAITING
      ).length
    };
  }

  /**
   * Stop the game manager and cleanup
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.rooms.clear();
    this.players.clear();
  }
}

module.exports = GameManager;
