const GenericDao = require('rfr')('core/generic-dao.js');

class RelatorioGerencialDao extends GenericDao {

    constructor() {
        super('relatorio_gerencial');
    }

    buscar(id, _transaction) {
        return this.queryFindOne(`
            WITH 
            filtro AS (
                SELECT *
                FROM relatorio_gerencial
                WHERE id_relatorio_gerencial = $1
            ),
            ocorrencias AS (
                SELECT o.id_ocorrencia, o.id_ocorrencia_variavel, o.data,
                    o.data_hora_final IS NOT NULL AS flag_encerrado
                FROM ocorrencia o
                JOIN filtro f
                    ON f.id_prestador_servico = o.id_prestador_servico 
                    AND f.id_unidade_escolar = o.id_unidade_escolar
                    AND f.mes = EXTRACT(MONTH FROM o.data)
                    AND f.ano = EXTRACT(YEAR FROM o.data)
                WHERE o.flag_gerar_desconto ORDER BY o.data
            ),
            dados0 AS (
                SELECT rgdv.id_ocorrencia_variavel, ov.descricao, ov.descricao_conforme, ov.descricao_conforme_com_ressalva, 
                    ov.descricao_nao_conforme, ov.id_ocorrencia_tipo, rgdv.observacao, rgdv.nota, rgdv.peso, rgdv.pontuacao, 
                    rgdv.id_ocorrencia_situacao, 
                    TO_JSON(array_remove(ARRAY_AGG(o ORDER BY o.data), NULL)) AS ocorrencias
                FROM relatorio_gerencial_detalhe_variavel rgdv 
                JOIN ocorrencia_variavel ov USING (id_ocorrencia_variavel)
                LEFT JOIN ocorrencias o ON o.id_ocorrencia_variavel = rgdv.id_ocorrencia_variavel
                WHERE rgdv.id_relatorio_gerencial = $1
                GROUP BY 1, 2,3, 4, 5, 6, 7, 8, 9, 10, 11
                ORDER BY ov.descricao
            ),
            dados1 AS (
                SELECT d0.id_ocorrencia_variavel, d0.descricao, d0.descricao_conforme, d0.descricao_conforme_com_ressalva, 
                    d0.descricao_nao_conforme, d0.id_ocorrencia_tipo, d0.observacao, d0.nota, d0.peso, d0.pontuacao, 
                    d0.ocorrencias, TO_JSON(os) AS situacao
                FROM dados0 d0 
                LEFT JOIN ocorrencia_situacao os USING (id_ocorrencia_situacao)
                ORDER BY d0.descricao
            ),
            dados2 AS (
                SELECT rgdt.id_relatorio_gerencial, ot.id_ocorrencia_tipo, ot.descricao, rgdt.pontuacao_parcial, 
                    rgdt.peso, rgdt.pontuacao_final, TO_JSON(ARRAY_AGG(v ORDER BY v.descricao)) AS variaveis
                FROM relatorio_gerencial_detalhe_tipo rgdt 
                JOIN ocorrencia_tipo ot USING (id_ocorrencia_tipo)
                JOIN dados1 v ON v.id_ocorrencia_tipo = ot.id_ocorrencia_tipo
                WHERE rgdt.id_relatorio_gerencial = $1
                GROUP BY 1, 2, 3, 4, 5, 6
                ORDER BY ot.descricao
            ),
            juntos AS (
                SELECT rg.id_relatorio_gerencial, rg.mes, rg.ano, rg.id_prestador_servico, rg.id_unidade_escolar, 
                    rg.pontuacao_final, 
                    coalesce(rg.fator_desconto, 0) as fator_desconto, 
                    rg.valor_bruto, 
                    coalesce(rg.valor_liquido, 0) as valor_liquido, 
                    coalesce(rg.fator_desconto_multa, 0) as fator_desconto_multa,
                    rg.total_ambientes_final_semana,
                    rg.total_metros_final_semana,
                    rg.valor_metro_final_semana,
                    rg.valor_total_final_semana,
                    rg.data_hora_aprovacao_fiscal,
                    rg.id_usuario_aprovacao_fiscal,
                    rg.data_hora_aprovacao_dre,
                    rg.id_usuario_aprovacao_dre,
                    TO_JSON(ARRAY_AGG(d2 ORDER BY d2.descricao)) AS detalhe
                FROM relatorio_gerencial rg
                JOIN dados2 d2 ON d2.id_relatorio_gerencial = rg.id_relatorio_gerencial
                WHERE rg.id_relatorio_gerencial = $1
                GROUP BY 1, 2, 3, 4, 5, 6, 7
            )
            
            SELECT 
                rg.id_relatorio_gerencial, 
                to_char(rg.mes, 'fm00') as mes, 
                rg.ano, 
                rg.detalhe, 
                rg.pontuacao_final, 
                rg.fator_desconto, 
                rg.fator_desconto_multa,
                rg.valor_bruto, 
                rg.valor_liquido,
                rg.total_ambientes_final_semana,
                rg.total_metros_final_semana,
                rg.valor_metro_final_semana,
                rg.valor_total_final_semana,
                rg.data_hora_aprovacao_fiscal,
                rg.id_usuario_aprovacao_fiscal,
                u1.nome AS nome_usuario_aprovacao_fiscal,
                rg.data_hora_aprovacao_dre,
                rg.id_usuario_aprovacao_dre,
                u2.nome AS nome_usuario_aprovacao_dre,
                JSON_BUILD_OBJECT('id', ue.id_unidade_escolar, 'descricao', ue.descricao, 'endereco', ue.endereco || ', ' || ue.numero || ' - ' || ue.bairro, 'latitude', ue.latitude, 'longitude', ue.longitude, 'tipo', te.descricao) AS unidade_escolar,
                JSON_BUILD_OBJECT('id', ps.id_prestador_Servico, 'razao_social', ps.razao_social, 'cnpj', ps.cnpj) AS prestador_servico
            FROM juntos rg
            JOIN prestador_servico ps USING (id_prestador_servico)
            JOIN unidade_escolar ue USING (id_unidade_escolar)
            JOIN tipo_escola te USING (id_tipo_escola)
            LEFT JOIN usuario u1 ON u1.id_usuario = rg.id_usuario_aprovacao_fiscal
            LEFT JOIN usuario u2 ON u2.id_usuario = rg.id_usuario_aprovacao_dre
        `, [id], _transaction);
    }

