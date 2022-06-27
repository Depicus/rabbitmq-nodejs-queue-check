require('dotenv').config();

var express = require('express');
var app = express();
var mustache = require('mustache');
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');

var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require("path");

var demoData = '';

console.log('user is ' + process.env.USERNAME);

app.set('port', (process.env.PORT || 5057));
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
    host: process.env.EMAILSERVER,
    port: 25,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: "username",
        pass: "password",
    }, tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
    },
});

// verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log("Server is ready to take our messages");
    }
});

function checkRabbit() {
    console.log('in to the rabbit hole...');
    var http = require('http');
    var request = http.request({ 'hostname': process.env.SERVER, 'port': 15672, 'path': '/api/queues', 'auth': process.env.RABBITUSER },
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
            demoData = data;
            for (var i = 0; i < data.length; i++) {
                console.log('name = ' + data[i].name + ' has ' + data[i].messages + ' messages');
                if (data[i].messages > 0)
                {
                    //send email alert
                    console.log('raising email alert because ' + data[i].name + ' was over 0 at ' + data[i].messages)
                    var mailOptions = {
                        from: 'AllClear Rabbit Monitor <rabbit@allclearinsurance.com>', // sender address
                        to: process.env.EMAIL, // list of receivers
                        subject: 'Rabbit Queue Alert', // Subject line
                        text: 'Rabbit Queue Over 0 for ' + data[i].name, // plaintext body
                        html: 'Rabbit Queue Over 0 for <b>' + data[i].name + '</b>' // html body
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

//check on load so the web page has data
checkRabbit();

var mytimer = setInterval(function () {
    checkRabbit();
}, app.get('checktime'));

var myrestart = setInterval(function () {
    console.log('delayed time');
    clearInterval(myrestart);
    mytimer = setInterval(checkRabbit(), app.get('checktime'));
}, app.get('checktimeout'));

var router = express.Router();

// route middleware that will happen on every request
router.use(function (req, res, next) {

    // log each request to the console
    console.log(req.method, req.url);
    if (req.url === '/')
    {
        console.log('we have the route doc');
    }

    // continue doing what we were doing and go to the route
    next();
});

// home page route (http://localhost:8080)
router.get('/', function (req, res) {

    var my_path = url.parse(req.url).pathname;
    var full_path = path.join(process.cwd(), my_path);
    console.log(my_path + ' and ' + full_path);
    fs.readFile(full_path + 'public/welcome.html', 'binary', function (err, file) {
        if (err) {
            res.writeHeader(500, {"Content-Type": "text/plain"});
            res.write(err + "\n");
            res.end();

        }
        else {
            //var slug = [req.params.slug][0]; // grab the page slug
            var rData = {records: demoData}; // wrap the data in a global object... (mustache starts from an object then parses)
            var page = fs.readFileSync(full_path + 'public/welcome.html', "utf8"); // bring in the HTML file
            var html = mustache.render(page, rData); // replace all of the data
            //res.send(html); // send to

            //console.log(html);

            res.writeHeader(200, {"Content-Type": "text/html"});
            res.write(html, "binary");
            res.end();
        }
    });

    // res.send('im the home page!');  
});

// about page route (http://localhost:5057/about)
router.get('/about', function (req, res) {
    res.send('im the about page!');
});

app.use('/', router);

app.listen(app.get('port'), function () {
    console.log("RabbitMQ queue monitor app is running at http://localhost:" + app.get('port'));
});
