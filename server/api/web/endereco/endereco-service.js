const ctrl = require('rfr')('core/controller');
const utils = require('rfr')('core/utils/utils.js');

const cepPromise = require('cep-promise');
const { Client } = require("@googlemaps/google-maps-services-js");

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

    const client = new Client({});

    await client.geocode({
        params: {
            address: req.params.endereco + ',Brasil',
            key: process.env.GEOCODE_API
        },
        timeout: 1000 // milliseconds
    }).then(async (response) => {
        await ctrl.gerarRetornoOk(res, response.data.results[0].geometry.location);
    }).catch(async (error) => {
        console.log(error);
        await ctrl.gerarRetornoErro(res, 'Houve um erro ao buscar as coordenadas por endereço.');
    });

}