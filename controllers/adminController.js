const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { broadcast, broadcastToGame } = require("../controllers/ws-functions");

const { startClock, resetClock } = require("../game-state/clock");
const {
  fetchGoogleSpreadsheet,
} = require("../services/fetchGoogleSpreadsheet");
const {
  sendToGoogleSpreadsheet,
} = require("../services/sendToGoogleSpreadsheet");

exports.adminBroadcast = async (req, res) => {
  broadcast("Broadcasting to all clients");

  res.json({
    message: "Successfully broadcast to all clients",
  });
};

exports.adminBroadcastToGame = async (req, res) => {
  const { gameId } = req.body;

  try {
    broadcastToGame(`Broadcasting to all clients in game ${gameId}`, gameId);

    return res.send("Broadcasting to all clients in game successful " + gameId);
  } catch (error) {
    console.log(error);
  }
};

exports.getDashboard = async (req, res) => {
  // Logic to get and display the admin dashboard

  const allGames = await prisma.game.findMany();

  // console.log(allGames);

  try {
    broadcast(JSON.stringify({ type: "games", games: allGames }));

    return res.json({
      message: "Admin Dashboard",
      games: allGames,
    });
  } catch (error) {
    console.log(error)
  }
};

exports.fetchGoogleSpreadsheet = async (req, res) => {
  const response = await fetchGoogleSpreadsheet();

  const valuesArray = response.data.values;

  if (!valuesArray || valuesArray.length === 0) {
    return res.status(404).json({ error: "No data found in Google Sheets" });
  }

  try {
    for (const value of valuesArray) {
      console.log(value[0] + " " + value[1]);
      await prisma.user.create({
        data: {
          name: value[1].toUpperCase(),
          password: "12345",
        },
      });
    }

    return res.json({
      Response: valuesArray,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.sendToGoogleSpreadsheet = async (req, res) => {
  const { gameId, gameNoForSheets } = req.body;

  try {
    const players = await prisma.user.findMany({
      where: {
        activeGameId: parseInt(gameId, 10),
        gameNoForSheets: parseInt(gameNoForSheets, 10),
      },
      orderBy: {
        points: "desc",
      },
    });

    console.log(players);

    const response = await sendToGoogleSpreadsheet(gameNoForSheets, players);

    await prisma.user.updateMany({
      where: {
        activeGameId: parseInt(gameId, 10),
      },
      data: {
        gameNoForSheets: parseInt(gameNoForSheets, 10) + 1,
      },
    });

    console.log(response);

    return res.status(200).send("Data Moved To Spreadsheet");
  }
  catch (error) {
    console.log(error);
  }
};

exports.getAllPlayers = async (req, res) => {
  try {
    const players = await prisma.user.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      players: players,
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    return res.status(500).json({
      message: "An error occurred while fetching players.",
    });
  }
};

exports.givePointsToPlayer = async (req, res) => {
  try {
    const playerID = req.body.playerID;
    const points = req.body.points;

    if (!playerID) {
      return res.status(400).json({ error: "Player ID is required" });
    }

    await prisma.user.update({
      where: { id: playerID },
      data: {
        points: {
          increment: points,
        },
      },
    });

    return res.send("Points added successfully");
  } catch (error) {
    return res.status(500).json({ error: "Error adding points" });
  }
};

exports.filterPlayers = async (req, res) => {
  try {
    const number = parseInt(req.body.number, 10);

    if (!number) {
      return res.status(400).json({ error: "Number is required" });
    }

    const topPlayers = await prisma.user.findMany({
      orderBy: {
        points: "desc",
      },
      take: number,
      select: {
        id: true,
      },
    });

    // Step 2: Extract top user IDs
    const topPlayerIds = topPlayers.map((player) => player.id);

    // Step 3: Delete users who are not in the top 30
    await prisma.user.deleteMany({
      where: {
        NOT: {
          id: {
            in: topPlayerIds,
          },
        },
      },
    });

    return res
      .status(200)
      .send(`Users deleted successfully keeping only top ${number} players`);
  } catch (error) {
    console.error("Error deleting users:", error);
    return res.status(500).json({ error: "Error filtering users" });
  }
};

exports.pairPlayers = async (req, res) => {
  try {
    // Step 1: Fetch all players
    const players = await prisma.user.findMany({
      where: {
        activeGameId: { not: null } // Assuming only players with an active game should be paired
      },
    });

    // Step 2: Sort players by gameId (ascending) and points (descending) for the same gameId
    players.sort((a, b) => {
      if (a.activeGameId !== b.activeGameId) {
        return a.activeGameId - b.activeGameId; // Sort by gameId in ascending order
      } else {
        return a.id - b.id; // If gameId is the same, sort by id in ascending order
      }
    });

    // Step 3: Pair players and update partnerId
    for (let i = 0; i < players.length; i += 2) {
      const currentPlayer = players[i];
      const nextPlayer = players[i + 1];

      // Check if nextPlayer exists and has the same gameId
      if (nextPlayer && currentPlayer.activeGameId === nextPlayer.activeGameId) {
        await prisma.user.update({
          where: { id: currentPlayer.id },
          data: { partnerId: nextPlayer.id },
        });

        await prisma.user.update({
          where: { id: nextPlayer.id },
          data: { partnerId: currentPlayer.id },
        });
      }
    }

    return res.send("Players paired and remaining players updated");
  } catch (error) {
    console.error(error);
    return res.status(500).send("An error occurred while pairing players");
  }
};


exports.createNewGame = async (req, res) => {
  // Logic to create a new game
  try {
    const newGame = await prisma.game.create({});
    return res.send(newGame);
  }
  catch (error) {
    console.log(error);
  }
};

exports.startGame = async (req, res) => {
  // Logic to create a new game
  const gameId = req.body.gameId;

  try {
    const existingGame = await prisma.game.findFirst({
      where: {
        gameId: gameId,
      },
    });

    if (existingGame.status === "ACTIVE") {
      return res.send("Game already started");
    }

    const startedGame = await prisma.game.update({
      where: {
        gameId: gameId,
      },
      data: {
        startTime: new Date(),
        roundNo: 1,
        status: "ACTIVE",
      },
    });

    return res.send(startedGame);
  }
  catch (error) {
    console.log(error);
  }
};

exports.endGame = async (req, res) => {
  // Logic to create a new game
  const gameId = req.body.gameId;

  try {
    const existingGame = await prisma.game.findUnique({
      where: {
        gameId: gameId,
      },
    });

    if (existingGame.status === "COMPLETED") {
      return res.send("Game already ended");
    }

    const endedGame = await prisma.game.update({
      where: {
        gameId: gameId,
      },
      data: {
        endTime: new Date(),
        roundNo: null,
        status: "COMPLETED",
      },
    });

    return res.send(endedGame);
  }
  catch (erro) {
    console.log(error);
  }
};

exports.resetClock = async (req, res) => {
  // Logic to reset the game clock
  const duration = req.body.duration || 30;
  const gameId = req.body.gameId;

  try {
    const updatedGame = await prisma.game.update({
      where: {
        gameId: gameId,
      },
      data: {
        roundNo: {
          increment: 1, // This increments the current roundNo by 1
        },
      },
    });

    const roundNumber = updatedGame.roundNo;

    // Default to 30 seconds if not provided
    resetClock(duration, gameId, roundNumber);

    return res.send(`Clock reset for round ${roundNumber}`);
  }
  catch (error) {
    console.log(error);
  }
};

exports.getGameStats = (req, res) => {
  // Logic to retrieve game stats
  try {
    return res.json({ stats: "Game statistics data" });
  } catch (error) {
    console.log(error);
  }
};

exports.deleteAllData = async (req, res) => {
  // Logic to delete all data
  try {
    await prisma.$transaction([
      prisma.game.deleteMany({}),
      prisma.user.deleteMany({}),
      prisma.move.deleteMany({}),
    ]);

    return res.send("All data deleted");
  }
  catch (error) {
    console.log(error);
  }
};

exports.truncateTables = async (req, res) => {
  try {
    // Logic to delete all data
    await prisma.$transaction([
      prisma.$executeRaw`TRUNCATE TABLE "Game" RESTART IDENTITY CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "Move" RESTART IDENTITY CASCADE;`,
    ]);

    return res.send("All tables truncated and primary keys reset");
  } catch (error) {
    console.error("Error truncating tables:", error);
    return res.status(500).send("Error truncating tables");
  }
};

