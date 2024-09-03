const express = require('express');
const ws = require('ws');
const cors = require('cors');

const app = express();
app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:5173', // your frontend URL
  credentials: true, // Allow credentials (cookies, etc.) to be sent
};

app.use(cors(corsOptions));

const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);

// Set up a headless websocket server that prints any
// events that come in.

const userSocketController = require('./controllers/userController/userSocketController');

const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', userSocketController);


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
