const { broadcast } = require("../controllers/ws-functions");
const { calculatePoints } = require('../services/calculatePoints');

let globalClock;

function startClock(duration, gameId, roundNumber) {
  let remainingTime = duration;

  globalClock = setInterval(() => {
    remainingTime -= 1;
    if (remainingTime <= 0) {
      clearInterval(globalClock);
      // Notify clients that the round has ended
      broadcast(JSON.stringify({ type: 'round-end', roundNumber }));

      calculatePoints(gameId, roundNumber);

      broadcast(JSON.stringify({ type: 'notice', message: "Points Calculated" }));
    } else {
      // Broadcast the remaining time to clients
      broadcast(JSON.stringify({ type: 'tick', remainingTime }));
    }
  }, 1000); // Update every second
}

function resetClock(duration, gameId, roundNumber) {
  clearInterval(globalClock);
  startClock(duration, gameId, roundNumber);
  broadcast(JSON.stringify({ type: 'round-start', roundNumber }));
}

function getGlobalClock() {
  return globalClock
}

module.exports = { startClock, resetClock, getGlobalClock };    
