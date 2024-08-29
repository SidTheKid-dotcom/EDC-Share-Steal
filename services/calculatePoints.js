const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { getClientById } = require('../game-state/clients');
const { broadcastToOne } = require('../controllers/ws-functions');

exports.calculatePoints = async (gameId, roundNumber) => {
    const moves = await prisma.move.findMany({});
    const processedPairs = new Set();

    for (const move of moves) {
        if (move.gameId === gameId && move.roundNo === roundNumber) {
            const player = await prisma.user.findFirst({
                where: { id: move.playerId }
            });
            const playerMove = move.move.toUpperCase();
            const partnerId = player.partnerId;

            // Create a unique key for the pair to avoid duplicate processing
            const pairKey = [player.id, partnerId].sort().join('-');

            // Check if this pair has already been processed
            if (!processedPairs.has(pairKey)) {
                const partnerMoveRow = await prisma.move.findFirst({
                    where: { gameId: gameId, roundNo: roundNumber, playerId: partnerId }
                });

                const partnerMove = partnerMoveRow.move.toUpperCase();

                console.log("Player: " + player.id + " Move: " + playerMove + " Partner: " + partnerId + " Move: " + partnerMove);

                if (playerMove === partnerMove && playerMove === "SHARE") {
                    await updateBothPlayerPoints(player.id, partnerId, 50);

                    const client = getClientById(player.id);
                    if (client) {
                        broadcastToOne(`Message for player ${player.id} Both Choose Share`, client);
                    }

                    const partnerClient = getClientById(partnerId);
                    if (partnerClient) {
                        broadcastToOne(`Message for player ${partnerId} Both Choose Share`, partnerClient);
                    }

                } else if (playerMove === "SHARE" && partnerMove === "STEAL") {
                    await updateSinglePlayerPoints(partnerId, 100);

                    const client = getClientById(player.id);
                    if (client) {
                        broadcastToOne(`Message for player ${player.id} Opponent chose Steal`, client);
                    }

                    const partnerClient = getClientById(partnerId);
                    if (partnerClient) {
                        broadcastToOne(`Message for player ${partnerId} Opponent Choose Share`, partnerClient);
                    }

                } else if (playerMove === "STEAL" && partnerMove === "SHARE") {
                    await updateSinglePlayerPoints(player.id, 100);

                    const client = getClientById(player.id);
                    if (client) {
                        broadcastToOne(`Message for player ${player.id} Opponent chose Share`, client);
                    }

                    const partnerClient = getClientById(partnerId);
                    if (partnerClient) {
                        broadcastToOne(`Message for player ${partnerId} Opponent chose Steal`, partnerClient);
                    }

                } else if (playerMove === "STEAL" && partnerMove === "STEAL") {
                    //await updateSinglePlayerPoints(player.id, -10);

                    const client = getClientById(player.id);
                    if (client) {
                        broadcastToOne(`Message for player ${player.id} Opponent chose Steal`, client);
                    }

                    const partnerClient = getClientById(partnerId);
                    if (partnerClient) {
                        broadcastToOne(`Message for player ${partnerId} Opponent chose Steal`, partnerClient);
                    }

                }

                // Mark this pair as processed
                processedPairs.add(pairKey);
            }
        }
    }

    // At the start of a new round, clear the set
    processedPairs.clear();
}

const updateBothPlayerPoints = async (
    firstPlayerId,
    secondPlayerId,
    pointsToAdd
) => {
    await prisma.$transaction([
        prisma.user.update({
            where: {
                id: firstPlayerId
            },
            data: {
                points: {
                    increment: pointsToAdd
                }
            }
        }),
        prisma.user.update({
            where: {
                id: secondPlayerId
            },
            data: {
                points: {
                    increment: pointsToAdd
                }
            }
        })
    ]);
};

const updateSinglePlayerPoints = async (
    playerId,
    pointsToAdd
) => {
    await prisma.user.update({
        where: {
            id: playerId
        },
        data: {
            points: {
                increment: pointsToAdd
            }
        }
    });
}