const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./diretoria-regional-dao');
const DaoUnidadeEscolar = require('../unidade-escolar/unidade-escolar-dao');

const dao = new Dao();
const daoUnidadeEscolar = new DaoUnidadeEscolar();

exports.buscar = buscar;
exports.tabela = tabela;
exports.inserir = inserir;
exports.atualizar = atualizar;
exports.remover = remover;
exports.combo = combo;
exports.comboTodos = comboTodos;

async function buscar(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    const response = await dao.findById(req.params.id);
    await ctrl.gerarRetornoOk(res, response);

}

async function tabela(req, res) {

    const params = await utils.getDatatableParams(req);
    const tabela = await dao.datatable(params.filters.descricao, req.userData.idOrigemDetalhe, params.length,params.start);
    await ctrl.gerarRetornoDatatable(res, tabela);

}

async function inserir(req, res) {
    await dao.insert(req.body.descricao, req.body.endereco, req.body.bairro, req.body.cep, req.body.telefone, req.body.email);
    await ctrl.gerarRetornoOk(res);
}

async function atualizar(req, res) {

    if(req.params.id != req.body.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    await dao.atualizar(req.params.id, req.body.descricao, req.body.endereco, req.body.bairro, req.body.cep, req.body.telefone, req.body.email);
    await ctrl.gerarRetornoOk(res);

}

async function remover(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    const _transaction = await ctrl.iniciarTransaction();

    try {
        await dao.remover(_transaction, req.params.id);
        await daoUnidadeEscolar.removerByIdDiretoriaRegional(_transaction, req.params.id);
        await ctrl.finalizarTransaction(true, _transaction);
        await ctrl.gerarRetornoOk(res);
    } catch(error) {
        console.log(error);
        await ctrl.finalizarTransaction(false, _transaction);
        await ctrl.gerarRetornoErro(res);
    }

}

async function combo(req, res) {

    switch(req.userData.origem.codigo) {
        case 'sme'  : return await ctrl.gerarRetornoOk(res, await dao.combo(req.userData.idOrigemDetalhe));
        case 'dre'  : return await ctrl.gerarRetornoOk(res, [ await dao.buscar(req.userData.idOrigemDetalhe) ]);
        default     : return await ctrl.gerarRetornoOk(res, []);
    }
    
}

async function comboTodos(req, res) {

    switch(req.userData.origem.codigo) {
        case 'sme'  : return await ctrl.gerarRetornoOk(res, await dao.comboTodos(req.userData.idOrigemDetalhe));
        case 'dre'  : return await ctrl.gerarRetornoOk(res, [ await dao.buscar(req.userData.idOrigemDetalhe) ]);
        default     : return await ctrl.gerarRetornoOk(res, []);
    }
    
}