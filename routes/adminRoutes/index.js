const express = require('express');
const router = express.Router();

const adminController = require('../../controllers/adminController');
const adminAuth = require('../../middleware/adminAuth');

router.get('/dashboard', adminAuth, adminController.getDashboard);
router.post('/pair-players', adminAuth, adminController.pairPlayers);
router.post('/create-new-game', adminAuth, adminController.createNewGame);
router.post('/start-game', adminAuth, adminController.startGame);
router.post('/end-game', adminAuth, adminController.endGame);
router.post('/reset-clock', adminAuth, adminController.resetClock);
router.get('/game-stats', adminAuth, adminController.getGameStats);

module.exports = router;
