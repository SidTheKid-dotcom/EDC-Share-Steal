const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { messageLimiter } = require("../../services/rateLimiting");

// Track connected clients
let {
  addClient,
  removeClient,
  removeClientById,
  getClientById,
  getClients,
} = require("../../game-state/clients");
const { getGlobalClock } = require("../../game-state/clock");
const { broadcastToOne } = require("../ws-functions");

const userSocketController = async (socket, request, decoded) => {

  const playerId = parseInt(decoded.playerId, 10);

  if (!playerId) {
    socket.send("Player ID is missing");
    return;
  }

  const player = await prisma.user.findUnique({
    where: { id: parseInt(playerId, 10) },
  });

  if (!player.activeGameId) {
    socket.send("Player is not in a game");
    socket.close();
    return;
  }

  // Remove old client from connected clients
  if (getClientById(playerId)) {
    removeClientById(playerId);
    console.log("Removing connected client: ", playerId);
  }
  

  // Add client to connected clients
  console.log("Plyaer ID: while connecting ", playerId);
  addClient(socket, playerId, player.activeGameId);

  socket.on("close", () => {
    removeClient(getClientById(playerId));
    console.log("Client disconnected: ", playerId);
  });

  socket.on("message", async (message) => {

    if (!await messageLimiter(playerId)) {
      socket.send('Rate limit exceeded');
      socket.close();
      return;
    }

    try {
      const data = JSON.parse(message);

      const globalClock = getGlobalClock(player.activeGameId);
      if (!globalClock) {
        socket.send("Round is not active");
        return;
      }

      switch (data.type) {
        case "submit":
          handleSubmitAnswer(data, socket);
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });
};

async function handleSubmitAnswer(data, socket) {
  const { gameId, userId, move } = data;

  try {
    // Start a transaction
    const result = await prisma.$transaction(async (prisma) => {
      const [game, user] = await Promise.all([
        prisma.game.findUnique({
          where: { gameId: parseInt(gameId, 10) }, // Ensure gameId is parsed as integer
          select: { status: true, roundNo: true },
        }),
        prisma.user.findUnique({
          where: { activeGameId: parseInt(gameId, 10), id: parseInt(userId, 10) }, // Ensure userId is parsed as integer
          select: { partnerId: true },
        }),
      ]);

      // Check if game is active
      if (!game || game.status !== "ACTIVE") {
        console.log("Game not found or is not active");
        throw new Error("Game not found or is not active");
      }

      // Check if user exists and has a partner
      if (!user || user.partnerId === null) {
        console.log("User not found for game or partner not found");
        throw new Error("User not found for game or partner not found");
      }

      // Fetch existing moves after game is confirmed to be active
      const existingMove = await prisma.move.findMany({
        where: {
          gameId: parseInt(gameId, 10), // Ensure gameId is treated as integer
          playerId: parseInt(userId, 10), // Ensure userId is treated as integer
          roundNo: parseInt(game.roundNo, 10), // Ensure roundNo is treated as integer
        },
      });

      console.log(userId, ' ', existingMove);

      // Check if move already exists for this round
      if (existingMove && existingMove.length > 0) {
        console.log("Move already exists");
        throw new Error("Move already exists");
      }

      // Create new move
      const newMove = await prisma.move.create({
        data: {
          gameId: parseInt(gameId, 10), // Ensure gameId is an integer
          playerId: parseInt(userId, 10), // Ensure userId is an integer
          move,
          roundNo: parseInt(game.roundNo, 10), // Ensure roundNo is an integer
          timestamp: new Date(),
        },
      });

      return newMove;
    });

    console.log(result);
    socket.send(JSON.stringify({
      type: "notice",
      message: `newMove submitted`
    }), result);
  } catch (error) {
    console.error("Error handling submit answer:", error);
    socket.send(
      "error",
      error.message || "An error occurred while processing the move"
    );
  }
}

module.exports = userSocketController;
