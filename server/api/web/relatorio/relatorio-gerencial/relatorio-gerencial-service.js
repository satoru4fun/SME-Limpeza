const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');
const moment = require('moment');

const Dao = require('./relatorio-gerencial-dao');
const OcorrenciaVariavelDao = require('../../ocorrencia/ocorrencia-variavel/ocorrencia-variavel-dao');
const UnidadeEscolarDao = require('../../unidade-escolar/unidade-escolar-dao');

const dao = new Dao();
const ocorrenciaVariavelDao = new OcorrenciaVariavelDao();
const unidadeEscolarDao = new UnidadeEscolarDao();

exports.buscar = buscar;
exports.tabela = tabela;
exports.avaliar = avaliar;
exports.consolidar = consolidar;
exports.aprovar = aprovar;

async function buscar(req, res) {

    let relatorioGerencial = await dao.buscar(req.params.id);

    if(!relatorioGerencial) {
        return await ctrl.gerarRetornoErro(res, 'Relatório não encontrado.');
    }

    if(req.userData.origem.codigo == 'ps' && relatorioGerencial.prestadorServico.id != req.userData.idOrigemDetalhe) {
        return await ctrl.gerarRetornoErro(res, 'Relatório não encontrado.');
    }

    if(req.userData.origem.codigo == 'ue' && relatorioGerencial.unidadeEscolar.id != req.userData.idOrigemDetalhe) {
        return await ctrl.gerarRetornoErro(res, 'Relatório não encontrado.');
    }

    const unidadeEscolar = await unidadeEscolarDao.findById(relatorioGerencial.unidadeEscolar.id);

    relatorioGerencial.flagPodeFiscalizar = await ctrl.verificarPodeFiscalizar(req.userData, relatorioGerencial.unidadeEscolar.id);
    relatorioGerencial.flagPodeAprovar = unidadeEscolar.idDiretoriaRegional === req.userData.idOrigemDetalhe;

    relatorioGerencial.flagAprovadoFiscal = (relatorioGerencial.idUsuarioAprovacaoFiscal && relatorioGerencial.dataHoraAprovacaoFiscal);
    relatorioGerencial.flagAprovadoDre = (relatorioGerencial.idUsuarioAprovacaoDre && relatorioGerencial.dataHoraAprovacaoDre);

    relatorioGerencial.valorDesconto = parseFloat(relatorioGerencial.valorBruto) * (parseFloat(relatorioGerencial.fatorDesconto)/100);
    relatorioGerencial.valorMulta = (parseFloat(relatorioGerencial.valorBruto) - parseFloat(relatorioGerencial.valorDesconto) + parseFloat(relatorioGerencial.valorTotalFinalSemana)) * (parseFloat(relatorioGerencial.fatorDescontoMulta)/100);
    
    await ctrl.gerarRetornoOk(res, relatorioGerencial);

}

async function tabela(req, res) {

    const params = await utils.getDatatableParams(req);
    const idPrestadorServico = req.userData.origem.codigo == 'ps' ? req.userData.idOrigemDetalhe : params.filters.idPrestadorServico;
    const idUnidadeEscolar = req.userData.origem.codigo == 'ue' ? req.userData.idOrigemDetalhe : params.filters.idUnidadeEscolar;
    const tabela = await dao.datatable(idPrestadorServico, idUnidadeEscolar, params.filters.ano, params.filters.mes, params.length, params.start);
    await ctrl.gerarRetornoDatatable(res, tabela);

}

async function avaliar(req, res) {

    const { idRelatorioGerencial, idOcorrenciaVariavel, idOcorrenciaSituacao, observacao } = req.body;
    
    if(req.params.id != idRelatorioGerencial) {
        return await ctrl.gerarRetornoErro(res);
    }

    const relatorioGerencial = await dao.findById(idRelatorioGerencial);

    const flagPodeFiscalizar = await ctrl.verificarPodeFiscalizar(req.userData, relatorioGerencial.idUnidadeEscolar);

    if(!relatorioGerencial) {
        return await ctrl.gerarRetornoErro(res, 'Relatório gerencial não encontrado.');
    }

    if(relatorioGerencial.idUsuarioAprovacaoFiscal || relatorioGerencial.idUsuarioAprovacaoDre) {
        return await ctrl.gerarRetornoErro(res, 'Relatório gerencial já consolidado.');
    }

    if(!flagPodeFiscalizar) {
        return await ctrl.gerarRetornoErro(res, 'Você não possui permissão para avaliar esse relatório gerencial.');
    }

    const _transaction = await ctrl.iniciarTransaction();

    try {

        await atualizarOcorrenciaVariavel(_transaction, idRelatorioGerencial, idOcorrenciaVariavel, idOcorrenciaSituacao, observacao);
        await recalcularRelatorioGerencial(_transaction, idRelatorioGerencial);
        await ctrl.finalizarTransaction(true, _transaction);
        await ctrl.gerarRetornoOk(res);

    } catch(error) {
        console.log(error);
        await ctrl.finalizarTransaction(false, _transaction);
        return await ctrl.gerarRetornoErro(res);
    }

}

