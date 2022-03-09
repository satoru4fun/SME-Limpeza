(() => {
	
	'use strict';

	angular
	.module('app.ocorrencia')
	.factory('OcorrenciaUtils', OcorrenciaUtils);

	OcorrenciaUtils.$inject = ['controller', 'OcorrenciaRest'];

	function OcorrenciaUtils(utils, dataservice) {

		let service = {
			buscarPrestadoresComReincidencia: buscarPrestadoresComReincidencia
		};

		return service;

		function buscarPrestadoresComReincidencia() {

			return dataservice.buscarPrestadoresComReincidencia().then(success).catch(error);

			function success(response) {
				return utils.criarRetornoPromise(true, utils.ler(response, 'data'));
			}

			function error(response) {
				return utils.criarRetornoPromise(false, []);
			}

		}

	}
	
})();