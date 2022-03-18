(function() {

    'use strict';

    var configuracaoREST = {
        aplicativo: 'aplicativo',
        authenticate: 'auth',
        recuperacaoSenha: 'auth/recuperar-senha',
        usuario: 'usuario',
        usuarioOrigem: 'usuario/origem',
        usuarioCargo: 'usuario/cargo',
        usuarioStatus: 'usuario/status',
        endereco: 'endereco',
        feriado: 'feriado',
        diretoriaRegional: 'diretoria-regional',
        unidadeEscolar: 'unidade-escolar',
        prestadorServico: 'prestador-servico',
        contrato: 'contrato',
        periodicidade: 'plano-trabalho/periodicidade',
        turno: 'plano-trabalho/turno',
        tipoAmbiente: 'plano-trabalho/ambiente/tipo-ambiente',
        ambienteGeral: 'plano-trabalho/ambiente/ambiente-geral',
        ambienteUnidadeEscolar: 'plano-trabalho/ambiente/ambiente-unidade-escolar',
        planoTrabalhoMatriz: 'plano-trabalho/matriz',
        planoTrabalhoUnidadeEscolar: 'plano-trabalho/unidade-escolar',
        monitoramento: 'monitoramento',
        ocorrencia: 'ocorrencia',
        ocorrenciaTipo: 'ocorrencia/ocorrencia-tipo',
        ocorrenciaSituacao: 'ocorrencia/ocorrencia-situacao',
        ocorrenciaVariavel: 'ocorrencia/ocorrencia-variavel',
        ocorrenciaMensagem: 'ocorrencia/ocorrencia-mensagem',
        relatorioGerencial: 'relatorio/relatorio-gerencial',
        relatorioContrato: 'relatorio/relatorio-contrato',
        url: getURL()
    };

    function getURL() {

        const listaHostsDesenvolvimento = [
            'localhost',
        ];

        if (listaHostsDesenvolvimento.includes(window.location.host)) {
            return 'http://' + window.location.host + ':3001/api/web/';
        } else {
            return 'http://' + window.location.host + ':3001/api/web/';
        }

    }

    angular
        .module('core.constantes')
        .constant('ConfigRest', configuracaoREST);

})();