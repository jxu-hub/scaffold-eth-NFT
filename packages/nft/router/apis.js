const express = require('express');
const router = express.Router();

const apis_handler = require('../router_handler/apis');

// 发布空投
router.post('/merkleTree', apis_handler.merkleTree);

// 验证空投
router.post('/verify', apis_handler.verify);

// 领取空投
router.post('/claim', apis_handler.claim);

module.exports = router;