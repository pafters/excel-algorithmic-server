const Router = require('express');
const router = new Router();

const AlgorithmicRouter = require('./algorithmic.router');

router.use('/files', AlgorithmicRouter);

module.exports = router;