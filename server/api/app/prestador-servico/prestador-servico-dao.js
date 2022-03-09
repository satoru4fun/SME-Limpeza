const GenericDao = require('rfr')('core/generic-dao.js');

class PrestadorServicoDao extends GenericDao {

    constructor() {
        super('prestador_servico');
    }

    findByCnpj(cnpj) {
        return this.queryFindOne(`
            SELECT ps.*
            FROM prestador_servico ps 
            WHERE flag_ativo AND cnpj = $1
        `, [cnpj]);
    }

    buscarUnidadeEscolar(id, idUnidadeEscolar) {
  
        return this.queryFindOne(`
            SELECT ue.id_unidade_escolar AS id, ue.codigo, ue.descricao
            FROM unidade_escolar ue
            JOIN contrato_detalhe cd USING (id_unidade_escolar)
            JOIN contrato c USING (id_contrato)
            WHERE c.id_prestador_servico = $1 AND cd.id_unidade_escolar = $2
        `, [ id, idUnidadeEscolar ]);

    }

}

module.exports = PrestadorServicoDao;