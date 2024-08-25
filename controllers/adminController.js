const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { startClock, resetClock } = require('../game-state/clock');

exports.getDashboard = async (req, res) => {
    // Logic to get and display the admin dashboard

    const allGames = await prisma.game.findMany();

    res.json({
        message: 'Admin Dashboard',
        games: allGames
    });
};

exports.createNewGame = async (req, res) => {
    // Logic to create a new game
    res.send('New game created');
    const newGame = await prisma.game.create({});

    res.send(newGame);
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

    res.send(startedGame);
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

    res.send(endedGame);
};

exports.resetClock = (req, res) => {
    // Logic to reset the game clock
    const duration = req.body.duration || 30;
    const gameId = req.body.gameId;
    const roundNumber = req.body.roundNumber;

    // Default to 30 seconds if not provided
    resetClock(duration, gameId, roundNumber);

    res.send(`Clock reset for round ${roundNumber}`);
};

exports.getGameStats = (req, res) => {
    // Logic to retrieve game stats
    res.json({ stats: "Game statistics data" });
};
