const GenericDao = require('rfr')('core/generic-dao.js');

class AmbienteGeralDao extends GenericDao {

    constructor() {
        super('ambiente_geral');
    }
    
    datatable(descricao, idTipoAmbiente, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(*) OVER() AS records_total, ag.id_ambiente_geral AS id, ag.descricao, ta.descricao AS tipo_ambiente
            FROM ambiente_geral ag
            JOIN tipo_ambiente ta USING (id_tipo_ambiente)
            WHERE ag.flag_ativo AND CASE WHEN $1::TEXT IS NULL THEN TRUE ELSE ag.descricao ILIKE ('%' || $1::TEXT || '%') END
                AND CASE WHEN $2::INT IS NULL THEN TRUE ELSE ag.id_tipo_ambiente = $2::INT END
            ORDER BY ag.descricao LIMIT $3 OFFSET $4
        `, [descricao, idTipoAmbiente, length, start]);
    }

    insert(descricao, idTipoAmbiente) {
        return this.query(`
            INSERT INTO ambiente_geral (descricao, id_tipo_ambiente) 
            VALUES ($1, $2)
        `, [descricao, idTipoAmbiente]);
    }

    atualizar(id, descricao, idTipoAmbiente) {
        return this.query(`
            UPDATE ambiente_geral SET descricao = $1, id_tipo_ambiente = $2 
            WHERE id_ambiente_geral = $3
        `, [descricao, idTipoAmbiente, id]);
    }

    remover(id) {
        return this.query(`
            UPDATE ambiente_geral SET flag_ativo = false
            WHERE id_ambiente_geral = $1
        `, [id]);
    }

    combo() {
        return this.queryFindAll(`
            SELECT ag.id_ambiente_geral AS id, ag.descricao, ta.descricao AS tipo_ambiente
            FROM ambiente_geral ag
            JOIN tipo_ambiente ta USING (id_tipo_ambiente)
            WHERE ag.flag_ativo ORDER BY ag.descricao
        `);
    }

}

module.exports = AmbienteGeralDao;