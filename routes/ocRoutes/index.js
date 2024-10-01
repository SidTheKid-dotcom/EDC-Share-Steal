const express = require('express');
const router = express.Router();

const ocController = require('../../controllers/ocController');

// Admins dont have a register endpoint for secutiry reasons,
// so we will manually insert them into the db

router.get('/get-all-players', ocController.getAllPlayers);
router.put('/give-points-to-player', ocController.givePointsToPlayer)

module.exports = router;