    datatable(idPrestadorServico, idUnidadeEscolar, ano, mes, length, start) {
        return this.queryFindAll(`
            SELECT 
                COUNT(rg) OVER() AS records_total, 
                rg.id_relatorio_gerencial AS id, 
                to_char(rg.mes, 'fm00') as mes,
                rg.ano, 
                rg.pontuacao_final, 
                rg.fator_desconto, 
                (rg.id_usuario_aprovacao_fiscal IS NOT NULL) AS flag_aprovado_fiscal,
                (rg.id_usuario_aprovacao_dre IS NOT NULL) AS flag_aprovado_dre,
                JSON_BUILD_OBJECT('descricao', ue.descricao, 'tipo', te.descricao) AS unidade_escolar,
                JSON_BUILD_OBJECT('razao_social', ps.razao_social, 'cnpj', ps.cnpj) AS prestador_servico
            FROM relatorio_gerencial rg
            JOIN prestador_servico ps USING (id_prestador_servico)
            JOIN unidade_escolar ue USING (id_unidade_escolar)
            JOIN tipo_escola te ON te.id_tipo_escola = ue.id_tipo_escola
            WHERE
                CASE WHEN $1::INT IS NULL THEN TRUE ELSE rg.id_prestador_servico = $1::INT END
                AND CASE WHEN $2::INT IS NULL THEN TRUE ELSE rg.id_unidade_escolar = $2::INT END
                AND CASE WHEN $3::INT IS NULL THEN TRUE ELSE rg.ano = $3::INT END
                AND CASE WHEN $4::INT IS NULL THEN TRUE ELSE rg.mes = $4::INT END
            ORDER BY rg.ano DESC, rg.mes DESC 
            LIMIT $5 OFFSET $6
        `, [idPrestadorServico, idUnidadeEscolar, ano, mes, length, start]);
    }

