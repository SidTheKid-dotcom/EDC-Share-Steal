const express = require('express');
const ws = require('ws');

const app = express();
app.use(express.json());

const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

// Set up a headless websocket server that prints any
// events that come in.

// Track connected clients
let { addClient, removeClient, getClients } = require('./game-state/clients');

const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', socket => {

  addClient(socket);
  socket.on('close', () => {
    removeClient(socket);
  });

  socket.on('message', message => console.log(message));
});


// `server` is a vanilla Node.js HTTP server, so use
// the same ws upgrade process described here:
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
const server = app.listen(3000, () => {
  console.log('Listening on port 3000');
});

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit('connection', socket, request);
  });
});
