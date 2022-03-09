const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./plano-trabalho-unidade-escolar-dao');
const dao = new Dao();

exports.buscar = buscar;
exports.tabela = tabela;
exports.inserir = inserir;
exports.atualizar = atualizar;
exports.remover = remover;

async function buscar(req, res) {

    if(!req.params.id) {
        await ctrl.gerarRetornoErro(res);
    }

    const planoTrabalho = await dao.buscar(req.params.id);

    if(planoTrabalho.idUnidadeEscolar != req.userData.idOrigemDetalhe) {
        return await ctrl.gerarRetornoErro(res);
    }

    await ctrl.gerarRetornoOk(res, planoTrabalho);

}

async function tabela(req, res) {

    const params = await utils.getDatatableParams(req);
    const tabela = await dao.datatable(req.userData.idOrigemDetalhe, params.filters.idPeriodicidade, params.filters.idAmbienteUnidadeEscolar, params.filters.idTipoAmbiente, params.length, params.start);
    await ctrl.gerarRetornoDatatable(res, tabela);

}

async function inserir(req, res) {

    const { idAmbienteGeral, idAmbienteUnidadeEscolarList, idPeriodicidade, idTurno, descricao } = req.body;
    let { dataInicial, diaSemana } = req.body;

    if(!idAmbienteGeral, !idAmbienteUnidadeEscolarList || !idPeriodicidade || !idTurno || !descricao) {
        return await ctrl.gerarRetornoErro(res);
    }

    if(idAmbienteUnidadeEscolarList.length == 0) {
        return await ctrl.gerarRetornoErro(res);
    }

    if(idPeriodicidade == 1) {
        dataInicial = null;
        diaSemana = null;
    } else if(idPeriodicidade == 2 || idPeriodicidade == 3) {
        dataInicial = null;
    } else if(idPeriodicidade == 4) {
        diaSemana = null;
    }

    const _transaction = await ctrl.iniciarTransaction();

    try {

        for(let idAmbienteUnidadeEscolar of idAmbienteUnidadeEscolarList) {
            await dao.insert(_transaction, req.userData.idOrigemDetalhe, idAmbienteUnidadeEscolar, idPeriodicidade, idTurno, descricao, diaSemana, dataInicial);
        }

        await ctrl.finalizarTransaction(true, _transaction);
        await ctrl.gerarRetornoOk(res);

    } catch(error) {
        console.log(error);
        await ctrl.finalizarTransaction(false, _transaction);
        await ctrl.gerarRetornoErro(res);
    }
    
}

async function atualizar(req, res) {

    if(req.params.id != req.body.idPlanoTrabalhoUnidadeEscolar) {
        return await ctrl.gerarRetornoErro(res);
    }

    const { idAmbienteGeral, idAmbienteUnidadeEscolar, idPeriodicidade, idTurno, descricao } = req.body;
    let { dataInicial, diaSemana } = req.body;

    if(!idAmbienteGeral, !idAmbienteUnidadeEscolar || !idPeriodicidade || !idTurno || !descricao) {
        return await ctrl.gerarRetornoErro(res);
    }

    if(idPeriodicidade == 1) {
        dataInicial = null;
        diaSemana = null;
    } else if(idPeriodicidade == 2 || idPeriodicidade == 3) {
        dataInicial = null;
    } else if(idPeriodicidade == 4) {
        diaSemana = null;
    }

    try {
        await dao.atualizar(req.params.id, req.userData.idOrigemDetalhe, idAmbienteUnidadeEscolar, idPeriodicidade, idTurno, descricao, diaSemana, dataInicial);
        await ctrl.gerarRetornoOk(res);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }

}

async function remover(req, res) {

    try {
        await dao.remover(req.params.id, req.userData.idOrigemDetalhe);
        await ctrl.gerarRetornoOk(res);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }

}