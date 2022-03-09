const ctrl = require('rfr')('core/controller');
const utils = require('rfr')('core/utils/utils.js');

const Dao = require('./monitoramento-dao');
const UnidadeEscolarDao = require('../unidade-escolar/unidade-escolar-dao');

const dao = new Dao();
const daoUnidadeEscolar = new UnidadeEscolarDao();

exports.buscarTurnos = buscarTurnos;
exports.buscarAmbienteGeralTurno = buscarAmbienteGeralTurno;
exports.buscarMonitoramentos = buscarMonitoramentos;
exports.buscarTodos = buscarTodos;
exports.atualizar = atualizar;

async function buscarTurnos(req, res) {

    try {
        const turnoList = await dao.buscarTurnos(req.idUnidadeEscolar, req.idPrestadorServico);
        await ctrl.gerarRetornoOk(res, turnoList || []);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }

}

async function buscarAmbienteGeralTurno(req, res) {

    try {
        const ambienteGeralList = await dao.buscarAmbienteGeralTurno(req.idUnidadeEscolar, req.idPrestadorServico, req.params.idTurno);
        await ctrl.gerarRetornoOk(res, ambienteGeralList || []);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }

}

async function buscarMonitoramentos(req, res) {

    const {idTurno, idAmbienteGeral} = req.params;

    try {
        const monitoramentoList = await dao.buscarMonitoramentos(req.idUnidadeEscolar, req.idPrestadorServico, idTurno, idAmbienteGeral);
        await ctrl.gerarRetornoOk(res, monitoramentoList || []);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }

}

async function buscarTodos(req, res) {

    try {
        const monitoramentos = await dao.buscarTodos(req.idUnidadeEscolar, req.idPrestadorServico);
        await ctrl.gerarRetornoOk(res, monitoramentos || []);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }
    
}

async function atualizar(req, res) {

    const { id, dataHoraInicio, latitudeInicio, longitudeInicio, dataHoraTermino, latitudeTermino, longitudeTermino } = req.body;

    if(req.params.id != id) {
        return await ctrl.gerarRetornoErro(res);
    }

    const monitoramento = await dao.findById(id);
    
    if(!monitoramento) {
        return await ctrl.gerarRetornoErro(res, 'Monitoramento não encontrado.');
    }

    const flagRealizado = dataHoraTermino != null;

    await dao.atualizar(id, flagRealizado, dataHoraInicio, latitudeInicio, longitudeInicio, dataHoraTermino, latitudeTermino, longitudeTermino, req.idUnidadeEscolar, req.idPrestadorServico);
    await ctrl.gerarRetornoOk(res, null, 'Monitoramento salvo com sucesso.');

}