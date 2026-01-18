const jwt = require('jsonwebtoken');

const onlineUsers = new Map();

module.exports = (io) => {
  // Attach onlineUsers to io so it can be accessed from controllers
  io.onlineUsers = onlineUsers;
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (socket: ${socket.id})`);
    onlineUsers.set(socket.userId, socket.id);

    console.log('📡 Current online users:', Array.from(onlineUsers.keys()));
    io.emit('users:online', Array.from(onlineUsers.keys()));

    socket.on('message:send', async (data) => {
      const { chatId, recipientId, content, type, mediaUrl } = data;

      const message = {
        chatId,
        senderId: socket.userId,
        content,
        type: type || 'text',
        mediaUrl,
        timestamp: new Date()
      };

      if (recipientId) {
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('message:received', message);
        }
      }

      socket.emit('message:sent', message);
    });

    socket.on('typing:start', (data) => {
      const { chatId, recipientId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:user', {
          userId: socket.userId,
          chatId
        });
      }
    });

    socket.on('typing:stop', (data) => {
      const { chatId, recipientId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('typing:stopped', {
          userId: socket.userId,
          chatId
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });
  });
};
