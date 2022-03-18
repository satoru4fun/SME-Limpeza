(() => {
	
	'use strict';
	
	angular
	.module('relatorio-contrato.relatorio-contrato-detalhe')
	.controller('RelatorioContratoDetalheController', RelatorioContratoDetalheController);
	
	RelatorioContratoDetalheController.$inject = ['$rootScope', 'controller', '$routeParams', 'RelatorioContratoRest', '$location'];
	
	function RelatorioContratoDetalheController($rootScope, controller, $routeParams, dataservice, $location) {
		/* jshint validthis: true */

		var vm = this;

		vm.formatarPercentual = formatarPercentual;
		vm.formatarDecimal = formatarDecimal;

		iniciar();
		
		function iniciar() {

			vm.anoReferencia = $routeParams.ano;
			vm.mesReferencia = $routeParams.mes;
			vm.idContrato = $routeParams.idContrato;

			if(!vm.anoReferencia || !vm.mesReferencia || !vm.idContrato) {
				redirecionarListagem();
			}

			buscar();

		}

		function buscar() {

			dataservice.buscar(vm.anoReferencia, vm.mesReferencia, vm.idContrato).then(success).catch(error);

			function success(response) {
				vm.dados = controller.ler(response, 'data');
			}

			function error(response) {
				controller.feedMessage(response);
				redirecionarListagem();
			}
			
		}

		function redirecionarListagem() {
			$rootScope.$evalAsync(function () {
				$location.path('relatorio/contrato');
			});
		}

		function formatarPercentual(value) {

			if(value === null || value === undefined) {
				return ' - ';
			}

			return formatarDecimal(value) + '%';
			
		}

		function formatarDecimal(value) {

			if(value === null || value === undefined) {
				return ' - ';
			}

			return parseFloat(value).toFixed(2);
			
		}

	}
	
})();