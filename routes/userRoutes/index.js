const express = require('express');
const router = express.Router();

const userHTTPController = require('../../controllers/userController/userHTTPController');
//const userAuth = require('../../middleware/userAuth');

router.post('/connect-to-game', userHTTPController.connectToGame);
router.post('/disconnect-from-game', userHTTPController.disconnectFromGame);

module.exports = router;
