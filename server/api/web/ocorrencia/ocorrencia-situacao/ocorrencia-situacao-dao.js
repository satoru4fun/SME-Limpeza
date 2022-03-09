const GenericDao = require('rfr')('core/generic-dao.js');

class OcorrenciaSituacaoDao extends GenericDao {

    constructor() {
        super('ocorrencia_situacao');
    }

    combo() {
        return this.queryFindAll(`
            SELECT id_ocorrencia_situacao AS id, descricao, classe 
            FROM ocorrencia_situacao
            ORDER BY id_ocorrencia_situacao
        `);
    }

}

module.exports = OcorrenciaSituacaoDao;