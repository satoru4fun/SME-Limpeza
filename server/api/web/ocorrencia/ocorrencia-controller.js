
const router = require('express').Router();
const service = require('./ocorrencia-service');

router.route('/tabela').get(service.tabela);
router.route('/reincidencia-por-prestador').get(service.reincidenciaPorPrestador);
router.route('/:id').get(service.buscar);
router.route('/').post(service.inserir);
router.route('/encerrar/:id').patch(service.encerrar);

module.exports = router;