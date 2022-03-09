
const router = require('express').Router();
const service = require('./contrato-service');

router.route('/tabela').get(service.tabela);
router.route('/vencimento-proximo/:quantidadeDias').get(service.buscarVencimentoProximo);
router.route('/:id').get(service.buscar);
router.route('/').post(service.inserir);
router.route('/:id').patch(service.atualizar);
router.route('/:id').delete(service.remover);

module.exports = router;