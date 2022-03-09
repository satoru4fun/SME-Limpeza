const GenericDao = require('rfr')('core/generic-dao.js');

class PlanoTrabalhoUnidadeEscolarDao extends GenericDao {

    constructor() {
        super('plano_trabalho_unidade_escolar');
    }

    buscar(id) {
        return this.queryFindOne(`
            SELECT ptue.*, aue.id_ambiente_geral
            FROM plano_trabalho_unidade_escolar ptue
            JOIN ambiente_unidade_escolar aue USING (id_ambiente_unidade_escolar)
            JOIN ambiente_geral ag USING (id_ambiente_geral)
            WHERE ptue.id_plano_trabalho_unidade_escolar = $1
        `, [id]);
    }
    
    datatable(idUnidadeEscolar, idPeriodicidade, idAmbienteUnidadeEscolar, idTipoAmbiente, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(*) OVER() AS records_total, ptue.id_plano_trabalho_unidade_escolar AS id, 
                TO_JSONB(t) AS turno, TO_JSONB(p) AS periodicidade, 
                ptue.descricao, aue.descricao AS ambiente, ta.descricao AS tipo_ambiente
            FROM plano_trabalho_unidade_escolar ptue
            JOIN ambiente_unidade_escolar aue USING (id_ambiente_unidade_escolar)
            JOIN ambiente_geral ag USING (id_ambiente_geral)
            JOIN tipo_ambiente ta USING (id_tipo_ambiente)
            JOIN turno t ON t.id_turno = ptue.id_turno
            JOIN periodicidade p ON p.id_periodicidade = ptue.id_periodicidade
            WHERE ptue.flag_ativo
                AND ptue.id_unidade_escolar = $1
                AND CASE WHEN $2::INT IS NULL THEN TRUE ELSE ptue.id_periodicidade = $2::INT END
                AND CASE WHEN $3::INT IS NULL THEN TRUE ELSE ptue.id_ambiente_unidade_escolar = $3::INT END
                AND CASE WHEN $4::INT IS NULL THEN TRUE ELSE ag.id_tipo_ambiente = $4::INT END
            ORDER BY aue.descricao LIMIT $5 OFFSET $6
        `, [idUnidadeEscolar, idPeriodicidade, idAmbienteUnidadeEscolar, idTipoAmbiente, length, start]);
    }

    insert(_transaction, idUnidadeEscolar, idAmbienteUnidadeEscolar, idPeriodicidade, idTurno, descricao, diaSemana, dataInicial) {
        return this.query(`
            INSERT INTO plano_trabalho_unidade_escolar (id_unidade_escolar, id_ambiente_unidade_escolar, id_periodicidade, id_turno, descricao, dia_semana, data_inicial) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [idUnidadeEscolar, idAmbienteUnidadeEscolar, idPeriodicidade, idTurno, descricao, diaSemana, dataInicial], _transaction);
    }

    atualizar(id, idUnidadeEscolar, idAmbienteUnidadeEscolar, idPeriodicidade, idTurno, descricao, diaSemana, dataInicial) {
        return this.query(`
            UPDATE plano_trabalho_unidade_escolar SET descricao = $1, id_periodicidade = $2, id_turno = $3, id_ambiente_unidade_escolar = $4, dia_semana = $5, data_inicial = $6
            WHERE id_plano_trabalho_unidade_escolar = $7 AND id_unidade_escolar = $8
        `, [descricao, idPeriodicidade, idTurno, idAmbienteUnidadeEscolar, diaSemana, dataInicial, id, idUnidadeEscolar]);
    }

    remover(id, idUnidadeEscolar) {
        return this.query(`
            UPDATE plano_trabalho_unidade_escolar SET flag_ativo = false 
            WHERE id_plano_trabalho_unidade_escolar = $1 AND id_unidade_escolar = $2
        `, [id, idUnidadeEscolar]);
    }

}

module.exports = PlanoTrabalhoUnidadeEscolarDao;