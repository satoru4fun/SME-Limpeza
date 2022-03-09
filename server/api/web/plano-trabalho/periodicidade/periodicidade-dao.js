const GenericDao = require('rfr')('core/generic-dao.js');

class PeriodicidadeDao extends GenericDao {

    constructor() {
        super('periodicidade');
    }

    combo() {
        return this.queryFindAll(`
            SELECT id_periodicidade AS id, codigo, descricao
            FROM periodicidade
            WHERE flag_ativo ORDER BY ordem
        `);
    }

}

module.exports = PeriodicidadeDao;