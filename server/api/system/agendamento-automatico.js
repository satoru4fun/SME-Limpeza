const conn = require('rfr')('core/database');
const emailService = require('rfr')('core/email');

const moment = require('moment');

let request;
let emailData = '';

function printToConsole(message, addToEmail = true) {

    const dataHora = moment().format('DD/MM/YYYY HH:mm:ss');

    if(addToEmail) {
        emailData = emailData + `\n<b>| ${dataHora} |</b>\t ${message}`;
    }
    
    request.write(`\n<b>| ${dataHora} |</b>\t ${message}`);
    console.log(`\n \x1b[34m %s | %s`, dataHora, message);

}

module.exports = async(req, res) => {

    request = res;

    res.write('<pre>');
    printToConsole('Iniciando processamento - SME - Agendamento Automático', false);
    printToConsole(`Iso Day: ${moment().isoWeekday()}`, false);

    const unidadeEscolarList = await buscarUnidadesEscolaresAtivas();

    printToConsole(`Encontradas ${unidadeEscolarList.length} unidades escolares.`, false);

    for (const unidadeEscolar of unidadeEscolarList) {
        await verificarAgendamentosPorUnidadeEscolar(unidadeEscolar);
    }

    printToConsole('Finalizando processamento - SME - Agendamento Automático', false);
    res.write('</pre>');
    res.end();

};

async function verificarAgendamentosPorUnidadeEscolar(unidadeEscolar) {

    let _transaction = await conn.iniciarTransaction();

    try {

        emailData = '';

        await printToConsole(`############################################################################`);
        await printToConsole(`UNIDADE ESCOLAR: (${unidadeEscolar.idUnidadeEscolar}) ${unidadeEscolar.descricao}`);
        await printToConsole(`PRESTADOR DE SERVIÇO: (${unidadeEscolar.prestadorServico.idPrestadorServico}) ${unidadeEscolar.prestadorServico.razaoSocial}`);
        await printToConsole(`DATA: ${moment().format('DD/MM/YYYY')}`);

        const feriado = await buscarFeriado(unidadeEscolar.idUnidadeEscolar);
        if(feriado) {
            await printToConsole(`FERIADO: ${feriado.descricao}`);
            await printToConsole(`IGNORANDO AGENDAMENTOS - FERIADO`);
        } else {
            await verificarAgendamentosDiarios(_transaction, unidadeEscolar);
            await verificarAgendamentosSemanais(_transaction, unidadeEscolar);
            await verificarAgendamentosMensais(_transaction, unidadeEscolar);
            await verificarAgendamentosTrimestrais(_transaction, unidadeEscolar);
        }
        
        await printToConsole(`############################################################################`);
        await enviarEmail(unidadeEscolar);
        await conn.finalizarTransaction(true, _transaction);
        return true;

    } catch (error) {
        console.log(error);
        await conn.finalizarTransaction(false, _transaction);
        return false;
    }

}

async function verificarAgendamentosDiarios(_transaction, unidadeEscolar) {

    const isoDay = moment().isoWeekday();

    await printToConsole('############################################################################');
    await printToConsole(`PERIODICIDADE: Diário (${isoDay})`);

    if (isoDay > 5) {
        return await printToConsole(`... Não é dia de semana.`);
    }

    let planoTrabalhoList = await buscarPlanoTrabalhoPorPeriodicidade(unidadeEscolar.idUnidadeEscolar, 1);

    if (!planoTrabalhoList || planoTrabalhoList.length == 0) {
        return await printToConsole(`... Nenhum plano de trabalho para agendar.`);
    }

    for (let planoTrabalho of planoTrabalhoList) {
        await agendarMonitoramento(_transaction, unidadeEscolar, planoTrabalho);
        await printToConsole(`... AUE: ${planoTrabalho.idAmbienteUnidadeEscolar} - TURNO: ${planoTrabalho.idTurno} - PTUE: ${planoTrabalho.idPlanoTrabalhoUnidadeEscolar}`);
    }

}

async function verificarAgendamentosSemanais(_transaction, unidadeEscolar) {

    const isoDay = moment().isoWeekday();

    await printToConsole('############################################################################');
    await printToConsole(`PERIODICIDADE: Semanal (${isoDay})`);

    let planoTrabalhoList = await buscarPlanoTrabalhoPorPeriodicidade(unidadeEscolar.idUnidadeEscolar, 2, isoDay);

    if (!planoTrabalhoList || planoTrabalhoList.length == 0) {
        return await printToConsole(`... Nenhum plano de trabalho para agendar.`);
    }

    for (let planoTrabalho of planoTrabalhoList) {
        await agendarMonitoramento(_transaction, unidadeEscolar, planoTrabalho);
        await printToConsole(`... AUE: ${planoTrabalho.idAmbienteUnidadeEscolar} - TURNO: ${planoTrabalho.idTurno} - PTUE: ${planoTrabalho.idPlanoTrabalhoUnidadeEscolar}`);
    }

}

