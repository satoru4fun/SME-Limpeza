const conn = require('rfr')('core/database');
const emailService = require('rfr')('core/email');
const path = require('path'); 
const moment = require('moment');
require('dotenv').config({ path: path.join(__dirname, '.env') });

let request;
let emailData = '';

function printToConsole(message, addToEmail = true) {
    const dataHora = moment().format('DD/MM/YYYY HH:mm:ss');
    if(addToEmail) emailData = emailData + `\n<b>| ${dataHora} |</b>\t ${message}`;
    request.write(`\n<b>| ${dataHora} |</b>\t ${message}`);
    console.log(`\n \x1b[34m %s | %s`, dataHora, message);
}

module.exports = async(req, res) => {

    request = res;

    res.write('<pre>');
    printToConsole('Iniciando processamento - SME Limpeza - Relatório Gerencial', false);

    if(moment().format('DD') == 5) {

        const unidadeEscolarList = await buscarUnidadesEscolares();
        for (const unidadeEscolar of unidadeEscolarList) {
            await gerarRelatorioPorUnidadeEscolar(unidadeEscolar);
        }
        
    } else {
        printToConsole(`Os Relatórios Gerenciais só podem ser gerados no quinto dia corrido de cada mês.`, false);
    }
    
    printToConsole('Finalizando processamento - SME Limpeza - Relatório Gerencial', false);
    res.write('</pre>');
    res.end();

};

async function gerarRelatorioPorUnidadeEscolar(unidadeEscolar) {

    let _transaction = await conn.iniciarTransaction();
    
    const DATA_COMPETENCIA = moment().subtract(1, 'months').startOf('month');
    
    try {

        emailData = '';

        await printToConsole(`############################################################################`);
        await printToConsole(`UNIDADE ESCOLAR: (${unidadeEscolar.idUnidadeEscolar}) ${unidadeEscolar.descricao}`);
        await printToConsole(`PRESTADOR DE SERVIÇO: (${unidadeEscolar.idPrestadorServico}) ${unidadeEscolar.prestadorServico.razaoSocial}`);
        await printToConsole(`COMPETÊNCIA: ${moment(DATA_COMPETENCIA).format('MM/YYYY')}`);

        const finalSemana = await calcularFinalSemana(unidadeEscolar, DATA_COMPETENCIA);

        const ID_RELATORIO_GERENCIAL = await inserirRelatorioGerencial(
            _transaction, 
            unidadeEscolar.idPrestadorServico, 
            unidadeEscolar.idUnidadeEscolar, 
            DATA_COMPETENCIA,
            unidadeEscolar.valor, 
            unidadeEscolar.idContrato,
            finalSemana
        );

        await inserirDetalheTipo(_transaction, ID_RELATORIO_GERENCIAL);
        await inserirDetalheVariavel(_transaction, ID_RELATORIO_GERENCIAL);

        await printToConsole(`############################################################################`);
        await conn.finalizarTransaction(true, _transaction);
        await enviarEmail(unidadeEscolar);
        return true;

    } catch (error) {
        console.log(error);
        await conn.finalizarTransaction(false, _transaction);
        return false;
    }

}

