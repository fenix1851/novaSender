 const nodemailer = require('nodemailer')

const {mailPassword, mail, apiUrl} = require('../config')

class MailService {

    constructor(){
        this.transporter = nodemailer.createTransport(
            {
                host: "smtp.yandex.com",
                port:465,
                secure: true,
                auth: {
                    user: mail,
                    pass: mailPassword
                }
            }
        )
    }

    async sendActivationMail(to, link) {
         await this.transporter.sendMail({
            from: mail+'@yandex.ru',
            to,
            subject: 'Account activate at: ' + apiUrl,
            text: '',
            html:
            `
            <div>
                <h1>
                    <a href=${link}>Activate</a>
                </h1>
            <div>
            `
         })
    }
}

module.exports = new MailService()