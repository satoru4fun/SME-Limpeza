const GenericDao = require('rfr')('core/generic-dao.js');

class UnidadeEscolarDao extends GenericDao {

    constructor() {
        super('unidade_escolar');
    }

    comboPorPrestadorServico(idPrestadorServico) {
        return this.queryFindAll(`
            SELECT ue.id_unidade_escolar AS id, ue.codigo, ue.descricao, 
                ue.endereco || ', ' || ue.numero || ', ' || ue.bairro AS endereco
            FROM unidade_escolar ue
            JOIN contrato_detalhe cd USING (id_unidade_escolar)
            JOIN contrato c USING (id_contrato)
            WHERE c.id_prestador_servico = $1
        `, [idPrestadorServico]);
    }

}

module.exports = UnidadeEscolarDao;