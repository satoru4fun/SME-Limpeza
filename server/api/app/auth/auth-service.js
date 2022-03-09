
const ctrl = require('rfr')('core/controller');
const utils = require('rfr')('core/utils/utils.js');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');

const PrestadorServicoDao = require('../prestador-servico/prestador-servico-dao');
const prestadorServicoDao = new PrestadorServicoDao();

exports.authenticate = authenticate; 

async function authenticate(req, res) {

    const { cnpj, senha } = req.body;

    const prestadorServico = await prestadorServicoDao.findByCnpj(cnpj);

    if(!prestadorServico || senha != prestadorServico.senhaAplicativo) {
        return await ctrl.gerarRetornoErro(res, 'Credenciais de acesso inválidas.');
    }

    await ctrl.gerarRetornoOk(res, {
        prestadorServico: { cnpj: prestadorServico.cnpj, razaoSocial: prestadorServico.razaoSocial },
        accessToken: gerarToken(prestadorServico)
    });

}

function gerarToken(prestadorServico) {
    return JWT.sign(
        { idPrestadorServico: prestadorServico.idPrestadorServico }, 
        process.env.JWT_SECRET_KEY, { expiresIn: '30d' }
    );       
}