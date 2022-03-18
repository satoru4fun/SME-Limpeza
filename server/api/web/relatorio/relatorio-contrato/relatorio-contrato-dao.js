const GenericDao = require('rfr')('core/generic-dao.js');

class RelatorioGerencialDao extends GenericDao {

    constructor() {
        super('relatorio_gerencial');
    }

    buscarRelatoriosUnidadeEscolar(anoReferencia, mesReferencia, idContrato, idPrestadorServico) {
        return this.queryFindAll(`
        select 
            rg.id_relatorio_gerencial,
            rg.pontuacao_final,
            rg.fator_desconto, 
            rg.fator_desconto_multa,
            rg.valor_bruto, 
            rg.valor_liquido,
            rg.valor_total_final_semana,
            rg.data_hora_aprovacao_fiscal is not null and rg.id_usuario_aprovacao_fiscal is not null as flag_aprovado_fiscal,
            rg.data_hora_aprovacao_dre is not null and rg.id_usuario_aprovacao_dre is not null as flag_aprovado_dre,
            json_build_object('id', ue.id_unidade_escolar, 'descricao', ue.descricao) as unidade_escolar
        from relatorio_gerencial rg 
        join unidade_escolar ue using (id_unidade_escolar)
        where rg.ano = $1 and rg.mes = $2 and rg.id_contrato = $3
            and case when $4::int is null then true else rg.id_prestador_servico = $4::int end
        order by ue.descricao
        `, [anoReferencia, mesReferencia, idContrato, idPrestadorServico]);
    }

    datatable(idPrestadorServico, ano, mes, length, start) {
        return this.queryFindAll(`
            with dados as (
                select
                    rg.ano,
                    rg.mes,
                    rg.id_contrato,
                    rg.id_prestador_servico,
                    c.descricao,
                    c.codigo,
                    c.valor_total,
                    SUM(rg.valor_liquido) as valor_liquido
                from relatorio_gerencial rg
                join contrato c using (id_contrato)
                where
                    case when $1::int is null then true else c.id_prestador_servico = $1::int end
                    and case when $2::int is null then true else rg.ano = $2::int end
                    and case when $3::int is null then true else rg.mes = $3::int end
                group by 1, 2, 3, 4, 5, 6, 7
                order by 1, 2, 6
            )
            select 
                count(d) over() as records_total,
                d.id_contrato,
                d.ano,
                to_char(d.mes, 'fm00') as mes,
                d.valor_total,
                d.valor_liquido,
                json_build_object('codigo', d.codigo, 'descricao', d.descricao) as contrato,
                json_build_object('razao_social', ps.razao_social, 'cnpj', ps.cnpj) as prestador_servico
            from dados d
            join prestador_servico ps using (id_prestador_servico)
            order by d.ano desc, d.mes desc
            limit $4 offset $5
        `, [idPrestadorServico, ano, mes, length, start]);
    }
    
}

module.exports = RelatorioGerencialDao;