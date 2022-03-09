const GenericDao = require('rfr')('core/generic-dao.js');

class UsuarioStatusDao extends GenericDao {

    constructor() {
        super('usuario_status');
    }

    combo() {
        return this.queryFindAll(`
            SELECT id_usuario_status AS id, descricao, codigo
            FROM usuario_status
            ORDER BY descricao
        `);
    }

}

module.exports = UsuarioStatusDao;