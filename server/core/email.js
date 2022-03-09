const nodemailer = require('nodemailer');

exports.enviar = async (destinatario, assunto, conteudo) =>{

    return await send({
        from: `${process.env.EMAIL_NAME} < ${process.env.EMAIL} >`,
        to: destinatario,
        subject: assunto,
        html: conteudo,
    });

};

async function init() {

    return await nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        service: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        },
    });

}

async function send(options) {

    const transporter = await init();
    await transporter.sendMail(options, async (error) => {
        if(error) console.log('Erro ao enviar email: ', error);
        return !error;
    });

}