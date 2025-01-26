const pool = require('../db/index');

// 发布空投
module.exports.merkleTree = async (req, res) => {
  try {
    const { merkleRoot, proofs, leaves, addresses, startTokenId } = req.body;

    if (!merkleRoot || !proofs || !leaves || !addresses || startTokenId === undefined) {
      return res.status(400).json({ message: "缺少必要的参数！" });
    }

    // 遍历并存储每个地址的相关数据
    const insertPromises = addresses.map((address, index) => {
      const tokenId = startTokenId + index;
      const leafHash = leaves[index];
      const proof = JSON.stringify(proofs[`${address}-${tokenId}`]); // 根据地址和 tokenId 获取对应的证明

      // 插入数据库
      const sql = `
        INSERT INTO merkle_tree (merkle_root, address, token_id, leaf_hash, proof)
        VALUES (?, ?, ?, ?, ?);
      `;
      return pool.execute(sql, [merkleRoot, address, tokenId, leafHash, proof]);
    });

    // 等待所有插入操作完成
    await Promise.all(insertPromises);

    res.status(200).json({ message: "Merkle Tree 数据已成功存储到数据库！" });
  } catch (error) {
    console.error("存储 Merkle Tree 数据时发生错误：", error);
    res.status(500).json({ message: "存储 Merkle Tree 数据失败！" });
  }
};

// 验证空投
module.exports.verify = async (req, res) => {
  const { address } = req.body;

  const sql = `
    SELECT token_id, proof 
    FROM merkle_tree
    WHERE address = ? AND is_claimed = FALSE; -- 查询未领取的记录
  `;

  pool.query(sql, [address], (err, results) => {
    if (err) {
      console.error("查询 Merkle Tree 失败：", err);
      return res.status(500).json({ message: "查询 Merkle Tree 失败！" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "未找到匹配的记录或空投已被领取！" });
    }

    // 直接返回 proof 和 token_id
    res.status(200).json({
      message: "查询成功！",
      tokenId: results[0].token_id,
      proof: results[0].proof, // 直接返回数据库中已经是数组的 proof
    });
  });
};

// 领取空投
module.exports.claim = async (req, res) => {
  const { tokenId, address } = req.body;

  const sql = `
    UPDATE merkle_tree
    SET is_claimed = TRUE
    WHERE token_id = ? AND address = ?;
  `;

  pool.query(sql, [tokenId, address], (err, result) => {
    if (err) {
      console.error("领取空投失败：", err);
      return res.status(500).json({ message: "领取空投失败！" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "未找到匹配的记录或空投已被领取！" });
    }

    res.status(200).json({ message: "空投已被领取！" });
  });
};