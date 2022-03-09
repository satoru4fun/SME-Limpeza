const moment = require('moment');

const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./contrato-dao');
const DaoUnidadeEscolar = require('../unidade-escolar/unidade-escolar-dao');

const dao = new Dao();
const daoUnidadeEscolar = new DaoUnidadeEscolar();

exports.buscar = buscar;
exports.buscarVencimentoProximo = buscarVencimentoProximo;
exports.tabela = tabela;
exports.inserir = inserir;
exports.atualizar = atualizar;
exports.remover = remover;

async function buscar(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    let contrato = await dao.buscar(req.params.id);
    let novaListaUnidadeEscolar = [];

    for(let unidadeEscolar of contrato.unidadeEscolarLista) {
        let ue = await daoUnidadeEscolar.buscarDetalhe(unidadeEscolar.idUnidadeEscolar);
        ue.valor = unidadeEscolar.valor;
        ue.valorMetroQuadradoFinalSemana = unidadeEscolar.valorMetroQuadradoFinalSemana;
        novaListaUnidadeEscolar.push(ue);
    }

    contrato.unidadeEscolarLista = novaListaUnidadeEscolar;
    await ctrl.gerarRetornoOk(res, contrato);
    
}

async function buscarVencimentoProximo(req, res) {

    const contratos = await dao.buscarVencimentoProximo(180, moment());
    await ctrl.gerarRetornoOk(res, contratos);
    
}

async function tabela(req, res) {

    const params = await utils.getDatatableParams(req);
    const tabela = await dao.datatable(params.filters.codigo, params.filters.idPrestadorServico, params.length,params.start);
    await ctrl.gerarRetornoDatatable(res, tabela);

}

async function inserir(req, res) {

    const { descricao, codigo, dataInicial, dataFinal, nomeResponsavel, emailResponsavel, idPrestadorServico, valorTotal } = req.body;

    const unidadeEscolarLista = req.body.unidadeEscolarLista || [];

    const _transaction = await ctrl.iniciarTransaction();

    try {

        for(let unidadeEscolar of unidadeEscolarLista) {
            const ue = await daoUnidadeEscolar.findById(unidadeEscolar.id);
            if(ue.idContratoAtual) {
                await ctrl.finalizarTransaction(false, _transaction);
                return await ctrl.gerarRetornoErro(res, `A unidade escolar ${ue.descricao} já possui um contrato associado.`);
            }
        }

        const idContrato = await dao.insert(_transaction, descricao, codigo, dataInicial, dataFinal, nomeResponsavel, emailResponsavel, idPrestadorServico, valorTotal);

        for(let unidadeEscolar of unidadeEscolarLista) {
            await dao.insertDetalhe(_transaction, idContrato, unidadeEscolar.id, unidadeEscolar.valor, unidadeEscolar.valorMetroQuadradoFinalSemana);
            await daoUnidadeEscolar.setarIdContratoAtual(_transaction, idContrato, unidadeEscolar.id);
        }

        await ctrl.finalizarTransaction(true, _transaction);
        await ctrl.gerarRetornoOk(res);

    } catch(error) {
        console.log(error);
        await ctrl.finalizarTransaction(false, _transaction);
        return await ctrl.gerarRetornoErro(res);
    }
    
}

async function atualizar(req, res) {

    const { id, descricao, codigo, dataInicial, dataFinal, nomeResponsavel, emailResponsavel, idPrestadorServico, valorTotal } = req.body;

    if(req.params.id != id) {
        return await ctrl.gerarRetornoErro(res);
    }

    const unidadeEscolarLista = req.body.unidadeEscolarLista || [];

    const _transaction = await ctrl.iniciarTransaction();

    try {

        for(let unidadeEscolar of unidadeEscolarLista) {
            const ue = await daoUnidadeEscolar.findById(unidadeEscolar.id);
            if(ue.idContratoAtual && ue.idContratoAtual != id) {
                await ctrl.finalizarTransaction(false, _transaction);
                return await ctrl.gerarRetornoErro(res, `A unidade escolar ${ue.descricao} possui outro contrato associado.`);
            }
        }

        await dao.atualizar(_transaction, id, descricao, codigo, dataInicial, dataFinal, nomeResponsavel, emailResponsavel, idPrestadorServico, valorTotal);
        await dao.deleteDetalhe(_transaction, id);

        for(let unidadeEscolar of unidadeEscolarLista) {
            await dao.insertDetalhe(_transaction, id, unidadeEscolar.id, unidadeEscolar.valor, unidadeEscolar.valorMetroQuadradoFinalSemana);
            await daoUnidadeEscolar.setarIdContratoAtual(_transaction, id, unidadeEscolar.id);
        }

        await ctrl.finalizarTransaction(true, _transaction);
        await ctrl.gerarRetornoOk(res);

    } catch(error) {
        console.log(error);
        await ctrl.finalizarTransaction(false, _transaction);
        return await ctrl.gerarRetornoErro(res);
    }

}

async function remover(req, res) {

    const idContrato = req.params.id;

    if(!idContrato) {
        return await ctrl.gerarRetornoErro(res);
    }

    const _transaction = await ctrl.iniciarTransaction();

    try {

        const unidadeEscolarLista = dao.buscarDetalheContrato(idContrato);
        for(let unidadeEscolar of unidadeEscolarLista) {
            await daoUnidadeEscolar.setarIdContratoAtual(_transaction, null, unidadeEscolar.id);
        }

        await dao.remover(_transaction, idContrato);
        await ctrl.finalizarTransaction(true, _transaction);
        await ctrl.gerarRetornoOk(res, contrato);

    } catch(error) {
        console.log(error);
        await ctrl.finalizarTransaction(false, _transaction);
        return await ctrl.gerarRetornoErro(res);
    }

}