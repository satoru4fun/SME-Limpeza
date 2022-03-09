(() => {

    'use strict';

    angular
    .module('ocorrencia.ocorrencia-form')
    .controller('OcorrenciaForm', OcorrenciaForm);

    OcorrenciaForm.$inject = ['$scope', '$rootScope', 'controller', '$uibModal', 'OcorrenciaRest', 'OcorrenciaVariavelUtils'];

    function OcorrenciaForm($scope, $rootScope, controller, $uibModal, dataservice, OcorrenciaVariavelUtils) {
        /*jslint evil: true */

        var vm = this;

        vm.fecharModal = fecharModal;
        vm.expandirImagem = expandirImagem;
        vm.evtErroUpload = evtErroUpload;
        vm.evtUploadStart = evtUploadStart;

        vm.salvar = salvar;

        vm.optionsDatePicker = {minMode: 'day', maxDate: moment()};

        iniciar();

        function iniciar() {
            
            vm.model = {};
            vm.model.data = new Date();

            if(vm.$resolve.modalOptions && vm.$resolve.modalOptions.monitoramento) {
                vm.model.monitoramento = vm.$resolve.modalOptions.monitoramento;
            }

            if($rootScope.usuario.usuarioOrigem.codigo != 'ue' || $rootScope.usuario.usuarioCargo.id != 3) {
                fecharModal();
                return;
            }

            carregarComboOcorrenciaVariavel();

        }

        function carregarComboOcorrenciaVariavel() {

            const flagApenasMonitoramento = angular.isDefined(vm.model.monitoramento);

			OcorrenciaVariavelUtils.carregarComboCadastro(flagApenasMonitoramento).then(success).catch(error);

			function success(response) {
				vm.ocorrenciaVariavelList = response.objeto;
			}

			function error(response) {
				vm.ocorrenciaVariavelList = [];
				controller.feed('error', 'Erro ao buscar combo de ocorrências.');
			}

        }
        
        function salvar(formulario) {

			if(formulario.$invalid) {
				return;
            }

			dataservice.inserir(vm.model).then(success).catch(error);

			function success(response) {
				controller.feed('success', 'Ocorrência salva com sucesso.');
				fecharModal();
			}

			function error(response) {
				controller.feed('error', 'Erro ao salvar ocorrência.');
			}

		}

        function expandirImagem(index) {

            vm.myInterval = 5000;
            vm.noWrapSlides = false;
            vm.active = index;

            $uibModal.open({
                animation: true,
                windowClass: 'modal-arquivos',
                template: `
                    <div class="modal-body p-0">
                        <div uib-carousel active="vm.active">
                            <div uib-slide ng-repeat="arquivo in vm.model.arquivoList" index="$index">
                                <img class="img-fluid" src="data:image/jpg;base64,{{arquivo.base64}}">
                                <div class="carousel-caption">
                                    <h4>{{arquivo.filename}}</h4>
                                </div>
                            </div>
                        </div>
                    </div>`,
                backdrop: true,
                scope: $scope,
                size: 'lg',
				keyboard: false,
            });

        }

        function fecharModal() {
            vm.$close();
        }

        function evtUploadStart(event, reader, file, fileList, fileObjs, object) {
            var tiposAceitos = ['image/jpeg', 'image/png'];
            if(!tiposAceitos.includes(object.filetype)) {
                controller.feed('Tipo de arquivo não aceito.');
                reader.abort();
            }
        }


        function evtErroUpload(event, reader, file) {
            console.log('An error occurred while reading file: ' + file.name);
            reader.abort();
        }

    }

})();