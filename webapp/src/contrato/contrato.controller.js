(function () {
	
	'use strict';
	
	angular
	.module('app.contrato')
	.controller('ContratoLista', ContratoLista);
	
	ContratoLista.$inject = ['SweetAlert', '$scope', 'controller', 'ContratoRest', 'tabela', '$uibModal', 'PrestadorServicoUtils', 'UnidadeEscolarUtils'];
	
	function ContratoLista(SweetAlert, $scope, controller, dataservice, tabela, $uibModal, PrestadorServicoUtils, UnidadeEscolarUtils) {
		/* jshint validthis: true */

		var vm = this;
		
		vm.instancia = {};
		vm.tabela = {};

		vm.optionsDatePicker = {minMode: 'day'};
		
		vm.abrirModal = abrirModal;
		vm.fecharModal = fecharModal;
		vm.salvar = salvar;

		vm.recarregarTabela = recarregarTabela;

		vm.abrirModalUnidadeEscolar = abrirModalUnidadeEscolar;
		vm.fecharModalUnidadeEscolar = fecharModalUnidadeEscolar;
		vm.salvarUnidadeEscolar = salvarUnidadeEscolar;
		vm.removerUnidadeEscolar = removerUnidadeEscolar;

		iniciar();
		
		function iniciar() {
			carregarComboPrestadorServico();
			montarTabela();
		}

		function carregarComboPrestadorServico() {

			PrestadorServicoUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.prestadorServicoList = response.objeto;
			}

			function error(response) {
				controller.feed('error', 'Erro ao buscar combo de prestadores.');
				vm.prestadorServicoList = [];
			}

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
					{data: 'codigo', title: 'Código'},
					{data: 'prestadorServico', title: 'Prestador de Serviço'},
					{data: 'dataInicial', title: 'Data Inicial', cssClass: 'text-right', renderWith: tabela.formatarData},
					{data: 'dataFinal', title: 'Data Final', cssClass: 'text-right', renderWith: tabela.formatarData},
					{data: 'flagAtivo', title: 'Ativo', cssClass: 'text-right', width: 12, renderWith: tabela.booleanParaBadgeSimNao},
					{data: 'quantidadeUnidadesEscolar', title: 'UE\'s', cssClass: 'text-right', width: 8, renderWith: function (total) {
						return `<div class="badge badge-pill badge-primary"> ${total} </div>`;
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

		function salvar(formulario) {

			if(formulario.$invalid) {
				return;
			}

			var valorTotalUnidades = (vm.modal.model.unidadeEscolarLista).reduce((accumulator, unidadeEscolar) => accumulator + unidadeEscolar.valor, 0 );

			if(parseFloat(vm.modal.model.valorTotal).toFixed(2) !== parseFloat(valorTotalUnidades).toFixed(2)) {
				controller.feed('warning', 'O valor total do contrato deve ser igual a soma dos valores das unidades escolares.');
				return;
			}

			if(vm.modal.isEditar) {
				dataservice.atualizar(vm.modal.model.id, vm.modal.model).then(success).catch(error);
			} else {
				dataservice.inserir(vm.modal.model).then(success).catch(error);
			}

			function success(response) {
				controller.feed('success', 'Contrato salvo com sucesso.');
				tabela.recarregarDados(vm.instancia);
				fecharModal();
			}

			function error(response) {
				controller.feed('error', 'Erro ao salvar contrato.');
				controller.feedMessage(response);
			}

		}

		function abrirModal(id, contrato) {

			carregarComboTodosPrestadorServico();

			vm.modal = $uibModal.open({
				templateUrl: 'src/contrato/contrato-form.html?' + new Date(),
				backdrop: 'static',
				scope: $scope,
				size: 'lg',
				keyboard: false
			});

			vm.modal.model = angular.isDefined(contrato) ? angular.copy(contrato) : {};
			vm.modal.model.unidadeEscolarLista = vm.modal.model.unidadeEscolarLista || [];
			vm.modal.model.dataInicial = vm.modal.model.dataInicial ? new Date(vm.modal.model.dataInicial) : null;
			vm.modal.model.dataFinal = vm.modal.model.dataFinal ? new Date(vm.modal.model.dataFinal) : null;
			vm.modal.model.id = id;
			vm.modal.isEditar = angular.isDefined(contrato);

		}

		function carregarComboTodosPrestadorServico() {

			PrestadorServicoUtils.carregarComboTodos().then(success).catch(error);

			function success(response) {
				vm.prestadorServicoTodosList = response.objeto;
			}

			function error(response) {
				controller.feed('error', 'Erro ao buscar combo de todos os prestadores.');
				vm.prestadorServicoTodosList = [];
			}

		}

		function fecharModal() {
			vm.modal.close();
			delete vm.modal;
		}

		function recarregarTabela() {
			tabela.recarregarDados(vm.instancia);
		}

		function abrirModalUnidadeEscolar(indice, unidadeEscolar) {

			carregarComboUnidadeEscolar();

			vm.modalUnidadeEscolar = $uibModal.open({
				templateUrl: 'src/contrato/contrato-form-unidade-escolar.html?' + new Date(),
				backdrop: 'static',
				scope: $scope,
				size: 'md',
				keyboard: false,
			});

			vm.modalUnidadeEscolar.model = angular.isDefined(unidadeEscolar) ? angular.copy(unidadeEscolar) : {};
			vm.modalUnidadeEscolar.index = indice;
			vm.modalUnidadeEscolar.isEditar = angular.isDefined(unidadeEscolar) && angular.isDefined(indice);

		}

		function fecharModalUnidadeEscolar() {
			vm.modalUnidadeEscolar.close();
			delete vm.modalUnidadeEscolar;
		}

		function salvarUnidadeEscolar(formularioUnidadeEscolar) {

			if(formularioUnidadeEscolar.$invalid) {
				return;
			}

			if(vm.modalUnidadeEscolar.isEditar) {
				vm.modal.model.unidadeEscolarLista[vm.modalUnidadeEscolar.index] = angular.copy(vm.modalUnidadeEscolar.model);
			} else {
				vm.modal.model.unidadeEscolarLista = vm.modal.model.unidadeEscolarLista || [];
				vm.modal.model.unidadeEscolarLista.push(angular.copy(vm.modalUnidadeEscolar.model));
			}

			fecharModalUnidadeEscolar();
			
		}

		function removerUnidadeEscolar(indice) {
			vm.modal.model.unidadeEscolarLista.splice(indice, 1);
		}

		function carregarComboUnidadeEscolar() {

			UnidadeEscolarUtils.carregarComboDetalhadoTodos().then(success).catch(error);

			function success(response) {
				var unidadeEscolarLista = response.objeto.filter(function (unidade) {
					return !vm.modal.model.unidadeEscolarLista.find(element => element.id == unidade.id);
				});
				vm.unidadeEscolarLista = unidadeEscolarLista;
			}

			function error(response) {
				vm.unidadeEscolarLista = [];
				controller.feed('error', 'Erro ao buscar combo de unidades escolares.');
			}

		}

	}
	
})();