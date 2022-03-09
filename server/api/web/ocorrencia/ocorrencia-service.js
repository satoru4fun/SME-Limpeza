const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const fs = require('fs');
const fse = require('fs-extra');
const moment = require('moment');

const Dao = require('./ocorrencia-dao');
const UnidadeEscolarDao = require('../unidade-escolar/unidade-escolar-dao');
const MonitoramentoDao = require('../monitoramento/monitoramento-dao');
const DiretoriaRegionalDao = require('../diretoria-regional/diretoria-regional-dao');

const dao = new Dao();
const unidadeEscolarDao = new UnidadeEscolarDao();
const monitoramentoDao = new MonitoramentoDao();
const diretoriaRegionalDao = new DiretoriaRegionalDao();

exports.buscar = buscar;
exports.tabela = tabela;
exports.inserir = inserir;
exports.encerrar = encerrar;
exports.reincidenciaPorPrestador = reincidenciaPorPrestador;

async function buscar(req, res) {

    if (!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    try {
        let ocorrencia = await dao.buscar(req.params.id);
        ocorrencia = await buscarArquivos(ocorrencia);
        await ctrl.gerarRetornoOk(res, ocorrencia);
    } catch (error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }

}

async function reincidenciaPorPrestador(req, res) {

    const dataInicial = moment().format('YYYY-MM-DD');
    const dataFinal = moment().subtract(3, 'months').format('YYYY-MM-DD');
    const dados = await dao.reincidenciaPorPrestador(dataInicial, dataFinal);
    await ctrl.gerarRetornoOk(res, dados);

}

async function tabela(req, res) {

    const params = await utils.getDatatableParams(req);
    const flagEncerrado = params.filters.flagEncerrado == undefined || params.filters.flagEncerrado == '' ? null : params.filters.flagEncerrado == 'true';
    const idUnidadeEscolar = req.userData.origem.codigo == 'ue' ? req.userData.idOrigemDetalhe : params.filters.idUnidadeEscolar;
    const idPrestadorServico = req.userData.origem.codigo == 'ps' ? req.userData.idOrigemDetalhe : params.filters.idPrestadorServico;
    const tabela = await dao.datatable(idPrestadorServico, idUnidadeEscolar, params.filters.idOcorrenciaTipo, params.filters.data, flagEncerrado, params.length, params.start);
    await ctrl.gerarRetornoDatatable(res, tabela);

}

async function inserir(req, res) {

    if (req.userData.origem.codigo != 'ue') {
        return await ctrl.gerarRetornoErro(res);
    }

    const { idOcorrenciaVariavel, observacao, flagAcaoImediata, acaoCorretiva, data, monitoramento } = req.body;

    const idMonitoramento = monitoramento ? monitoramento.idMonitoramento : null;

    if (monitoramento && (monitoramento.idOcorrencia || !monitoramento.flagPodeFiscalizar)) {
        return await ctrl.gerarRetornoErro(res);
    }

    const arquivoList = req.body.arquivoList || [];
    const idUnidadeEscolar = req.userData.idOrigemDetalhe;
    const prestadorServico = await unidadeEscolarDao.buscarPrestadorServicoAtual(idUnidadeEscolar);
    const idFiscal = req.userData.idUsuario;

    if (flagAcaoImediata && !acaoCorretiva) {
        return await ctrl.gerarRetornoErro(res);
    }

    const _transaction = await ctrl.iniciarTransaction();

    try {

        const idOcorrencia = await dao.insert(_transaction, idOcorrenciaVariavel, observacao, acaoCorretiva, data, idFiscal, idUnidadeEscolar, prestadorServico.idPrestadorServico, idMonitoramento);
        await salvarArquivos(_transaction, idOcorrencia, arquivoList);

        if (idMonitoramento) {
            await monitoramentoDao.setarOcorrencia(_transaction, idMonitoramento, idOcorrencia);
        }

        await ctrl.finalizarTransaction(true, _transaction);
        await enviarEmailNovaOcorrencia(idOcorrencia);
        await ctrl.gerarRetornoOk(res);

    } catch (error) {
        console.log(error);
        await ctrl.finalizarTransaction(false, _transaction);
        return await ctrl.gerarRetornoErro(res);
    }

}

async function encerrar(req, res) {

    if (req.userData.origem.codigo != 'ue') {
        return await ctrl.gerarRetornoErro(res);
    }

    const flagGerarDesconto = req.body.flagGerarDesconto || false;

    const idOcorrencia = req.params.id;
    const ocorrencia = await dao.buscar(idOcorrencia);
    const dataHora = new Date();

    if (!ocorrencia || ocorrencia.dataHoraFinal) {
        return await ctrl.gerarRetornoErro(res);
    }

    await dao.encerrar(idOcorrencia, dataHora, flagGerarDesconto);
    await ctrl.gerarRetornoOk(res);

}

async function buscarArquivos(ocorrencia) {

    try {

        for (let arquivo of ocorrencia.arquivos) {
            arquivo.base64 = await fs.readFileSync(arquivo.caminho, { encoding: 'base64' });
            delete arquivo.caminho;
        }

        return ocorrencia;

    } catch (error) {
        console.log(error);
        throw new Error();
    }

}

async function salvarArquivos(_transaction, idOcorrencia, arquivoList) {

    const PATH_ARQUIVOS = `${process.env.FILES}/${moment().format('YYYY')}/${moment().format('MM')}/${moment().format('DD')}/`;

    try {

        for (let arquivo of arquivoList) {
            let base64Data = arquivo.base64.replace(/^data:image\/png;base64,/, '');
            let caminhoCompleto = PATH_ARQUIVOS + arquivo.filename;
            await dao.inserirArquivo(_transaction, idOcorrencia, arquivo.filename, arquivo.filesize, caminhoCompleto);
            await fse.outputFileSync(caminhoCompleto, base64Data, 'base64');
        }

    } catch (error) {
        console.log(error);
        throw new Error();
    }

}

async function enviarEmailNovaOcorrencia(idOcorrencia) {

    let ocorrencia = await dao.buscar(idOcorrencia);
    let diretoriaRegional = await diretoriaRegionalDao.buscar(ocorrencia.unidadeEscolar.idDiretoriaRegional);
    let linkOcorrencia = process.env.FRONTEND_URL + '/ocorrencia/detalhe/' + idOcorrencia;

    let html = `
        Olá,
        <br><br>
        Uma nova ocorrência foi protocolada!
        <br>
        <br><b>UNIDADE ESCOLAR:</b> ${ocorrencia.unidadeEscolar.codigo} | ${ocorrencia.unidadeEscolar.descricao}
        <br><b>PRESTADOR DE SERVIÇO:</b> ${ocorrencia.prestadorServico.razaoSocial}
        <br><br>
        Para visualizar os detalhes da ocorrência, <a href="${linkOcorrencia}" target="_blank">Clique aqui</a>.
        <br><br><br>
        E-mail enviado automaticamente, favor não responder.
    `;

    let destinatario = ocorrencia.prestadorServico.email + ',' + diretoriaRegional.email;
    ctrl.enviarEmail(destinatario, 'Nova Ocorrência', html);

}