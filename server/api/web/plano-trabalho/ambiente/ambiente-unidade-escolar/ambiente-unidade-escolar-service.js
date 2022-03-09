const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');
const jsZip = require('jszip');
const fs = require('fs');
const pdf = require('html-pdf');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');

const Dao = require('./ambiente-unidade-escolar-dao');
const moment = require('moment');
const dao = new Dao();

exports.buscar = buscar;
exports.tabela = tabela;
exports.inserir = inserir;
exports.atualizar = atualizar;
exports.remover = remover;
exports.combo = combo;
exports.comboPorAmbienteGeral = comboPorAmbienteGeral;
exports.qrcode = qrcode;
exports.gerarTodosQRCode = gerarTodosQRCode;

async function buscar(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    const ambiente = await dao.findById(req.params.id);
    if(ambiente.idUnidadeEscolar != req.userData.idOrigemDetalhe) {
        return await ctrl.gerarRetornoErro(res);
    }

    await ctrl.gerarRetornoOk(res, ambiente);

}

async function tabela(req, res) {

    const params = await utils.getDatatableParams(req);
    const tabela = await dao.datatable(req.userData.idOrigemDetalhe, params.filters.descricao, params.filters.idTipoAmbiente, params.length, params.start);
    await ctrl.gerarRetornoDatatable(res, tabela);

}

async function inserir(req, res) {
    const { idAmbienteGeral, descricao, areaAmbiente } = req.body;
    if(!idAmbienteGeral || !descricao || !areaAmbiente) {
        return await ctrl.gerarRetornoErro(res);
    }
    const id = await dao.insert(req.userData.idOrigemDetalhe, idAmbienteGeral, descricao, areaAmbiente);
    const hash = bcrypt.hashSync(id.toString(), 10);
    await dao.atualizarHash(id, hash);
    await ctrl.gerarRetornoOk(res);
}

async function atualizar(req, res) {

    const { id, idAmbienteGeral, descricao, areaAmbiente } = req.body;

    if(req.params.id != id) {
        return await ctrl.gerarRetornoErro(res);
    }

    await dao.atualizar(req.params.id, idAmbienteGeral, descricao, areaAmbiente);
    await ctrl.gerarRetornoOk(res);

}

async function remover(req, res) {

    if(!req.params.id) {
        return await ctrl.gerarRetornoErro(res);
    }

    await dao.remover(req.params.id);
    await ctrl.gerarRetornoOk(res);

}

async function combo(req, res) {

    const idUnidadeEscolar = req.userData.origem.codigo == 'ue' ? req.userData.idOrigemDetalhe : req.params.idUnidadeEscolar;

    try {
        const combo = await dao.combo(idUnidadeEscolar);
        await ctrl.gerarRetornoOk(res, combo);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }

}

async function comboPorAmbienteGeral(req, res) {

    const idUnidadeEscolar = req.userData.origem.codigo == 'ue' ? req.userData.idOrigemDetalhe : req.params.idUnidadeEscolar;

    try {
        const combo = await dao.comboPorAmbienteGeral(idUnidadeEscolar, req.params.idAmbienteGeral);
        await ctrl.gerarRetornoOk(res, combo);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }

}

async function gerarTodosQRCode(req, res) {

    const idUnidadeEscolar = req.userData.origem.codigo == 'ue' ? req.userData.idOrigemDetalhe : req.params.idUnidadeEscolar;
    let arquivoList = [];
    try {
        const ambienteUnidadeEscolarList = await dao.combo(idUnidadeEscolar);
        for(const [index, aue] of Object(ambienteUnidadeEscolarList).entries()) {
            const ambienteUnidadeEscolar = await dao.buscarDadosQRCode(aue.id);
            const base64 = await gerarBase64QRCode(ambienteUnidadeEscolar.hash);
            const arquivo = await gerarArquivoPDF(ambienteUnidadeEscolar, base64);
            if(!base64 || !arquivo) throw new Error();
            arquivoList.push({
                name: `SME-QRCODE-${index+1}.pdf`,
                buffer: arquivo
            });
        }

        let zip = new jsZip();
        for(let arquivo of arquivoList) {
            zip.file(arquivo.name, arquivo.buffer);
        }
        
        await zip.generateAsync({type: 'nodebuffer', streamFiles: true}).then(async (content) => {
            return await ctrl.gerarRetornoOk(res, {
                name: 'SME-QRCODE-' + moment().format('YYYYMMDD-HHmmss'),
                extension: 'zip',
                buffer: content
            });
        });  

    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }
        
}

async function qrcode(req, res) {

    const idAmbienteUnidadeEscolar = req.params.id;

    if(!idAmbienteUnidadeEscolar) {
        return await ctrl.gerarRetornoErro(res);
    }

    const ambienteUnidadeEscolar = await dao.buscarDadosQRCode(idAmbienteUnidadeEscolar);

    if(!ambienteUnidadeEscolar) {
        return await ctrl.gerarRetornoErro(res, 'Ambiente não encontrado.');
    }

    const base64 = await gerarBase64QRCode(ambienteUnidadeEscolar.hash);

    if(!base64) {
        return await ctrl.gerarRetornoErro(res, 'Erro ao gerar o QRCode.');
    }

    const arquivo = await gerarArquivoPDF(ambienteUnidadeEscolar, base64);

    if(!arquivo) {
        return await ctrl.gerarRetornoErro(res, 'Erro ao gerar o arquivo PDF.');
    }

    await ctrl.gerarRetornoOk(res, {
        name: 'SME-QRCODE-' + moment().format('YYYYMMDD-HHmmss'),
        extension: 'pdf',
        buffer: arquivo
    });

    
}

function gerarBase64QRCode(hash) {

    return QRCode.toDataURL(hash)
    .then(url => url)
    .catch(err => null);

}

async function gerarArquivoPDF(ambienteUnidadeEscolar, base64) {

    const options = {
        type: 'pdf',
        format: 'A4',
        orientation: 'portrait',
        border: '20mm',
    };

    const html = await montarHTML(ambienteUnidadeEscolar, base64);

    return new Promise((resolve, reject) => {
        pdf.create(html, options).toBuffer((error, buffer) => {
            if(error) resolve();
            resolve(buffer);      
        });
    });

}

async function montarHTML(ambienteUnidadeEscolar, base64) {
    return `
        <style>${getStyle()}</style>
        <div style="width: 100%; height: 100%; text-align: center; vertical-align: middle">
            <img alt="" src="${getBase64Logo()}" class="mb-50 responsive-logo">
            <p class="fs-36 text-bold">${ambienteUnidadeEscolar.descricao}</p>
            <img src="${base64}" class="responsive-qrcode"></img>
            <p class="fs-12 text-left mt-30"><b>Tipo de Ambiente: </b> ${ambienteUnidadeEscolar.tipoAmbiente}</p>
            <p class="fs-12 text-left"><b>Unidade Escolar: </b> ${ambienteUnidadeEscolar.unidadeEscolar}</p>
            <p class="fs-12 text-left"><b>DRE: </b> ${ambienteUnidadeEscolar.diretoriaRegional}</p>
            <p class="fs-10 mt-80">${ambienteUnidadeEscolar.hash}</p>
        </div>
    `;
}

function getStyle() {
    return fs.readFileSync('api/web/plano-trabalho/ambiente/ambiente-unidade-escolar/pdf.css', {
        encoding: 'utf8'
    });
}

function getBase64Logo() {
    const file = fs.readFileSync('assets/img/logo-preto-vertical.png', {
        encoding: 'base64'
    });
    return 'data:image/png;base64,' + file;
}