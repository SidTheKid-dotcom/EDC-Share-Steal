const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Track connected clients
let { addClient, removeClient, getClients } = require('../game-state/clients');
const { getGlobalClock } = require('../game-state/clock');

const userController = (socket, request) => {

    const playerId = request.headers['playerid'];
    console.log('Plyaer ID: while connecting ', playerId);
    addClient(socket, playerId);

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
    const { gameId, userId, move } = data;

    try {
        // Fetch game, user, and check for existing move in a single query
        const [game, user, existingMove] = await Promise.all([
            prisma.game.findUnique({
                where: { gameId },
                select: { status: true, roundNo: true }
            }),
            prisma.user.findUnique({
                where: { id: userId },
                select: { partnerId: true }
            }),
            prisma.move.findFirst({
                where: { gameId, playerId: userId }
            })
        ]);

        // Check if game is active
        if (!game || game.status !== 'ACTIVE') {
            console.log('Game not found or is not active');
            return;
        }

        // Check if user exists and has a partner
        if (!user || user.partnerId === null) {
            console.log('User not found or partner not found');
            return;
        }

        // Check if move already exists for this round
        if (existingMove && existingMove.roundNo === game.roundNo) {
            console.log('Move already exists');
            return;
        }

        // Create new move
        const newMove = await prisma.move.create({
            data: {
                gameId,
                playerId: userId,
                move,
                roundNo: game.roundNo,
                timestamp: new Date(),
            }
        });

        socket.send("newMove", newMove);
    } catch (error) {
        console.error('Error handling submit answer:', error);
        socket.send('error', 'An error occurred while processing the move');
    }
}

module.exports = userController;