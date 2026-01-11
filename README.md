# maNet

A real-time messaging application built with React Native and Node.js, featuring WebSocket communication for instant messaging, user authentication, media sharing, and group chat functionality.

## Tech Stack

### Frontend (Mobile)
- React Native
- Socket.IO Client
- React Navigation
- AsyncStorage for local data

### Backend
- Node.js & Express
- Socket.IO for real-time communication
- MongoDB with Mongoose
- JWT authentication
- Bcrypt for password hashing

## Features

- Real-time messaging with WebSocket
- User authentication (email/password + Google OAuth)
- Google Sign-In integration
- Direct messaging
- Group chats
- Media sharing (images, videos, files)
- Online/offline status
- Typing indicators
- Message read receipts
- User search
- Profile management

## Project Structure

```
manet/
├── mobile/              # React Native app
├── backend/             # Node.js server
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth & validation
│   │   ├── config/      # Socket.IO config
│   │   └── server.js    # Entry point
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- React Native development environment
- Android Studio / Xcode

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/manet
JWT_SECRET=your_secure_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development

SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id_from_console
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_console
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

5. (Optional) Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
   - Copy Client ID and Client Secret to `.env`

6. Start MongoDB

7. Run the server:
```bash
npm run dev
```

### Mobile App Setup

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. For iOS (macOS only):
```bash
cd ios && pod install && cd ..
```

4. Run the app:

For Android:
```bash
npm run android
```

For iOS:
```bash
npm run ios
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/google/mobile` - Google Sign-In for mobile (with ID token)

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search?query=` - Search users
- `GET /api/users/:userId` - Get user by ID

### Chats
- `POST /api/chats` - Create new chat
- `GET /api/chats` - Get all user chats
- `GET /api/chats/:chatId` - Get chat by ID
- `POST /api/chats/:chatId/participants` - Add participants to group
- `DELETE /api/chats/:chatId/leave` - Leave group chat

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/chat/:chatId` - Get chat messages
- `PUT /api/messages/:messageId/read` - Mark message as read
- `DELETE /api/messages/:messageId` - Delete message

## WebSocket Events

### Client → Server
- `message:send` - Send a message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

### Server → Client
- `message:received` - New message received
- `message:sent` - Message sent confirmation
- `typing:user` - User is typing
- `typing:stopped` - User stopped typing
- `users:online` - Online users list

## Development Progress

This project is being developed incrementally with progress updates shared on LinkedIn to demonstrate:
- Full-stack development skills
- Real-time application architecture
- Mobile app development
- Database design and API development
- Authentication and security best practices

## Next Steps

- [ ] Implement media upload functionality
- [ ] Add push notifications
- [ ] Create React Native UI components
- [ ] Implement state management
- [ ] Add end-to-end encryption
- [ ] Deploy backend to cloud
- [ ] Publish to app stores

## License

MIT

---

Built by Christos | [LinkedIn](#) | Portfolio Project
