const GenericDao = require('rfr')('core/generic-dao.js');

class OcorrenciaDao extends GenericDao {

    constructor() {
        super('ocorrencia');
    }

    buscar(id) {
        return this.queryFindOne(`
        WITH arquivos AS (
            SELECT id_ocorrencia, ARRAY_AGG(json_build_object(
                'caminho', caminho,
                'filename', filename,
                'filesize', filesize
            )) AS arquivos
            FROM ocorrencia_arquivo oa
            WHERE id_ocorrencia = $1
            GROUP BY 1
        )
        SELECT o.id_ocorrencia AS id, o.data, ot.descricao AS tipo, o.data_hora_cadastro, o.id_monitoramento, o.flag_gerar_desconto, 
                TO_JSON(ov) AS variavel, o.acao_corretiva, o.observacao, o.data_hora_final IS NOT NULL AS flag_encerrado, o.data_hora_final, 
                JSON_BUILD_OBJECT('descricao', ue.descricao, 'codigo', ue.codigo, 'id_diretoria_regional', ue.id_diretoria_regional, 'endereco', ue.endereco || ', ' || ue.numero || ' - ' || ue.bairro, 'latitude', ue.latitude, 'longitude', ue.longitude, 'tipo', te.descricao) AS unidade_escolar,
                JSON_BUILD_OBJECT('razao_social', ps.razao_social, 'cnpj', ps.cnpj, 'email', ps.email) AS prestador_servico,
                COALESCE(TO_JSON(oa.arquivos), '[]') AS arquivos
            FROM ocorrencia o 
            JOIN ocorrencia_variavel ov USING (id_ocorrencia_variavel)
            JOIN ocorrencia_tipo ot USING (id_ocorrencia_tipo)
            JOIN prestador_servico ps USING (id_prestador_servico)
            JOIN unidade_escolar ue USING (id_unidade_escolar)
            JOIN tipo_escola te ON te.id_tipo_escola = ue.id_tipo_escola
            LEFT JOIN arquivos oa ON oa.id_ocorrencia = o.id_ocorrencia
            WHERE o.id_ocorrencia = $1
        `, [id]);
    }

    reincidenciaPorPrestador(dataInicial, dataFinal) {
        return this.queryFindAll(`
            WITH ocorrencias as (
                SELECT id_prestador_servico, id_unidade_escolar, id_ocorrencia_variavel, count(*) AS total
                FROM ocorrencia 
                WHERE data BETWEEN $2::DATE AND $1::DATE
                GROUP BY 1, 2, 3
                HAVING count(*) > 1
                ORDER BY 4
            )
            SELECT ov.descricao AS ocorrencia, ot.descricao AS tipo, o.total,
                JSON_BUILD_OBJECT('descricao', ue.descricao, 'endereco', ue.endereco || ', ' || ue.numero || ' - ' || ue.bairro, 'latitude', ue.latitude, 'longitude', ue.longitude, 'tipo', te.descricao) AS unidade_escolar,
                JSON_BUILD_OBJECT('razao_social', ps.razao_social, 'cnpj', ps.cnpj) AS prestador_servico
            FROM ocorrencias o
            JOIN prestador_servico ps ON ps.id_prestador_servico = o.id_prestador_servico 
            JOIN unidade_escolar ue ON ue.id_unidade_escolar = o.id_unidade_escolar
            JOIN tipo_escola te ON te.id_tipo_escola = ue.id_tipo_escola
            JOIN ocorrencia_variavel ov ON ov.id_ocorrencia_variavel = o.id_ocorrencia_variavel 
            JOIN ocorrencia_tipo ot ON ot.id_ocorrencia_tipo = ov.id_ocorrencia_tipo
            ORDER BY o.total DESC, ue.descricao
        `, [dataInicial, dataFinal]);
    }

    datatable(idPrestadorServico, idUnidadeEscolar, idOcorrenciaTipo, data, flagEncerrado, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(o.*) OVER() AS records_total, o.id_ocorrencia AS id, o.data, o.flag_gerar_desconto, 
                o.data_hora_final IS NOT NULL AS flag_encerrado, ot.descricao AS tipo,
                JSON_BUILD_OBJECT('descricao', ue.descricao, 'endereco', ue.endereco || ', ' || ue.numero || ' - ' || ue.bairro, 'latitude', ue.latitude, 'longitude', ue.longitude, 'tipo', te.descricao) AS unidade_escolar,
                JSON_BUILD_OBJECT('razao_social', ps.razao_social, 'cnpj', ps.cnpj) AS prestador_servico
            FROM ocorrencia o 
            JOIN ocorrencia_variavel ov USING (id_ocorrencia_variavel)
            JOIN ocorrencia_tipo ot USING (id_ocorrencia_tipo)
            JOIN prestador_servico ps USING (id_prestador_servico)
            JOIN unidade_escolar ue USING (id_unidade_escolar)
            JOIN tipo_escola te ON te.id_tipo_escola = ue.id_tipo_escola
            WHERE
                CASE WHEN $1::INT IS NULL THEN TRUE ELSE o.id_prestador_servico = $1::INT END
                AND CASE WHEN $2::INT IS NULL THEN TRUE ELSE o.id_unidade_escolar = $2::INT END
                AND CASE WHEN $3::INT IS NULL THEN TRUE ELSE ov.id_ocorrencia_tipo = $3::INT END
                AND CASE WHEN $4::DATE IS NULL THEN TRUE ELSE o.data = $4::DATE END
                AND CASE WHEN $5::BOOLEAN IS NULL THEN TRUE ELSE 
                    CASE WHEN $5::BOOLEAN THEN o.data_hora_final IS NOT NULL
                    ELSE o.data_hora_final IS NULL END END
            ORDER BY o.data DESC LIMIT $6 OFFSET $7
        `, [idPrestadorServico, idUnidadeEscolar, idOcorrenciaTipo, data, flagEncerrado, length, start]);
    }

    insert(_transaction, idOcorrenciaVariavel, observacao, acaoCorretiva, data, idFiscal, idUnidadeEscolar, idPrestadorServico, idMonitoramento) {
        return this.insertWithReturn(`
            INSERT INTO ocorrencia (id_ocorrencia_variavel, observacao, acao_corretiva, data, id_fiscal, id_unidade_escolar, id_prestador_servico, id_monitoramento, data_hora_cadastro)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [idOcorrenciaVariavel, observacao, acaoCorretiva, data, idFiscal, idUnidadeEscolar, idPrestadorServico, idMonitoramento, new Date()], 'id_ocorrencia', _transaction);
    }

    inserirArquivo(_transaction, idOcorrencia, filename, filesize, caminho) {
        return this.query(`
            INSERT INTO ocorrencia_arquivo (id_ocorrencia, filename, filesize, caminho)
            VALUES ($1, $2, $3, $4)
        `, [idOcorrencia, filename, filesize, caminho], _transaction);
    }

    encerrar(idOcorrencia, dataHora, flagGerarDesconto) {
        return this.query(`
            UPDATE ocorrencia SET data_hora_final = $1, flag_gerar_desconto = $2 
            WHERE id_ocorrencia = $3
        `, [dataHora, flagGerarDesconto, idOcorrencia]);
    }

}

module.exports = OcorrenciaDao;