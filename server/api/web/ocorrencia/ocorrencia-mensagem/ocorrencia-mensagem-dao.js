const GenericDao = require('rfr')('core/generic-dao.js');

class OcorrenciaMensagemDao extends GenericDao {

    constructor() {
        super('ocorrencia_mensagem');
    }

    buscarPorOcorrencia(idOcorrencia) {
        return this.queryFindAll(`
            SELECT om.id_ocorrencia_mensagem AS id, om.data_hora, om.mensagem,
                JSON_BUILD_OBJECT('nome', u.nome, 'origem', uo.codigo) AS usuario
            FROM ocorrencia_mensagem om
            LEFT JOIN usuario u USING (id_usuario)
            JOIN usuario_cargo uc USING (id_usuario_cargo)
            JOIN usuario_origem uo USING (id_usuario_origem)
            WHERE om.id_ocorrencia = $1
            ORDER BY om.data_hora
        `, [idOcorrencia]);
    }

    inserir(idOcorrencia, idUsuario, mensagem, dataHora) {
        return this.query(`
            INSERT INTO ocorrencia_mensagem (id_ocorrencia, id_usuario, mensagem, data_hora)
            VALUES ($1, $2, $3, $4)
        `, [idOcorrencia, idUsuario, mensagem, dataHora]);
    }

}

module.exports = OcorrenciaMensagemDao;