const GenericDao = require('rfr')('core/generic-dao.js');

class UnidadeEscolarDao extends GenericDao {

    constructor() {
        super('unidade_escolar');
    }

    buscar(id) {
        return this.queryFindOne(`
            SELECT id_unidade_escolar AS id, descricao 
            FROM unidade_escolar
            WHERE id_unidade_escolar = $1
        `, [id]);
    }

    buscarDetalhe(id) {
        return this.queryFindOne(`
            SELECT ue.id_unidade_escolar AS id, ue.descricao, ue.codigo, ue.endereco, ue.numero, ue.bairro, ue.cep, ue.latitude, ue.longitude,
                ue.email, ue.telefone, ue.flag_ativo, ue.responsavel_legal_lista,
                JSON_BUILD_OBJECT('id', te.id_tipo_escola, 'descricao', te.descricao) AS tipo_escola,
                JSON_BUILD_OBJECT('id', dr.id_diretoria_regional, 'descricao', dr.descricao, 'email', dr.email) AS diretoria_regional
            FROM unidade_escolar ue
            JOIN diretoria_regional dr ON dr.id_diretoria_regional = ue.id_diretoria_regional
            JOIN tipo_escola te ON te.id_tipo_escola = ue.id_tipo_escola
            WHERE ue.id_unidade_escolar = $1
        `, [id] );
    }

    combo() {
        return this.queryFindAll(`
            SELECT id_unidade_escolar AS id, descricao, codigo 
            FROM unidade_escolar WHERE flag_ativo
        `);
    }
    
    comboTodos() {
        return this.queryFindAll(`
            SELECT id_unidade_escolar AS id, descricao, codigo 
            FROM unidade_escolar
        `);
    }

    comboTodosDiretoriaRegional(idDiretoriaRegional) {
        return this.queryFindAll(`
            SELECT id_unidade_escolar AS id, descricao, codigo 
            FROM unidade_escolar WHERE id_diretoria_regional = $1
        `, [idDiretoriaRegional]);
    }

    comboDetalhado() {
        return this.queryFindAll(`
            SELECT ue.id_unidade_escolar AS id, ue.descricao, ue.codigo, ue.endereco, ue.numero, ue.bairro, ue.cep, ue.latitude, ue.longitude,
                ue.email, ue.telefone, ue.flag_ativo, ue.responsavel_legal_lista,
                JSON_BUILD_OBJECT('id', te.id_tipo_escola, 'descricao', te.descricao) AS tipo_escola,
                JSON_BUILD_OBJECT('id', dr.id_diretoria_regional, 'descricao', dr.descricao) AS diretoria_regional
            FROM unidade_escolar ue
            JOIN diretoria_regional dr ON dr.id_diretoria_regional = ue.id_diretoria_regional
            JOIN tipo_escola te ON te.id_tipo_escola = ue.id_tipo_escola
            WHERE ue.flag_ativo`);
    }

    carregarComboDetalhadoTodos() {
        return this.queryFindAll(`
            SELECT ue.id_unidade_escolar AS id, ue.descricao, ue.codigo, ue.endereco, ue.numero, ue.bairro, ue.cep, ue.latitude, ue.longitude,
                ue.email, ue.telefone, ue.flag_ativo, ue.responsavel_legal_lista,
                JSON_BUILD_OBJECT('id', te.id_tipo_escola, 'descricao', te.descricao) AS tipo_escola,
                JSON_BUILD_OBJECT('id', dr.id_diretoria_regional, 'descricao', dr.descricao) AS diretoria_regional
            FROM unidade_escolar ue
            JOIN diretoria_regional dr ON dr.id_diretoria_regional = ue.id_diretoria_regional
            JOIN tipo_escola te ON te.id_tipo_escola = ue.id_tipo_escola`);
    }

    comboPorPrestadorServico(idPrestadorServico) {
        return this.queryFindAll(`
            SELECT ue.id_unidade_escolar AS id, ue.codigo, ue.descricao, 
                ue.endereco || ', ' || ue.numero || ', ' || ue.bairro AS endereco
            FROM unidade_escolar ue
            JOIN contrato_detalhe cd USING (id_unidade_escolar)
            JOIN contrato c USING (id_contrato)
            WHERE ue.flag_ativo AND c.id_prestador_servico = $1
        `, [idPrestadorServico]);
    }

