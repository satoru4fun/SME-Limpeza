
const router = require('express').Router();
const service = require('./ambiente-unidade-escolar-service');

router.route('/tabela').get(service.tabela);
router.route('/combo/:idUnidadeEscolar').get(service.combo);
router.route('/combo/:idUnidadeEscolar/ambiente-geral/:idAmbienteGeral').get(service.comboPorAmbienteGeral);
router.route('/combo').get(service.combo);
router.route('/qrcode/:id').get(service.qrcode);
router.route('/todos-qrcode').get(service.gerarTodosQRCode);
router.route('/:id').get(service.buscar);
router.route('/').post(service.inserir);
router.route('/:id').patch(service.atualizar);
router.route('/:id').delete(service.remover);

module.exports = router;