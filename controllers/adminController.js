const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { broadcast, broadcastToGame } = require("../controllers/ws-functions");

const { startClock, resetClock } = require('../game-state/clock');
const { fetchGoogleSpreadsheet } = require('../services/fetchGoogleSpreadsheet')
const { sendToGoogleSpreadsheet } = require('../services/sendToGoogleSpreadsheet')

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

    const valuesArray = response.data.values;

    if (!valuesArray || valuesArray.length === 0) {
        return res.status(404).json({ error: 'No data found in Google Sheets' });
    }

    for (const value of valuesArray) {
        console.log(value[0] + " " + value[1]);
        await prisma.user.create({
            data: {
                name: value[1],
                password: '12345'
            }
        })
    }

    return res.json({
        "Response": valuesArray
    });
}

exports.sendToGoogleSpreadsheet = async (req, res) => {

    const { gameId, gameNoForSheets } = req.body;

    const players = await prisma.user.findMany({
        where: {
            activeGameId: gameId,
            gameNoForSheets: gameNoForSheets
        },
        orderBy: {
            points: 'desc',
        },
    });

    console.log(players);

    const response = await sendToGoogleSpreadsheet(gameNoForSheets, players);

    await prisma.user.updateMany({
        where: {
            activeGameId: gameId
        },
        data: {
            gameNoForSheets: gameNoForSheets + 1
        }
    });

    console.log(response);

    return res.status(200).send('Data Moved To Spreadsheet');
}

exports.givePointsToPlayer = async (req, res) => {
    try {
        const playerID = req.body.playerID;
        const points = req.body.points

        if (!playerID) {
            return res.status(400).json({ error: 'Player ID is required' });
        }

        await prisma.user.update({
            where: { id: playerID },
            data: {
                points: {
                    increment: points,
                },
            },
        });

        return res.send('Points added successfully');
    } catch (error) {
        return res.status(500).json({ error: 'Error adding points' });
    }
}

exports.filterPlayers = async (req, res) => {
    try {

        const number = parseInt(req.body.number, 10);

        if(!number) {
            return res.status(400).json({ error: 'Number is required' });
        }

        const topPlayers = await prisma.user.findMany({
            orderBy: {
                points: 'desc',
            },
            take: number,
            select: {
                id: true,
            },
        });

        // Step 2: Extract top user IDs
        const topPlayerIds = topPlayers.map(player => player.id);

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

        return res.status(200).send(`Users deleted successfully keeping only top ${number} players`);
    } catch (error) {
        console.error('Error deleting users:', error);
        return res.status(500).json({ error: 'Error filtering users' });
    }
}

exports.pairPlayers = async (req, res) => {
    try {
        // Get the top 150 players sorted by points in descending order, then by id in ascending order
        const players = await prisma.user.findMany({})

        // Step 2: Sort these top 4 players by their IDs in ascending order
        players.sort((a, b) => a.id - b.id);

        // Pair players and update partnerId
        for (let i = 0; i < players.length; i += 2) {
            const currentPlayer = players[i];
            const nextPlayer = players[i + 1];

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
