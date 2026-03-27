const express = require('express');
const apiUserRoutes = require('./ApiUserController');

const router = express.Router();

router.use('/users', apiUserRoutes);

module.exports = router;
