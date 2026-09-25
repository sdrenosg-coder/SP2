import { Server } from 'socket.io';

export function setupSocket(server) {
  const io = new Server(server, { cors: { origin: true, credentials: true } });
  io.on('connection', (socket) => {
    socket.on('joinBusiness', (businessId) => socket.join(`business:${businessId}`));
    socket.on('leaveBusiness', (businessId) => socket.leave(`business:${businessId}`));
  });
  return io;
}

export function emitBusinessEvent(io, businessId, event, payload) {
  io.to(`business:${businessId}`).emit(event, payload);
}
