(function () {
	'use strict';

	angular
	.module('ocorrencia.ocorrencia-tipo')
	.factory('OcorrenciaTipoUtils', OcorrenciaTipoUtils);

	OcorrenciaTipoUtils.$inject = ['controller', 'OcorrenciaTipoRest'];

	function OcorrenciaTipoUtils(utils, dataservice) {

		var service = {
			carregarCombo: carregarCombo,
			carregarComboCadastro: carregarComboCadastro
		};

		return service;

		function carregarCombo() {

			return dataservice.carregarCombo().then(success).catch(error);

			function success(response) {
				return utils.criarRetornoPromise(true, utils.ler(response, 'data'));
			}

			function error(response) {
				return utils.criarRetornoPromise(false, []);
			}

		}

		function carregarComboCadastro() {

			return dataservice.carregarComboCadastro().then(success).catch(error);

			function success(response) {
				return utils.criarRetornoPromise(true, utils.ler(response, 'data'));
			}

			function error(response) {
				return utils.criarRetornoPromise(false, []);
			}

		}

	}
	
})();