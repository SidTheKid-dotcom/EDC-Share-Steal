const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Track connected clients
let { addClient, removeClient, getClients } = require('../../game-state/clients');
const { getGlobalClock } = require('../../game-state/clock');

const userSocketController = async (socket, request) => {

    const playerId = request.headers['playerid'];

    if (!playerId) {
        socket.send('Player ID is missing');
        return;
    }

    const player = await prisma.user.findUnique({
        where: { id: parseInt(playerId) },
    });

    if (!player.activeGameId) {
        socket.send('Player is not in a game');
        socket.close();
        return;
    }

    console.log('Plyaer ID: while connecting ', playerId);
    addClient(socket, playerId, player.activeGameId);

    socket.on('close', () => {
        removeClient(socket);
    });

    socket.on('message', async message => {
        try {
            const data = JSON.parse(message);

            const globalClock = getGlobalClock(player.activeGameId);
            if (!globalClock) {
                socket.send('Round is not active');
                return;
            }

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
    const { gameId, userId, move } = data;

    try {
        // Start a transaction
        const result = await prisma.$transaction(async (prisma) => {

            const [game, user] = await Promise.all([
                prisma.game.findUnique({
                    where: { gameId },
                    select: { status: true, roundNo: true }
                }),
                prisma.user.findUnique({
                    where: { id: userId },
                    select: { partnerId: true }
                })
            ]);

            // Check if game is active
            if (!game || game.status !== 'ACTIVE') {
                console.log('Game not found or is not active');
                throw new Error('Game not found or is not active');
            }

            // Check if user exists and has a partner
            if (!user || user.partnerId === null) {
                console.log('User not found or partner not found');
                throw new Error('User not found or partner not found');
            }

            // Fetch existing moves after game is confirmed to be active
            const existingMove = await prisma.move.findMany({
                where: {
                    gameId,
                    playerId: userId,
                    roundNo: parseInt(game.roundNo, 10) // Ensure roundNo is treated as an integer
                }
            });

            // Check if move already exists for this round
            if (existingMove && existingMove.length > 0) {
                console.log('Move already exists');
                throw new Error('Move already exists');
            }

            // Create new move
            const newMove = await prisma.move.create({
                data: {
                    gameId,
                    playerId: parseInt(userId, 10),
                    move,
                    roundNo: parseInt(game.roundNo, 10),
                    timestamp: new Date(),
                }
            });

            return newMove;
        });

        console.log(result);
        socket.send("newMove", result);
    } catch (error) {
        console.error('Error handling submit answer:', error);
        socket.send('error', error.message || 'An error occurred while processing the move');
    }
}

module.exports = userSocketController;