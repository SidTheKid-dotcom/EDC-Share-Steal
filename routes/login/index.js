const express = require('express');
const router = express.Router();

const loginController = require('../../controllers/loginController');

router.post('/admin', loginController.adminLogin);
router.post('/oc', loginController.ocLogin);

module.exports = router;