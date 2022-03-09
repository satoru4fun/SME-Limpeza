const GenericDao = require('rfr')('core/generic-dao.js');

class MonitoramentoDao extends GenericDao {

    constructor() {
        super('monitoramento');
    }

    buscar(id) {
        return this.queryFindOne(`
            SELECT m.id_monitoramento, CASE WHEN ptue IS NULL THEN m.atividades ELSE ptue.descricao END AS atividades, 
                m.data, m.flag_realizado, m.data_hora_inicio, m.latitude_inicio, m.longitude_inicio,
                m.data_hora_termino, m.latitude_termino, m.longitude_termino,
                m.id_ocorrencia, TO_JSONB(t) AS turno, TO_JSONB(p) AS periodicidade,
                JSON_BUILD_OBJECT('descricao', aue.descricao, 'tipo', ta.descricao, 'area', aue.area_ambiente) AS ambiente,
                JSON_BUILD_OBJECT('id_unidade_escolar', ue.id_unidade_escolar, 'descricao', ue.descricao, 'endereco', ue.endereco || ', ' || ue.numero || ' - ' || ue.bairro, 'latitude', ue.latitude, 'longitude', ue.longitude, 'tipo', te.descricao) AS unidade_escolar,
                JSON_BUILD_OBJECT('id_prestador_servico', ps.id_prestador_servico, 'razao_social', ps.razao_social, 'cnpj', ps.cnpj) AS prestador_servico
            FROM monitoramento m
            JOIN ambiente_unidade_escolar aue USING (id_ambiente_unidade_escolar)
            JOIN ambiente_geral ag USING (id_ambiente_geral)
            JOIN tipo_ambiente ta USING (id_tipo_ambiente)
            JOIN unidade_escolar ue ON ue.id_unidade_escolar = m.id_unidade_escolar
            JOIN tipo_escola te ON te.id_tipo_escola = ue.id_tipo_escola
            JOIN prestador_servico ps ON ps.id_prestador_servico = m.id_prestador_servico
            JOIN turno t ON t.id_turno = m.id_turno
            JOIN periodicidade p ON p.id_periodicidade = m.id_periodicidade
            LEFT JOIN plano_trabalho_unidade_escolar ptue ON ptue.id_plano_trabalho_unidade_escolar = m.id_plano_trabalho_unidade_escolar
            WHERE m.id_monitoramento = $1
        `, [id]);
    }

    datatable(idPrestadorServico, idUnidadeEscolar, data, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(m.*) OVER() AS records_total, m.id_monitoramento AS id, m.data, m.flag_ativo, TO_JSONB(t) AS turno, TO_JSONB(p) AS periodicidade,
                m.flag_realizado, CASE WHEN NOT m.flag_realizado THEN NULL ELSE m.id_ocorrencia IS NOT NULL END AS flag_possui_ocorrencia,
                JSON_BUILD_OBJECT('descricao', aue.descricao, 'tipo', ta.descricao, 'area', aue.area_ambiente) AS ambiente,
                JSON_BUILD_OBJECT('descricao', ue.descricao, 'endereco', ue.endereco || ', ' || ue.numero || ' - ' || ue.bairro, 'latitude', ue.latitude, 'longitude', ue.longitude, 'tipo', te.descricao) AS unidade_escolar,
                JSON_BUILD_OBJECT('razao_social', ps.razao_social, 'cnpj', ps.cnpj) AS prestador_servico
            FROM monitoramento m
            JOIN ambiente_unidade_escolar aue USING (id_ambiente_unidade_escolar)
            JOIN ambiente_geral ag USING (id_ambiente_geral)
            JOIN tipo_ambiente ta USING (id_tipo_ambiente)
            JOIN unidade_escolar ue ON ue.id_unidade_escolar = m.id_unidade_escolar
            JOIN tipo_escola te ON te.id_tipo_escola = ue.id_tipo_escola
            JOIN prestador_servico ps ON ps.id_prestador_servico = m.id_prestador_servico
            JOIN turno t ON t.id_turno = m.id_turno
            JOIN periodicidade p ON p.id_periodicidade = m.id_periodicidade
            WHERE m.flag_ativo
                AND CASE WHEN $1::INT IS NULL THEN TRUE ELSE m.id_prestador_servico = $1::INT END
                AND CASE WHEN $2::INT IS NULL THEN TRUE ELSE m.id_unidade_escolar = $2::INT END
                AND CASE WHEN $3::DATE IS NULL THEN TRUE ELSE m.data = $3::DATE END
            ORDER BY m.data DESC LIMIT $4 OFFSET $5
        `, [idPrestadorServico, idUnidadeEscolar, data, length, start]);
    }

    inserir(idPrestadorServico, idUnidadeEscolar, idAmbienteUnidadeEscolar, idPeriodicidade, idTurno, descricao, data) {
        return this.insertWithReturn(`
            INSERT INTO monitoramento (
                id_prestador_servico,
                id_unidade_escolar,
                id_ambiente_unidade_escolar,
                id_periodicidade,
                id_turno,
                atividades,
                data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [idPrestadorServico, idUnidadeEscolar, idAmbienteUnidadeEscolar, idPeriodicidade, idTurno, descricao, data], 'id_monitoramento');
    }

    atualizarData(id, novaData) {
        return this.query(`
            UPDATE monitoramento SET data = $2
            WHERE id_monitoramento = $1 AND flag_ativo AND NOT flag_realizado
        `, [id, novaData]);
    }

    setarOcorrencia(_transaction, id, idOcorrencia) {
        return this.query(`
            UPDATE monitoramento SET id_ocorrencia = $2
            WHERE id_monitoramento = $1
        `, [id, idOcorrencia], _transaction);
    }

    remover(id, idUsuario) {
        return this.query(`
            UPDATE monitoramento SET flag_ativo = FALSE, id_usuario_remocao = $2, data_hora_remocao = $3
            WHERE id_monitoramento = $1 AND flag_ativo AND NOT flag_realizado
        `, [id, idUsuario, new Date()]);
    }

}

module.exports = MonitoramentoDao;