const { broadcast } = require("../controllers/ws-functions");

let globalClock;

function startClock(duration, roundNumber) {
  let remainingTime = duration;

  globalClock = setInterval(() => {
    remainingTime -= 1;
    if (remainingTime <= 0) {
      clearInterval(globalClock);
      // Notify clients that the round has ended
      broadcast(JSON.stringify({ type: 'round-end', roundNumber }));
      roundNumber += 1;
    } else {
      // Broadcast the remaining time to clients
      broadcast(JSON.stringify({ type: 'tick', remainingTime }));
    }
  }, 1000); // Update every second
}

function resetClock(duration, roundNumber) {
  clearInterval(globalClock);
  startClock(duration, roundNumber);
  broadcast(JSON.stringify({ type: 'round-start', roundNumber }));
}

module.exports = { startClock, resetClock };    
