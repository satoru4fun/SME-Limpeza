const GenericDao = require('rfr')('core/generic-dao.js');

class TipoAmbienteDao extends GenericDao {

    constructor() {
        super('tipo_ambiente');
    }
    
    combo() {
        return this.queryFindAll(`
            SELECT id_tipo_ambiente AS id, descricao, codigo
            FROM tipo_ambiente ORDER BY descricao
        `);
    }

}

module.exports = TipoAmbienteDao;