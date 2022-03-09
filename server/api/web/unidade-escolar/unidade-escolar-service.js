const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./unidade-escolar-dao');
const dao = new Dao();

exports.buscar = buscar;
exports.buscarDetalhe = buscarDetalhe;
exports.tabela = tabela;
exports.inserir = inserir;
exports.atualizar = atualizar;
exports.remover = remover;
exports.comboTipoEscola = comboTipoEscola;
exports.combo = combo;
exports.comboTodos = comboTodos;
exports.comboDetalhado = comboDetalhado;
exports.carregarComboDetalhadoTodos = carregarComboDetalhadoTodos;

async function buscar(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    const unidadeEscolar = await dao.findById(req.params.id);
    await ctrl.gerarRetornoOk(res, unidadeEscolar);

}

async function buscarDetalhe(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    const unidadeEscolar = await dao.buscarDetalhe(req.params.id);
    await ctrl.gerarRetornoOk(res, unidadeEscolar);

}

async function tabela(req, res) {
    
    const params = await utils.getDatatableParams(req);
    const idUnidadeEscolar = req.userData.origem.codigo == 'ps' ? req.userData.idOrigemDetalhe : null;
    const idDiretoriaRegional = params.filters.idDiretoriaRegional ? params.filters.idDiretoriaRegional : req.userData.idOrigemDetalhe;
    const tabela = await dao.datatable(params.filters.idTipoEscola, idUnidadeEscolar, idDiretoriaRegional, params.filters.descricao, params.length, params.start);
    await ctrl.gerarRetornoDatatable(res, tabela);

}

async function inserir(req, res) {

    var responsavelLegalLista = req.body.responsavelLegalLista || [];
    await dao.insert(req.body.descricao, req.body.codigo, req.body.endereco, req.body.numero, req.body.bairro, req.body.cep, req.body.latitude, req.body.longitude, req.body.telefone, req.body.email, req.body.idTipoEscola, req.body.idDiretoriaRegional, JSON.stringify(responsavelLegalLista));
    await ctrl.gerarRetornoOk(res);

}

async function atualizar(req, res) {
    
    if(req.params.id != req.body.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    const responsavelLegalLista = req.body.responsavelLegalLista || [];
    await dao.atualizar(req.params.id, req.body.descricao, req.body.codigo, req.body.endereco, req.body.numero, req.body.bairro, req.body.cep, req.body.latitude, req.body.longitude, req.body.telefone, req.body.email, req.body.idTipoEscola, req.body.idDiretoriaRegional, JSON.stringify(responsavelLegalLista));
    await ctrl.gerarRetornoOk(res);
    
}

async function remover(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    await dao.remover(req.params.id);
    await ctrl.gerarRetornoOk(res);
}

async function comboTipoEscola(req, res) {

    const combo = await dao.comboTipoEscola();
    await ctrl.gerarRetornoOk(res, combo);

}

async function combo(req, res) {
    switch(req.userData.origem.codigo) {
        case 'sme'  : return await ctrl.gerarRetornoOk(res, await dao.combo());
        case 'dre'  : return await ctrl.gerarRetornoOk(res, await dao.combo());
        case 'ue'   : return await ctrl.gerarRetornoOk(res, [ await dao.buscar(req.userData.idOrigemDetalhe) ]);
        case 'ps'   : return await ctrl.gerarRetornoOk(res, await dao.comboPorPrestadorServico(req.userData.idOrigemDetalhe));
        default     : return await ctrl.gerarRetornoOk(res, []);
    }
}

async function comboTodos(req, res) {
    switch(req.userData.origem.codigo) {
        case 'sme'  : return await ctrl.gerarRetornoOk(res, await dao.comboTodos());
        case 'dre'  : return await ctrl.gerarRetornoOk(res, await dao.comboTodosDiretoriaRegional(req.userData.idOrigemDetalhe));
        case 'ue'   : return await ctrl.gerarRetornoOk(res, [ await dao.buscar(req.userData.idOrigemDetalhe) ]);
        case 'ps'   : return await ctrl.gerarRetornoOk(res, await dao.comboTodosPorPrestadorServico(req.userData.idOrigemDetalhe));
        default     : return await ctrl.gerarRetornoOk(res, []);
    }
}

async function comboDetalhado(req, res) {

    const combo = await dao.comboDetalhado();
    await ctrl.gerarRetornoOk(res, combo);

}

async function carregarComboDetalhadoTodos(req, res) {

    const combo = await dao.carregarComboDetalhadoTodos();
    await ctrl.gerarRetornoOk(res, combo);

}