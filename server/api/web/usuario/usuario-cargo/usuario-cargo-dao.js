const GenericDao = require('rfr')('core/generic-dao.js');

class UsuarioCargoDao extends GenericDao {

    constructor() {
        super('usuario_cargo');
    }

    combo(idUsuarioOrigem) {
        return this.queryFindAll(`
            SELECT uc.id_usuario_cargo AS id, uc.descricao
            FROM usuario_cargo uc
            WHERE uc.id_usuario_origem = $1
            ORDER BY uc.descricao
        `, [idUsuarioOrigem]);
    }

}

module.exports = UsuarioCargoDao;