async function verificarAgendamentosMensais(_transaction, unidadeEscolar) {

    const isoDay = moment().isoWeekday();
    const isPrimeiroDiaSemana = await verificarPrimeiroDiaDaSemanaDoMes(isoDay);
    console.log('.......................', isPrimeiroDiaSemana)
    await printToConsole('############################################################################');
    await printToConsole(`PERIODICIDADE: Mensal (${isoDay} - ${isPrimeiroDiaSemana})`);

    let planoTrabalhoList = await buscarPlanoTrabalhoPorPeriodicidade(unidadeEscolar.idUnidadeEscolar, 3, isoDay);

    if (!isPrimeiroDiaSemana || !planoTrabalhoList || planoTrabalhoList.length == 0) {
        return await printToConsole(`... Nenhum plano de trabalho para agendar.`);
    }

    for (let planoTrabalho of planoTrabalhoList) {
        await agendarMonitoramento(_transaction, unidadeEscolar, planoTrabalho);
        await printToConsole(`... AUE: ${planoTrabalho.idAmbienteUnidadeEscolar} - TURNO: ${planoTrabalho.idTurno} - PTUE: ${planoTrabalho.idPlanoTrabalhoUnidadeEscolar}`);
    }

}

async function verificarAgendamentosTrimestrais(_transaction, unidadeEscolar) {

    const isoDay = moment().isoWeekday();

    await printToConsole('############################################################################');
    await printToConsole(`PERIODICIDADE: Trimestral`);

    let planoTrabalhoList = (await buscarPlanoTrabalhoPorPeriodicidade(unidadeEscolar.idUnidadeEscolar, 4)).filter((planoTrabalho) => {
        let dias = moment().diff(planoTrabalho.dataInicio, 'days');
        return (dias % 90) === 0;
    });

    if (!planoTrabalhoList || planoTrabalhoList.length == 0) {
        return await printToConsole(`... Nenhum plano de trabalho para agendar.`);
    }

    let data;
    if (isoDay == 6) {
        data = moment().add(2, 'days');
    } else if (isoDay == 7) {
        data = moment().add(1, 'day');
    }

    for (let planoTrabalho of planoTrabalhoList) {
        await agendarMonitoramento(_transaction, unidadeEscolar, planoTrabalho, data);
        await printToConsole(`... AUE: ${planoTrabalho.idAmbienteUnidadeEscolar} - TURNO: ${planoTrabalho.idTurno} - PTUE: ${planoTrabalho.idPlanoTrabalhoUnidadeEscolar}`);
    }

}

async function verificarPrimeiroDiaDaSemanaDoMes(diaSemana) {

    let result = moment().startOf('month');

    while (result.isoWeekday() !== diaSemana) {
        result.add(1, 'day');
    }

    return moment().isSame(result, 'day');

}

async function buscarFeriado(idUnidadeEscolar) {

    const dataAtual = moment().format('YYYY/MM/DD');

    return await conn.findOne(`
        SELECT *
        FROM feriado
        WHERE data = $1 AND id_unidade_escolar = $2
    `, [dataAtual, idUnidadeEscolar]);

}

async function buscarUnidadesEscolaresAtivas() {

    return await conn.findAll(`
        SELECT ue.id_unidade_escolar, ue.descricao, ue.id_contrato_atual,
            JSON_BUILD_OBJECT('id_contrato', c.id_contrato, 'descricao', c.descricao, 'codigo', c.codigo) AS contrato,
            JSON_BUILD_OBJECT('id_prestador_servico', ps.id_prestador_servico, 'razao_social', ps.razao_social, 'cnpj', ps.cnpj) AS prestador_servico
        FROM unidade_escolar ue
        JOIN contrato c ON c.id_contrato = ue.id_contrato_atual
        JOIN prestador_servico ps USING (id_prestador_servico)
        WHERE ue.flag_ativo ORDER BY ue.descricao
    `);

}

async function buscarPlanoTrabalhoPorPeriodicidade(idUnidadeEscolar, idPeriodicidade, diaSemana) {

    return await conn.findAll(`
        SELECT 
            id_plano_trabalho_unidade_escolar, 
            id_ambiente_unidade_escolar, 
            id_periodicidade,
            id_turno
        FROM plano_trabalho_unidade_escolar
        WHERE flag_ativo AND id_unidade_escolar = $1 AND id_periodicidade = $2
            AND CASE WHEN $3::INT IS NULL THEN TRUE ELSE dia_semana = $3::INT END
    `, [idUnidadeEscolar, idPeriodicidade, diaSemana]);

}

async function agendarMonitoramento(_transaction, unidadeEscolar, planoTrabalho, data) {

    await conn.query(`
        INSERT INTO monitoramento (
            id_prestador_servico,
            id_unidade_escolar,
            id_ambiente_unidade_escolar,
            id_periodicidade,
            id_turno,
            id_plano_trabalho_unidade_escolar,
            data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
        unidadeEscolar.prestadorServico.idPrestadorServico,
        unidadeEscolar.idUnidadeEscolar,
        planoTrabalho.idAmbienteUnidadeEscolar,
        planoTrabalho.idPeriodicidade,
        planoTrabalho.idTurno,
        planoTrabalho.idPlanoTrabalhoUnidadeEscolar,
        data || new Date()
    ], _transaction);

}

async function enviarEmail(unidadeEscolar) {

    const assunto = `Agendamento Automático - ${unidadeEscolar.descricao}`;

    const html = `
        <br>
        <pre>${emailData}</pre>
        <br><br>
        <br>E-mail enviado automaticamente, favor não responder.
        <br>At. te, Julio Frantz<br>
    `;

    return await emailService.enviar('julio25frantz@gmail.com', assunto, html);

}