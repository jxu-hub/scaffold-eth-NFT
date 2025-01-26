const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());

app.use(bodyParser.json());

// NFT 处理
const nftRouter = require('./router/nft');
app.use('/nft', nftRouter);

// 活动 API
const apis = require('./router/apis');
app.use('/api', apis);

app.listen(3001, () => {
    console.log('服务器运行在端口 3001');
});