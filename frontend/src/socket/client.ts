import { io, Socket } from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ['websocket'],
});
