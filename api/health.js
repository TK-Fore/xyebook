// 健康检查 - Vercel Serverless Function
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

module.exports = serverless(app);
