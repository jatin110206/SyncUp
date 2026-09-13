# SyncUp — Frontend Client

> A modern, real-time messaging application built with React 19 + Vite. Supports one-on-one chats, group conversations, live online presence, and robust user blocking — all powered by WebSockets.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Available Scripts](#-available-scripts)
- [Features](#-features)
- [State Management](#-state-management)
- [Real-time Communication](#-real-time-communication)
- [Key Components](#-key-components)

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| UI Framework | React 19 |
| Build Tool | Vite 8 |
| Routing | React Router v7 |
| State Management | Zustand v5 |
| Real-time | Socket.IO Client v4 |
| HTTP Client | Axios |
| Animations | Framer Motion |
| Icons | Lucide React |
| Styling | Tailwind CSS v3 |
| Linting | OxLint |

---

## 📁 Project Structure

```
client/
├── public/                     # Static assets
├── src/
│   ├── assets/                 # Images, icons, etc.
│   ├── components/
│   │   ├── chat/               # Chat-related components
│   │   │   ├── ChatCard.jsx          # Individual chat list item
│   │   │   ├── ChatDetailsPanel.jsx  # Right panel: info, members, block
│   │   │   ├── ChatHeader.jsx        # Top bar for active chat
│   │   │   ├── ChatListSidebar.jsx   # Left sidebar: conversation list
│   │   │   ├── NewChatModal.jsx      # Start a new DM by User ID
│   │   │   └── NewGroupModal.jsx     # Create a group chat
│   │   ├── common/             # Shared/generic components
│   │   ├── layout/             # App shell and layout wrappers
│   │   └── messages/           # Message rendering components
│   │       └── MessageBubble.jsx     # Single message with block-aware display
│   ├── pages/
│   │   ├── AppPage.jsx         # Main authenticated app shell
│   │   ├── LoginPage.jsx       # Login form
│   │   ├── SignupPage.jsx      # Registration form
│   │   ├── ProfilePage.jsx     # User profile editor
│   │   └── SettingsPage.jsx    # App settings
│   ├── services/
│   │   ├── api.js              # Axios instance + interceptors
│   │   ├── authService.js      # Login / signup / logout API calls
│   │   ├── chatService.js      # Chat CRUD API calls
│   │   ├── messageService.js   # Message send/fetch API calls
│   │   ├── socket.js           # Socket.IO connection manager & event handlers
│   │   └── userService.js      # User search, block/unblock API calls
│   ├── store/
│   │   ├── useAuthStore.js     # Auth state (current user, JWT)
│   │   ├── useChatStore.js     # Chat list, active chat, block state
│   │   ├── useMessageStore.js  # Messages for active chat
│   │   ├── usePresenceStore.js # Online/offline presence tracking
│   │   └── useUiStore.js       # UI flags (modals, panels, sidebar)
│   ├── App.jsx                 # Root component + route definitions
│   ├── App.css
│   ├── index.css               # Global styles & Tailwind directives
│   └── main.jsx                # React entry point
├── .env                        # Local environment variables (not committed)
├── .env.example                # Template for required env vars
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- The **SyncUp backend server** must be running (see `/server/README.md`)

### Installation

```bash
# From the repository root
cd client

# Install dependencies
npm install
```

### Running in Development

```bash
npm run dev
```

The app will be available at **http://localhost:5173** by default.

> Make sure the backend is running on `http://localhost:3000` (or the port you configured in `.env`) before starting the frontend.

---

## 🔑 Environment Variables

Create a `.env` file in the `client/` directory:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend REST API | `http://localhost:3000/api` |
| `VITE_SOCKET_URL` | URL for the Socket.IO server | `http://localhost:3000` |

> All client-side env vars **must** be prefixed with `VITE_` to be exposed by Vite.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build optimised production bundle to `dist/` |
| `npm run preview` | Locally preview the production build |
| `npm run lint` | Lint all source files with OxLint |

---

## ✨ Features

### 💬 Real-time Messaging
- Instant message delivery via **Socket.IO** — no polling.
- Messages appear in real-time for all participants.
- Message timestamps with smart relative formatting.

### 👥 Group Chats
- Create groups with a name and multiple members.
- Add members by searching their **Unique User ID** (prevents adding strangers by accident).
- Admins can add or remove members from the **Chat Details Panel**.

### 🔍 Search by User ID
- Start a **new direct message** by entering the target user's unique ID.
- Add members to a group by User ID — no full user-directory exposure.

### 🚫 Block / Unblock
- Block any user from a DM chat or from a group's member list.
- **Blocked users** cannot send you messages (enforced server-side).
- Messages from blocked users are **collapsed** with a "Show" toggle — you decide what to read.
- Block/unblock propagates **instantly** via WebSocket events to all connected sessions.
- If you are blocked by someone, their chat shows as **Unavailable**.

### 🟢 Online Presence
- Real-time **online / offline indicators** next to user avatars.
- Presence updates broadcast via Socket.IO on connect/disconnect.

### 🔐 Authentication
- **JWT-based** authentication with tokens stored in `localStorage`.
- Axios interceptor automatically attaches the `Authorization` header.
- Protected routes redirect unauthenticated users to `/login`.

### 👤 Profile Management
- Update display name, avatar, and bio from the **Profile page**.
- Changes reflected immediately across the app.

---

## 🗄 State Management

The app uses **Zustand** for global client state, split into focused stores:

| Store | File | Responsibility |
|---|---|---|
| `useAuthStore` | `store/useAuthStore.js` | Logged-in user, JWT token, login/logout actions |
| `useChatStore` | `store/useChatStore.js` | Chat list, selected chat, real-time block state updates |
| `useMessageStore` | `store/useMessageStore.js` | Messages for the active chat, send/receive actions |
| `usePresenceStore` | `store/usePresenceStore.js` | Map of userId → isOnline for presence indicators |
| `useUiStore` | `store/useUiStore.js` | Modal open/close flags, sidebar visibility, active panels |

---

## 📡 Real-time Communication

All real-time logic is centralised in `src/services/socket.js`.

### Socket Events

#### Emitted (Client → Server)

| Event | Payload | Purpose |
|---|---|---|
| `join-chat` | `{ chatId }` | Subscribe to a chat room |
| `leave-chat` | `{ chatId }` | Unsubscribe from a chat room |
| `send-message` | `{ chatId, content }` | Send a new message |

#### Listened (Server → Client)

| Event | Payload | Purpose |
|---|---|---|
| `new-message` | message object | Append incoming message |
| `user-online` | `userId` | Mark user as online |
| `user-offline` | `userId` | Mark user as offline |
| `user-blocked` | `{ blockerId, blockedId }` | Update block state in store |
| `user-unblocked` | `{ blockerId, blockedId }` | Remove block state from store |
| `chat-block-updated` | `{ chatId, ... }` | Refresh a specific chat's block flags |

---

## 🧩 Key Components

### `ChatListSidebar`
Left panel listing all conversations. Shows unread badges, last message preview, and online indicators. Houses the **New Chat** and **New Group** buttons.

### `ChatHeader`
Top bar of the active conversation. Displays contact name, online status, and a `Blocked` / `Unavailable` badge when applicable.

### `ChatDetailsPanel`
Collapsible right panel showing chat info. For DMs: block/unblock button. For groups: member list with per-member block controls and an add-member form.

### `NewGroupModal`
Modal for creating a new group. Members are added by searching their **Unique User ID** — displays blocked-user warnings and shows selected members as removable chips.

### `MessageBubble`
Renders a single message. If the sender is blocked, the message is **collapsed by default** with a `Show` button so the user consciously opts in to reading it.

---

## 🤝 Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/my-feature`
2. Commit your changes following [Conventional Commits](https://www.conventionalcommits.org/).
3. Open a Pull Request describing what changed and why.

---

## 📄 License

This project is licensed under the **MIT License**.
