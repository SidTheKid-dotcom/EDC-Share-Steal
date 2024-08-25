const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.calculatePoints = async (gameId, roundNumber) => {
    const moves = await prisma.move.findMany({});
    for (const move of moves) {
        if (move.gameId === gameId && move.roundNo === roundNumber) {
            const player = await prisma.user.findFirst({
                where: {
                    id: move.playerId
                }
            });
            const playerMove = move.move.toUpperCase();
            const partnerId = player.partnerId;

            const partnerMoveRow = await prisma.move.findFirst({
                where: {
                    gameId: gameId,
                    roundNo: roundNumber,
                    playerId: partnerId
                }
            });

            const partnerMove = partnerMoveRow.move.toUpperCase();

            if (playerMove === partnerMove && playerMove === "SHARE") {
                await updateBothPlayerPoints(player.id, partnerId, 50);
            }
            else if (playerMove === "SHARE" && partnerMove === "STEAL") {
                await updateSinglePlayerPoints(partnerId, 100);
            }
            else if (playerMove === "STEAL" && partnerMove === "SHARE") {
                await updateSinglePlayerPoints(player.id, 100);
            }
        }
    }
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