const GenericDao = require('rfr')('core/generic-dao.js');

class OcorrenciaVariavelDao extends GenericDao {

    constructor() {
        super('ocorrencia_variavel');
    }

    combo(flagApenasMonitoramento) {
        return this.queryFindAll(`
            SELECT ov.id_ocorrencia_variavel AS id, ov.descricao, ov.descricao_conforme, 
                ov.descricao_conforme_com_ressalva, ov.descricao_nao_conforme 
            FROM ocorrencia_variavel ov
            JOIN ocorrencia_tipo ot USING (id_ocorrencia_tipo)
            WHERE CASE WHEN $1::BOOLEAN THEN ot.flag_apenas_monitoramento ELSE NOT ot.flag_apenas_monitoramento END
        `, [flagApenasMonitoramento]);
    }

}

module.exports = OcorrenciaVariavelDao;