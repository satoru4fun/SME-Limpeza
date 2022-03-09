const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./ocorrencia-tipo-dao');
const dao = new Dao();

exports.combo = combo;
exports.comboCadastro = comboCadastro;

async function combo(req, res) {
    const combo = await dao.combo(false);
    await ctrl.gerarRetornoOk(res, combo || []);
}

async function comboCadastro(req, res) {
    const combo = await dao.combo(true);
    await ctrl.gerarRetornoOk(res, combo || []);
}