    atualizarDetalheOcorrenciaVariavel(_transaction, idRelatorioGerencial, idOcorrenciaVariavel, idOcorrenciaSituacao, observacao, nota, peso, pontuacao) {
        return this.query(`
            UPDATE relatorio_gerencial_detalhe_variavel SET 
                id_ocorrencia_situacao = $1,
                observacao = $2,
                nota = $3,
                peso = $4,
                pontuacao = $5
            WHERE id_relatorio_gerencial = $6 AND id_ocorrencia_variavel = $7
        `, [idOcorrenciaSituacao, observacao, nota, peso, pontuacao, idRelatorioGerencial, idOcorrenciaVariavel], _transaction);
    }

    atualizarDetalheOcorrenciaTipo(_transaction, idRelatorioGerencial, idOcorrenciaTipo, pontuacaoParcial, pontuacaoFinal) {
        return this.query(`
            UPDATE relatorio_gerencial_detalhe_tipo SET 
                pontuacao_parcial = $1,
                pontuacao_final = $2
            WHERE id_relatorio_gerencial = $3 AND id_ocorrencia_tipo = $4
        `, [pontuacaoParcial, pontuacaoFinal, idRelatorioGerencial, idOcorrenciaTipo], _transaction);
    }

    atualizarTotal(_transaction, idRelatorioGerencial, pontuacaoTotal, fatorDesconto, valorLiquido, fatorDescontoMulta) {
        return this.query(`
            UPDATE relatorio_gerencial SET 
                pontuacao_final  = $1,
                fator_desconto = $2,
                valor_liquido = $3,
                fator_desconto_multa = $4
            WHERE id_relatorio_gerencial = $5
        `, [pontuacaoTotal, fatorDesconto, valorLiquido, fatorDescontoMulta, idRelatorioGerencial], _transaction);
    }

    consolidar(idRelatorioGerencial, idUsuario, dataHoraConsolidacao) {
        return this.query(`
            UPDATE relatorio_gerencial SET 
            id_usuario_aprovacao_fiscal  = $1,
                data_hora_aprovacao_fiscal = $2
            WHERE id_relatorio_gerencial = $3
        `, [idUsuario, dataHoraConsolidacao, idRelatorioGerencial]);
    }

    aprovar(idRelatorioGerencial, idUsuario, dataHoraConsolidacao) {
        return this.query(`
            UPDATE relatorio_gerencial SET 
            id_usuario_aprovacao_dre  = $1,
                data_hora_aprovacao_dre = $2
            WHERE id_relatorio_gerencial = $3
        `, [idUsuario, dataHoraConsolidacao, idRelatorioGerencial]);
    }

    buscarRelatorioPorData(idUnidadeEscolar, idPrestadorServico, mesDoisMesesAnteriores, anoDoisMesesAnteriores, mesUmMesAnterior, anoUmMesAnterior) {
        return this.queryFindAll(`
            select *
            from relatorio_gerencial
            where
                id_unidade_escolar = $1 and
                id_prestador_servico = $2 and
                (
                    (mes = $3::int and ano = $4::int) or
                    (mes = $5::int and ano = $6::int)
                )
        `, [
            idUnidadeEscolar,
            idPrestadorServico,
            mesDoisMesesAnteriores,
            anoDoisMesesAnteriores,
            mesUmMesAnterior,
            anoUmMesAnterior
        ]);
    }

}

module.exports = RelatorioGerencialDao;