const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { broadcast, broadcastToGame } = require("../controllers/ws-functions");

const { startClock, resetClock } = require('../game-state/clock');
const { fetchGoogleSpreadsheet } = require('../services/fetchGoogleSpreadsheet')

exports.adminBroadcast = async (req, res) => {

    broadcast('Broadcasting to all clients');

    res.json({
        message: 'Successfully broadcast to all clients',
    });
};


exports.adminBroadcastToGame = async (req, res) => {

    const { gameId } = req.body;

    broadcastToGame(`Broadcasting to all clients in game ${gameId}`, gameId);

    return res.send('Broadcasting to all clients in game successful ' + gameId);
};

exports.getDashboard = async (req, res) => {
    // Logic to get and display the admin dashboard

    const allGames = await prisma.game.findMany();

    console.log(allGames);

    broadcast(JSON.stringify({ type: 'games', games: allGames }));

    return res.json({
        message: 'Admin Dashboard',
        games: allGames
    });
};

exports.fetchGoogleSpreadsheet = async (req, res) => {
    const response = await fetchGoogleSpreadsheet();

    return res.json({
        "Response": response
    });
}

exports.givePointsToPlayer = async (req, res) => {
    try {
        const playerID = req.body.playerID;

        if (!playerID) {
            return res.status(400).json({ error: 'Player ID is required' });
        }

        await prisma.user.update({
            where: { id: playerID },
            data: {
                points: {
                    increment: 10,
                },
            },
        });

        return res.send('Points added successfully');
    } catch (error) {
        return res.status(500).json({ error: 'Error adding points' });
    }
}

exports.pairPlayers = async (req, res) => {
    try {
        // Get the top 150 players sorted by points in descending order, then by id in ascending order
        const topPlayers = await prisma.user.findMany({
            orderBy: {
                points: 'desc',
            },
            take: 6,
        });

        // Step 2: Sort these top 4 players by their IDs in ascending order
        topPlayers.sort((a, b) => a.id - b.id);

        // Pair players and update partnerId
        for (let i = 0; i < topPlayers.length; i += 2) {
            const currentPlayer = topPlayers[i];
            const nextPlayer = topPlayers[i + 1];

            if (nextPlayer) {
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

        // Update partnerId to null for players not in the top 150
        await prisma.user.deleteMany({
            where: {
                id: {
                    notIn: topPlayers.map(player => player.id),
                },
            },
        });

        return res.send('Players paired and remaining players updated');

    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred while pairing players');
    }
};

exports.createNewGame = async (req, res) => {
    // Logic to create a new game
    res.send('New game created');
    const newGame = await prisma.game.create({});

    return res.send(newGame);
};

exports.startGame = async (req, res) => {
    // Logic to create a new game
    const gameId = req.body.gameId;

    const existingGame = await prisma.game.findFirst({
        where: {
            gameId: gameId
        }
    });

    if (existingGame.status === 'ACTIVE') {
        return res.send('Game already started');
    }

    const startedGame = await prisma.game.update({
        where: {
            gameId: gameId
        },
        data: {
            startTime: new Date(),
            roundNo: 1,
            status: 'ACTIVE'
        }
    })

    return res.send(startedGame);
};

exports.endGame = async (req, res) => {
    // Logic to create a new game
    const gameId = req.body.gameId;

    const existingGame = await prisma.game.findUnique({
        where: {
            gameId: gameId
        }
    });

    if (existingGame.status === 'COMPLETED') {
        return res.send('Game already ended');
    }

    const endedGame = await prisma.game.update({
        where: {
            gameId: gameId
        },
        data: {
            endTime: new Date(),
            roundNo: null,
            status: 'COMPLETED'
        }
    })

    return res.send(endedGame);
};

exports.resetClock = async (req, res) => {
    // Logic to reset the game clock
    const duration = req.body.duration || 30;
    const gameId = req.body.gameId;

    const updatedGame = await prisma.game.update({
        where: {
            gameId: gameId,
        },
        data: {
            roundNo: {
                increment: 1,  // This increments the current roundNo by 1
            },
        },
    });

    const roundNumber = updatedGame.roundNo;

    // Default to 30 seconds if not provided
    resetClock(duration, gameId, roundNumber);

    res.send(`Clock reset for round ${roundNumber}`);
};

exports.getGameStats = (req, res) => {
    // Logic to retrieve game stats
    res.json({ stats: "Game statistics data" });
};
