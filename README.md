# UNO Multiplayer Game

A real-time multiplayer UNO card game built with Node.js, Socket.IO, and vanilla JavaScript.

## 🚀 Quick Start

### Option 1: Using the startup script (Recommended)
1. Double-click `start-server.bat` in the project root
2. Open your browser and go to `http://localhost:3000`

### Option 2: Manual startup
1. Open terminal/command prompt
2. Navigate to the server directory:
   ```bash
   cd D:\End_sem_2\uno-multiplayer\server
   ```
3. Start the server:
   ```bash
   node app.js
   ```
4. Open your browser and go to `http://localhost:3000`

## 🎮 How to Play

1. **Create a Room**: Click "Create Room" and enter your name
2. **Share Room ID**: Share the 6-character room ID with friends
3. **Join Room**: Friends can join using "Join Room" and entering the room ID
4. **Start Game**: Host can start the game when 2-4 players are ready
5. **Play UNO**: Follow standard UNO rules - match color or number, use special cards, call UNO when you have 1 card left!

## 🌐 Network Play

The server displays LAN IP addresses when it starts. Friends on the same network can join using:
- `http://[LAN-IP]:3000` (e.g., `http://192.168.1.100:3000`)

## 🛠️ Features

- ✅ Real-time multiplayer gameplay
- ✅ Room-based system with unique IDs
- ✅ Responsive design for mobile and desktop
- ✅ Modern glassmorphism UI
- ✅ Sound effects and animations
- ✅ Automatic reconnection handling
- ✅ Game state persistence

## 📁 Project Structure

```
uno-multiplayer/
├── server/                 # Backend server
│   ├── app.js             # Main server file
│   ├── game/              # Game logic
│   ├── socket/            # Socket.IO handlers
│   └── utils/             # Utilities
├── public/                # Frontend files
│   ├── index.html         # Main HTML file
│   ├── css/               # Stylesheets
│   └── js/                # JavaScript files
├── start-server.bat       # Windows startup script
└── README.md              # This file
```

## 🔧 Troubleshooting

### Port 3000 already in use
If you get "EADDRINUSE" error:
1. Close any other servers running on port 3000
2. Or change the port in `server/app.js` (line 22)

### Cannot connect to server
1. Make sure the server is running
2. Check firewall settings
3. Try `http://localhost:3000` instead of `http://127.0.0.1:3000`

### Game not loading
1. Check browser console for errors (F12)
2. Make sure all CSS and JS files are loading
3. Try refreshing the page

## 🎯 Game Rules

- Each player starts with 7 cards
- Match the color or number of the top card
- Special cards: Skip, Reverse, Draw 2, Wild, Wild Draw 4
- Call "UNO!" when you have 1 card left
- First player to empty their hand wins!

## 🚀 Ready to Play!

Your UNO Multiplayer game is now ready! Just run the startup script and start playing with friends.