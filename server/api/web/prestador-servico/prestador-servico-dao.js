const GenericDao = require('rfr')('core/generic-dao.js');

class PrestadorServicoDao extends GenericDao {

    constructor() {
        super('prestador_servico');
    }

    buscar(id) {
        return this.queryFindOne(`
            SELECT id_prestador_servico AS id, razao_social, cnpj, endereco, numero, bairro, cep, telefone, email
            FROM prestador_servico
            WHERE id_prestador_servico = $1
        `, [id]);
    }
    
    datatable(razaoSocial, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(*) OVER() AS records_total, id_prestador_servico AS id, razao_social, cnpj
            FROM prestador_servico
            WHERE flag_ativo AND CASE WHEN $1::TEXT IS NULL THEN TRUE ELSE razao_social ILIKE ('%' || $1::TEXT || '%') END
            ORDER BY razao_social LIMIT $2 OFFSET $3
        `, [razaoSocial, length, start]);
    }

    insert(razaoSocial, cnpj, endereco, numero, bairro, cep, telefone, email, senhaAplicativo) {
        return this.query(`
            INSERT INTO prestador_servico (razao_social, cnpj, endereco, numero, bairro, cep, telefone, email, senha_aplicativo) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [razaoSocial, cnpj, endereco, numero, bairro, cep, telefone, email, senhaAplicativo]);
    }

    atualizar(id, razaoSocial, cnpj, endereco, numero, bairro, cep, telefone, email) {
        return this.query(`
            UPDATE prestador_servico SET razao_social = $1, cnpj = $2, endereco = $3, numero= $4, bairro = $5, cep = $6, telefone = $7, email = $8 WHERE id_prestador_servico = $9
        `, [razaoSocial, cnpj, endereco, numero, bairro, cep, telefone, email, id]);
    }

    remover(id) {
        return this.query(`
            UPDATE prestador_servico SET flag_ativo = false 
            WHERE id_prestador_servico = $1
        `, [id]);
    }

    combo() {
        return this.queryFindAll(`
            SELECT id_prestador_servico AS id, razao_social AS descricao, razao_social, cnpj 
            FROM prestador_servico 
            WHERE flag_ativo 
            ORDER BY razao_social
        `);
    }

    comboTodos() {
        return this.queryFindAll(`
            SELECT id_prestador_servico AS id, razao_social AS descricao, razao_social, cnpj 
            FROM prestador_servico 
            ORDER BY razao_social
        `);
    }

    buscarDadosAcesso(id) {
        return this.queryFindOne(`
            SELECT cnpj, senha_aplicativo
            FROM prestador_servico
            WHERE id_prestador_servico = $1
        `, [id]);
    }

    alterarSenhaAplicativo(id, senhaAplicativo) {
        return this.query(`
            UPDATE prestador_servico SET senha_aplicativo = $2
            WHERE id_prestador_servico = $1
        `, [id, senhaAplicativo]);
    }

    comboPorUnidadeEscolar(idUnidadeEscolar) {
        return this.queryFindAll(`
            SELECT ps.id_prestador_servico AS id, ps.razao_social AS descricao, ps.razao_social, ps.cnpj 
            FROM prestador_servico ps
            JOIN contrato c USING (id_prestador_servico)
            JOIN contrato_detalhe cd USING (id_contrato)
            WHERE ps.flag_ativo AND cd.id_unidade_escolar = $1
        `, [idUnidadeEscolar]);
    }

    comboTodosPorUnidadeEscolar(idUnidadeEscolar) {
        return this.queryFindAll(`
            SELECT ps.id_prestador_servico AS id, ps.razao_social AS descricao, ps.razao_social, ps.cnpj 
            FROM prestador_servico ps
            JOIN contrato c USING (id_prestador_servico)
            JOIN contrato_detalhe cd USING (id_contrato)
            WHERE cd.id_unidade_escolar = $1
        `, [idUnidadeEscolar]);
    }

}

module.exports = PrestadorServicoDao;