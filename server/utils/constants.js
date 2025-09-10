// Game Configuration Constants
const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 4,
  CARDS_PER_PLAYER: 7,
  MAX_ROOM_NAME_LENGTH: 20,
  MAX_PLAYER_NAME_LENGTH: 15,
  ROOM_ID_LENGTH: 6,
  GAME_TIMEOUT: 300000, // 5 minutes
  PLAYER_TIMEOUT: 30000, // 30 seconds
  RECONNECT_TIMEOUT: 60000, // 1 minute
};

// UNO Card Constants
const CARD_COLORS = ['red', 'green', 'blue', 'yellow'];
const CARD_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
const WILD_CARDS = ['wild', 'wild-draw4'];

// Game State Constants
const GAME_PHASES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  ENDED: 'ended',
  PAUSED: 'paused'
};

const PLAYER_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  READY: 'ready',
  NOT_READY: 'not_ready',
  PLAYING: 'playing',
  SPECTATING: 'spectating'
};

// Socket Event Constants
const SOCKET_EVENTS = {
  // Client to Server
  CREATE_ROOM: 'create-room',
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  START_GAME: 'start-game',
  PLAY_CARD: 'play-card',
  DRAW_CARD: 'draw-card',
  CALL_UNO: 'call-uno',
  CHOOSE_COLOR: 'choose-color',
  READY_STATUS: 'ready-status',
  CHALLENGE_WILD_DRAW4: 'challenge-wild-draw4',
  RECONNECT: 'reconnect',
  
  // Server to Client
  ROOM_CREATED: 'room-created',
  ROOM_JOINED: 'room-joined',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  PLAYER_READY: 'player-ready',
  GAME_STARTED: 'game-started',
  GAME_STATE_UPDATE: 'game-state-update',
  CARD_PLAYED: 'card-played',
  CARD_DRAWN: 'card-drawn',
  TURN_CHANGED: 'turn-changed',
  UNO_CALLED: 'uno-called',
  COLOR_CHOSEN: 'color-chosen',
  GAME_ENDED: 'game-ended',
  INVALID_MOVE: 'invalid-move',
  ERROR: 'error',
  CONNECTION_STATUS: 'connection-status',
  ROOM_FULL: 'room-full',
  ROOM_NOT_FOUND: 'room-not-found',
  INVALID_ROOM: 'invalid-room',
  PLAYER_DISCONNECTED: 'player-disconnected',
  PLAYER_RECONNECTED: 'player-reconnected'
};

// Error Messages
const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: 'Room not found',
  ROOM_FULL: 'Room is full',
  INVALID_ROOM_ID: 'Invalid room ID',
  INVALID_PLAYER_NAME: 'Invalid player name',
  GAME_ALREADY_STARTED: 'Game has already started',
  NOT_YOUR_TURN: 'It is not your turn',
  INVALID_CARD: 'Invalid card to play',
  INVALID_MOVE: 'Invalid move',
  PLAYER_NOT_FOUND: 'Player not found',
  GAME_NOT_STARTED: 'Game has not started yet',
  INSUFFICIENT_PLAYERS: 'Not enough players to start game',
  UNO_NOT_CALLED: 'You must call UNO when you have one card left',
  INVALID_COLOR: 'Invalid color choice',
  CARD_NOT_IN_HAND: 'Card not in your hand',
  WILD_DRAW4_CHALLENGE_FAILED: 'Wild Draw 4 challenge failed',
  CONNECTION_LOST: 'Connection lost',
  SERVER_ERROR: 'Server error occurred'
};

// Game Rules Constants
const GAME_RULES = {
  UNO_PENALTY_CARDS: 2, // Cards to draw if UNO not called
  WILD_DRAW4_CHALLENGE_PENALTY: 4, // Cards to draw if challenge fails
  MAX_CARDS_IN_HAND: 108, // Theoretical maximum
  DRAW_CARD_LIMIT: 1, // Cards to draw per turn if no playable card
  SKIP_TURN_PENALTY: 0, // No penalty for skipping turn
};

// Animation and UI Constants
const UI_CONFIG = {
  CARD_ANIMATION_DURATION: 300,
  TURN_INDICATOR_DURATION: 1000,
  NOTIFICATION_DURATION: 3000,
  CONNECTION_RETRY_DELAY: 2000,
  MAX_RECONNECT_ATTEMPTS: 5,
  DEAL_ANIMATION_DELAY: 100,
  CARD_PLAY_ANIMATION_DURATION: 500
};

module.exports = {
  GAME_CONFIG,
  CARD_COLORS,
  CARD_VALUES,
  WILD_CARDS,
  GAME_PHASES,
  PLAYER_STATUS,
  SOCKET_EVENTS,
  ERROR_MESSAGES,
  GAME_RULES,
  UI_CONFIG
};
