(function () {

	'use strict';

	angular
		.module('app')
		.config(routes);

	routes.$inject = ['$routeProvider'];

	function routes($routeProvider) {

		$routeProvider
		.when('/diretoria-regional/', {
			templateUrl: 'src/diretoria-regional/diretoria-regional-lista.html',
			controller: 'DiretoriaRegionalLista',
			controllerAs: 'vm',
			reloadOnSearch: false
		});

	}

})();