async function inserirRelatorioGerencial(_transaction, idPrestadorServico, idUnidadeEscolar, dataCompetencia, valorBruto, idContrato, finalSemana) {

    return await conn.insertWithReturn(`
        insert into relatorio_gerencial (
            id_prestador_servico,
            id_unidade_escolar,
            mes,
            ano,
            valor_bruto,
            valor_liquido,
            id_contrato,
            total_ambientes_final_semana,
            total_metros_final_semana,
            valor_metro_final_semana,
            valor_total_final_semana
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
        idPrestadorServico,
        idUnidadeEscolar,
        moment(dataCompetencia).format('MM'), 
        moment(dataCompetencia).format('YYYY'),
        valorBruto,
        (parseFloat(valorBruto) + parseFloat(finalSemana.valorTotalFinalSemana)),
        idContrato,
        finalSemana.totalAmbientesFinalSemana,
        finalSemana.totalMetrosFinalSemana,
        finalSemana.valorMetroFinalSemana,
        finalSemana.valorTotalFinalSemana
    ], 'id_relatorio_gerencial', _transaction);

}

async function inserirDetalheVariavel(_transaction, idRelatorioGerencial) {

    await conn.query(`
        insert into relatorio_gerencial_detalhe_variavel (id_relatorio_gerencial, id_ocorrencia_variavel, peso)
        select $1 as id_relatorio_gerencial, ov.id_ocorrencia_variavel, ov.peso
        from ocorrencia_variavel ov
        order by ov.id_ocorrencia_variavel
    `, [idRelatorioGerencial], _transaction);

}

async function inserirDetalheTipo(_transaction, idRelatorioGerencial) {

    await conn.query(`
        insert into relatorio_gerencial_detalhe_tipo (id_relatorio_gerencial, id_ocorrencia_tipo, peso)
        select $1 as id_relatorio_gerencial, ot.id_ocorrencia_tipo, ot.peso
        from ocorrencia_tipo ot
        order by ot.id_ocorrencia_tipo
    `, [idRelatorioGerencial], _transaction);

}

async function calcularFinalSemana(unidadeEscolar, dataCompetencia) {

    const dados = await buscarMonitoramentosFinalSemana(
        unidadeEscolar.idUnidadeEscolar, 
        unidadeEscolar.idPrestadorServico,
        moment(dataCompetencia).startOf('month').format('YYYY-MM-DD'),
        moment(dataCompetencia).endOf('month').format('YYYY-MM-DD')
    );

    return {
        ...dados,
        valorMetroFinalSemana: unidadeEscolar.valorMetroQuadradoFinalSemana,
        valorTotalFinalSemana: parseFloat(dados.totalMetrosFinalSemana) * parseFloat(unidadeEscolar.valorMetroQuadradoFinalSemana)
    }

}

async function buscarMonitoramentosFinalSemana(idUnidadeEscolar, idPrestadorServico, dataInicial, dataFinal) {

    return await conn.findOne(`
        with dados as (
            select *
            from monitoramento m
            where 
                id_unidade_escolar = $1 and
                id_prestador_servico = $2 and 
                data between $3 and $4
        ) 
        select 
            cast(count(*) as integer) as total_ambientes_final_semana, 
            coalesce(sum(aue.area_ambiente), 0) as total_metros_final_semana
        from dados d
        join ambiente_unidade_escolar aue using (id_ambiente_unidade_escolar)
        where extract(dow from d.data) in (0, 6)
    `, [idUnidadeEscolar, idPrestadorServico, dataInicial, dataFinal]);

}

async function buscarUnidadesEscolares() {

    return await conn.findAll(`
        select 
            ue.id_unidade_escolar, 
            ue.descricao, 
            ps.id_prestador_servico,
            c.id_contrato,
            cd.valor,
            cd.valor_metro_quadrado_final_semana,
            json_build_object('id_prestador_servico', ps.id_prestador_servico, 'razao_social', ps.razao_social, 'cnpj', ps.cnpj) as prestador_servico
        from unidade_escolar ue
        join contrato c on c.id_contrato = ue.id_contrato_atual
        join prestador_servico ps using (id_prestador_servico)
        join contrato_detalhe cd using (id_unidade_escolar)
        order by ue.descricao
    `);

}

async function enviarEmail(unidadeEscolar) {

    const assunto = `Relatório Gerencial - ${unidadeEscolar.descricao}`;

    const html = `
        <br>
        <pre>${emailData}</pre>
        <br><br>
        <br>E-mail enviado automaticamente, favor não responder.
        <br>At. te, Julio Frantz<br>
    `;

    return await emailService.enviar(process.env.EMAIL_NOTIFICATION, assunto, html);

}