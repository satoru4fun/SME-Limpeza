const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./ocorrencia-mensagem-dao');
const dao = new Dao();

exports.buscarPorOcorrencia = buscarPorOcorrencia;
exports.inserir = inserir;

async function buscarPorOcorrencia(req, res) {
    const mensagemList = await dao.buscarPorOcorrencia(req.params.idOcorrencia);
    await ctrl.gerarRetornoOk(res, mensagemList || []);
}

async function inserir(req, res) {
    
    const { idOcorrencia, mensagem } = req.body;
    const idUsuario = req.userData.idUsuario;
    const dataHora = new Date();

    await dao.inserir(parseInt(idOcorrencia), idUsuario, mensagem, dataHora);
    await ctrl.gerarRetornoOk(res);

}