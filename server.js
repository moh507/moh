const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer, WebSocket } = require('ws');

const port = Number(process.env.PORT) || 8080;
const indexPath = path.join(__dirname, 'index.html');

const httpServer = http.createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ http: true, websocket: true, port }));
    return;
  }

  if (request.url !== '/' && request.url !== '/index.html') {
    response.writeHead(404, { 'Content-Type': 'text/plain' });
    response.end('Not found');
    return;
  }

  fs.readFile(indexPath, (error, page) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain' });
      response.end('Unable to load index.html');
      return;
    }

    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(page);
  });
});

const dashboardWebSocketServer = new WebSocketServer({ noServer: true });
const relayWebSocketServer = new WebSocketServer({ noServer: true });
const allowedRelays = new Set([
  'wss://relay.deev.is/',
  'wss://relay.lax1dude.net/',
  'wss://relay.shhnowisnottheti.me/'
]);

dashboardWebSocketServer.on('connection', (socket) => {
  socket.send('<strong>Connection ready.</strong><br>Waiting for your next WebSocket message.');

  socket.on('message', (message) => {
    const payload = message.toString();
    for (const client of dashboardWebSocketServer.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  });
});

relayWebSocketServer.on('connection', (client, request, target) => {
  const upstream = new WebSocket(target, { origin: request.headers.origin });
  const pendingMessages = [];

  client.on('message', (message, isBinary) => {
    if (upstream.readyState === WebSocket.OPEN) {
      upstream.send(message, { binary: isBinary });
    } else if (upstream.readyState === WebSocket.CONNECTING) {
      pendingMessages.push({ message, isBinary });
    }
  });

  upstream.on('open', () => {
    for (const pending of pendingMessages) {
      upstream.send(pending.message, { binary: pending.isBinary });
    }
    pendingMessages.length = 0;
  });

  upstream.on('message', (message, isBinary) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message, { binary: isBinary });
    }
  });

  upstream.on('error', () => client.close(1011, 'Relay connection failed'));
  upstream.on('close', (code, reason) => client.close(code, reason));
  client.on('close', () => upstream.close());
});

httpServer.on('upgrade', (request, socket, head) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === '/relay') {
    const target = requestUrl.searchParams.get('target');
    if (!allowedRelays.has(target)) {
      socket.destroy();
      return;
    }
    relayWebSocketServer.handleUpgrade(request, socket, head, (client) => {
      relayWebSocketServer.emit('connection', client, request, target);
    });
    return;
  }

  dashboardWebSocketServer.handleUpgrade(request, socket, head, (client) => {
    dashboardWebSocketServer.emit('connection', client, request);
  });
});

httpServer.listen(port, () => {
  console.log(`WebSocket tester running at http://localhost:${port}`);
  console.log(`WebSocket endpoint: ws://localhost:${port}`);
});

httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing server or use another port.`);
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});