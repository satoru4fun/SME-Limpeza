const GenericDao = require('rfr')('core/generic-dao.js');

class AmbienteUnidadeEscolarDao extends GenericDao {

    constructor() {
        super('ambiente_unidade_escolar');
    }

    buscarDadosQRCode(id) {
        return this.queryFindOne(`
            SELECT aue.id_ambiente_unidade_escolar AS id, aue.hash, aue.descricao, ta.descricao AS tipo_ambiente, aue.area_ambiente,
                ue.descricao AS unidade_escolar, dr.descricao AS diretoria_regional
            FROM ambiente_unidade_escolar aue
            JOIN ambiente_geral ag ON ag.id_ambiente_geral = aue.id_ambiente_geral
            JOIN unidade_escolar ue ON ue.id_unidade_escolar = aue.id_unidade_escolar
            JOIN diretoria_regional dr ON dr.id_diretoria_regional = ue.id_diretoria_regional
            JOIN tipo_ambiente ta ON ta.id_tipo_ambiente = ag.id_tipo_ambiente
            WHERE aue.id_ambiente_unidade_escolar = $1 
        `, [id]);
    }
    
    datatable(idUnidadeEscolar, descricao, idTipoAmbiente, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(*) OVER() AS records_total, aue.id_ambiente_unidade_escolar AS id, aue.descricao, ta.descricao AS tipo_ambiente, aue.area_ambiente
            FROM ambiente_unidade_escolar aue
            JOIN ambiente_geral ag ON ag.id_ambiente_geral = aue.id_ambiente_geral
            JOIN unidade_escolar ue ON ue.id_unidade_escolar = aue.id_unidade_escolar
            JOIN tipo_ambiente ta ON ta.id_tipo_ambiente = ag.id_tipo_ambiente
            WHERE aue.flag_ativo AND aue.id_unidade_escolar = $1 
                AND CASE WHEN $2::TEXT IS NULL THEN TRUE ELSE aue.descricao ILIKE ('%' || $2::TEXT || '%') END
                AND CASE WHEN $3::INT IS NULL THEN TRUE ELSE ag.id_tipo_ambiente = $3::INT END
            ORDER BY aue.descricao LIMIT $4 OFFSET $5
        `, [idUnidadeEscolar, descricao, idTipoAmbiente, length, start]);
    }

    insert(idUnidadeEscolar, idAmbienteGeral, descricao, areaAmbiente) {
        return this.insertWithReturn(`
            INSERT INTO ambiente_unidade_escolar (id_unidade_escolar, id_ambiente_geral, descricao, area_ambiente) 
            VALUES ($1, $2, $3, $4)
        `, [idUnidadeEscolar, idAmbienteGeral, descricao, areaAmbiente], 'id_ambiente_unidade_escolar');
    }

    atualizar(id, idAmbienteGeral, descricao, areaAmbiente) {
        return this.query(`
            UPDATE ambiente_unidade_escolar SET id_ambiente_geral = $1, descricao = $2, area_ambiente = $3
            WHERE id_ambiente_unidade_escolar = $4
        `, [idAmbienteGeral, descricao, areaAmbiente, id]);
    }

    atualizarHash(id, hash) {
        return this.query(`
            UPDATE ambiente_unidade_escolar SET hash = $1
            WHERE id_ambiente_unidade_escolar = $2
        `, [hash, id]);
    }

    remover(id) {
        return this.query(`
            UPDATE ambiente_unidade_escolar SET flag_ativo = false 
            WHERE id_ambiente_unidade_escolar = $1
        `, [id]);
    }

    combo(idUnidadeEscolar) {
        return this.queryFindAll(`
            SELECT id_ambiente_unidade_escolar AS id, descricao
            FROM ambiente_unidade_escolar
            WHERE flag_ativo AND id_unidade_escolar = $1 
            ORDER BY 2
        `, [idUnidadeEscolar]);
    }

    comboPorAmbienteGeral(idUnidadeEscolar, idAmbienteGeral) {
        return this.queryFindAll(`
            SELECT id_ambiente_unidade_escolar AS id, descricao
            FROM ambiente_unidade_escolar
            WHERE flag_ativo AND id_unidade_escolar = $1 AND id_ambiente_geral = $2
            ORDER BY 2
        `, [idUnidadeEscolar, idAmbienteGeral]);
    }

}

module.exports = AmbienteUnidadeEscolarDao;