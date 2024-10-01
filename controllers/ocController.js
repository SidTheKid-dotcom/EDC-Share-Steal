const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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