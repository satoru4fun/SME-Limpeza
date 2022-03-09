(function () {
	
	'use strict';
	
	angular
	.module('monitoramento.monitoramento-agendamento')
	.controller('MonitoramentoAgendamento', MonitoramentoAgendamento);
	
	MonitoramentoAgendamento.$inject = ['$rootScope', 'controller', 'MonitoramentoRest', 
		'TurnoUtils', 'UnidadeEscolarUtils', 'AmbienteUnidadeEscolarUtils'];
	
	function MonitoramentoAgendamento($rootScope, controller, dataservice, 
		TurnoUtils, UnidadeEscolarUtils, AmbienteUnidadeEscolarUtils) {
		
		var vm = this;

		vm.model = {};

		vm.salvar = salvar;
		vm.evtChangeUnidadeEscolar = evtChangeUnidadeEscolar;
		vm.fecharModal = fecharModal;
		vm.verificarFormulario = verificarFormulario;

		vm.optionsSummernote = {
			height: 300,
			focus: true,
			toolbar: [
				['edit',['undo','redo']],
				['alignment', ['ul', 'ol']]
			]
		};

		vm.optionsDatePicker = {
			minMode: 'day', 
			minDate: $rootScope.usuario.usuarioOrigem.codigo == 'ue' ? moment().add(2, 'days') : moment()
		};

		iniciar();
		
		async function iniciar() {

			if(!['dre', 'ue'].includes($rootScope.usuario.usuarioOrigem.codigo)) {
				return fecharModal();
			}

			vm.model.data = $rootScope.usuario.usuarioOrigem.codigo == 'ue' ? new Date(moment().add(2, 'days')) : new Date();
			await carregarComboTurno();
			await carregarComboUnidadeEscolar();
			await carregarComboAmbiente();

		}

		async function carregarComboTurno() {

			TurnoUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.turnoList = response.objeto;
			}

			function error(response) {
				vm.turnoList = [];
				controller.feed('error', 'Erro ao buscar turnos.');
			}

		}

		async function carregarComboUnidadeEscolar() {

			UnidadeEscolarUtils.carregarCombo().then(success).catch(error);

			function success(response) {
				vm.unidadeEscolarList = response.objeto;
			}

			function error(response) {
				vm.unidadeEscolarLista = [];
				controller.feed('error', 'Erro ao buscar combo de unidades escolares.');
			}

		}

		async function carregarComboAmbiente() {

			AmbienteUnidadeEscolarUtils.carregarCombo(vm.model.idUnidadeEscolar).then(success).catch(error);

			function success(response) {
				vm.ambienteUnidadeEscolarList = response.objeto;
			}

			function error(response) {
				vm.ambienteUnidadeEscolarList = [];
				controller.feed('error', 'Erro ao buscar lista de ambientes da unidade escolar.');
			}

		}
		
		async function salvar(formulario) {

			if(!verificarFormulario(formulario)) {
				return;
			}

			dataservice.inserir(vm.model).then(success).catch(error);

			function success(response) {
				controller.feed('success', 'Monitoramento agendado com com sucesso.');
				fecharModal(true);
			}

			function error(response) {
				controller.feed('error', 'Erro ao agendar monitoramento.');
			}

		}

		function evtChangeUnidadeEscolar() {

			if(!vm.model.idUnidadeEscolar) {
				return;
			}

			vm.ambienteUnidadeEscolarList = [];
			vm.model.idAmbienteUnidadeEscolar = null;
			carregarComboAmbiente();

		}
		
		function fecharModal(result = false) {
			vm.$close({ DataSend: result} );
		}

		function verificarFormulario(formulario) {

			if(formulario.$invalid) {
				return false;
			}

			if(calcularCaracteresAtividades() < 3) {
				return false;
			}

			return true;

		}

		function calcularCaracteresAtividades() {
            
            if(!vm.model.descricao) {
                return 0;
            }

            let plainText = vm.model.descricao
                .replace(/<\/p>/gi, "\n")
                .replace(/<br\/?>/gi, "\n")
                .replace(/&nbsp;/gi, "")
                .replace(/<\/?[^>]+(>|$)/g, "");

            return plainText.length;

        }
		
	}
	
})();