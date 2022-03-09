const GenericDao = require('rfr')('core/generic-dao.js');

class DiretoriaRegional extends GenericDao {

    constructor() {
        super('diretoria_regional');
    }

    buscar(id) {
        return this.queryFindOne(`
            SELECT id_diretoria_regional AS id, descricao, email
            FROM diretoria_regional
            WHERE id_diretoria_regional = $1
        `, [id]);
    }

    datatable(descricao, idOrigemDetalhe, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(*) OVER() AS records_total, id_diretoria_regional AS id, descricao, endereco, bairro, cep, telefone, email, flag_ativo
            FROM diretoria_regional
            WHERE flag_ativo 
                AND CASE WHEN $1::TEXT IS NULL THEN TRUE ELSE descricao ILIKE ('%' || $1::TEXT || '%') END
                AND CASE WHEN $2::INT IS NULL THEN TRUE ELSE id_diretoria_regional = $2::INT END 
            ORDER BY descricao LIMIT $3 OFFSET $4
        `, [descricao, idOrigemDetalhe, length, start]);
    }

    insert(descricao, endereco, bairro, cep, telefone, email) {
        return this.query(`
            INSERT INTO diretoria_regional (descricao, endereco, bairro, cep, telefone, email) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [descricao, endereco, bairro, cep, telefone, email]);
    }

    atualizar(id, descricao, endereco, bairro, cep, telefone, email) {
        return this.query(`
            UPDATE diretoria_regional SET descricao = $1, endereco = $2, bairro = $3, cep = $4, telefone = $5, email = $6 
            WHERE id_diretoria_regional = $7
        `, [descricao, endereco, bairro, cep, telefone, email, id]);
    }

    remover(_transaction, id) {
        return this.query(`
            UPDATE diretoria_regional SET flag_ativo = false 
            WHERE id_diretoria_regional = $1
        `, [id], _transaction);
    }

    combo(idOrigemDetalhe) {
        return this.queryFindAll(`
            SELECT id_diretoria_regional AS id, descricao 
            FROM diretoria_regional 
            WHERE flag_ativo 
                AND CASE WHEN $1::INT IS NULL THEN TRUE ELSE id_diretoria_regional = $1::INT END
            ORDER BY descricao
        `, [idOrigemDetalhe]);
    }

    comboTodos(idOrigemDetalhe) {
        return this.queryFindAll(`
            SELECT id_diretoria_regional AS id, descricao 
            FROM diretoria_regional
            WHERE CASE WHEN $1::INT IS NULL THEN TRUE ELSE id_diretoria_regional = $1::INT END
            ORDER BY descricao
        `, [idOrigemDetalhe]);
    }

}

module.exports = DiretoriaRegional;