import * as AWS from 'aws-sdk';
import * as T from 'twitter';
import * as Credstash from 'nodecredstash/js';
import * as crypto from 'crypto';
import * as request from 'request';

const credstash = new Credstash({ awsOpts: { region: process.env.AWS_DEFAULT_REGION } });
const rekognition = new AWS.Rekognition();

function verifyTwitterSignature(event, payload, consumer_secret) {
  const { 'X-Twitter-Webhooks-Signature': signature } = event.headers;
  const webhook_signature = "sha256=" + crypto.createHmac('sha256', consumer_secret)
    .update(payload || "").digest('base64');

  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(webhook_signature))) {
    console.log('Rejecting invalid webhook signature', signature, webhook_signature);
    throw new Error("Invalid webhook signature!");
  }
}


export const handler = async (event, context, cb) => {

  const consumer_key = await credstash.getSecret({ name: 'TWITTER_IMAGEBOT_CONSUMER_KEY' });
  const consumer_secret = await credstash.getSecret({ name: 'TWITTER_IMAGEBOT_CONSUMER_SECRET' });
  const token = await credstash.getSecret({ name: 'TWITTER_IMAGEBOT_ACCESS_TOKEN' });
  const token_secret = await credstash.getSecret({ name: 'TWITTER_IMAGEBOT_ACCESS_TOKEN_SECRET' });

  console.log('ASDF', consumer_key, consumer_secret, token, token_secret);
  const twitter_client = new T({
    consumer_key,
    consumer_secret,
    access_token_key: token,
    access_token_secret: token_secret,
  });

// =-----------------------------------------------------------------------------------------------=
// =--= REGISTER =---------------------------------------------------------------------------------=
// =-----------------------------------------------------------------------------------------------=

  if (event.httpMethod === 'PATCH') {
    // If this is a PATCH request, my human is asking me to register myself.

    const { appId: provided_secret } = JSON.parse(event.body);
    if (provided_secret !== consumer_key) {
      console.log('Rejecting request!');
      return cb(null, { statusCode: 401 });
    }

    try {
      let subscribe_response = await new Promise((resolve, reject) =>
        twitter_client.post('account_activity/all/dev/subscriptions',
          (error, payload, response) => {
            if (error) reject(error);
            resolve(payload);
          }
        )
      );

      return cb(null, {
        statusCode: 200,
        body: JSON.stringify(subscribe_response),
      });
    } catch (e) {
      console.log('There was an error', e);
      return cb(e);
    }

// =-----------------------------------------------------------------------------------------------=
// =--= DE-REGISTER =------------------------------------------------------------------------------=
// =-----------------------------------------------------------------------------------------------=

  } else if (event.httpMethod === 'DELETE') {
    // If this is a DELETE request, my human is asking me to deregister myself.

    const { appId: provided_secret, id } = JSON.parse(event.body);
    if (provided_secret !== consumer_key) {
      console.log('Rejecting request!');
      return cb(null, { statusCode: 401 });
    }

    try {
      let result = await new Promise((resolve, reject) => request.delete({
        oauth: { consumer_key, consumer_secret, token, token_secret },
        url: `https://api.twitter.com/1.1/account_activity/all/dev/webhooks/${id}.json`
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      }));
      return cb(null, {statusCode: 200, body: JSON.stringify(result)});
    } catch (e) {
      console.log('There was an error', e);
      return cb(e);
    }

// =-----------------------------------------------------------------------------------------------=
// =--= VERIFICATION =-----------------------------------------------------------------------------=
// =-----------------------------------------------------------------------------------------------=

  } else if (event.httpMethod === 'GET') {
    // If this is a GET request, it's likely an attempt by twitter to verify the identity of the
    // webhook.  If there's a crc_token, lets respond in kind.

    const { crc_token } = event.queryStringParameters;
    const hmac = crypto.createHmac('sha256', consumer_secret).update(crc_token).digest('base64');

    try {
      let twitter_response = await new Promise((resolve, reject) =>
        twitter_client.post('statuses/update', {
            status: 'My human just registered me with a web-hook!',
          },
          (error, tweet, response) => {
            if (error) return reject(error);
            console.log(tweet);
            resolve(response);
          }
        )
      );
    } catch (e) {
      console.log('Unable to celebrate registering a web hook!', e);
    }

    return cb(null, {
      statusCode: 200,
      body: JSON.stringify({
        response_token: `sha256=${hmac}`,
      }),
    });

// =-----------------------------------------------------------------------------------------------=
// =--= EVENT HANDLER =----------------------------------------------------------------------------=
// =-----------------------------------------------------------------------------------------------=

  } else if (event.httpMethod === 'POST') {
    let body = JSON.parse(event.body);

    console.log('Received event', event);

    if (!body.direct_message_events) {
      return cb(null, { statusCode: 200 });
    }

    // For each direct message event with an embedded image, fetch it into a buffer.
    await Promise.all(body.direct_message_events
      .filter(message => message.type === "message_create")
      .filter(message => message.message_create.message_data.attachment !== null)
      .filter(message => message.message_create.message_data.attachment.type === 'media')
      .map(async message => {
        let recipient_id = message.message_create.sender_id;
        let url = message.message_create.message_data.attachment.media.media_url;
        let resp = await new Promise<string>((resolve, reject) => request.get({
          url,
          oauth: { consumer_key, consumer_secret, token, token_secret },
          encoding: 'binary',
        }, (err, response, body) => {
          if (err) return reject(err);

          let base64Encoded : string = new Buffer(body, 'binary').toString('base64');
          resolve(base64Encoded);
        }));

        let labels = await rekognition.detectLabels({
					MaxLabels: 7,
					MinConfidence: 80,
					Image: {
						Bytes: new Buffer(resp, 'base64'),
					}
        }).promise();

        console.log('Labels returned from rekog as',
          labels.Labels.map(label => label.Name).join(', ')
        );

        await new Promise((resolve, reject) => {
          request.post({
            url: 'https://api.twitter.com/1.1/direct_messages/events/new.json',
            oauth: { consumer_key, consumer_secret, token, token_secret },
            json: true,
            headers: { 'content-type': 'application/json' },
            body: {
              event: {
                message_create: {
                  message_data: {
                    text: 'I saw the following in what you sent me:'
                      + labels.Labels.map(label => label.Name).join(', ')
                  },
                  target: { recipient_id },
                },
                type: 'message_create',
              }
            }
          }, (err, resp, body) => {
            console.log('Response', err, resp, body);
            if (err) return reject(err);
            resolve(body);
          });
        });
      }));

    return cb(null, {
      statusCode: 200,
    });
  }

// =-----------------------------------------------------------------------------------------------=
// =--= DEFAULT =----------------------------------------------------------------------------------=
// =-----------------------------------------------------------------------------------------------=

  return cb(null, {
    statusCode: 200,
    body: 'I have no idea what you wanted from me',
  });
};
