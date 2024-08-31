const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { broadcastToOne } = require('../ws-functions');
const { getClientById, removeClient } = require('../../game-state/clients');

exports.fetchGames = async (req, res) => {

    const allGames = await prisma.game.findMany({
        where: {
            status: 'ACTIVE',
        },
        orderBy: {
            startTime: 'desc',
        },
    });

    res.json({
        message: 'All Games',
        games: allGames
    });

}

exports.connectToGame = async (req, res) => {

    const { gameId, playerId } = req.body;

    if (!gameId || !playerId) {
        return res.status(400).json({ error: 'Game ID or player ID is missing' });
    }

    const game = await prisma.game.findUnique({
        where: { gameId: parseInt(gameId, 10) },
    });

    if (game.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Game is not active' });
    }

    await prisma.user.update({
        where: { id: parseInt(playerId, 10) },
        data: {
            activeGameId: parseInt(gameId, 10)
        }
    });

    return res.status(200).send('Game connection ready, send webscoket connection');

};

exports.disconnectFromGame = async (req, res) => {
    const { playerId } = req.body;

    const client = getClientById(playerId);
    if (client) {
        broadcastToOne('Game disconnected', playerId);
        client.close();
        removeClient(client);
    }

    if (!playerId) {
        return res.status(400).json({ error: 'Player ID is missing' });
    }
    await prisma.user.update({
        where: { id: parseInt(playerId, 10) },
        data: {
            activeGameId: null
        }
    });

    return res.status(200).send('Game disconnected');
}
