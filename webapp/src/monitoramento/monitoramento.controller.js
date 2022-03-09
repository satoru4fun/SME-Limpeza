(function () {
	
	'use strict';
	
	angular
	.module('app.monitoramento')
	.controller('MonitoramentoController', MonitoramentoController);
	
	MonitoramentoController.$inject = ['$rootScope', '$scope', 'controller', 'MonitoramentoRest', 
		'tabela', '$uibModal', 'SweetAlert', 'UnidadeEscolarUtils'];
	
	function MonitoramentoController($rootScope, $scope, controller, dataservice, 
		tabela, $uibModal, SweetAlert, UnidadeEscolarUtils) {
		/* jshint validthis: true */
		
		var vm = this;
		
		vm.instancia = {};
		vm.tabela = {};

		vm.optionsDatePicker = {minMode: 'day', minDate: moment()};
		vm.optionsDatePickerFiltro = {minMode: 'day'};
		
		vm.transferirData = transferirData;
		vm.fecharModalTransferencia = fecharModalTransferencia;

		vm.recarregarTabela = recarregarTabela;

		vm.abrirModalAgendamento = abrirModalAgendamento;

		iniciar();
		
		function iniciar() {
			carregarComboUnidadeEscolar();
			montarTabela();
		}

		function carregarComboUnidadeEscolar() {

			UnidadeEscolarUtils.carregarComboTodos().then(success).catch(error);

			function success(response) {
				vm.unidadeEscolarList = response.objeto;
			}

			function error(response) {
				vm.unidadeEscolarLista = [];
				controller.feed('error', 'Erro ao buscar combo de unidades escolares.');
			}

		}
		
		function montarTabela() {

			criarOpcoesTabela();

			function criarColunasTabela() {

				var colunas = [
					{data: '', title: 'Data', renderWith: (var1, var2, data) => {
						return `
							<h5>${moment(data.data).format('DD/MM/YYYY')}</h5>
							<small>${data.periodicidade.descricao} - ${data.turno.descricao}</small>
						`;
					}},
					{data: '', title: 'Ambiente', renderWith: (var1, var2, data) => {
						return `
							<h5 style="font-weight: 100">${data.ambiente.descricao}</h5>
							<small>${data.ambiente.tipo} - ${data.ambiente.area}m²</small>
						`;
					}}
				];

				if($rootScope.usuario.usuarioOrigem.codigo != 'ps') {
					colunas.push({data: '', width: 20, title: 'Prestador de Serviço', renderWith: (var1, var2, data) => {
						return `
							<h5 style="font-weight: 100">${data.prestadorServico.razaoSocial}</h5>
							<small>CNPJ: ${controller.formatarCnpj(data.prestadorServico.cnpj)}</small>
						`;
					}});
				}

				if($rootScope.usuario.usuarioOrigem.codigo != 'ue') {
					colunas.push({data: '', width: 20, title: 'Unidade Escolar', renderWith: (var1, var2, data) => {
						return `
							<h5 style="font-weight: 100">${data.unidadeEscolar.descricao}</h5>
							<small>${data.unidadeEscolar.endereco}</small>
						`;
					}});
				}

				colunas.push({data: 'flagRealizado', title: 'Realizado', width: 10, cssClass: 'text-right', renderWith: tabela.booleanParaBadgeSimNao});
				colunas.push({data: 'flagPossuiOcorrencia', title: 'Ocorrência', width: 10, cssClass: 'text-right', renderWith: tabela.booleanParaBadgeSimNao});
				colunas.push({data: 'id', title: 'Ações', width: 15, cssClass: 'text-right', renderWith: (var1, var2, data) => {
					var html = '';
					if($rootScope.usuario.usuarioOrigem.codigo == 'ue' && $rootScope.usuario.usuarioCargo.id == 2) {
						html += `
							<button class="mr-1 btn btn-outline-info btn-sm transferir" title="Reagendar">
								<i class="icon-calendar"></i>
							</button>
							<button class="mr-1 btn btn-outline-danger btn-sm remover" title="Remover">
								<i class="icon-trash"></i>
							</button>
						`;
					}
					html += `<button class="btn btn-outline-primary btn-sm visualizar" title="Visualizar"><i class="icon-eye"></i></button>`;
					return html;
				}});

				vm.tabela.colunas = tabela.adicionarColunas(colunas);

			}

			function criarOpcoesTabela() {

				vm.tabela.opcoes = tabela.criarTabela(ajax, vm, null, 'data');
				vm.tabela.opcoes.withOption('rowCallback', rowCallback);
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

				function rowCallback(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
                
					$('.transferir', nRow).off('click');
					$('.transferir', nRow).on('click', function () {
						abrirModalTransferencia(aData);
					});
	
					$('.visualizar', nRow).off('click');
					$('.visualizar', nRow).on('click', function () {
						$rootScope.$evalAsync(function () {
							window.open('monitoramento/detalhe/' + aData.id, '_blank');
						});
					});

					$('.remover', nRow).off('click');
					$('.remover', nRow).on('click', function () {
						remover(aData);
					});
	
				}

			}

		}

		function abrirModalTransferencia(monitoramento) {

			if($rootScope.usuario.usuarioOrigem.codigo != 'ue' || $rootScope.usuario.usuarioCargo.id != 2) {
				return;
			}
			
			if(monitoramento.flagRealizado) {
				return SweetAlert.swal({
					title: "Opss!",	
					text: "Você não pode alterar a data deste monitoramento pois ele já foi realizado!",
					type: "error",
					showCancelButton: false,
					confirmButtonColor: '#3F51B5',
					confirmButtonText: 'Certo, entendi!',
					closeOnConfirm: true,
				});
			}

			if(!monitoramento.flagAtivo) {
				return SweetAlert.swal({
					title: "Opss!",	
					text: "Você não pode reagendar um monitoramento que já foi removido!",
					type: "error",
					showCancelButton: false,
					confirmButtonColor: '#3F51B5',
					confirmButtonText: 'Certo, entendi!',
					closeOnConfirm: true,
				});
			}

			vm.modalTransferencia = $uibModal.open({
				templateUrl: 'src/monitoramento/monitoramento-transferencia-modal.html?' + new Date(),
				backdrop: 'static',
				scope: $scope,
				size: 'md',
				keyboard: false,
			});

			vm.optionsDatePicker.minDate = moment(monitoramento.data).add(1, 'days');
			vm.modalTransferencia.model = angular.copy(monitoramento);
			vm.modalTransferencia.model.id = monitoramento.id;		

		}

		function transferirData() {

			if($rootScope.usuario.usuarioOrigem.codigo != 'ue' || $rootScope.usuario.usuarioCargo.id != 2) {
				return;
			}

			var novaData = vm.modalTransferencia.model.novaData;

			if(!novaData) {
				return controller.feed('error', 'Informe a nova data.');
			}

			if(moment(novaData).isSame(vm.modalTransferencia.model.data, 'day')) {
				return controller.feed('error', 'Informe uma data diferente da data atual do plano de trabalho.');
			}

			dataservice.atualizar(vm.modalTransferencia.model.id, vm.modalTransferencia.model).then(success).catch(error);

			function success(response) {
				controller.feed('success', 'Monitoramento reagendado com sucesso');
				tabela.recarregarDados(vm.instancia);
				fecharModalTransferencia();
			}

			function error(response) {
				controller.feed('error', 'Erro ao reagendar o monitoramento.');
			}

		}

		function remover(monitoramento) {

			if($rootScope.usuario.usuarioOrigem.codigo != 'ue' || $rootScope.usuario.usuarioCargo.id != 2) {
				return;
			}

			if(monitoramento.flagRealizado) {
				return SweetAlert.swal({
					title: "Opss!",	
					text: "Você não pode remover um monitoramento que já foi realizado!",
					type: "error",
					showCancelButton: false,
					confirmButtonColor: '#3F51B5',
					confirmButtonText: 'Certo, entendi!',
					closeOnConfirm: true,
				});
			}

			if(!monitoramento.flagAtivo) {
				return SweetAlert.swal({
					title: "Opss!",	
					text: "Você não pode remover um monitoramento que já foi removido!",
					type: "error",
					showCancelButton: false,
					confirmButtonColor: '#3F51B5',
					confirmButtonText: 'Certo, entendi!',
					closeOnConfirm: true,
				});
			}

			SweetAlert.swal({
                title: "Tem certeza?",	
                text: "Você não poderá desfazer essa ação!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: '#3F51B5',
                cancelButtonColor: '#FF4081',
                confirmButtonText: "Remover",
                cancelButtonText: 'Cancelar',
                closeOnConfirm: true,
            }, (isConfirm) => { 
				if(isConfirm) {
					dataservice.remover(monitoramento.id).then(success).catch(error);
				}
			 });   

			function success(response) {
				controller.feed('success', 'Monitoramento removido com sucesso.');
				tabela.recarregarDados(vm.instancia);
			}

			function error(response) {
				controller.feed('error', 'Erro ao remover o monitoramento.');
			}
			
		}

		function fecharModalTransferencia() {
			vm.modalTransferencia.close();
			delete vm.modalTransferencia;
		}

		function recarregarTabela() {
			tabela.recarregarDados(vm.instancia);
		}

		function abrirModalAgendamento() {

			vm.modalAgendamento = $uibModal.open({
				templateUrl: 'src/monitoramento/monitoramento-agendamento/monitoramento-agendamento.html?' + new Date(),
				bindToController: true,
				controller: 'MonitoramentoAgendamento',
                controllerAs: 'vm',
				backdrop: 'static',
				size: 'lg',
				keyboard: false,
			}).result.then((retorno) => {
				if(retorno.DataSend) {
					recarregarTabela();
				}
			});	
			
		}

	}
	
})();