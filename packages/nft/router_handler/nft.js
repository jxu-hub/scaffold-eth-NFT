const pool = require('../db/index');

// 铸造NFT
module.exports.mintNft = (req, res) => {
    const { tokenId, category, address, cid, is_listing, is_rented } = req.body;
    const price = 0;
    const sql = `INSERT INTO nfts (token_id, category, address, cid, is_listing, is_rented, price) VALUES (?,?,?,?,?,?,?)`;
    pool.query(sql, [tokenId, category, address, cid, is_listing, is_rented, price], (err, result) => {
        if (err) {
            console.error('Failed to mint NFT', err);
            return res.status(500).json({ error: 'Failed to mint NFT' });
        }

        res.status(200).json({ message: 'NFT mint successfully', result: result });
    });
}

// 上架NFT
module.exports.listNft = (req, res) => {
    const { tokenId, price } = req.body;
    const sql = `UPDATE nfts SET is_listing = 1, price = ? WHERE token_id = ?`;
    pool.query(sql, [price, tokenId], (err, result) => {
        if (err) {
            console.error('Failed to list NFT', err);
            return res.status(500).json({ error: 'Failed to list NFT' });
        }

        res.status(200).json({ message: 'NFT listed successfully', result: result });
    });
}

// 下架NFT
 module.exports.unlistNft = (req, res) => {
    const { tokenId } = req.body;
    const sql = `UPDATE nfts SET is_listing = 0 WHERE token_id = ?`;
    pool.query(sql, [tokenId], (err, result) => {
        if (err) {
            console.error('Failed to unlist NFT', err);
            return res.status(500).json({ error: 'Failed to unlist NFT' });
        }

        res.status(200).json({ message: 'NFT unlisted successfully', result: result });
    });
}

// 举报NFT
 module.exports.reportNft = (req, res) => {
    const { tokenId, userAddress, report } = req.body;
    console.log("req.body = ", req.body);
    const reasonsArray = report.reasons || [];
    const customReason = report.customReason;
    let reason = reasonsArray.join(", ");
    if (customReason) {
        reason = reason ? `${reason} : ${customReason}` : customReason;
    }
    const sql = `INSERT INTO nft_reports (token_id, reporter_address, reason) VALUES (?,?,?)`;
    pool.query(sql, [tokenId, userAddress, reason], (err, result) => {
        if (err) {
            console.error('Failed to report NFT', err);
            return res.status(500).json({ error: 'Failed to report NFT' });
        }

        res.status(200).json({ message: 'NFT reported successfully', result: result });
    });
}

// 收藏NFT
 module.exports.likeNft = (req, res) => {
    const { tokenId, userAddress } = req.body;
    const sql = `INSERT INTO nft_favorites (token_id, user_address) VALUES (?,?)`;
    pool.query(sql, [tokenId, userAddress], (err, result) => {
        if (err) {
            console.error('Failed to favorite NFT', err);
            return res.status(500).json({ error: 'Failed to favorite NFT' });
        }

        res.status(200).json({ message: 'NFT favorited successfully', result: result });
    });
}

// 取消收藏NFT
 module.exports.unLikeNft = (req, res) => {
    const { tokenId, userAddress } = req.body;
    const sql = `DELETE FROM nft_favorites WHERE token_id = ? AND user_address = ?`;
    pool.query(sql, [tokenId, userAddress], (err, result) => {
        if (err) {
            console.error('Failed to unfavorite NFT', err);
            return res.status(500).json({ error: 'Failed to unfavorite NFT' });
        }

        res.status(200).json({ message: 'NFT unfavorited successfully', result: result });
    });
}

// 获取NFT被当前用户的收藏和举报状态
 module.exports.status = (req, res) => {
    const { tokenId, userAddress } = req.body;
    const favoriteSql = `SELECT COUNT(*) AS isFavorited FROM nft_favorites WHERE token_id = ? AND user_address = ?`;
    const reportSql = `SELECT COUNT(*) AS isReported FROM nft_reports WHERE token_id = ? AND reporter_address = ?`;

    // 查询收藏状态
    pool.query(favoriteSql, [tokenId, userAddress], (favoriteErr, favoriteResult) => {
        if (favoriteErr) {
            console.error('Failed to check favorite status', favoriteErr);
            return res.status(500).json({ error: 'Failed to check favorite status' });
        }

        // 查询举报状态
        pool.query(reportSql, [tokenId, userAddress], (reportErr, reportResult) => {
            if (reportErr) {
                console.error('Failed to check report status', reportErr);
                return res.status(500).json({ error: 'Failed to check report status' });
            }

            const isFavorited = favoriteResult[0].isFavorited > 0;
            const isReported = reportResult[0].isReported > 0;

            res.status(200).json({
                isFavorited,
                isReported,
            });
        });
    });
}