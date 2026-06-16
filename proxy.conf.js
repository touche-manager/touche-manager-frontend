// Proxy para `ng serve -c local`: reenvía /api y /ws al backend.
// Reescribe el header Origin a un valor permitido por el CORS del backend
// (cors.allowed-origins incluye http://localhost:4200), de modo que el
// handshake WebSocket (STOMP/SockJS) pase aunque el front se sirva por IP LAN.
const TARGET = 'http://localhost:8080';
const ALLOWED_ORIGIN = 'http://localhost:4200';

module.exports = {
  '/api': {
    target: TARGET,
    secure: false,
    changeOrigin: true,
    headers: { origin: ALLOWED_ORIGIN }
  },
  '/ws': {
    target: TARGET,
    secure: false,
    changeOrigin: true,
    ws: true,
    headers: { origin: ALLOWED_ORIGIN }
  }
};
