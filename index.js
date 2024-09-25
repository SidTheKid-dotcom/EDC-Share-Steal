const express = require("express");
const ws = require("ws");
const cors = require("cors");
const app = express();

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const { connectionLimiter } = require('./services/rateLimiting');
const userSocketController = require("./controllers/userController/userSocketController");

app.use(express.json());
app.use(cookieParser());

// Configure CORS to allow only your frontend
app.use(
  cors({
    origin: ["http://localhost:5173", "ws://localhost:5173"], // Allow only your frontend
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Specify allowed methods
    allowedHeaders: "Content-Type,Authorization", // Specify allowed headers
    credentials: true, // Allow cookies and authentication headers
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

const adminRoutes = require("./routes/adminRoutes");
const adminAuth = require("./middleware/adminAuth");

const userRoutes = require("./routes/userRoutes");
const loginRoutes = require("./routes/login");

app.use("/login", loginRoutes);
app.use("/admin", adminAuth, adminRoutes);
app.use("/user", userRoutes);

// Set up a headless websocket server that prints any
// events that come in.

const wsServer = new ws.Server({ noServer: true });
wsServer.on("connection", userSocketController);

// `server` is a vanilla Node.js HTTP server, so use
// the same ws upgrade process described here:
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
const server = app.listen(8080, () => {
  console.log("Listening on port 8080");
});

server.on('upgrade', (request, socket, head) => {
  const cookies = request.headers.cookie;
  const token = cookies ? cookies.split('; ').find(row => row.startsWith('token='))?.split('=')[1] : null;
  
  console.log('updrage request: ', request);
  console.log('server side websocket upgrade', cookies, token);

  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET_PLAYER, async (err, decoded) => {
    if (err) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const playerId = parseInt(decoded.playerId, 10);

    if (!await connectionLimiter(playerId)) {
      socket.write('HTTP/1.1 429 Too Many Connection Requests\r\n\r\n');
      socket.destroy();
      return;
    }

    wsServer.handleUpgrade(request, socket, head, (ws) => {
      wsServer.emit('connection', ws, request, decoded); // Optionally pass decoded token
    });
  });
});

