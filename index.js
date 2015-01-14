var express = require('express');
var app = express();
var mustache = require('mustache');
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');

var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require("path");

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

var demoData1 = [{// dummy data to display
        "server": "rabbit01.domain.local",
        "systems": [{
                "queue": "Bob01"
            }, {
                "queue": "Bill01"
            }, {
                "queue": "Bob02"
            }, {
                "queue": "Bill02"
            }]
    }];

var demoData = [{"memory":14128,"message_stats":{"deliver_get":10,"deliver_get_details":{"rate":0.0},"deliver_no_ack":10,"deliver_no_ack_details":{"rate":0.0},"publish":10,"publish_details":{"rate":0.0}},"messages":0,"messages_details":{"rate":0.0},"messages_ready":0,"messages_ready_details":{"rate":0.0},"messages_unacknowledged":0,"messages_unacknowledged_details":{"rate":0.0},"idle_since":"2015-01-11 20:31:32","consumer_utilisation":"","policy":"","exclusive_consumer_tag":"","consumers":1,"down_slave_nodes":"","backing_queue_status":{"q1":0,"q2":0,"delta":["delta","undefined",0,"undefined"],"q3":0,"q4":0,"len":0,"target_ram_count":"infinity","next_seq_id":0,"avg_ingress_rate":0.0,"avg_egress_rate":0.0,"avg_ack_ingress_rate":0.0,"avg_ack_egress_rate":0.0},"state":"running","messages_ram":0,"messages_ready_ram":0,"messages_unacknowledged_ram":0,"messages_persistent":0,"message_bytes":0,"message_bytes_ready":0,"message_bytes_unacknowledged":0,"message_bytes_ram":0,"message_bytes_persistent":0,"backing_queue_status":{"q1":0,"q2":0,"delta":["delta","undefined",0,"undefined"],"q3":0,"q4":0,"len":0,"target_ram_count":"infinity","next_seq_id":0,"avg_ingress_rate":0.0,"avg_egress_rate":0.0,"avg_ack_ingress_rate":0.0,"avg_ack_egress_rate":0.0},"name":"Freedom","vhost":"/","durable":true,"auto_delete":false,"arguments":{},"node":"rabbit@rabbit01"},{"memory":21936,"message_stats":{"deliver_get":8,"deliver_get_details":{"rate":0.0},"get":1,"get_details":{"rate":0.0},"get_no_ack":7,"get_no_ack_details":{"rate":0.0},"publish":7,"publish_details":{"rate":0.0},"redeliver":1,"redeliver_details":{"rate":0.0}},"messages":0,"messages_details":{"rate":0.0},"messages_ready":0,"messages_ready_details":{"rate":0.0},"messages_unacknowledged":0,"messages_unacknowledged_details":{"rate":0.0},"idle_since":"2015-01-11 16:05:46","consumer_utilisation":"","policy":"","exclusive_consumer_tag":"","consumers":0,"down_slave_nodes":"","backing_queue_status":{"q1":0,"q2":0,"delta":["delta","undefined",0,"undefined"],"q3":0,"q4":0,"len":0,"target_ram_count":"infinity","next_seq_id":7,"avg_ingress_rate":2.9114037801939964e-7,"avg_egress_rate":0.31517342803854537,"avg_ack_ingress_rate":2.9114037801939964e-7,"avg_ack_egress_rate":0.0},"state":"running","messages_ram":0,"messages_ready_ram":0,"messages_unacknowledged_ram":0,"messages_persistent":0,"message_bytes":0,"message_bytes_ready":0,"message_bytes_unacknowledged":0,"message_bytes_ram":0,"message_bytes_persistent":0,"backing_queue_status":{"q1":0,"q2":0,"delta":["delta","undefined",0,"undefined"],"q3":0,"q4":0,"len":0,"target_ram_count":"infinity","next_seq_id":7,"avg_ingress_rate":2.9114037801939964e-7,"avg_egress_rate":0.31517342803854537,"avg_ack_ingress_rate":2.9114037801939964e-7,"avg_ack_egress_rate":0.0},"name":"Options","vhost":"/","durable":true,"auto_delete":false,"arguments":{},"node":"rabbit@rabbit01"}];

var options = {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['htm', 'html'],
    index: false,
    maxAge: '1d',
    redirect: false,
    setHeaders: function (res, path, stat) {
        res.set('x-timestamp', Date.now())
    }
};

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
            var html = mustache.to_html(page, rData); // replace all of the data
            //res.send(html); // send to

            //console.log(html);

            res.writeHeader(200, {"Content-Type": "text/html"});
            res.write(html, "binary");
            res.end();
        }
    });

    // res.send('im the home page!');  
});

// about page route (http://localhost:8080/about)
router.get('/about', function (req, res) {
    res.send('im the about page!');
});

app.use('/', router);
/*
 app.get('/',function (request, response) {
 
 var my_path = url.parse(request.url).pathname;  
 var full_path = path.join(process.cwd(),my_path);  
 console.log(my_path + ' and ' + full_path);
 fs.exists(full_path,function(exists){  
 if(!exists){  
 response.writeHeader(404, {"Content-Type": "text/plain"});    
 response.write("404 Not Found\n");    
 response.end();  
 }  
 else{  
 fs.readFile(full_path, "binary", function(err, file) {    
 if(err) {    
 response.writeHeader(500, {"Content-Type": "text/plain"});    
 response.write(err + "\n");    
 response.end();    
 
 }    
 else{  
 
 
 //var slug = [req.params.slug][0]; // grab the page slug
 var rData = {records: demoData}; // wrap the data in a global object... (mustache starts from an object then parses)
 var page = fs.readFileSync(full_path, "utf8"); // bring in the HTML file
 var html = mustache.to_html(page, rData); // replace all of the data
 //res.send(html); // send to
 
 console.log(html);
 
 response.writeHeader(200);    
 response.write(html, "binary");    
 response.end();  
 }  
 
 });  
 }  
 });  
 //response.send('RabbitMQ queue monitor!');
 });
 */

app.listen(app.get('port'), function () {
    console.log("RabbitMQ queue monitor app is running at localhost:" + app.get('port'));
});
