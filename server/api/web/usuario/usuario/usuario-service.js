const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');
const bcrypt = require('bcrypt');

const UsuarioCargoConstants = require('rfr')('core/constants/usuario-cargo.constantes');
const UsuarioOrigemConstants = require('rfr')('core/constants/usuario-origem.constantes');

const Dao = require('./usuario-dao');
const UnidadeEscolarDao = require('../../unidade-escolar/unidade-escolar-dao');

const dao = new Dao();
const unidadeEscolarDao = new UnidadeEscolarDao();

exports.buscar = buscar;
exports.tabela = tabela;
exports.inserir = inserir;
exports.atualizar = atualizar;
exports.remover = remover;
exports.menu = menu;
exports.alterarSenha = alterarSenha;

async function buscar(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    const usuario = await dao.buscar(req.params.id);
    await ctrl.gerarRetornoOk(res, usuario);

}

async function tabela(req, res) {

    const idOrigemDetalheList = await buscarOrigemDetalheListagem(req.userData);
    const idUsuarioOrigemList = await buscarUsuarioOrigemListagem(req.userData);

    const params = await utils.getDatatableParams(req);
    const tabela = await dao.datatable(params.filters.nome, idOrigemDetalheList, idUsuarioOrigemList, params.length, params.start);
    await ctrl.gerarRetornoDatatable(res, tabela);

}

async function buscarOrigemDetalheListagem(userData) {

    let idOrigemDetalheList = [userData.idOrigemDetalhe];

    if(userData.origem.codigo == 'sme') {
        return null;
    }

    if(userData.origem.codigo == 'dre') {
        //Pode buscar usuários da DRE e das UE subordinadas.
        let unidadeEscolarList = await unidadeEscolarDao.comboTodosDiretoriaRegional(userData.idOrigemDetalhe);
        for(let ue of unidadeEscolarList) {
            idOrigemDetalheList.push(ue.id);
        }
    }

    return idOrigemDetalheList;

}

async function buscarUsuarioOrigemListagem(userData) {

    if(userData.origem.codigo.includes('ue', 'ps')) {
        return [userData.origem.id];
    }

    if(userData.origem.codigo == 'dre') {
        //Pode buscar usuários da DRE e das UE subordinadas.
        return [2, 3];
    }

    if(userData.origem.codigo == 'sme') {
        return [1, 2, 3, 4];
    }

}

async function inserir(req, res) {

    const { nome, email, senha, idUsuarioStatus, idUsuarioCargo, idUsuarioOrigem, idOrigemDetalhe, urlNomeacao } = req.body;

    // let idUsuarioCargo;

    // switch(idUsuarioOrigem) {
    //     case UsuarioOrigemConstants.SME: idUsuarioCargo = 6; break;
    //     case UsuarioOrigemConstants.DRE: idUsuarioCargo = 1; break;
    //     case UsuarioOrigemConstants.UE: idUsuarioCargo = idUsuarioCargo; break;
    //     case UsuarioOrigemConstants.PS: idUsuarioCargo = 4; break;
    // }

    if(!nome || !email || !senha || !idUsuarioStatus || !idUsuarioOrigem || !idUsuarioCargo) {
        return await ctrl.gerarRetornoErro(res);
    }

    if(idUsuarioOrigem != UsuarioOrigemConstants.SME && !idOrigemDetalhe) {
        return await ctrl.gerarRetornoErro(res);
    }

    if([
        UsuarioCargoConstants.FISCAL_TITULAR, 
        UsuarioCargoConstants.FISCAL_SUPLENTE
    ].includes(idUsuarioCargo) && !urlNomeacao) {
        return await ctrl.gerarRetornoErro(res, 'Informe o link de nomeação do fiscal.');
    }

    if(await dao.findDetalhadoByEmail(email)) {
        return await ctrl.gerarRetornoErro(res, 'Já existe usuário cadastrado para o email informado.');
    }

    const hashSenha = bcrypt.hashSync(senha, 10);
    await dao.insert(nome, email, hashSenha, idUsuarioStatus, idUsuarioCargo, idOrigemDetalhe, urlNomeacao);
    await ctrl.gerarRetornoOk(res);

}

