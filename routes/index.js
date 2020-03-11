var express = require('express');
var router = express.Router();
require('dotenv').config()
const axios = reqire('axios');
const AWS = require('aws-sdk');
// aws config
AWS.config.update({
  accessKeyId: process.env.aws_access_key_id,
  secretAccessKey: process.env.aws_secret_access_key,
  region: process.env.region
});
// sns instance
var sns = new AWS.SNS();

// listen for the aws sns messages
router.post('/', (req, res) => {
  let body = ''

  req.on('data', (chunk) => {
    body += chunk.toString()
  })

  req.on('end', () => {
    let payload = JSON.parse(body)
    let notifications = [];
    // check payload if SubscriptionConfirmation or Notification
    if (payload.Type === 'SubscriptionConfirmation') {
      const promise = new Promise((resolve, reject) => {
        const url = payload.SubscribeURL;
        request(url, (error, response) => {
          if (!error && response.statusCode == 200) {
            console.log('SubscriptionConfirmation')
            return resolve()
          } else {
            return reject()
          }
        })
      })

      promise.then(() => {
        res.end("ok")
      })
    } else
      if (payload.Type === 'Notification') {
        notifications.push({
          Type: payload.Type,
          MessageId: payload.MessageId,
          Subject: payload.Subject,
          Message: payload.Message,
          Timestamp: payload.Timestamp,
        })
        res.status(200).end(notifications.toString())
      }
  })
})

// subscribe to the Topic
router.get('/subscribe', (req, res) => {
  let params = {
    Protocol: 'HTTPS',
    TopicArn: process.env.Topic,
    Endpoint: req.query.endpoint
  };
  console.log(params)
  sns.subscribe(params, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
      res.send(data);
    }
  });
});

router.get('/UnsubscribeURL',async (req,res)=>{
  console.log("unsubscribeURL",unsubscribeURL)
  await axios.get(unsubscribeURL) // save unsubscribeURL in localstorage or db once subscription message is obtained
res.send('Unsubscribed successfully')
})

// send notifications to the Topic
router.get('/send', (req, res) => {
  let params = {
    Message: req.query.message,
    Subject: req.query.subject,
    TopicArn: process.env.Topic
  };

  sns.publish(params, function (err, data) {
    if (err) console.log(err, err.stack);
    else console.log(data);
  });
  res.end('Reminder Sent')
});
module.exports = router;