    comboTodosPorPrestadorServico(idPrestadorServico) {
        return this.queryFindAll(`
            SELECT ue.id_unidade_escolar AS id, ue.codigo, ue.descricao, 
                ue.endereco || ', ' || ue.numero || ', ' || ue.bairro AS endereco
            FROM unidade_escolar ue
            JOIN contrato_detalhe cd USING (id_unidade_escolar)
            JOIN contrato c USING (id_contrato)
            WHERE c.id_prestador_servico = $1
        `, [idPrestadorServico]);
    }
    
    datatable(idTipoEscola, idUnidadeEscolar, idDiretoriaRegional, descricao, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(ue.*) OVER() AS records_total, ue.id_unidade_escolar AS id, ue.descricao, ue.bairro, te.descricao AS tipo, dre.descricao AS dre
            FROM unidade_escolar ue
            JOIN tipo_escola te USING (id_tipo_escola)
            JOIN diretoria_regional dre ON dre.id_diretoria_regional = ue.id_diretoria_regional
            WHERE ue.flag_ativo AND dre.flag_ativo 
                AND CASE WHEN $1::INT IS NULL THEN TRUE ELSE te.id_tipo_escola = $1::INT END
                AND CASE WHEN $2::INT IS NULL THEN TRUE ELSE ue.id_unidade_escolar = $2::INT END
                AND CASE WHEN $3::INT IS NULL THEN TRUE ELSE dre.id_diretoria_regional = $3::INT END
                AND CASE WHEN $4::TEXT IS NULL THEN TRUE ELSE ue.descricao ILIKE ('%' || $4::TEXT || '%') END
            ORDER BY ue.descricao LIMIT $5 OFFSET $6
        `, [idTipoEscola, idUnidadeEscolar, idDiretoriaRegional, descricao, length, start]);
    }

    insert(descricao, codigo, endereco, numero, bairro, cep, latitude, longitude, telefone, email, idTipoEscola, idDiretoriaRegional, responsavelLegalLista) {
        return this.query(`
            INSERT INTO unidade_escolar (descricao, codigo, endereco, numero, bairro, cep, latitude, longitude, telefone, email, id_tipo_escola, id_diretoria_regional, responsavel_legal_lista) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [descricao, codigo, endereco, numero, bairro, cep, latitude, longitude, telefone, email, idTipoEscola, idDiretoriaRegional, responsavelLegalLista]);
    }

    atualizar(id, descricao, codigo, endereco, numero, bairro, cep, latitude, longitude, telefone, email, idTipoEscola, idDiretoriaRegional, responsavelLegalLista) {
        return this.query(`
            UPDATE unidade_escolar SET descricao = $1, codigo = $2, endereco = $3, numero= $4, bairro = $5, cep = $6, latitude = $7, 
                longitude = $8, telefone = $9, email = $10, id_tipo_escola = $11, id_diretoria_regional = $12, responsavel_legal_lista = $13 
            WHERE id_unidade_escolar = $14
        `, [descricao, codigo, endereco, numero, bairro, cep, latitude, longitude, telefone, email, idTipoEscola, idDiretoriaRegional, responsavelLegalLista, id]);
    }

    remover(id) {
        return this.query(`
            UPDATE unidade_escolar SET flag_ativo = false WHERE id_unidade_escolar = $1
        `, [id]);
    }

    removerByIdDiretoriaRegional(_transaction, idDiretoriaRegional) {
        return this.query(`
            UPDATE unidade_escolar SET flag_ativo = false 
            WHERE id_diretoria_regional = $1
        `, [idDiretoriaRegional], _transaction);
    }

    comboTipoEscola() {
        return this.queryFindAll(`
            SELECT id_tipo_escola AS id, descricao 
            FROM tipo_escola
            ORDER BY descricao
        `);
    }

    setarIdContratoAtual(_transaction, idContrato, id) {
        return this.query(`
            UPDATE unidade_escolar SET id_contrato_atual = $1 
            WHERE id_unidade_escolar = $2
        `, [idContrato, id], _transaction);
    }

    buscarPrestadorServicoAtual(idUnidadeEscolar) {
        return this.queryFindOne(`
            SELECT ps.*
            FROM unidade_escolar ue 
            JOIN contrato c ON c.id_contrato = ue.id_contrato_atual
            JOIN prestador_servico ps USING (id_prestador_servico)
            WHERE ue.id_unidade_escolar = $1
        `, [idUnidadeEscolar]);
    }

}

module.exports = UnidadeEscolarDao;