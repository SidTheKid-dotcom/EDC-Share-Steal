const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Track connected clients
let { addClient, removeClient, getClients } = require('../game-state/clients');
const { getGlobalClock } = require('../game-state/clock');

const userController = (socket) => {

    addClient(socket);
    socket.on('close', () => {
        removeClient(socket);
    });

    socket.on('message', message => {
        try {
            const data = JSON.parse(message);

            const globalClock = getGlobalClock();
            if (!globalClock) {
                socket.send('Round is not active');
                return;
            }

            console.log('Received message:', data);

            switch (data.type) {
                case 'submit':
                    handleSubmitAnswer(data, socket);
                    break;
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
}

async function handleSubmitAnswer(data, socket) {

    const gameId = data.gameId;
    const userId = data.userId;
    const move = data.move;

    const existingGame = await prisma.game.findUnique({
        where: {
            gameId: gameId
        }
    });
    if (!existingGame) {
        console.log('Game not found');
        return;
    }

    if (existingGame.status !== 'ACTIVE') {
        console.log('Game is not active');
        return;
    }

    const existingMove = await prisma.move.findFirst({
        where: {
            gameId: gameId,
            playerId: userId
        }
    });

    if (existingMove) {
        console.log('Move already exists');
        return;
    }

    const game = await prisma.game.findUnique({
        where: {
            gameId: gameId
        }
    });
    const roundNo = game.roundNo;

    const newMove = await prisma.move.create({
        data: {
            gameId: gameId,
            playerId: userId,
            move: move,
            roundNo: roundNo,
            timestamp: new Date(),
        }
    });

    socket.send("newMove", newMove);
}

module.exports = userController;