const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('UNAUTHORIZED'));
    try {
      socket.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id ?? socket.user.userId;
    socket.join(`user:${userId}`);
    console.log(`[Socket] user ${userId} connected — joined room user:${userId}`);

    socket.on('disconnect', () => {
      console.log(`[Socket] user ${userId} disconnected`);
    });
  });

  return io;
}

function getIo() {
  if (!io) throw new Error('Socket.io not initialised — call initSocket first');
  return io;
}

module.exports = { initSocket, getIo };
