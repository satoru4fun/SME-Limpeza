const GenericDao = require('rfr')('core/generic-dao.js');

class MonitoramentoDao extends GenericDao {

    constructor() {
        super('monitoramento');
    }

    buscarTurnos(idUnidadeEscolar, idPrestadorServico) {
        return this.queryFindAll(`
            WITH monitoramentos AS (
                SELECT DISTINCT(id_turno), COUNT(*) AS total
                FROM monitoramento
                WHERE flag_ativo AND NOT flag_realizado AND id_unidade_escolar = $1 
                    AND id_prestador_servico = $2 AND data = $3
                GROUP BY 1
            )
            SELECT t.id_turno, t.codigo, t.descricao, m.total
            FROM monitoramentos m
            JOIN turno t USING (id_turno)
            ORDER BY t.ordem
        `, [idUnidadeEscolar, idPrestadorServico, new Date()]);
    }

    buscarAmbienteGeralTurno(idUnidadeEscolar, idPrestadorServico, idTurno) {
        return this.queryFindAll(`
            WITH monitoramentos AS (
                SELECT *
                FROM monitoramento
                WHERE flag_ativo AND NOT flag_realizado AND id_unidade_escolar = $1 
                    AND id_prestador_servico = $2 AND data = $3 AND id_turno = $4
            )
            SELECT DISTINCT(ag.id_ambiente_geral), ag.descricao, ta.descricao AS tipo, COUNT(m) AS total
            FROM monitoramentos m
            JOIN ambiente_unidade_escolar aue USING (id_ambiente_unidade_escolar)
            JOIN ambiente_geral ag USING (id_ambiente_geral)
            JOIN tipo_ambiente ta USING (id_tipo_ambiente)
            GROUP BY 1, 2, 3 ORDER BY 3, 2
        `, [idUnidadeEscolar, idPrestadorServico, new Date(), idTurno]);
    }

    buscarMonitoramentos(idUnidadeEscolar, idPrestadorServico, idTurno, idAmbienteGeral) {
        return this.queryFindAll(`
            WITH monitoramentos AS (
                SELECT *
                FROM monitoramento
                WHERE flag_ativo AND NOT flag_realizado AND id_unidade_escolar = $1 
                    AND id_prestador_servico = $2 AND data = $3 AND id_turno = $4
            )
            SELECT m.id_monitoramento AS id, CASE WHEN ptue IS NULL THEN m.atividades ELSE ptue.descricao END AS atividades, 
                m.data, m.flag_realizado, m.data_hora_inicio, m.latitude_inicio, m.longitude_inicio,
                m.data_hora_termino, m.latitude_termino, m.longitude_termino,
                JSON_BUILD_OBJECT('descricao', aue.descricao, 'tipo', ta.descricao, 'area', aue.area_ambiente, 'hash', aue.hash) AS ambiente,
                TO_JSONB(t) AS turno, TO_JSONB(p) AS periodicidade 
            FROM monitoramentos m
            JOIN ambiente_unidade_escolar aue USING (id_ambiente_unidade_escolar)
            JOIN ambiente_geral ag USING (id_ambiente_geral)
            JOIN tipo_ambiente ta USING (id_tipo_ambiente)
            JOIN turno t ON t.id_turno = m.id_turno
            JOIN periodicidade p ON p.id_periodicidade = m.id_periodicidade
            JOIN plano_trabalho_unidade_escolar ptue ON ptue.id_plano_trabalho_unidade_escolar = m.id_plano_trabalho_unidade_escolar
            WHERE aue.id_ambiente_geral = $5
            ORDER BY aue.descricao
        `, [idUnidadeEscolar, idPrestadorServico, new Date(), idTurno, idAmbienteGeral]);
    }

    buscarTodos(idUnidadeEscolar, idPrestadorServico) {
        return this.queryFindAll(`
            SELECT m.id_monitoramento AS id, CASE WHEN ptue IS NULL THEN m.atividades ELSE ptue.descricao END AS atividades, 
                m.data, m.flag_realizado, m.data_hora_inicio, m.latitude_inicio, m.longitude_inicio,
                m.data_hora_termino, m.latitude_termino, m.longitude_termino,
                JSON_BUILD_OBJECT('descricao', aue.descricao, 'tipo', ta.descricao, 'area', aue.area_ambiente, 'hash', aue.hash) AS ambiente,
                TO_JSONB(t) AS turno, TO_JSONB(p) AS periodicidade 
            FROM monitoramento m
            JOIN ambiente_unidade_escolar aue USING (id_ambiente_unidade_escolar)
            JOIN ambiente_geral ag USING (id_ambiente_geral)
            JOIN tipo_ambiente ta USING (id_tipo_ambiente)
            JOIN turno t ON t.id_turno = m.id_turno
            JOIN periodicidade p ON p.id_periodicidade = m.id_periodicidade
            JOIN plano_trabalho_unidade_escolar ptue ON ptue.id_plano_trabalho_unidade_escolar = m.id_plano_trabalho_unidade_escolar
            WHERE m.flag_ativo AND NOT m.flag_realizado AND m.id_unidade_escolar = $1 AND m.id_prestador_servico = $2 AND m.data = $3
        `, [idUnidadeEscolar, idPrestadorServico, new Date()]);
    }

    atualizar(id, flagRealizado, dataHoraInicio, latitudeInicio, longitudeInicio, dataHoraTermino, latitudeTermino, longitudeTermino, idUnidadeEscolar, idPrestadorServico) {
        return this.query(`
            UPDATE monitoramento SET flag_realizado = $1, data_hora_inicio = $2, latitude_inicio = $3, longitude_inicio = $4, 
                data_hora_termino = $5, latitude_termino = $6, longitude_termino = $7 
                WHERE id_monitoramento = $8 AND id_unidade_escolar = $9 AND id_prestador_servico = $10
        `, [flagRealizado, dataHoraInicio, latitudeInicio, longitudeInicio, dataHoraTermino, latitudeTermino, longitudeTermino, id, idUnidadeEscolar, idPrestadorServico]);
    }

}

module.exports = MonitoramentoDao;