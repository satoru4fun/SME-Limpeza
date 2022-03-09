const GenericDao = require('rfr')('core/generic-dao.js');

class ContratoDao extends GenericDao {

    constructor() {
        super('contrato');
    }

    buscar(id) {
        return this.queryFindOne(`
            WITH unidades AS (
                SELECT * FROM contrato_detalhe
                WHERE id_contrato = $1
            )
            SELECT c.id_contrato AS id, c.descricao, c.codigo, c.data_inicial, c.data_final, c.nome_responsavel, c.email_responsavel, c.id_prestador_servico, c.valor_total,
                JSON_AGG(u) AS unidade_escolar_lista
            FROM contrato c
            LEFT JOIN unidades u USING (id_contrato)
            WHERE c.id_contrato = $1
            GROUP BY c.id_contrato, c.descricao, c.codigo, c.data_inicial, c.data_final, c.nome_responsavel, c.email_responsavel
        `, [id]);
    }

    buscarVencimentoProximo(quantidadeDias, dataAtual) {
        return this.queryFindAll(`
            SELECT 
                c.descricao, 
                c.codigo,
                c.data_final,
                (data_final - $1::date) as dias,
                row_to_json(ps) as prestador_servico
            FROM contrato c
            JOIN prestador_servico ps USING (id_prestador_servico)
            WHERE (data_final - $1::date) BETWEEN 0 AND $2::int
        `, [dataAtual, quantidadeDias]);
    }
    
    datatable(codigo, idPrestadorServico, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(c.*) OVER() AS records_total, c.id_contrato AS id, c.descricao, c.codigo, c.data_inicial, c.data_final, c.valor_total,
                c.flag_ativo, ps.razao_social AS prestador_servico, COUNT(cd) AS quantidade_unidades_escolar
            FROM contrato c
            JOIN prestador_servico ps USING (id_prestador_servico)
            LEFT JOIN contrato_detalhe cd ON cd.id_contrato = c.id_contrato
            WHERE CASE WHEN $1::TEXT IS NULL THEN TRUE ELSE c.codigo ILIKE ('%' || $1::TEXT || '%') END
                AND CASE WHEN $2::INT IS NULL THEN TRUE ELSE c.id_prestador_servico = $2::INT END
            GROUP BY c.id_contrato, c.descricao, c.codigo, c.data_inicial, c.data_final, c.flag_ativo, ps.razao_social
            ORDER BY c.codigo LIMIT $3 OFFSET $4
        `, [codigo, idPrestadorServico, length, start]);
    }

    insert(_transaction, descricao, codigo, dataInicial, dataFinal, nomeResponsavel, emailResponsavel, idPrestadorServico, valorTotal) {
        return this.insertWithReturn(`
            INSERT INTO contrato (descricao, codigo, data_inicial, data_final, nome_responsavel, email_responsavel, id_prestador_servico, valor_total) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [descricao, codigo, dataInicial, dataFinal, nomeResponsavel, emailResponsavel, idPrestadorServico, valorTotal], 'id_contrato', _transaction);
    }

    insertDetalhe(_transaction, id, idUnidadeEscolar, valor, valorMetroQuadradoFinalSemana) {
        return this.query(`
            INSERT INTO contrato_detalhe (
                id_contrato, 
                id_unidade_escolar, 
                valor,
                valor_metro_quadrado_final_semana
            ) VALUES ($1, $2, $3, $4)
        `, [id, idUnidadeEscolar, valor, valorMetroQuadradoFinalSemana], _transaction);
    }

    atualizar(_transaction, id, descricao, codigo, dataInicial, dataFinal, nomeResponsavel, emailResponsavel, idPrestadorServico, valorTotal) {
        return this.query(`
            UPDATE contrato SET descricao = $1, codigo = $2, data_inicial = $3, data_final= $4, nome_responsavel = $5, 
                email_responsavel = $6, id_prestador_servico = $7, valor_total = $8 
            WHERE id_contrato = $9
        `, [descricao, codigo, dataInicial, dataFinal, nomeResponsavel, emailResponsavel, idPrestadorServico, valorTotal, id], _transaction);
    }

    deleteDetalhe(_transaction, id) {
        return this.query(`
            DELETE FROM contrato_detalhe 
            WHERE id_contrato = $1
        `, [id], _transaction);
    }

    remover(_transaction, id) {
        return this.query(`
            UPDATE contrato SET flag_ativo = false 
            WHERE id_contrato = $1
        `, [id], _transaction);
    }

    buscarDetalheContrato(id) {
        return this.queryFindAll(`
            SELECT cd.id_unidade_escolar AS id
            FROM contrato c
            JOIN contrato_detalhe cd USING (id_contrato)
            WHERE c.id_contrato = $1
        `, [id]);
    }

}

module.exports = ContratoDao;