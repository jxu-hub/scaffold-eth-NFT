const express = require('express');
const router = express.Router();

// 铸造NFT
const nft_handler = require('../router_handler/nft');
router.post('/mintNft', nft_handler.mintNft);

// 上架NFT
router.post('/listNft', nft_handler.listNft);

// 下架NFT
router.post('/unlistNft', nft_handler.unlistNft);

// 收藏NFT
router.post('/likeNft', nft_handler.likeNft);

// 取消收藏NFT
router.post('/unLikeNft', nft_handler.unLikeNft);

// 举报NFT
router.post('/reportNft', nft_handler.reportNft);

// 获取NFT被当前用户收藏和举报的状态
router.post('/status', nft_handler.status);

module.exports = router;