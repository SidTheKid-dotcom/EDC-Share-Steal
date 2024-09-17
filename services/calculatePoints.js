const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { getClientById } = require("../game-state/clients");
const { broadcastToOne } = require("../controllers/ws-functions");

exports.calculatePoints = async (gameId, roundNumber) => {
  const moves = await prisma.move.findMany({});
  const processedPairs = new Set();

  for (const move of moves) {
    if (move.gameId === gameId && move.roundNo === roundNumber) {
      const player = await prisma.user.findFirst({
        where: { id: move.playerId },
      });
      const playerMove = move.move.toUpperCase();
      const playerId = parseInt(player.id, 10);
      const partnerId = parseInt(player.partnerId, 10);

      // Create a unique key for the pair to avoid duplicate processing
      const pairKey = [playerId, partnerId].sort().join("-");

      // Check if this pair has already been processed
      if (!processedPairs.has(pairKey)) {
        const partnerMoveRow = await prisma.move.findFirst({
          where: { gameId: gameId, roundNo: roundNumber, playerId: partnerId },
        });

        const partnerMove = partnerMoveRow
          ? partnerMoveRow.move.toUpperCase()
          : null;

        if(!partnerMove) {
          console.log("Partner move not found for player: " + playerId);
          await updateSinglePlayerPoints(playerId, 50);
          await updateSinglePlayerPoints(partnerId, -50);

          
          processedPairs.add(pairKey);
          continue;
        }

        console.log(
          "Player: " +
          playerId +
          " Move: " +
          playerMove +
          " Partner: " +
          partnerId +
          " Move: " +
          partnerMove
        );

        if (playerMove === partnerMove && playerMove === "SHARE") {
          await updateBothPlayerPoints(playerId, partnerId, 50);

          const client = getClientById(playerId);
          if (client) {
            broadcastToOne(
              JSON.stringify({
                type: "display-round-points",
                message: `Message for player ${playerId} Both Choose Share`
              }),
              client
            );
          }

          const partnerClient = getClientById(partnerId);
          if (partnerClient) {
            broadcastToOne(
              JSON.stringify({
                type: "display-round-points",
                message: `Message for player ${partnerId} Both Choose Share`
              }),
              partnerClient
            );
          }
        } else if (playerMove === "SHARE" && partnerMove === "STEAL") {
          await updateSinglePlayerPoints(partnerId, 100);

          const client = getClientById(playerId);
          if (client) {
            broadcastToOne(
              JSON.stringify({
                type: "display-round-points",
                message: `Message for player ${playerId} Opponent Choose Steal`
              }),
              client
            );
          }

          const partnerClient = getClientById(partnerId);
          if (partnerClient) {
            broadcastToOne(
              JSON.stringify({
                type: "display-round-points",
                message: `Message for player ${partnerId} Opponent Choose Share`
              }),
              partnerClient
            );
          }
        } else if (playerMove === "STEAL" && partnerMove === "SHARE") {
          await updateSinglePlayerPoints(playerId, 100);

          const client = getClientById(playerId);
          if (client) {
            broadcastToOne(
              JSON.stringify({
                type: "display-round-points",
                message: `Message for player ${playerId} Opponent Choose Share`
              }),
              client
            );
          }

          const partnerClient = getClientById(partnerId);
          if (partnerClient) {
            broadcastToOne(
              JSON.stringify({
                type: "display-round-points",
                message: `Message for player ${partnerId} Opponent Choose Steal`
              }),
              partnerClient
            );
          }
        } else if (playerMove === "STEAL" && partnerMove === "STEAL") {
          await updateBothPlayerPoints(playerId, partnerId, -50);

          const client = getClientById(playerId);
          if (client) {
            broadcastToOne(
              JSON.stringify({
                type: "display-round-points",
                message: `Message for player ${playerId} Opponent Choose Steal`
              }),
              client
            );
          }

          const partnerClient = getClientById(partnerId);
          if (partnerClient) {
            broadcastToOne(
              JSON.stringify({
                type: "display-round-points",
                message: `Message for player ${partnerId} Opponent Choose Steal`
              }),
              partnerClient
            );
          }
        }

        // Mark this pair as processed
        processedPairs.add(pairKey);
      }
    }
  }

  // At the start of a new round, clear the set
  processedPairs.clear();
};

const updateBothPlayerPoints = async (
  firstPlayerId,
  secondPlayerId,
  pointsToAdd
) => {
  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: firstPlayerId,
      },
      data: {
        points: {
          increment: pointsToAdd,
        },
      },
    }),
    prisma.user.update({
      where: {
        id: secondPlayerId,
      },
      data: {
        points: {
          increment: pointsToAdd,
        },
      },
    }),
  ]);
};

const updateSinglePlayerPoints = async (playerId, pointsToAdd) => {
  await prisma.user.update({
    where: {
      id: playerId,
    },
    data: {
      points: {
        increment: pointsToAdd,
      },
    },
  });
};
