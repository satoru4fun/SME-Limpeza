const GenericDao = require('rfr')('core/generic-dao.js');

class TurnoDao extends GenericDao {

    constructor() {
        super('turno');
    }

    combo() {
        return this.queryFindAll(`
            SELECT id_turno AS id, codigo, descricao
            FROM turno
            ORDER BY ordem
        `);
    }

}

module.exports = TurnoDao;