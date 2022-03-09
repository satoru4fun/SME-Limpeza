
const router = require('express').Router();
const service = require('./ocorrencia-mensagem-service');

router.route('/buscar-por-ocorrencia/:idOcorrencia').get(service.buscarPorOcorrencia);
router.route('/').post(service.inserir);

module.exports = router;