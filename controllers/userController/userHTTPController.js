const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const axios = require('axios')

const { broadcastToOne } = require('../ws-functions');
const { getClientById, removeClient } = require('../../game-state/clients');
const jwt = require('jsonwebtoken');

exports.fetchGames = async (req, res) => {

    try {
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
    catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({
            message: 'An error occurred while fetching games.',
        });
    }

}

exports.connectToGame = async (req, res) => {

    const { captchaToken, gameId, playerId, playerName } = req.body;

    if (!captchaToken) {
        return res.status(400).json({ message: "Captcha token is missing." });
    }

    if (!gameId || !playerId) {
        return res.status(400).json({ error: 'Game ID or player ID is missing' });
    }

    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_SERVER_CAPTCHA_KEY}&response=${captchaToken}`
        );

        const data = response.data;
        if (!data.success) {
            return res.status(400).json({ message: "Captcha verification failed." });
        }

        const game = await prisma.game.findUnique({
            where: { gameId: parseInt(gameId, 10) },
        });

        if (game.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Game is not active' });
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: parseInt(playerId, 10),
                name: playerName.toUpperCase()
            },
            data: {
                activeGameId: parseInt(gameId, 10)
            }
        });

        // Check if the update was successful
        if (!updatedUser) {
            return res.status(400).json({ error: 'User update failed. Invalid player ID or name.' });
        }

        const token = jwt.sign(
            {
                role: "PLAYER",
                gameId: parseInt(gameId, 10),
                playerId: parseInt(playerId, 10),
            },
            process.env.JWT_SECRET_PLAYER,
            { expiresIn: '1h' }
        );

        // Store token in a cookie, setting its expiration to match the JWT's expiration time
        /* res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            domain: 'localhost',  // Or the appropriate domain
            sameSite: 'none',
            maxAge: 1 * 60 * 60 * 1000, // 1 hour
        }); */

        return res.status(200).json({
            message: 'Game connection ready, send webscoket connection',
            token: token
        });

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Wrong player ID or Name' });
    }

};

/*************  ✨ Codeium Command ⭐  *************/
/**
 * Disconnect player from game
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @property {number} req.body.playerId - Player ID
 * @returns {Promise<void>}
 * @throws {Error} If player ID is missing or error occurs
 */
/******  10ad2b4f-0c08-44e8-a40f-575d48f7560a  *******/
exports.disconnectFromGame = async (req, res) => {
    const { playerId } = req.body;

    try {

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
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error disconnecting from game' });
    }
}
