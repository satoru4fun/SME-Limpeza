
const router = require('express').Router();
const service = require('./relatorio-gerencial-service');

router.route('/tabela').get(service.tabela);
router.route('/:id').get(service.buscar);
router.route('/avaliar/:id').post(service.avaliar);
router.route('/consolidar/:id').post(service.consolidar);
router.route('/aprovar/:id').post(service.aprovar);

module.exports = router;