
const router = require('express').Router();
const service = require('./relatorio-contrato-service');

router.route('/tabela').get(service.tabela);
router.route('/:ano/:mes/:idContrato').get(service.buscar);

module.exports = router;