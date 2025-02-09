const AlgorithmicService = require("../services/algorithmic.service");

class AlgorithmicController {

    async fileUpload(req, res) {
        const { tableData } = req.body;
        if (tableData) {
            const tableDataObj = AlgorithmicService.getProductNames(tableData, null);
            const data = await AlgorithmicService.fileUpload(tableDataObj);
            if (data) {
                res.status(data.status).send(data.msg);
            } else res.status(500).send({ err: 'Что то пошло не так' });
        }
        else res.status(500).send({ err: 'Что то пошло не так' });

    }

    async addToMainTable(req, res) {
        const { cash, products } = req.body;
        const data = await AlgorithmicService.addToMainTable(cash, products);
        if (data) {
            res.status(data.status).send(data.msg);
        } else res.status(500).send({ err: 'Что то пошло не так' });
    }
}

module.exports = new AlgorithmicController();