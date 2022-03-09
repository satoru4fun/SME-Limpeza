const GenericDao = require('rfr')('core/generic-dao.js');

class UsuarioOrigemDao extends GenericDao {

    constructor() {
        super('usuario_origem');
    }

    combo(idUsuarioCargo) {
        return this.queryFindAll(`
            SELECT DISTINCT(uo.id_usuario_origem) AS id, uo.descricao, uo.codigo
            FROM usuario_origem uo
            JOIN usuario_cargo uc USING (id_usuario_origem)
            JOIN usuario_cargo_permissao_cadastro ucpc USING (id_usuario_cargo)
            WHERE ucpc.id_usuario_cargo_requisicao = $1
            ORDER BY uo.id_usuario_origem
        `, [idUsuarioCargo]);
    }

}

module.exports = UsuarioOrigemDao;