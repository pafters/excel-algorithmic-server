const Router = require('express');
const router = new Router();

const AlgorithmicRouter = require('./algorithmic.router');

router.use('/algorithmic', AlgorithmicRouter);

module.exports = router;