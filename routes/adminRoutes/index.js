const express = require('express');
const router = express.Router();

const adminController = require('../../controllers/adminController');

// Admins dont have a register endpoint for secutiry reasons,
// so we will manually insert them into the db

router.post('/broadcast', adminController.adminBroadcast);
router.post('/broadcast-to-game', adminController.adminBroadcastToGame);

router.get('/dashboard', adminController.getDashboard);
router.get('/fetch-google-spreadsheet', adminController.fetchGoogleSpreadsheet);
router.post('/send-to-google-spreadsheet', adminController.sendToGoogleSpreadsheet);
router.get('/get-all-players', adminController.getAllPlayers);
router.put('/give-points-to-player', adminController.givePointsToPlayer)
router.delete('/filter-players', adminController.filterPlayers);
router.post('/pair-players', adminController.pairPlayers);
router.post('/create-new-game', adminController.createNewGame);
router.post('/start-game', adminController.startGame);
router.post('/end-game', adminController.endGame);
router.post('/reset-clock', adminController.resetClock);
router.get('/game-stats', adminController.getGameStats);

router.delete('/delete-all-data', adminController.deleteAllData);
router.post('/truncate-tables', adminController.truncateTables);

module.exports = router;
