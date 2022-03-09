(function () {
	'use strict';

	angular
	.module('ocorrencia.ocorrencia-variavel')
	.factory('OcorrenciaVariavelUtils', OcorrenciaVariavelUtils);

	OcorrenciaVariavelUtils.$inject = ['controller', 'OcorrenciaVariavelRest'];

	function OcorrenciaVariavelUtils(utils, dataservice) {

		var service = {
			carregarComboCadastro: carregarComboCadastro
		};

		return service;

		function carregarComboCadastro(flagApenasMonitoramento) {

			return dataservice.carregarComboCadastro(flagApenasMonitoramento).then(success).catch(error);

			function success(response) {
				return utils.criarRetornoPromise(true, utils.ler(response, 'data'));
			}

			function error(response) {
				return utils.criarRetornoPromise(false, []);
			}

		}

	}
	
})();