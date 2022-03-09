(function () {

	'use strict';

	angular
		.module('app')
		.config(routes);

	routes.$inject = ['$routeProvider'];

	function routes($routeProvider) {

		$routeProvider
		.when('/plano-trabalho/ambiente/ambiente-unidade-escolar', {
			templateUrl: 'src/plano-trabalho/ambiente/ambiente-unidade-escolar/ambiente-unidade-escolar-lista.html',
			controller: 'AmbienteUnidadeEscolarController',
			controllerAs: 'vm',
			reloadOnSearch: false
		});

	}

})();