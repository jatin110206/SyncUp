# 🚀 SyncUp — Real-Time Chat & Messaging Backend API

**SyncUp** is a feature-packed, production-hardened Node.js & Express RESTful API and real-time Socket.io backend powering 1-on-1 chats, group chats, image sharing, message read receipts, user profiles, and presence tracking.

---

## 📑 Table of Contents
- [Tech Stack](#-tech-stack)
- [Environment Setup](#-environment-setup)
- [Security & Production Hardening](#-security--production-hardening)
- [Real-Time Socket.io Events](#-real-time-socketio-events)
- [API Endpoints Reference](#-api-endpoints-reference)
  - [Health Check](#1-health-check)
  - [Authentication](#2-authentication-apiauth)
  - [User & Profile Management](#3-user--profile-management-apiuser)
  - [Chat & Group Conversations](#4-chat--group-conversations-apichat)
  - [Messaging System](#5-messaging-system-apimessage)
- [Standard Response Formats](#-standard-response-formats)

---

## 🛠️ Tech Stack

- **Runtime & Framework**: Node.js, Express.js (v5)
- **Database & ODM**: MongoDB, Mongoose
- **Real-Time Communication**: Socket.io (v4)
- **Authentication**: JSON Web Tokens (JWT), BcryptJS
- **Media Cloud Storage**: Cloudinary SDK (Image upload for profiles & chat messages)
- **Security**: Helmet, Express Rate Limit, Custom NoSQL Injection Protection

---

## ⚙️ Environment Setup

Create a `config.env` file in the `server/` directory:

```env
PORT_NUMBER=5001
CONN_STRING=mongodb+srv://<username>:<password>@cluster.mongodb.net/syncup
JWT_SECRET=your_jwt_secret_key_here
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
```

### Installation & Launch

```bash
# Navigate into server directory
cd server

# Install dependencies
npm install

# Start in development mode (with nodemon)
npm run dev

# Start in production mode
npm start
```

---

## 🛡️ Security & Production Hardening

- **Helmet Security Headers**: Enforces HSTS, clickjacking protection (`X-Frame-Options`), MIME-sniffing prevention (`X-Content-Type-Options`), and strips `X-Powered-By`.
- **Rate Limiting**:
  - General API: Max 100 requests per 15 minutes per IP.
  - Auth Endpoints (`/api/auth/*`): Max 15 requests per 15 minutes per IP (protects against brute-force).
- **NoSQL Injection Sanitization**: Strips `$`, `.`, and operators from `req.body`, `req.params`, and `req.query`.
- **Graceful Shutdown**: Intercepts `SIGINT` / `SIGTERM` signals to cleanly close HTTP/Socket listeners and Mongoose connections.
- **Centralized Error Handling**: Standardized JSON error outputs hiding stack traces in non-development environments.

---

## 🔌 Real-Time Socket.io Events

Socket.io runs on the same HTTP server port. Connect your Socket.io client to `http://localhost:5001`.

### 📤 Client → Server Events

| Event Name | Data Payload | Business Logic |
|---|---|---|
| `user-online` | `userId` (string) | Registers user socket as online and broadcasts updated online users list. |
| `join-chat` | `chatId` (string) | Joins the socket to a specific chat room ID. |
| `leave-chat` | `chatId` (string) | Leaves the specified chat room ID. |
| `send-message` | `messageData` (object) | Relays a real-time message payload to all other members in the chat room. |
| `typing` | `{ chatId, userId, firstname }` | Broadcasts typing indicator to other room members. |
| `stop-typing` | `{ chatId, userId }` | Clears typing indicator for room members. |

### 📥 Server → Client Events

| Event Name | Emitted Data | Description |
|---|---|---|
| `get-online-users` | `Array<userId>` | Array of currently connected user IDs. |
| `receive-message` | `messageData` (object) | Real-time incoming message payload. |
| `user-typing` | `{ chatId, userId, firstname }` | Triggered when a user starts typing. |
| `user-stop-typing` | `{ chatId, userId }` | Triggered when a user stops typing. |

---

## 📡 API Endpoints Reference

All protected endpoints require an `Authorization` header containing a valid JWT token:
`Authorization: Bearer <your_jwt_token>`

---

### 1. Health Check

#### `GET /health`
- **Access**: Public
- **Logic**: Returns live operational status, uptime, server timestamp, database connection status, and environment mode.

**Example Output (200 OK)**:
```json
{
  "status": "OK",
  "uptime": 128.45,
  "timestamp": "2026-09-13T15:40:00.000Z",
  "database": "connected",
  "environment": "development"
}
```

---

### 2. Authentication (`/api/auth`)

#### `POST /api/auth/signup`
- **Access**: Public (Rate-limited: max 15 requests / 15m)
- **Logic**: Checks if user email already exists. Hashes password with `bcrypt` (10 rounds) and saves new user record.

**Input Body**:
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "profileImage": "https://example.com/avatar.jpg"
}
```

**Output Response (201 Created)**:
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "6aa6218b542aafcb495e0a7e",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "profileImage": "https://example.com/avatar.jpg",
    "bio": "",
    "status": "Hey there! I am using SyncUp.",
    "createdAt": "2026-09-13T04:07:39.718Z"
  }
}
```

---

#### `POST /api/auth/login`
- **Access**: Public (Rate-limited: max 15 requests / 15m)
- **Logic**: Verifies user existence and compares hashed password using `bcrypt`. Generates JWT signed token expiring in 1 hour.

**Input Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Output Response (200 OK)**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 3. User & Profile Management (`/api/user`)

#### `GET /api/user/profile`
- **Access**: Authenticated
- **Logic**: Fetches the authenticated user's own profile excluding password.

**Output Response (200 OK)**:
```json
{
  "user": {
    "_id": "6aa6218b542aafcb495e0a7e",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "bio": "Software Engineer",
    "status": "Coding 👨‍💻",
    "profilePicture": "https://res.cloudinary.com/demo/image/upload/user_123.jpg"
  }
}
```

---

#### `GET /api/user/all`
- **Access**: Authenticated
- **Logic**: Retrieves all registered users except the logged-in user.

**Output Response (200 OK)**:
```json
{
  "users": [
    {
      "_id": "6aa621bf542aafcb495e0a7f",
      "firstname": "Jane",
      "lastname": "Smith",
      "email": "jane@example.com",
      "bio": "Designer",
      "status": "Available for chat!"
    }
  ]
}
```

---

#### `GET /api/user/search?q=query&page=1&limit=10`
- **Access**: Authenticated
- **Logic**: Performs case-insensitive partial match regex search on `firstname`, `lastname`, and `email` with pagination metadata.

**Query Parameters**:
- `q`: Search string (required)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)

**Output Response (200 OK)**:
```json
{
  "users": [
    {
      "_id": "6aa621bf542aafcb495e0a7f",
      "firstname": "Jane",
      "lastname": "Smith",
      "email": "jane@example.com"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

#### `GET /api/user/:userId`
- **Access**: Authenticated
- **Logic**: Fetches public profile details of a user by ID.

**Output Response (200 OK)**:
```json
{
  "user": {
    "_id": "6aa621bf542aafcb495e0a7f",
    "firstname": "Jane",
    "lastname": "Smith",
    "email": "jane@example.com",
    "bio": "Creative Lead",
    "status": "In a meeting"
  }
}
```

---

#### `PUT /api/user/updateProfile`
- **Access**: Authenticated
- **Logic**: Updates profile fields (`firstname`, `lastname`, `bio`, `status`). Validates lengths (`bio` max 200 chars, `status` max 100 chars).

**Input Body**:
```json
{
  "firstname": "Johnathan",
  "bio": "Fullstack Developer & Tech Enthusiast",
  "status": "Building cool projects 🚀"
}
```

**Output Response (200 OK)**:
```json
{
  "message": "Profile updated successfully!",
  "user": {
    "_id": "6aa6218b542aafcb495e0a7e",
    "firstname": "Johnathan",
    "lastname": "Doe",
    "bio": "Fullstack Developer & Tech Enthusiast",
    "status": "Building cool projects 🚀"
  }
}
```

---

#### `PUT /api/user/changePassword`
- **Access**: Authenticated
- **Logic**: Verifies `currentPassword` with `bcrypt`. Compares `newPassword` and `confirmPassword`, checks length (min 6 chars), hashes new password, and saves.

**Input Body**:
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Output Response (200 OK)**:
```json
{
  "message": "Password changed successfully!"
}
```

---

#### `POST /api/user/uploadProfilePicture`
- **Access**: Authenticated
- **Logic**: Uploads base64 image payload to Cloudinary under folder `profile_pictures`. Updates user `profilePicture` and `profileImage` fields with secure URL.

**Input Body**:
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Output Response (200 OK)**:
```json
{
  "message": "Profile picture updated successfully!",
  "user": {
    "_id": "6aa6218b542aafcb495e0a7e",
    "profilePicture": "https://res.cloudinary.com/demo/image/upload/v1234/profile_pictures/user_123.jpg"
  }
}
```

---

### 4. Chat & Group Conversations (`/api/chat`)

#### `POST /api/chat/createChat`
- **Access**: Authenticated
- **Logic**: Creates a 1-on-1 chat between logged-in user and target `recepientId`. If a chat already exists between the two users, it returns the existing chat to prevent duplicates.

**Input Body**:
```json
{
  "recepientId": "6aa621bf542aafcb495e0a7f"
}
```

**Output Response (200 / 201 OK)**:
```json
{
  "chat": {
    "_id": "6aa63195495aa621f5ffa4b3",
    "members": ["6aa6218b542aafcb495e0a7e", "6aa621bf542aafcb495e0a7f"],
    "isGroupChat": false,
    "unreadCount": 0,
    "lastMessage": null,
    "createdAt": "2026-09-13T09:00:00.000Z"
  }
}
```

---

#### `POST /api/chat/createGroupChat`
- **Access**: Authenticated
- **Logic**: Creates a multi-user group chat. Requires a group name and at least 2 member IDs (total 3+ members including creator). Sets creator as `groupAdmin`.

**Input Body**:
```json
{
  "groupName": "Dev Team Sync",
  "members": ["6aa621bf542aafcb495e0a7f", "6aa6431f08f89c491ebdb300"]
}
```

**Output Response (201 Created)**:
```json
{
  "message": "Group chat created successfully!",
  "chat": {
    "_id": "6aa712398471239847129837",
    "isGroupChat": true,
    "groupName": "Dev Team Sync",
    "groupAdmin": {
      "_id": "6aa6218b542aafcb495e0a7e",
      "firstname": "John",
      "lastname": "Doe"
    },
    "members": [
      { "_id": "6aa6218b542aafcb495e0a7e", "firstname": "John" },
      { "_id": "6aa621bf542aafcb495e0a7f", "firstname": "Jane" },
      { "_id": "6aa6431f08f89c491ebdb300", "firstname": "Jatin" }
    ]
  }
}
```

---

#### `GET /api/chat/getChats`
- **Access**: Authenticated
- **Logic**: Fetches all chats (1-on-1 and group) where authenticated user is a member, sorted by `updatedAt` descending. Populates members and `lastMessageDetails`.

**Output Response (200 OK)**:
```json
{
  "chats": [
    {
      "_id": "6aa63195495aa621f5ffa4b3",
      "isGroupChat": false,
      "lastMessage": "Hey! How are you?",
      "unreadCount": 2,
      "members": [
        { "_id": "6aa621bf542aafcb495e0a7f", "firstname": "Jane", "lastname": "Smith" }
      ]
    }
  ]
}
```

---

#### `GET /api/chat/getChat/:chatId`
- **Access**: Authenticated
- **Logic**: Fetches single chat details by ID, verifying user membership.

**Output Response (200 OK)**:
```json
{
  "chat": {
    "_id": "6aa63195495aa621f5ffa4b3",
    "isGroupChat": false,
    "members": [{ "_id": "6aa621bf542aafcb495e0a7f" }]
  }
}
```

---

#### `PUT /api/chat/clearUnread`
- **Access**: Authenticated
- **Logic**: Resets `unreadCount` for a specific chat to 0.

**Input Body**:
```json
{
  "chatId": "6aa63195495aa621f5ffa4b3"
}
```

**Output Response (200 OK)**:
```json
{
  "message": "Unread count cleared!",
  "chat": {
    "_id": "6aa63195495aa621f5ffa4b3",
    "unreadCount": 0
  }
}
```

---

#### `PUT /api/chat/renameGroup`
- **Access**: Authenticated (Group Admin Only)
- **Logic**: Renames an existing group chat. Only group admin is permitted.

**Input Body**:
```json
{
  "chatId": "6aa712398471239847129837",
  "groupName": "Frontend Squad"
}
```

**Output Response (200 OK)**:
```json
{
  "message": "Group name updated successfully!",
  "chat": {
    "_id": "6aa712398471239847129837",
    "groupName": "Frontend Squad"
  }
}
```

---

#### `PUT /api/chat/addGroupMembers`
- **Access**: Authenticated (Group Admin Only)
- **Logic**: Adds new user ID(s) to a group chat. Only group admin is permitted.

**Input Body**:
```json
{
  "chatId": "6aa712398471239847129837",
  "members": ["6aa655555555555555555555"]
}
```

**Output Response (200 OK)**:
```json
{
  "message": "Members added successfully!",
  "chat": { "_id": "6aa712398471239847129837" }
}
```

---

#### `PUT /api/chat/removeGroupMember`
- **Access**: Authenticated (Group Admin Only)
- **Logic**: Removes a user from a group chat. Only group admin is permitted.

**Input Body**:
```json
{
  "chatId": "6aa712398471239847129837",
  "memberId": "6aa655555555555555555555"
}
```

**Output Response (200 OK)**:
```json
{
  "message": "Member removed successfully!"
}
```

---

#### `PUT /api/chat/leaveGroup`
- **Access**: Authenticated
- **Logic**: Allows a member to leave a group. If the admin leaves, administrative privileges are automatically transferred to the next remaining member.

**Input Body**:
```json
{
  "chatId": "6aa712398471239847129837"
}
```

**Output Response (200 OK)**:
```json
{
  "message": "You have left the group chat."
}
```

---

### 5. Messaging System (`/api/message`)

#### `POST /api/message/newMessage`
- **Access**: Authenticated
- **Logic**: Sends a text and/or image message. If `image` base64 is provided, uploads to Cloudinary (`chat_images`). Updates chat `lastMessage` and increments `unreadCount`. Returns message populated with `sender`.

**Input Body**:
```json
{
  "chatId": "6aa63195495aa621f5ffa4b3",
  "text": "Hello team! Check out this snapshot.",
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**Output Response (201 Created)**:
```json
{
  "message": {
    "_id": "6aa888888888888888888888",
    "chatId": "6aa63195495aa621f5ffa4b3",
    "sender": {
      "_id": "6aa6218b542aafcb495e0a7e",
      "firstname": "John",
      "lastname": "Doe",
      "profilePicture": "https://example.com/pic.jpg"
    },
    "text": "Hello team! Check out this snapshot.",
    "image": "https://res.cloudinary.com/demo/image/upload/chat_images/msg_123.jpg",
    "read": false,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": "2026-09-13T10:00:00.000Z"
  }
}
```

---

#### `GET /api/message/getMessages/:chatId`
- **Access**: Authenticated
- **Logic**: Retrieves all messages for a specific chat ordered chronologically, with populated `sender` details (`firstname`, `lastname`, `profilePicture`).

**Output Response (200 OK)**:
```json
{
  "messages": [
    {
      "_id": "6aa888888888888888888888",
      "chatId": "6aa63195495aa621f5ffa4b3",
      "text": "Hello team! Check out this snapshot.",
      "sender": {
        "_id": "6aa6218b542aafcb495e0a7e",
        "firstname": "John"
      },
      "read": true
    }
  ]
}
```

---

#### `PUT /api/message/markAsRead/:chatId`
- **Access**: Authenticated
- **Logic**: Marks all messages in specified chat as read (`read: true`) for recipient and resets chat `unreadCount` to 0.

**Output Response (200 OK)**:
```json
{
  "message": "Messages marked as read!"
}
```

---

#### `PUT /api/message/editMessage/:messageId`
- **Access**: Authenticated (Sender Only)
- **Logic**: Allows original sender to edit their text message. Sets `isEdited: true`.

**Input Body**:
```json
{
  "text": "Updated message text"
}
```

**Output Response (200 OK)**:
```json
{
  "message": "Message edited successfully!",
  "data": {
    "_id": "6aa888888888888888888888",
    "text": "Updated message text",
    "isEdited": true
  }
}
```

---

#### `DELETE /api/message/deleteMessage/:messageId`
- **Access**: Authenticated (Sender Only)
- **Logic**: Soft deletes message. Replaces text with `"This message was deleted"` and sets `isDeleted: true`.

**Output Response (200 OK)**:
```json
{
  "message": "Message deleted successfully!",
  "data": {
    "_id": "6aa888888888888888888888",
    "text": "This message was deleted",
    "isDeleted": true
  }
}
```

---

## 📌 Standard Response Formats

### Error Response Schema
```json
{
  "status": 400,
  "message": "Detailed description of validation or execution error"
}
```

### Common HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation error or missing required parameters.
- `401 Unauthorized`: Missing or invalid JWT authentication token.
- `403 Forbidden`: Authenticated user lacks permission (e.g. non-admin attempting group rename).
- `404 Not Found`: Target route, user, chat, or message does not exist.
- `429 Too Many Requests`: Rate limit threshold exceeded.
- `500 Internal Server Error`: Unhandled server exception.
