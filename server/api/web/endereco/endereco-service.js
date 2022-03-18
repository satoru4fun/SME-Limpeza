const ctrl = require('rfr')('core/controller');
const utils = require('rfr')('core/utils/utils.js');

const cepPromise = require('cep-promise');
const axios = require('axios');

exports.buscarPorCep = buscarPorCep;
exports.buscarCoordenadas = buscarCoordenadas;

async function buscarPorCep(req, res) {
    
    const cep = req.params.cep;

    if(!cep) {
        return await ctrl.gerarRetornoErro(res, 'CEP inválido.');
    }

    try {

        const response = await cepPromise(cep);

        if(response.state != 'SP') {
            return await ctrl.gerarRetornoErro(res, 'O CEP informado não é do estado de São Paulo.');
        }

        if(response.city != 'São Paulo') {
            return await ctrl.gerarRetornoErro(res, 'O CEP informado não é da cidade de São Paulo.');
        }

        const endereco = {
            logradouro: response.street,
            bairro: response.neighborhood,
            localidade: response.city,
            uf: response.state
        };

        await ctrl.gerarRetornoOk(res, endereco);

    } catch(e) {    
        console.error(e);
        return await ctrl.gerarRetornoErro(res, 'Houve um erro ao localizar os dados do CEP.');
    }

}

async function buscarCoordenadas(req, res) {

    const data = {
        'text': req.params.endereco,
        'layers':  'address',
        'boundary.gid': 'whosonfirst:locality:101965533'
    };
    
    const parameters = new URLSearchParams(data);
      
    axios.get('https://georef.sme.prefeitura.sp.gov.br/v1/search?' + parameters)
        .then((response) => {
            ctrl.gerarRetornoOk(res, {
                lng: response.data.features[0].geometry.coordinates[0],
                lat: response.data.features[0].geometry.coordinates[1]
            });
        }).catch((err) => {
            console.error(err);
            ctrl.gerarRetornoErro(res, 'Houve um erro ao buscar as coordenadas por endereço.');
        });

}