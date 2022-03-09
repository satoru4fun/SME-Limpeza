const GenericDao = require('rfr')('core/generic-dao.js');

class OcorrenciaTipoDao extends GenericDao {

    constructor() {
        super('ocorrencia_tipo');
    }

    combo(flagSomenteCadastro) {
        return this.queryFindAll(`
            SELECT id_ocorrencia_tipo AS id, descricao, flag_apenas_monitoramento 
            FROM ocorrencia_tipo
            WHERE CASE WHEN $1 THEN NOT flag_apenas_monitoramento ELSE TRUE END
        `, [flagSomenteCadastro]);
    }

}

module.exports = OcorrenciaTipoDao;