async function consolidar(req, res) {

    const relatorioGerencial = await dao.findById(req.params.id);

    const flagPodeFiscalizar = await ctrl.verificarPodeFiscalizar(req.userData, relatorioGerencial.idUnidadeEscolar);

    if(!relatorioGerencial) {
        return await ctrl.gerarRetornoErro(res, 'Relatório gerencial não encontrado.');
    }

    if(!flagPodeFiscalizar) {
        return await ctrl.gerarRetornoErro(res, 'Você não possui permissão para consolidar esse relatório gerencial.');
    }

    if(relatorioGerencial.idUsuarioAprovacaoFiscal || relatorioGerencial.idUsuarioAprovacaoDre) {
        return await ctrl.gerarRetornoErro(res, 'Relatório gerencial já consolidado.');
    }

    if(relatorioGerencial.pontuacaoFinal == null || relatorioGerencial.fatorDesconto == null) {
        return await ctrl.gerarRetornoErro(res, 'Existem itens pendentes de avaliação.');
    }

    await dao.consolidar(req.params.id, req.userData.idUsuario, new Date());
    await ctrl.gerarRetornoOk(res);

}

async function aprovar(req, res) {

    const relatorioGerencial = await dao.findById(req.params.id);
    const unidadeEscolar = await unidadeEscolarDao.findById(relatorioGerencial.idUnidadeEscolar);

    if(!relatorioGerencial || !relatorioGerencial.idUsuarioAprovacaoFiscal) {
        return await ctrl.gerarRetornoErro(res, 'Relatório gerencial não encontrado.');
    }

    if(unidadeEscolar.idDiretoriaRegional !== req.userData.idOrigemDetalhe) {
        return await ctrl.gerarRetornoErro(res, 'Você não possui permissão para aprovar esse relatório gerencial.');
    }

    if(relatorioGerencial.idUsuarioAprovacaoDre) {
        return await ctrl.gerarRetornoErro(res, 'Relatório gerencial já aprovado.');
    }

    await dao.aprovar(req.params.id, req.userData.idUsuario, new Date());
    await ctrl.gerarRetornoOk(res);

}

async function atualizarOcorrenciaVariavel(_transaction, idRelatorioGerencial, idOcorrenciaVariavel, idOcorrenciaSituacao, observacao) {
    
    if(![1, 2, 3].includes(idOcorrenciaSituacao)) {
        throw new Error();
    }

    const nota = await calcularNotaOcorrenciaVariavel(idOcorrenciaSituacao);
    const peso = await calcularPesoOcorrenciaVariavel(idOcorrenciaVariavel);
    const pontuacao = parseFloat(nota).toFixed(2) * (peso/100);

    return await dao.atualizarDetalheOcorrenciaVariavel(_transaction, idRelatorioGerencial, idOcorrenciaVariavel, idOcorrenciaSituacao, observacao, nota, peso, pontuacao);

}

async function calcularNotaOcorrenciaVariavel(idOcorrenciaSituacao) {

    switch(idOcorrenciaSituacao) {
        case 1: return 100;
        case 2: return 50;
        case 3: return 0;
    }

}

async function calcularPesoOcorrenciaVariavel(idOcorrenciaVariavel) {
    const ocorrenciaVariavel = await ocorrenciaVariavelDao.findById(idOcorrenciaVariavel);
    return ocorrenciaVariavel.peso;
}

async function recalcularRelatorioGerencial(_transaction, idRelatorioGerencial) {

    const relatorioGerencial = await dao.buscar(idRelatorioGerencial, _transaction);
    
    for(let tipo of relatorioGerencial.detalhe) {
        await calcularDetalhe(_transaction, idRelatorioGerencial, tipo);
    }

    await calcularTotal(_transaction, idRelatorioGerencial);

}

