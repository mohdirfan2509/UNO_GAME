# UNO Multiplayer Game - System Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT-SIDE (Browser)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Player 1  │  │   Player 2  │  │   Player 3  │  │   Player 4  │ │
│  │  (Desktop)  │  │  (Mobile)   │  │  (Tablet)   │  │  (Desktop)  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│         │                 │                 │                 │     │
│         └─────────────────┼─────────────────┼─────────────────┘     │
│                           │                 │                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Frontend Application                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │   GameUI    │  │ GameState   │  │CardRenderer │             │ │
│  │  │             │  │             │  │             │             │ │
│  │  │ • Page Nav  │  │ • State Mgmt│  │ • Card Anim │             │ │
│  │  │ • Modals    │  │ • Validation│  │ • Rendering │             │ │
│  │  │ • Notifications│ • Turn Logic│  │ • Effects   │             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  │                                                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │SocketClient │  │   Utils     │  │   App.js    │             │ │
│  │  │             │  │             │  │             │             │ │
│  │  │ • WebSocket │  │ • Helpers   │  │ • Main App  │             │ │
│  │  │ • Events    │  │ • Storage   │  │ • Init      │             │ │
│  │  │ • Reconnect │  │ • Validation│  │ • Lifecycle │             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ WebSocket (Socket.IO)
                                │ Real-time Communication
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER-SIDE (Node.js)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Express.js Server                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │   Routes    │  │ Middleware  │  │ Static Files│             │ │
│  │  │             │  │             │  │             │             │ │
│  │  │ • /health   │  │ • CORS      │  │ • HTML/CSS  │             │ │
│  │  │ • /server-info│ • JSON Parse│  │ • JS Files  │             │ │
│  │  │ • SPA Route │  │ • Logging   │  │ • Assets    │             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                │                                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Socket.IO Handler                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │Connection   │  │Room Events  │  │Game Events  │             │ │
│  │  │Management   │  │             │  │             │             │ │
│  │  │             │  │ • Create    │  │ • Play Card │             │ │
│  │  │ • Connect   │  │ • Join      │  │ • Draw Card │             │ │
│  │  │ • Disconnect│  │ • Leave     │  │ • Call UNO  │             │ │
│  │  │ • Reconnect │  │ • Ready     │  │ • Choose Color│           │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                │                                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                    Game Management Layer                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │GameManager  │  │ GameRules   │  │   Player    │             │ │
│  │  │             │  │             │  │             │             │ │
│  │  │ • Room Mgmt │  │ • Validation│  │ • Hand Mgmt │             │ │
│  │  │ • Game State│  │ • Turn Logic│  │ • Stats     │             │ │
│  │  │ • Cleanup   │  │ • Effects   │  │ • Connection│             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  │                                                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │    Card     │  │    Deck     │  │   Utils     │             │ │
│  │  │             │  │             │  │             │             │ │
│  │  │ • Card Logic│  │ • 108 Cards │  │ • Constants │             │ │
│  │  │ • Actions   │  │ • Shuffle   │  │ • Helpers   │             │ │
│  │  │ • Validation│  │ • Deal      │  │ • Logger    │             │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Game Flow                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Player Creates/Joins Room                                   │
│     Client → Socket.IO → GameManager → Room Creation            │
│                                                                 │
│  2. Game State Synchronization                                  │
│     Server → Socket.IO → All Clients → UI Update               │
│                                                                 │
│  3. Player Action (Play Card)                                   │
│     Client → Socket.IO → GameRules → Validation → GameManager   │
│                                                                 │
│  4. Game State Update                                           │
│     GameManager → Socket.IO → All Clients → UI Update          │
│                                                                 │
│  5. Turn Progression                                            │
│     GameRules → GameManager → Socket.IO → All Clients          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Stack                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   HTML5     │  │    CSS3     │  │JavaScript   │             │
│  │             │  │             │  │   ES6+      │             │
│  │ • Semantic  │  │ • Variables │  │ • Classes   │             │
│  │ • Forms     │  │ • Flexbox   │  │ • Modules   │             │
│  │ • Modals    │  │ • Grid      │  │ • Async/Await│            │
│  │ • Accessibility│ • Animations│  │ • DOM API   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Bootstrap 5 │  │Font Awesome │  │Google Fonts │             │
│  │             │  │             │  │             │             │
│  │ • Components│  │ • Icons     │  │ • Typography│             │
│  │ • Grid      │  │ • UI Elements│  │ • Inter Font│            │
│  │ • Utilities │  │ • Status    │  │ • Weights   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Socket.IO
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Stack                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Node.js   │  │  Express.js │  │  Socket.IO  │             │
│  │             │  │             │  │             │             │
│  │ • Runtime   │  │ • Framework │  │ • WebSockets│             │
│  │ • Event Loop│  │ • Routing   │  │ • Real-time │             │
│  │ • NPM       │  │ • Middleware│  │ • Rooms     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │     CORS    │  │   Nodemon   │  │    Git      │             │
│  │             │  │             │  │             │             │
│  │ • Cross-Origin│ • Dev Server │  │ • Version   │             │
│  │ • LAN Access│  │ • Auto-restart│ │ • Control   │             │
│  │ • Security  │  │ • Hot Reload│  │ • History   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Local Network                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Router    │    │   Server    │    │   Clients   │         │
│  │             │    │             │    │             │         │
│  │ • DHCP      │◄──►│ • Node.js   │◄──►│ • Browsers  │         │
│  │ • NAT       │    │ • Port 3000 │    │ • WebSocket │         │
│  │ • Firewall  │    │ • LAN IP    │    │ • HTTP      │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Communication Protocol                       │ │
│  │                                                             │ │
│  │  HTTP/HTTPS: Static files, API endpoints                   │ │
│  │  WebSocket: Real-time game events, state sync              │ │
│  │  Socket.IO: Fallback polling, connection management        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    Feature Implementation                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Multiplayer │  │ Game Logic  │  │ UI/UX       │             │
│  │             │  │             │  │             │             │
│  │ • Room System│  │ • UNO Rules │  │ • Glassmorphism│         │
│  │ • Real-time │  │ • Validation│  │ • Responsive│             │
│  │ • 2-4 Players│  │ • Turn Mgmt │  │ • Animations│             │
│  │ • Host Control│  │ • Card Effects│ │ • Accessibility│        │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Performance │  │ Error       │  │ Deployment  │             │
│  │             │  │ Handling    │  │             │             │
│  │ • Optimized │  │ • Reconnect │  │ • LAN Setup │             │
│  │ • Low Latency│  │ • Validation│  │ • Cross-platform│        │
│  │ • Memory Mgmt│  │ • Graceful  │  │ • Easy Start│            │
│  │ • Efficient │  │ • Recovery  │  │ • Auto Discovery│         │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

This architecture diagram shows the complete system design, data flow, technology stack, and feature implementation of your UNO Multiplayer game. Use this for your presentation to demonstrate the technical depth and architectural decisions made in the project.