async function atualizar(req, res) {

    const { id, nome, email, senha, idUsuarioStatus, idUsuarioOrigem, idUsuarioCargo, idOrigemDetalhe, urlNomeacao } = req.body;

    if(req.params.id != id || !nome || !email || !senha || !idUsuarioStatus || !idUsuarioOrigem || !idUsuarioCargo) {
        return await ctrl.gerarRetornoErro(res);
    }

    if(idUsuarioOrigem != UsuarioOrigemConstants.SME && !idOrigemDetalhe) {
        return await ctrl.gerarRetornoErro(res);
    }

    if([
        UsuarioCargoConstants.FISCAL_TITULAR, 
        UsuarioCargoConstants.FISCAL_SUPLENTE
    ].includes(idUsuarioCargo) && !urlNomeacao) {
        return await ctrl.gerarRetornoErro(res, 'Informe o link de nomeação do fiscal.');
    }

    const usuarioAtual = await dao.findById(req.params.id);

    const usuarioExistenteEmail = await dao.findDetalhadoByEmail(email);
    if(usuarioExistenteEmail && id != usuarioAtual.idUsuario) {
        return await ctrl.gerarRetornoErro(res, 'Já existe usuário cadastrado para o email informado.');
    }

    
    const hashSenha = senha != usuarioAtual.senha ? bcrypt.hashSync(senha, 10) : senha;
    await dao.atualizar(req.params.id, nome, email, hashSenha, idUsuarioStatus, idUsuarioCargo, idOrigemDetalhe, urlNomeacao);
    await ctrl.gerarRetornoOk(res);

}

async function remover(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    await dao.desativar(req.params.id);
    await ctrl.gerarRetornoOk(res);

}

async function menu(req, res) {

    if(!req.userData.origem || !req.userData.cargo) {
        return await ctrl.gerarRetornoErro(res);
    }

    let menuList = [];

    switch(req.userData.cargo.id) {

        case UsuarioCargoConstants.GESTOR_SME: 
            menuList = await montarMenuGestorSME(); 
            break;

        case UsuarioCargoConstants.GESTOR_DRE: 
            menuList = await montarMenuGestorDRE(); 
            break;

        case UsuarioCargoConstants.RESPONSAVEL_UE: 
            menuList = await montarMenuGestorUE(); 
            break;

        case UsuarioCargoConstants.FISCAL_TITULAR: 
            menuList = await montarMenuFiscalUE(); 
            break;

        case UsuarioCargoConstants.FISCAL_SUPLENTE: 
            menuList = await montarMenuFiscalUE(); 
            break;

        case UsuarioCargoConstants.GESTOR_PS: 
            menuList = await montarMenuGestorPS(); 
            break;

    }

    await ctrl.gerarRetornoOk(res, menuList);

}

async function montarMenuGestorSME() {

    return [
        {
            nome: 'Dashboard',
            icone: 'icon-equalizer',
            link: 'dashboard'
        },
        {
            nome: 'Cadastros',
            icone: 'icon-layers',
            itemList: [
                { nome: 'Usuários', link: 'usuario' },
                { nome: 'DRE\'s', link: 'diretoria-regional' },
                { nome: 'Unidades Escolares', link: 'unidade-escolar' },
                { nome: 'Prestadores de Serviço', link: 'prestador-servico' },
                { nome: 'Contratos', link: 'contrato' },
            ]
        },
        {
            nome  : 'Planos de Trabalho',
            icone : 'icon-briefcase',
            itemList: [
                { nome: 'Ambientes', link: 'plano-trabalho/ambiente/ambiente-geral' },
                { nome: 'Planos', link: 'plano-trabalho/matriz' },
            ]
        },
        {
            nome: 'Monitoramentos',
            icone: 'icon-notebook',
            link: 'monitoramento'
        },
        {
            nome: 'Ocorrências',
            icone: 'icon-shield',
            link: 'ocorrencia'
        },
        {
            nome: 'Relatórios',
            icone: 'icon-chart',
            itemList: [
                { nome: 'Por Unidade Escolar', link: 'relatorio/gerencial'},
                { nome: 'Por Contrato', link: 'relatorio/contrato'},
            ]
        },
    ];

}