async function calcularDetalhe(_transaction, idRelatorioGerencial, tipo) {

    let pontuacaoParcial = 0;
    let tipoCompleto = true;
    for(let variavel of tipo.variaveis) {
        if(variavel.nota == null || variavel.peso == null || variavel.pontuacao == null) tipoCompleto = false;
        pontuacaoParcial += variavel.pontuacao;
    }

    if(tipoCompleto) {
        let pontuacaoFinal = parseFloat(pontuacaoParcial).toFixed(2) * (tipo.peso / 100);
        await dao.atualizarDetalheOcorrenciaTipo(_transaction, idRelatorioGerencial, tipo.idOcorrenciaTipo, pontuacaoParcial, pontuacaoFinal); 
    }

}

async function calcularTotal(_transaction, idRelatorioGerencial) {

    const relatorioGerencial = await dao.buscar(idRelatorioGerencial, _transaction);

    let pontuacaoTotal = 0;
    let isCompleto = true;
    for(let tipo of relatorioGerencial.detalhe) {
        if(tipo.pontuacaoParcial == null || tipo.pontuacaoFinal == null) isCompleto = false;
        pontuacaoTotal += tipo.pontuacaoFinal;
    }

    if(!isCompleto) {
        return;
    }

    const fatorDesconto = await calcularFatorDesconto(pontuacaoTotal);
    const valorDesconto = relatorioGerencial.valorBruto * (fatorDesconto / 100);
    const valorLiquidoPreMulta = parseFloat(relatorioGerencial.valorBruto  - valorDesconto + relatorioGerencial.valorTotalFinalSemana);

    const fatorDescontoMulta = await calcularFatorDescontoMulta(pontuacaoTotal, relatorioGerencial);
    const valorLiquidoPosMulta = valorLiquidoPreMulta - (valorLiquidoPreMulta * (fatorDescontoMulta / 100));

    await dao.atualizarTotal(_transaction, idRelatorioGerencial, pontuacaoTotal, fatorDesconto, valorLiquidoPosMulta, fatorDescontoMulta); 

}

async function calcularFatorDesconto(pontuacaoTotal) {

    pontuacaoTotal = parseFloat(pontuacaoTotal).toFixed(2);

    if(pontuacaoTotal > 100) {
        throw new Error();
    }

    if(pontuacaoTotal >= 95.0) {
        return 0;
    }

    if(pontuacaoTotal >= 90.0) {
        return 1;
    }

    if(pontuacaoTotal >= 85.0) {
        return 2;
    }

    if(pontuacaoTotal >= 80.0) {
        return 3;
    }

    if(pontuacaoTotal >= 75.0) {
        return 4;
    }

    if(pontuacaoTotal >= 70.0) {
        return 5;
    }

    return 7.2;

}

async function calcularFatorDescontoMulta(pontuacaoTotal, relatorioGerencial) {

    const PONTUACAO_MINIMA = 70;

    if(pontuacaoTotal >= PONTUACAO_MINIMA) {
        return 0;
    }

    const mesDoisMesesAnteriores = moment(`${relatorioGerencial.ano}-${relatorioGerencial.mes}-01`).subtract(2, 'months').startOf('month').format('MM');
    const anoDoisMesesAnteriores = moment(`${relatorioGerencial.ano}-${relatorioGerencial.mes}-01`).subtract(2, 'months').startOf('month').format('YYYY');
    
    const mesUmMesAnterior = moment(`${relatorioGerencial.ano}-${relatorioGerencial.mes}-01`).subtract(1, 'months').endOf('month').format('MM');
    const anoUmMesAnterior = moment(`${relatorioGerencial.ano}-${relatorioGerencial.mes}-01`).subtract(1, 'months').endOf('month').format('YYYY');

    const relatoriosAnteriores = await dao.buscarRelatorioPorData(
        relatorioGerencial.unidadeEscolar.id, 
        relatorioGerencial.prestadorServico.id, 
        mesDoisMesesAnteriores, anoDoisMesesAnteriores,
        mesUmMesAnterior, anoUmMesAnterior
    );

    const pontuacoesMenoresQue70 = relatoriosAnteriores.filter(rg => (rg.pontuacaoFinal != null && rg.pontuacaoFinal < PONTUACAO_MINIMA)).length;
    return pontuacoesMenoresQue70 == 2 ? 10 : 0;

}