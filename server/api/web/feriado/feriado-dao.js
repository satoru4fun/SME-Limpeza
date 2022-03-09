const GenericDao = require('rfr')('core/generic-dao.js');

class FeriadoDao extends GenericDao {

    constructor() {
        super('feriado');
    }
    
    datatable(idUnidadeEscolar, length, start) {
        return this.queryFindAll(`
            SELECT 
                COUNT(f.*) OVER() AS records_total, 
                f.id_feriado AS id, 
                f.descricao, 
                f.data
            FROM feriado f
            WHERE f.id_unidade_escolar = $1
            ORDER BY f.data 
            LIMIT $2 OFFSET $3
        `, [idUnidadeEscolar, length, start]);
    }

    insert(idUnidadeEscolar, data, descricao) {
        return this.query(`
            INSERT INTO feriado (id_unidade_escolar, data, descricao) 
            VALUES ($1, $2, $3)
        `, [idUnidadeEscolar, data, descricao]);
    }

    atualizar(id, descricao) {
        return this.query(`
            UPDATE feriado SET descricao = $1
            WHERE id_feriado = $2
        `, [descricao, id]);
    }

    remover(id) {
        return this.query(`
            DELETE FROM feriado
            WHERE id_feriado = $1
        `, [id]);
    }

}

module.exports = FeriadoDao;