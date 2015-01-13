var express = require('express');
var app = express();

var nodemailer = require('nodemailer');

app.set('port', (process.env.PORT || 5000));
app.set('checktime', process.env.CHECKTIME || 60000); // 60 seconds
app.set('checktimeout', process.env.CHECKTIMEOUT || 3600000); // 60 minutes 3600000
app.set('username', (process.env.USERNAME || ''));
app.set('password', (process.env.PASSWORD || ''));
app.use(express.static(__dirname + '/public'));

if (app.get('username') === '')
{
    console.log('exiting no username for sending mail');
    process.exit(1); //exit if we have not set username for sending email 
}

var transporter = nodemailer.createTransport({
    service: 'Mailgun',
    auth: {
        user: app.get('username'),
        pass: app.get('password')
    }
});

function checkRabbit() {
    console.log('in to the rabbit hole...');
    var http = require('http');
    var request = http.request({'hostname': 'rabbit01.allcleartravel.local', 'port': 15672, 'path': '/api/queues', 'auth': 'guest:guest'
    },
    function (response) {
        console.log('status: ' + response.statusCode);
        response.setEncoding('utf8');
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            console.log('request finished');
            data = JSON.parse(str); // you missed that...
            for (var i = 0; i < data.length; i++) {
                console.log('name = ' + data[i].name + ' has ' + data[i].messages + ' messages');
                if (data[i].messages > 0)
                {
                    //send email alert
                    console.log('raising email alert because ' + data[i].name + ' was over 0 at ' + data[i].messages)
                    var mailOptions = {
                        from: 'AllClear Rabbit Monitor <rabbit@allclearinsurance.com>', // sender address
                        to: 'brian.slack@allclearinsurance.com', // list of receivers
                        subject: 'Rabbit Queue Alert', // Subject line
                        text: 'Rabbit Queue Over 0 for ' + data[i].name, // plaintext body
                        html: '<b>Rabbit Queue Over 0 for ' + data[i].name + '</b>' // html body
                    };
                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('message sent: ' + info.response);
                        }
                    });
                    // disable the check for a grace period
                    clearInterval(mytimer);
                    myrestart = setInterval(request, app.get('checktimeout'));
                }
            }
        });
    });
    request.end();
}

var mytimer = setInterval(function () {
    checkRabbit();
}, app.get('checktime'));

var myrestart = setInterval(function () {
    console.log('delayed time');
    clearInterval(myrestart);
    mytimer = setInterval(checkRabbit(), app.get('checktime'));
}, app.get('checktimeout'));

app.get('/', function (request, response) {
    response.send('RabbitMQ queue monitor!');
});

app.listen(app.get('port'), function () {
    console.log("RabbitMQ queue monitor app is running at localhost:" + app.get('port'));
});
