
const router = require('express').Router();
const service = require('./usuario-service');

router.route('/tabela').get(service.tabela);
router.route('/menu').get(service.menu);
router.route('/:id').get(service.buscar);
router.route('/alterar-senha').post(service.alterarSenha);
router.route('/').post(service.inserir);
router.route('/:id').patch(service.atualizar);
router.route('/:id').delete(service.remover);

module.exports = router;