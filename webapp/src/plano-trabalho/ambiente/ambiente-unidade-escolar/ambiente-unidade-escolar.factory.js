(function () {
	'use strict';

	angular
	.module('ambiente.ambiente-unidade-escolar')
	.factory('AmbienteUnidadeEscolarUtils', AmbienteUnidadeEscolarUtils);

	AmbienteUnidadeEscolarUtils.$inject = ['controller', 'AmbienteUnidadeEscolarRest'];

	function AmbienteUnidadeEscolarUtils(utils, dataservice) {

		var service = {
			carregarCombo: carregarCombo,
			carregarComboPorAmbienteGeral: carregarComboPorAmbienteGeral,
		};

		return service;

		function carregarCombo(idUnidadeEscolar) {

			return dataservice.carregarCombo(idUnidadeEscolar).then(success).catch(error);

			function success(response) {
				return utils.criarRetornoPromise(true, utils.ler(response, 'data'));
			}

			function error(response) {
				return utils.criarRetornoPromise(false, []);
			}

		}

		function carregarComboPorAmbienteGeral(idUnidadeEscolar, idAmbienteGeral) {

			return dataservice.carregarComboPorAmbienteGeral(idUnidadeEscolar, idAmbienteGeral).then(success).catch(error);

			function success(response) {
				return utils.criarRetornoPromise(true, utils.ler(response, 'data'));
			}

			function error(response) {
				return utils.criarRetornoPromise(false, []);
			}

		}

	}
	
})();