const express = require('express');

const agendamentoAutomaticoService = require('./agendamento-automatico');

require('express-group-routes');

const app = express();

app.group('/api/system', (app) => {

    app.use((req, res, next) => {

        if(req.headers.host.split(':')[0] === 'localhost') {
            next();
        }
        
    });

    app.route('/agendar-monitoramentos-automaticos').get(agendamentoAutomaticoService);

});

module.exports = app;