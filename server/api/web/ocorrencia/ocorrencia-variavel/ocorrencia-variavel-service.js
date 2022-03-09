const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./ocorrencia-variavel-dao');
const dao = new Dao();

exports.combo = combo;

async function combo(req, res) {

    const flagApenasMonitoramento = req.params.flagApenasMonitoramento || false;
    const combo = await dao.combo(flagApenasMonitoramento);
    await ctrl.gerarRetornoOk(res, combo || []);
    
}