const express = require('express');
const router = express.Router();

const adminController = require('../../controllers/adminController');
const adminAuth = require('../../middleware/adminAuth');


router.post('/broadcast', adminAuth, adminController.adminBroadcast);
router.post('/broadcast-to-game', adminAuth, adminController.adminBroadcastToGame);

router.get('/dashboard', adminAuth, adminController.getDashboard);
router.get('/fetch-google-spreadsheet', adminController.fetchGoogleSpreadsheet);
router.put('/give-points-to-player', adminAuth, adminController.givePointsToPlayer)
router.post('/pair-players', adminAuth, adminController.pairPlayers);
router.post('/create-new-game', adminAuth, adminController.createNewGame);
router.post('/start-game', adminAuth, adminController.startGame);
router.post('/end-game', adminAuth, adminController.endGame);
router.post('/reset-clock', adminAuth, adminController.resetClock);
router.get('/game-stats', adminAuth, adminController.getGameStats);

module.exports = router;
