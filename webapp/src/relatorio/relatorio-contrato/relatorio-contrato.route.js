(() => {

	'use strict';

	angular
	.module('app')
	.config(routes);

	routes.$inject = ['$routeProvider'];

	function routes($routeProvider) {

		$routeProvider
		.when('/relatorio/contrato/', {
			templateUrl: 'src/relatorio/relatorio-contrato/relatorio-contrato-lista.html',
			controller: 'RelatorioContratoController',
			controllerAs: 'vm',
			reloadOnSearch: false
		})
		.when('/relatorio/contrato/detalhe/:ano/:mes/:idContrato', {
			templateUrl: 'src/relatorio/relatorio-contrato/relatorio-contrato-detalhe/relatorio-contrato-detalhe.html',
			controller: 'RelatorioContratoDetalheController',
			controllerAs: 'vm',
			reloadOnSearch: false
		});

	}

})();