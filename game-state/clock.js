const { games } = require("googleapis/build/src/apis/games");
const { broadcastToGame } = require("../controllers/ws-functions");
const { calculatePoints } = require('../services/calculatePoints');

let globalClocks = [];

function startClock(duration, gameId, roundNumber) {
  let remainingTime = duration;

  globalClocks[gameId] = setInterval(() => {
    remainingTime -= 1;
    if (remainingTime <= 0) {
      clearInterval(globalClocks[gameId]);
      // Notify clients that the round has ended
      broadcastToGame(JSON.stringify({ type: 'round-end', roundNumber }), gameId);
      
      console.log("calculate points");
      calculatePoints(gameId, roundNumber);

      broadcastToGame(JSON.stringify({ type: 'notice', message: "Points Calculated" }), gameId);
    } else {
      // Broadcast the remaining time to clients
      broadcastToGame(JSON.stringify({ type: 'tick', remainingTime }), gameId);
    }
  }, 1000); // Update every second
}

function resetClock(duration, gameId, roundNumber) {
  clearInterval(globalClocks[gameId]);
  startClock(duration, gameId, roundNumber);
  broadcastToGame(JSON.stringify({ type: 'round-start', roundNumber }), gameId);
}

function getAllGlobalClocks() {
  return globalClocks;
}

function getGlobalClock(gameId) {
  return globalClocks[gameId];
}

module.exports = { startClock, resetClock, getGlobalClock, getAllGlobalClocks };    
