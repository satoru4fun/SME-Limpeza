(function () {

	'use strict';

	angular
	.module('app.contrato')
	.factory('ContratoUtils', ContratoUtils);

	ContratoUtils.$inject = ['controller', 'ContratoRest'];

	function ContratoUtils(utils, dataservice) {

		let service = {
			buscarVencimentoProximo: buscarVencimentoProximo
		};

		return service;

		function buscarVencimentoProximo(quantidadeDias) {

			return dataservice.buscarVencimentoProximo(quantidadeDias).then(success).catch(error);

			function success(response) {
				return utils.criarRetornoPromise(true, utils.ler(response, 'data'));
			}

			function error(response) {
				return utils.criarRetornoPromise(false, []);
			}

		}

	}
	
})();