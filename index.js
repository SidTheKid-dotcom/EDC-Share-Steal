const express = require("express");
const ws = require("ws");
const cors = require("cors");
const url = require('url');
const app = express();

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const { connectionLimiter } = require('./services/rateLimiting');
const userSocketController = require("./controllers/userController/userSocketController");

app.use(express.json());
app.use(cookieParser());

// Configure CORS to allow only your anywhere
app.use(
  cors({
    origin: ["https://edc-steal-share-frontend.vercel.app", "wss://edc-steal-share-frontend.vercel.app", "https://tejchalaikyutuneapnigadi.vercel.app", "http://localhost:5173", "ws://localhost:5173"], // Allow requests from any origin
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
const ocAuth = require("./middleware/ocAuth");

// route added to check domain resolution
app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.use("/login", loginRoutes);
app.use("/admin", adminAuth, adminRoutes);
app.use("/oc", ocAuth, ocRoutes);
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
  const query = url.parse(request.url, true).query;
  const token = query.token;

  console.log('server side websocket upgrade', token);

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