async function montarMenuGestorDRE() {

    return [
        {
            nome: 'Dashboard',
            icone: 'icon-equalizer',
            link: 'dashboard'
        },
        {
            nome: 'Cadastros',
            icone: 'icon-layers',
            itemList: [
                { nome: 'Usuários', link: 'usuario' },
                { nome: 'Unidades Escolares', link: 'unidade-escolar' },
            ]
        },
        {
            nome: 'Monitoramentos',
            icone: 'icon-notebook',
            link: 'monitoramento'
        },
        {
            nome: 'Ocorrências',
            icone: 'icon-shield',
            link: 'ocorrencia'
        },
        {
            nome: 'Relatórios',
            icone: 'icon-chart',
            itemList: [
                { nome: 'Por Unidade Escolar', link: 'relatorio/gerencial'},
                { nome: 'Por Contrato', link: 'relatorio/contrato'},
            ]
        },
    ];

}

async function montarMenuGestorUE() {

    return [
        {
            nome: 'Dashboard',
            icone: 'icon-equalizer',
            link: 'dashboard'
        },
        {
            nome: 'Cadastros',
            icone: 'icon-layers',
            itemList: [
                { nome: 'Usuários', link: 'usuario' },
                { nome: 'Feriados', link: 'feriado' }
            ]
        },
        {
            nome: 'Planos de Trabalho',
            icone: 'icon-briefcase',
            itemList: [
                { nome: 'Ambientes', link: 'plano-trabalho/ambiente/ambiente-unidade-escolar'},
                { nome: 'Planos', link: 'plano-trabalho/unidade-escolar'},
            ]
        },
        {
            nome: 'Monitoramentos',
            icone: 'icon-notebook',
            link: 'monitoramento'
        },
        {
            nome: 'Ocorrências',
            icone: 'icon-shield',
            link: 'ocorrencia'
        },
    ];
}

async function montarMenuFiscalUE() {

    return [
        {
            nome: 'Dashboard',
            icone: 'icon-equalizer',
            link: 'dashboard'
        },
        {
            nome: 'Monitoramentos',
            icone: 'icon-notebook',
            link: 'monitoramento'
        },
        {
            nome: 'Ocorrências',
            icone: 'icon-shield',
            link: 'ocorrencia'
        },
        {
            nome: 'Relatórios',
            icone: 'icon-chart',
            itemList: [
                { nome: 'Por Unidade Escolar', link: 'relatorio/gerencial'}
            ]
        },
    ];
}


async function montarMenuGestorPS() {

    return [
        {
            nome: 'Dashboard',
            icone: 'icon-equalizer',
            link: 'dashboard'
        },
        {
            nome: 'Aplicativo',
            icone: 'icon-screen-smartphone',
            link: 'aplicativo'
        },
        {
            nome: 'Monitoramentos',
            icone: 'icon-notebook',
            link: 'monitoramento'
        },
        {
            nome: 'Ocorrências',
            icone: 'icon-shield',
            link: 'ocorrencia'
        },
        {
            nome: 'Relatórios',
            icone: 'icon-chart',
            itemList: [
                { nome: 'Por Unidade Escolar', link: 'relatorio/gerencial'},
                { nome: 'Por Contrato', link: 'relatorio/contrato'},
            ]
        },
    ];

}

async function alterarSenha(req, res) {

    let model = req.body;

    if (model.novaSenha !== model.confirmacaoNovaSenha) {
        return await ctrl.gerarRetornoErro(res, 'A nova senha e confirmação da senha devem ser iguais.');
    }

    if (model.senhaAtual == model.novaSenha) {
        return await ctrl.gerarRetornoErro(res, 'A nova senha deve ser diferente da senha atual.');
    }

    let usuario = await dao.findById(req.userData.idUsuario);
    if (usuario == null || !bcrypt.compareSync(model.senhaAtual, usuario.senha)) {
        return await ctrl.gerarRetornoErro(res, 'Senha atual inválida.');
    }

    let hashSenha = bcrypt.hashSync(model.novaSenha, 10);

    dao.atualizarSenhaUsuario(req.userData.idUsuario, hashSenha);
    await ctrl.gerarRetornoOk(res);

}