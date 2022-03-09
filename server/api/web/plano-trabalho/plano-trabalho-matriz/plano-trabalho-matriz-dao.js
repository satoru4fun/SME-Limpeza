const GenericDao = require('rfr')('core/generic-dao.js');

class PlanoTrabalhoMatrizDao extends GenericDao {

    constructor() {
        super('plano_trabalho_matriz');
    }

    buscarPorAmbienteGeralPeriodicidadeTurno(idAmbienteGeral, idPeriodicidade, idTurno) {
        return this.queryFindOne(`
            SELECT * FROM plano_trabalho_matriz
            WHERE flag_ativo AND id_ambiente_geral = $1 AND id_periodicidade = $2 AND id_turno  = $3
        `, [idAmbienteGeral, idPeriodicidade, idTurno]);
    }
    
    datatable(idPeriodicidade, idAmbienteGeral, idTipoAmbiente, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(*) OVER() AS records_total, pt.id_plano_trabalho_matriz AS id, TO_JSONB(t) AS turno, TO_JSONB(p) AS periodicidade, pt.descricao, ag.descricao AS ambiente, ta.descricao AS tipo_ambiente
            FROM plano_trabalho_matriz pt
            JOIN ambiente_geral ag USING (id_ambiente_geral)
            JOIN tipo_ambiente ta USING (id_tipo_ambiente)
            JOIN turno t ON t.id_turno = pt.id_turno
            JOIN periodicidade p ON p.id_periodicidade = pt.id_periodicidade
            WHERE pt.flag_ativo 
                AND CASE WHEN $1::INT IS NULL THEN TRUE ELSE pt.id_periodicidade  = $1::INT END
                AND CASE WHEN $2::INT IS NULL THEN TRUE ELSE pt.id_ambiente_geral = $2::INT END
                AND CASE WHEN $3::INT IS NULL THEN TRUE ELSE ag.id_tipo_ambiente  = $3::INT END
            ORDER BY ag.descricao LIMIT $4 OFFSET $5
        `, [idPeriodicidade, idAmbienteGeral, idTipoAmbiente, length, start]);
    }

    insert(_transaction, descricao, idPeriodicidade, idAmbienteGeral, idTurno) {
        return this.query(`
            INSERT INTO plano_trabalho_matriz (descricao, id_periodicidade, id_ambiente_geral, id_turno) 
            VALUES ($1, $2, $3, $4)
        `, [descricao, idPeriodicidade, idAmbienteGeral, idTurno], _transaction);
    }

    atualizar(id, descricao, idPeriodicidade, idAmbienteGeral, idTurno) {
        return this.query(`
            UPDATE plano_trabalho_matriz SET descricao = $1, id_periodicidade = $2, id_ambiente_geral = $3, id_turno = $4
            WHERE id_plano_trabalho_matriz = $5
        `, [descricao, idPeriodicidade, idAmbienteGeral, idTurno, id]);
    }

    remover(id) {
        return this.query(`
            UPDATE plano_trabalho_matriz SET flag_ativo = false 
            WHERE id_plano_trabalho_matriz = $1
        `, [id]);
    }

    comboUnidadeEscolar(idUnidadeEscolar) {
        return this.queryFindAll(`
            SELECT DISTINCT(ptm.id_plano_trabalho_matriz) AS id, TO_JSONB(t) AS turno, TO_JSONB(p) AS periodicidade, 
                ptm.descricao, TO_JSONB(ag) AS ambiente_geral, ta.descricao AS tipo_ambiente
            FROM plano_trabalho_matriz ptm 
            JOIN ambiente_geral ag USING (id_ambiente_geral)
            JOIN ambiente_unidade_escolar aue USING (id_ambiente_geral)
            JOIN tipo_ambiente ta ON ta.id_tipo_ambiente = ag.id_tipo_ambiente
            JOIN turno t ON t.id_turno = ptm.id_turno
            JOIN periodicidade p ON p.id_periodicidade = ptm.id_periodicidade
            WHERE ptm.flag_ativo AND aue.flag_ativo AND aue.id_unidade_escolar = $1
        `, [idUnidadeEscolar]);
    }

}

module.exports = PlanoTrabalhoMatrizDao;