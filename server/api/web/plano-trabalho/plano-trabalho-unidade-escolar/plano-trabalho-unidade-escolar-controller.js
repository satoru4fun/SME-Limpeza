
const router = require('express').Router();
const service = require('./plano-trabalho-unidade-escolar-service');

router.route('/tabela').get(service.tabela);
router.route('/:id').get(service.buscar);
router.route('/').post(service.inserir);
router.route('/:id').patch(service.atualizar);
router.route('/:id').delete(service.remover);

module.exports = router;