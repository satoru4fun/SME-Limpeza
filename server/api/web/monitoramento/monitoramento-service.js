const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./monitoramento-dao');
const UnidadeEscolarDao = require('../unidade-escolar/unidade-escolar-dao');

const dao = new Dao();
const unidadeEscolarDao = new UnidadeEscolarDao();

exports.buscar = buscar;
exports.tabela = tabela;
exports.inserir = inserir;
exports.atualizar = atualizar;
exports.remover = remover;

async function buscar(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    try {
        let monitoramento = await dao.buscar(req.params.id);
        monitoramento.flagPodeFiscalizar = await ctrl.verificarPodeFiscalizar(req.userData, monitoramento.unidadeEscolar.idUnidadeEscolar);
        await ctrl.gerarRetornoOk(res, monitoramento);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }
    
}

async function tabela(req, res) {

    const params = await utils.getDatatableParams(req);

    const idUnidadeEscolar = req.userData.origem.codigo == 'ue' ? req.userData.idOrigemDetalhe : params.filters.idUnidadeEscolar;
    const idPrestadorServico = req.userData.origem.codigo == 'ps' ? req.userData.idOrigemDetalhe : null;

    const tabela = await dao.datatable(idPrestadorServico, idUnidadeEscolar, params.filters.data, params.length, params.start);
    await ctrl.gerarRetornoDatatable(res, tabela);

}

async function inserir(req, res) {

    if(!['dre', 'ue'].includes(req.userData.origem.codigo)) {
        return await ctrl.gerarRetornoErro(res, 'Você não possui permissões.');
    }

    try {
        const idUnidadeEscolar = req.userData.origem.codigo == 'ue' ? req.userData.idOrigemDetalhe : req.body.idUnidadeEscolar;
        const unidadeEscolar = await unidadeEscolarDao.buscarDetalhe(idUnidadeEscolar);
        const prestadorServico = await unidadeEscolarDao.buscarPrestadorServicoAtual(idUnidadeEscolar);
        const idMonitoramento = await dao.inserir(prestadorServico.idPrestadorServico, idUnidadeEscolar, req.body.idAmbienteUnidadeEscolar, 5, req.body.idTurno, req.body.descricao, req.body.data);
        await ctrl.gerarRetornoOk(res);
        notificarAgendamentoManual(idMonitoramento, prestadorServico, unidadeEscolar);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }
    
}

async function atualizar(req, res) {

    if(req.userData.origem.codigo != 'ue' || req.userData.cargo.id != 2) {
        return await ctrl.gerarRetornoErro(res);
    }

    if(req.params.id != req.body.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    try {
        await dao.atualizarData(req.params.id, req.body.novaData);
        await ctrl.gerarRetornoOk(res);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }

}

async function remover(req, res) {

    if(req.userData.origem.codigo != 'ue' || req.userData.cargo.id != 2) {
        return await ctrl.gerarRetornoErro(res);
    }

    try {
        await dao.remover(req.params.id, req.userData.idUsuario);
        await ctrl.gerarRetornoOk(res);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }

}

async function notificarAgendamentoManual(idMonitoramento, prestadorServico, unidadeEscolar) {

    let linkMonitoramento = process.env.FRONTEND_URL + '/monitoramento/detalhe/' + idMonitoramento;
    let destinatario = prestadorServico.email + ',' + unidadeEscolar.diretoriaRegional.emaill;

    ctrl.enviarEmail(destinatario, 'Nova Atividade', `
        Olá,
        <br><br>
        Uma nova atividade foi cadastrada no sistema de monitoramento de limpeza da SME/SP!
        <br>
        <br><b>UNIDADE ESCOLAR:</b> ${unidadeEscolar.codigo} | ${unidadeEscolar.descricao}
        <br><b>PRESTADOR DE SERVIÇO:</b> ${prestadorServico.razaoSocial}
        <br><br>
        Para visualizar os detalhes da atividade, <a href="${linkMonitoramento}" target="_blank">Clique aqui</a>.
        <br><br><br>
        E-mail enviado automaticamente, favor não responder.
    `);

}