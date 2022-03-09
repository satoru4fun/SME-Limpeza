(function () {
	
	'use strict';
	
	angular
	.module('usuario.usuario')
	.controller('UsuarioController', UsuarioController);
	
	UsuarioController.$inject = ['$rootScope', '$scope', 'controller', 'UsuarioRest', 'tabela', '$uibModal', 'UsuarioOrigemUtils', 
		'UsuarioCargoUtils', 'UsuarioStatusUtils', 'DiretoriaRegionalUtils', 'UnidadeEscolarUtils', 'PrestadorServicoUtils'];
	
	function UsuarioController($rootScope, $scope, controller, dataservice, tabela, $uibModal, UsuarioOrigemUtils, 
		UsuarioCargoUtils, UsuarioStatusUtils, DiretoriaRegionalUtils, UnidadeEscolarUtils, PrestadorServicoUtils) {
		/* jshint validthis: true */

		var vm = this;
		
		vm.instancia = {};
		vm.tabela = {};

		vm.abrirModal = abrirModal;
		vm.fecharModal = fecharModal;
		vm.salvar = salvar;

		vm.evtChangeUsuarioOrigem = evtChangeUsuarioOrigem;
		vm.recarregarTabela = recarregarTabela;
		
		iniciar();
		
		function iniciar() {
			montarTabela();
			carregarComboUsuarioOrigem();
			carregarComboUsuarioStatus();
		}
		
		function montarTabela() {

			criarOpcoesTabela();

			function carregarObjeto(aData) {
				dataservice.buscar(aData.id).then((response) => {
					abrirModal(aData.id, controller.ler(response, 'data'));
				});
			}

			function criarColunasTabela() {

				var colunas = [
					{data: 'nome', title: 'Nome'},
					{data: 'email', title: 'E-mail'},
					{data: 'usuarioStatus', title: 'Situação', renderWith: (usuarioStatus) => {
						return `<div class="badge ${usuarioStatus.classeLabel}">${usuarioStatus.descricao}</div>`;
					}},
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

		function carregarComboUsuarioOrigem() {

			UsuarioOrigemUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.usuarioOrigemList = response.objeto;
			}

			function error(response) {
				vm.usuarioOrigemList = [];
				controller.feed('error', 'Não foi possível carregar a combo de origem.');
			}

		}

		function carregarComboUsuarioStatus() {

			UsuarioStatusUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.usuarioStatusList = response.objeto;
			}

			function error(response) {
				vm.usuarioStatusList = [];
				controller.feed('error', 'Não foi possível carregar a combo de status.');
			}

		}

		function evtChangeUsuarioOrigem() {
			vm.origemSelecionada = vm.usuarioOrigemList.find(origem => origem.id == vm.modal.model.idUsuarioOrigem);
			carregarComboUsuarioCargo();
			carregarComboOrigemDetalhe();
		}

		function carregarComboUsuarioCargo() {

			if(!vm.modal.model.idUsuarioOrigem) {
				return;
			}

			UsuarioCargoUtils.carregarCombo(vm.modal.model.idUsuarioOrigem).then(success).catch(error);

			function success(response) {
				vm.usuarioCargoList = response.objeto;
			}

			function error(response) {
				vm.usuarioCargoList = [];
				controller.feed('error', 'Não foi possível carregar a combo de cargos.');
			}

		}

		function carregarComboOrigemDetalhe() {

			switch(vm.origemSelecionada.codigo) {
				case 'dre'	: DiretoriaRegionalUtils.carregarComboTodos().then(success).catch(error); break;
				case 'ue'	: UnidadeEscolarUtils.carregarComboTodos().then(success).catch(error); break;
				case 'ps'	: PrestadorServicoUtils.carregarComboTodos().then(success).catch(error); break;
			}

			function success(response) {
				vm.origemDetalheList = response.objeto;
			}

			function error(response) {
				vm.origemDetalheList = [];
				controller.feed('error');
			}

		}

		function salvar(formulario) {

			if(formulario.$invalid) {
				return;
			}

			if(vm.modal.isEditar) {
				dataservice.atualizar(vm.modal.model.id, vm.modal.model).then(success).catch(error);
			} else {
				dataservice.inserir(vm.modal.model).then(success).catch(error);
			}

			function success(response) {
				controller.feed('success', 'Registro salvo com sucesso.');
				tabela.recarregarDados(vm.instancia);
				fecharModal();
			}

			function error(response) {
				controller.feedMessage(response);
			}

		}

		function abrirModal(id, usuario) {

			vm.modal = $uibModal.open({
				templateUrl: 'src/usuario/usuario/usuario-form.html?' + new Date(),
				backdrop: 'static',
				scope: $scope,
				size: 'lg',
				keyboard: false
			});

			vm.modal.model = angular.isDefined(usuario) ? angular.copy(usuario) : {};
			vm.modal.model.id = id;
			vm.modal.isEditar = angular.isDefined(usuario);
			evtChangeUsuarioOrigem();

		}

		function fecharModal() {
			vm.modal.close();
			delete vm.modal;
		}

		function recarregarTabela() {
			tabela.recarregarDados(vm.instancia);
		}

	}
})();