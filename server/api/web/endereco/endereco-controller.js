const router = require('express').Router();
const service = require('./endereco-service');

router.route('/cep/:cep').get(service.buscarPorCep);
router.route('/coordenadas/:endereco').get(service.buscarCoordenadas);

module.exports = router;