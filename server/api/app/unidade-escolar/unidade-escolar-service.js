
const ctrl = require('rfr')('core/controller');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./unidade-escolar-dao');
const dao = new Dao();

exports.combo = combo;

async function combo(req, res) {

    const combo = await dao.comboPorPrestadorServico(req.idPrestadorServico);
    await ctrl.gerarRetornoOk(res, combo || []);

}