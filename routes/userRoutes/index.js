const express = require('express');
const router = express.Router();

const userHTTPController = require('../../controllers/userController/userHTTPController');
//const userAuth = require('../../middleware/userAuth');

router.post('/connect-to-game', userHTTPController.connectToGame);

module.exports = router;
