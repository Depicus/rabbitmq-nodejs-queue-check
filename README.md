# RabbitMQ Queue Checker

A Node.js app to check if any queue on a [RabbitMQ](http://www.rabbitmq.com) is above a pre determined number.

This application is currently quite basic in that it will only check once per set time interval (usually 1 minute) and if the queue is above 0 it will fire off an email and put the timer into another loop (currently 1 hour) where it will not check further. This stops the dreaded morning of 4,000,000 email alerts but doesn't help if anything else gets stuck in that hour.

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Foreman](http://theforeman.org/) installed.

```sh
$ git clone location-of-git
$ cd folder-just-created
$ npm install
```
then each time
```sh
$ foreman start
# then
ctrl-c # to exit
```

The web app should now be running on [localhost:5000](http://localhost:5000/).

The web interface really is boring and shows nothing exciting (at the moment).

## Deploying to Dokku-Alt

This app was built to run on our [Dokku-Alt](http://dokku-alt.github.io/) so it should be just a quick

```sh
$ git push whateveryoucalledtherepository master

```

## Using an `.env` file

You can change the behavior of this app either in the `index.js` file or by using an `.env` file.

```
USERNAME=Bob
PASSWORD=BobsSecretPassword
```
We are using [Nodemailer](https://github.com/andris9/Nodemailer) to send email. It can be quickly changed to use SMTP but have a look at [Mailgun](http://www.mailgun.com) which is ideal for this kind of error reporting.

```javascript
var transport = nodemailer.createTransport(smtpTransport({
  host: 'localhost',
  port: 25,
  auth: {
    user: 'username',
    pass: 'password'
  }
}));
```

Any questions feel free to tweet [@depicus](https://www.twitter.com/depicus) or file an issue.
