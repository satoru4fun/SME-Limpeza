const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./relatorio-contrato-dao');
const ContratoDao = require('../../contrato/contrato-dao');
const PrestadorServicoDao = require('../../prestador-servico/prestador-servico-dao');

const dao = new Dao();
const contratoDao = new ContratoDao();
const prestadorServicoDao = new PrestadorServicoDao();

exports.buscar = buscar;
exports.tabela = tabela;

async function buscar(req, res) {

    const anoReferencia = req.params.ano;
    const mesReferencia = req.params.mes;
    const idContrato = req.params.idContrato;
    const idPrestadorServico = req.userData.origem.codigo == 'ps' ? req.userData.idOrigemDetalhe : null;

    
    const contrato = await contratoDao.buscar(idContrato);
    const relatorioList = await dao.buscarRelatoriosUnidadeEscolar(anoReferencia, mesReferencia, idContrato, idPrestadorServico);

    if(!contrato || relatorioList.length == 0) {
        return await ctrl.gerarRetornoErro(res, 'Relatório não encontrado.');
    }

    if(req.userData.origem.codigo != 'ps' && req.userData.origem.codigo != 'dre' && req.userData.origem.codigo != 'sme') {
        return await ctrl.gerarRetornoErro(res, 'Relatório não encontrado.');
    }

    const response = {
        anoReferencia: anoReferencia,
        mesReferencia: mesReferencia,
        contrato: contrato,
        prestadorServico: await prestadorServicoDao.buscar(contrato.idPrestadorServico),
        relatorioList: relatorioList,
        flagAprovadoFiscal: relatorioList.every(c => c.flagAprovadoFiscal == true),
        flagAprovadoDre: relatorioList.every(c => c.flagAprovadoDre == true),
        valorLiquido: relatorioList.reduce((soma, c) => soma + parseFloat(c.valorLiquido), 0)
    };

    await ctrl.gerarRetornoOk(res, response);

}

async function tabela(req, res) {

    const params = await utils.getDatatableParams(req);
    const idPrestadorServico = req.userData.origem.codigo == 'ps' ? req.userData.idOrigemDetalhe : null;
    const tabela = await dao.datatable(idPrestadorServico, params.filters.ano, params.filters.mes, params.length, params.start);
    await ctrl.gerarRetornoDatatable(res, tabela);

}