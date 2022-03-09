
const router = require('express').Router();
const service = require('./ocorrencia-tipo-service');

router.route('/combo/').get(service.combo);
router.route('/combo-cadastro/').get(service.comboCadastro);

module.exports = router;