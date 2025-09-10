const GameManager = require('../game/GameManager');
const { SOCKET_EVENTS, ERROR_MESSAGES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Main Socket.IO event handler
 */
class SocketHandler {
  constructor() {
    this.gameManager = new GameManager();
    this.io = null;
  }

  /**
   * Initialize the socket handler
   * @param {Object} io - Socket.IO server instance
   */
  initialize(io) {
    this.io = io;
    
    io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    logger.info('Socket handler initialized');
  }

  /**
   * Handle new socket connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    logger.socketEvent('CONNECTION', socket.id, {
      address: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent']
    });

    // Send connection status
    socket.emit(SOCKET_EVENTS.CONNECTION_STATUS, {
      status: 'connected',
      socketId: socket.id,
      timestamp: Date.now()
    });

    // Handle all socket events
    this.setupEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });
  }

  /**
   * Setup event handlers for a socket
   * @param {Object} socket - Socket instance
   */
  setupEventHandlers(socket) {
    // Room management events
    socket.on(SOCKET_EVENTS.CREATE_ROOM, (data) => {
      this.handleCreateRoom(socket, data);
    });

    socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
      this.handleJoinRoom(socket, data);
    });

    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data) => {
      this.handleLeaveRoom(socket, data);
    });

    socket.on(SOCKET_EVENTS.START_GAME, (data) => {
      this.handleStartGame(socket, data);
    });

    // Game action events
    socket.on(SOCKET_EVENTS.PLAY_CARD, (data) => {
      this.handlePlayCard(socket, data);
    });

    socket.on(SOCKET_EVENTS.DRAW_CARD, (data) => {
      this.handleDrawCard(socket, data);
    });

    socket.on(SOCKET_EVENTS.CALL_UNO, (data) => {
      this.handleCallUno(socket, data);
    });

    socket.on(SOCKET_EVENTS.CHOOSE_COLOR, (data) => {
      this.handleChooseColor(socket, data);
    });

    socket.on(SOCKET_EVENTS.READY_STATUS, (data) => {
      this.handleReadyStatus(socket, data);
    });

    socket.on(SOCKET_EVENTS.CHALLENGE_WILD_DRAW4, (data) => {
      this.handleChallengeWildDraw4(socket, data);
    });

    socket.on(SOCKET_EVENTS.RECONNECT, (data) => {
      this.handleReconnect(socket, data);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR,
        error: error.message
      });
    });
  }

  /**
   * Handle create room event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handleCreateRoom(socket, data) {
    try {
      const { playerName, settings = {} } = data;

      if (!playerName || typeof playerName !== 'string') {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Invalid player name'
        });
        return;
      }

      const result = this.gameManager.createRoom(socket.id, playerName, settings);
      
      if (result.success) {
        socket.emit(SOCKET_EVENTS.ROOM_CREATED, {
          roomId: result.roomId,
          room: result.room
        });
        
        // Join the socket to the room
        socket.join(result.roomId);
        
        logger.socketEvent('ROOM_CREATED', socket.id, {
          roomId: result.roomId,
          playerName
        });
      } else {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error handling create room:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle join room event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handleJoinRoom(socket, data) {
    try {
      const { roomId, playerName } = data;

      if (!roomId || !playerName) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Room ID and player name are required'
        });
        return;
      }

      const result = this.gameManager.joinRoom(roomId, socket.id, playerName);
      
      if (result.success) {
        // Join the socket to the room
        socket.join(roomId);
        
        // Notify the joining player
        socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
          room: result.room,
          player: result.player
        });
        
        // Notify other players in the room
        socket.to(roomId).emit(SOCKET_EVENTS.PLAYER_JOINED, {
          player: result.player,
          room: result.room
        });
        
        logger.socketEvent('ROOM_JOINED', socket.id, {
          roomId,
          playerName
        });
      } else {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error handling join room:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle leave room event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handleLeaveRoom(socket, data) {
    try {
      const { roomId } = data;

      if (!roomId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Room ID is required'
        });
        return;
      }

      const result = this.gameManager.leaveRoom(roomId, socket.id);
      
      if (result.success) {
        // Leave the socket room
        socket.leave(roomId);
        
        // Notify the leaving player
        socket.emit(SOCKET_EVENTS.ROOM_LEFT, {
          roomId
        });
        
        // Notify other players if room still exists
        if (result.room) {
          socket.to(roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, {
            room: result.room
          });
        }
        
        logger.socketEvent('ROOM_LEFT', socket.id, {
          roomId
        });
      } else {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error handling leave room:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle start game event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handleStartGame(socket, data) {
    try {
      const { roomId } = data;

      if (!roomId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Room ID is required'
        });
        return;
      }

      const result = this.gameManager.startGame(roomId, socket.id);
      
      if (result.success) {
        // Notify all players in the room
        this.io.to(roomId).emit(SOCKET_EVENTS.GAME_STARTED, {
          gameState: result.gameState
        });
        
        logger.socketEvent('GAME_STARTED', socket.id, {
          roomId
        });
      } else {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error handling start game:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle play card event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handlePlayCard(socket, data) {
    try {
      const { roomId, cardIndex, chosenColor } = data;

      if (!roomId || cardIndex === undefined) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Room ID and card index are required'
        });
        return;
      }

      const result = this.gameManager.playCard(roomId, socket.id, cardIndex, chosenColor);
      
      if (result.success) {
        // Notify all players in the room
        this.io.to(roomId).emit(SOCKET_EVENTS.CARD_PLAYED, {
          gameState: result.gameState,
          playedCard: result.playedCard,
          winner: result.winner
        });
        
        // If game ended, notify players
        if (result.winner) {
          this.io.to(roomId).emit(SOCKET_EVENTS.GAME_ENDED, {
            winner: result.winner,
            gameState: result.gameState
          });
        }
        
        logger.socketEvent('CARD_PLAYED', socket.id, {
          roomId,
          cardIndex,
          chosenColor
        });
      } else {
        socket.emit(SOCKET_EVENTS.INVALID_MOVE, {
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error handling play card:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle draw card event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handleDrawCard(socket, data) {
    try {
      const { roomId } = data;

      if (!roomId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Room ID is required'
        });
        return;
      }

      const result = this.gameManager.drawCard(roomId, socket.id);
      
      if (result.success) {
        // Notify all players in the room
        this.io.to(roomId).emit(SOCKET_EVENTS.CARD_DRAWN, {
          gameState: result.gameState,
          drawnCard: result.drawnCard
        });
        
        logger.socketEvent('CARD_DRAWN', socket.id, {
          roomId
        });
      } else {
        socket.emit(SOCKET_EVENTS.INVALID_MOVE, {
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error handling draw card:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle call UNO event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handleCallUno(socket, data) {
    try {
      const { roomId } = data;

      if (!roomId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Room ID is required'
        });
        return;
      }

      const result = this.gameManager.callUno(roomId, socket.id);
      
      if (result.success) {
        // Notify all players in the room
        this.io.to(roomId).emit(SOCKET_EVENTS.UNO_CALLED, {
          gameState: result.gameState,
          message: result.message,
          penalized: result.penalized
        });
        
        logger.socketEvent('UNO_CALLED', socket.id, {
          roomId
        });
      } else {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error handling call UNO:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle choose color event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handleChooseColor(socket, data) {
    try {
      const { roomId, color } = data;

      if (!roomId || !color) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Room ID and color are required'
        });
        return;
      }

      // This would be implemented in GameManager
      // For now, just acknowledge the color choice
      this.io.to(roomId).emit(SOCKET_EVENTS.COLOR_CHOSEN, {
        color,
        playerId: socket.id
      });
      
      logger.socketEvent('COLOR_CHOSEN', socket.id, {
        roomId,
        color
      });
    } catch (error) {
      logger.error('Error handling choose color:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle ready status event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handleReadyStatus(socket, data) {
    try {
      const { roomId, ready } = data;

      console.log('Ready status received:', { roomId, ready, socketId: socket.id });

      if (!roomId || typeof ready !== 'boolean') {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Room ID and ready status are required'
        });
        return;
      }

      const result = this.gameManager.setReady(roomId, socket.id, ready);
      
      console.log('Ready status result:', result);
      
      if (result.success) {
        // Notify ALL players in the room (including the one who clicked ready)
        const readyData = {
          playerId: socket.id,
          ready,
          room: result.room
        };
        
        console.log('Broadcasting ready status to room:', roomId, readyData);
        
        this.io.to(roomId).emit(SOCKET_EVENTS.PLAYER_READY, readyData);
        
        logger.socketEvent('READY_STATUS', socket.id, {
          roomId,
          ready
        });
      } else {
        console.log('Ready status failed:', result.error);
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error handling ready status:', error);
      logger.error('Error handling ready status:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle challenge wild draw 4 event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handleChallengeWildDraw4(socket, data) {
    try {
      const { roomId, challenge } = data;

      if (!roomId || typeof challenge !== 'boolean') {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Room ID and challenge status are required'
        });
        return;
      }

      // This would be implemented in GameManager
      // For now, just broadcast the challenge
      this.io.to(roomId).emit(SOCKET_EVENTS.WILD_DRAW4_CHALLENGE, {
        challengerId: socket.id,
        challenge
      });
      
      logger.socketEvent('WILD_DRAW4_CHALLENGE', socket.id, {
        roomId,
        challenge
      });
    } catch (error) {
      logger.error('Error handling wild draw 4 challenge:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle reconnect event
   * @param {Object} socket - Socket instance
   * @param {Object} data - Event data
   */
  handleReconnect(socket, data) {
    try {
      const { oldSocketId } = data;

      if (!oldSocketId) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: 'Old socket ID is required'
        });
        return;
      }

      const result = this.gameManager.handleReconnection(oldSocketId, socket.id);
      
      if (result.success) {
        // Join the socket to the room
        socket.join(result.room.id);
        
        // Notify the reconnecting player
        socket.emit(SOCKET_EVENTS.PLAYER_RECONNECTED, {
          room: result.room,
          gameState: result.gameState
        });
        
        // Notify other players
        socket.to(result.room.id).emit(SOCKET_EVENTS.PLAYER_RECONNECTED, {
          playerId: socket.id,
          room: result.room
        });
        
        logger.socketEvent('RECONNECTED', socket.id, {
          oldSocketId,
          roomId: result.room.id
        });
      } else {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error handling reconnect:', error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }

  /**
   * Handle socket disconnection
   * @param {Object} socket - Socket instance
   * @param {string} reason - Disconnection reason
   */
  handleDisconnection(socket, reason) {
    logger.socketEvent('DISCONNECTION', socket.id, {
      reason
    });

    // Handle disconnection in game manager
    this.gameManager.handleDisconnection(socket.id);
  }

  /**
   * Get game manager instance
   * @returns {GameManager} Game manager instance
   */
  getGameManager() {
    return this.gameManager;
  }

  /**
   * Stop the socket handler
   */
  stop() {
    if (this.gameManager) {
      this.gameManager.stop();
    }
  }
}

module.exports = new SocketHandler();
