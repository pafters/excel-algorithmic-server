const Router = require('express');
const AlgorithmicController = require('../controllers/algorithmic.controller');
const router = new Router();

router.post('/upload-file', AlgorithmicController.fileUpload);

router.post('/add-to-main-table', AlgorithmicController.addToMainTable)

module.exports = router;