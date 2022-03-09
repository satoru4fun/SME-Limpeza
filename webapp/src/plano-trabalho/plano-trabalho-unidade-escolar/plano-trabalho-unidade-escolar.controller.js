(function () {
	
	'use strict';
	
	angular
	.module('plano-trabalho.plano-trabalho-unidade-escolar')
	.controller('PlanoTrabalhoUnidadeEscolarController', PlanoTrabalhoUnidadeEscolarController);
	
	PlanoTrabalhoUnidadeEscolarController.$inject = ['$scope', 'controller', 'PlanoTrabalhoUnidadeEscolarRest', 'tabela', '$uibModal', 'PeriodicidadeUtils', 
		'AmbienteUnidadeEscolarUtils', 'TipoAmbienteUtils'];
	
	function PlanoTrabalhoUnidadeEscolarController($scope, controller, dataservice, tabela, $uibModal, PeriodicidadeUtils, 
			AmbienteUnidadeEscolarUtils, TipoAmbienteUtils) {
		/* jshint validthis: true */

		var vm = this;
		
		vm.instancia = {};
		vm.tabela = {};

		vm.abrirModalCadastro = abrirModalCadastro;
		vm.recarregarTabela = recarregarTabela;

		iniciar();
		
		function iniciar() {
			carregarComboTipoAmbiente();
			carregarComboAmbiente();
			carregarComboPeriodicidade();
			montarTabela();
		}
		
		function montarTabela() {

			criarOpcoesTabela();

			function carregarObjeto(aData) {
				dataservice.buscar(aData.id).then((response) => {
					abrirModalCadastro(controller.ler(response, 'data'));
				});
			}

			function criarColunasTabela() {

				var colunas = [
					{data: 'ambiente', title: 'Ambiente'},
					{data: 'tipoAmbiente', title: 'Tipo do Ambiente', cssClass: 'text-right'},
					{data: 'periodicidade.descricao', title: 'Periodicidade', cssClass: 'text-right'},
					{data: 'turno.descricao', title: 'Turno', cssClass: 'text-right'},
					{data: 'id', title: 'Ações', width: 15, cssClass: 'text-right', renderWith: tabela.criarBotaoPadrao}
				];

				vm.tabela.colunas = tabela.adicionarColunas(colunas);

			}

			function criarOpcoesTabela() {

				vm.tabela.opcoes = tabela.criarTabela(ajax, vm, remover, 'data', carregarObjeto);
				criarColunasTabela();

				function ajax(data, callback, settings) {

					dataservice.tabela(tabela.criarParametros(data, vm.filtros)).then(success).catch(error);

					function success(response) {
						callback(controller.lerRetornoDatatable(response));
					}

					function error(response) {
						callback(tabela.vazia());
					}

				}

				function remover(id) {
					
					dataservice.remover(id).then(success).catch(error);

					function success(response) {
						controller.feed('success', 'Registro removido com sucesso.');
						tabela.recarregarDados(vm.instancia);
					}

					function error(response) {
						controller.feed('error', 'Erro ao remover registro.');				
					}

				}

			}

		}

		function carregarComboTipoAmbiente() {
			
			TipoAmbienteUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.tipoAmbienteList = response.objeto;
			}

			function error(response) {
				vm.tipoAmbienteList = [];
				controller.feed(false, 'Erro ao carregar tipos de ambiente.');
			}
		}

		function carregarComboAmbiente(idAmbienteGeral) {

			AmbienteUnidadeEscolarUtils.carregarCombo().then(success).catch(error);
			
			function success(response) {
				vm.ambienteUnidadeEscolarList = response.objeto;
			}

			function error(response) {
				vm.ambienteUnidadeEscolarList = [];
				controller.feed('error', 'Erro ao buscar lista de ambientes da unidade escolar.');
			}

		}

		function carregarComboPeriodicidade() {

			PeriodicidadeUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.periodicidadeList = response.objeto;
			}

			function error(response) {
				vm.periodicidadeList = [];
				controller.feed('error', 'Erro ao buscar periodicidades.');
			}

		}

		function abrirModalCadastro(planoTrabalho) {

			vm.modalCadastro = $uibModal.open({
				templateUrl: 'src/plano-trabalho/plano-trabalho-unidade-escolar/cadastro/cadastro.html?' + new Date(),
				bindToController: true,
				controller: 'CadastroController',
                controllerAs: 'vm',
				backdrop: 'static',
				size: 'lg',
				keyboard: false,
				resolve: {
					modalOptions: [() => {
						return angular.copy(planoTrabalho);						
					}]
				}
			}).result.then((retorno) => {
				if(retorno.DataSend) {
					recarregarTabela();
				}
			});	
			
		}

		function recarregarTabela() {
			tabela.recarregarDados(vm.instancia);
		}

	}
	
})();