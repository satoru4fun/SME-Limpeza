const ctrl = require('rfr')('core/controller.js');
const utils = require('rfr')('core/utils/utils.js');

const fs = require('fs');

exports.download = download;

async function download(req, res) {

    try {
        const arquivo = await fs.readFileSync('/opt/apps/sme-prefeitura-sao-paulo/server/api/web/aplicativo/aplicativo.apk');
        await ctrl.gerarRetornoOk(res, arquivo);
    } catch(error) {
        console.log(error);
        await ctrl.gerarRetornoErro(res);
    }
    
}