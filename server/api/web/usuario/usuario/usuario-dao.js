const GenericDao = require('rfr')('core/generic-dao.js');

class UsuarioDao extends GenericDao {

    constructor() {
        super('usuario');
    }

    buscar(id) {
        return this.queryFindOne(`
            SELECT u.id_usuario AS id, u.nome, u.email, u.senha, u.id_origem_detalhe,
                u.id_usuario_cargo, uc.id_usuario_origem, u.id_usuario_status, u.url_nomeacao
            FROM usuario u
            JOIN usuario_cargo uc ON uc.id_usuario_cargo = u.id_usuario_cargo
            WHERE u.id_usuario = $1
        `, [id] );
    }

    findDetalhadoByEmail(email) {
        return this.queryFindOne(`
            SELECT u.id_usuario AS id, u.nome, u.email, u.senha, u.id_origem_detalhe,
                JSON_BUILD_OBJECT('id', uc.id_usuario_cargo, 'descricao', uc.descricao) AS usuario_cargo,
                JSON_BUILD_OBJECT('id', uo.id_usuario_origem, 'descricao', uo.descricao, 'codigo', uo.codigo) AS usuario_origem
            FROM usuario u
            JOIN usuario_cargo uc ON uc.id_usuario_cargo = u.id_usuario_cargo
            JOIN usuario_origem uo ON uo.id_usuario_origem = uc.id_usuario_origem
            JOIN usuario_status us ON us.id_usuario_status = u.id_usuario_status
            WHERE u.email = $1 AND us.flag_pode_logar
        `, [email] );
    }

    findDetalhadoById(id) {
        return this.queryFindOne(`
            SELECT u.id_usuario AS id, u.nome, u.email, u.senha, u.id_origem_detalhe,
                JSON_BUILD_OBJECT('id', uc.id_usuario_cargo, 'descricao', uc.descricao) AS usuario_cargo,
                JSON_BUILD_OBJECT('id', uo.id_usuario_origem, 'descricao', uo.descricao, 'codigo', uo.codigo) AS usuario_origem
            FROM usuario u
            JOIN usuario_cargo uc ON uc.id_usuario_cargo = u.id_usuario_cargo
            JOIN usuario_origem uo ON uo.id_usuario_origem = uc.id_usuario_origem
            JOIN usuario_status us ON us.id_usuario_status = u.id_usuario_status
            WHERE u.id_usuario = $1 AND us.flag_pode_logar
        `, [id] );
    }

    datatable(nome, idOrigemDetalheList, idUsuarioOrigemList, length, start) {
        return this.queryFindAll(`
            SELECT COUNT(u.*) OVER() AS records_total, u.id_usuario AS id, u.nome, u.email,
                JSON_BUILD_OBJECT('descricao', us.descricao, 'classe_label', us.classe_label) AS usuario_status
            FROM usuario u
            JOIN usuario_status us ON us.id_usuario_status = u.id_usuario_status
            JOIN usuario_cargo uc ON uc.id_usuario_cargo = u.id_usuario_cargo
            JOIN usuario_origem uo ON uo.id_usuario_origem = uc.id_usuario_origem
            WHERE CASE WHEN $1::TEXT IS NULL THEN TRUE ELSE u.nome ILIKE ('%' || $1::TEXT || '%') END
                AND CASE WHEN $2::INT[] IS NULL THEN TRUE ELSE u.id_origem_detalhe = ANY($2::INT[]) END
                AND uo.id_usuario_origem = ANY($3::INT[])
            ORDER BY u.nome LIMIT $4 OFFSET $5
        `, [nome, idOrigemDetalheList, idUsuarioOrigemList, length, start]);
    }

    insert(nome, email, hashSenha, idUsuarioStatus, idUsuarioCargo, idOrigemDetalhe, urlNomeacao) {
        return this.query(`
            INSERT INTO usuario (nome, email, senha, id_usuario_status, id_usuario_cargo, id_origem_detalhe, url_nomeacao) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [nome, email, hashSenha, idUsuarioStatus, idUsuarioCargo, idOrigemDetalhe, urlNomeacao]);
    }

    atualizar(id, nome, email, hashSenha, idUsuarioStatus, idUsuarioCargo, idOrigemDetalhe, urlNomeacao) {
        return this.query(`
            UPDATE usuario SET 
                nome = $1, 
                email = $2, 
                senha = $3, 
                id_usuario_status = $4, 
                id_usuario_cargo = $5, 
                id_origem_detalhe = $6,
                url_nomeacao = $7
            WHERE id_usuario = $8
        `, [nome, email, hashSenha, idUsuarioStatus, idUsuarioCargo, idOrigemDetalhe, urlNomeacao, id]);
    }

    desativar(id) {
        return this.query(`
            UPDATE usuario SET id_usuario_status = 3 WHERE id_usuario = $1
        `, [id]);
    }

    atualizarSenhaUsuario(id, senha, _transaction) {
        return this.query(`
            UPDATE usuario SET senha = $2 
            WHERE id_usuario = $1
        `, [id, senha], _transaction);
    }

    insertRedefinicaoSenha(idUsuario, token) {
        return this.query(`
            INSERT INTO usuario_recuperacao (id_usuario, token, data_hora_insercao) 
            VALUES ($1, $2, $3)
        `, [idUsuario, token, new Date()]);
    }

    findByTokenRecuperacao(token) {
        return this.queryFindOne(`
            SELECT u.id_usuario AS id, u.nome, u.email, ur.id_usuario_recuperacao, ur.data_hora_insercao
            FROM usuario_recuperacao ur
            JOIN usuario u USING (id_usuario)
            WHERE ur.token = $1 AND data_hora_recuperacao IS NULL
        `, [token]);
    }

    setarTokenRecuperado(idUsuarioRecuperacao, _transaction) {
        return this.query(`
            UPDATE usuario_recuperacao SET data_hora_recuperacao = $2 
            WHERE id_usuario_recuperacao = $1
        `, [idUsuarioRecuperacao, new Date()], _transaction);
    }

}

module.exports = UsuarioDao;