import * as T from 'twitter';
import * as Credstash from 'nodecredstash/js';
import * as crypto from 'crypto';
import * as request from 'request';

const credstash = new Credstash({ awsOpts: { region: process.env.AWS_DEFAULT_REGION } });

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
  console.log('Received Event', event);

  const consumer_secret = await credstash.getSecret({ name: 'TWITTER_IMAGEBOT_CONSUMER_SECRET' });
  const consumer_key = await credstash.getSecret({ name: 'TWITTER_IMAGEBOT_CONSUMER_KEY' });
  const access_token_key = await credstash.getSecret({ name: 'TWITTER_IMAGEBOT_ACCESS_TOKEN' });
  const access_token_secret = await credstash.getSecret({ name: 'TWITTER_IMAGEBOT_ACCESS_TOKEN_SECRET' });

  const twitter_client = new T({
    consumer_key,
    consumer_secret,
    access_token_key,
    access_token_secret,
  });

// =--------------------------------------------------------------------------=
// =--= REGISTER =------------------------------------------------------------=
// =--------------------------------------------------------------------------=

  if (event.httpMethod === 'PATCH') {
    // If this is a PATCH request, my human is asking me to register myself.

    const { appId: provided_secret } = JSON.parse(event.body);
    if (provided_secret !== consumer_key) {
      console.log('Rejecting request!');
      return cb(null, { statusCode: 401 });
    }

    try {
      let result = await new Promise((resolve, reject) =>
        // Specify a full URL so that we don't try adding .json to the end...
        twitter_client.post('https://api.twitter.com/1.1/account_activity/all/dev/webhooks.json?url=' +
            'https%3A%2F%2Fno-server-november.ulfhedinn.net%2Fimagebot',
          (error, payload, response) => {
            if (error) {
              reject(error);
            } else {
              console.log('Payload', payload);
              resolve(payload);
            }
          }
        )
      );

      let subscribe_response = await new Promise((resolve, reject) => request.post({
        oauth: {
          consumer_key,
          consumer_secret,
          token: access_token_key,
          token_secret: access_token_secret,
        },
        url: `https://api.twitter.com/1.1/account_activity/all/dev/subscriptions.json`
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      }));

      return cb(null, {
        statusCode: 200,
        body: JSON.stringify(Object.assign(result, subscribe_response)),
      });
    } catch (e) {
      console.log('There was an error', e);
      return cb(e);
    }

// =--------------------------------------------------------------------------=
// =--= DE-REGISTER =---------------------------------------------------------=
// =--------------------------------------------------------------------------=

  } else if (event.httpMethod === 'DELETE') {
    // If this is a DELETE request, my human is asking me to deregister myself.

    const { appId: provided_secret, id } = JSON.parse(event.body);
    if (provided_secret !== consumer_key) {
      console.log('Rejecting request!');
      return cb(null, { statusCode: 401 });
    }

    try {
      let result = await new Promise((resolve, reject) => request.delete({
        oauth: {
          consumer_key,
          consumer_secret,
          token: access_token_key,
          token_secret: access_token_secret,
        },
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

// =--------------------------------------------------------------------------=
// =--= VERIFICATION =--------------------------------------------------------=
// =--------------------------------------------------------------------------=

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
      return cb(e);
    }

    return cb(null, {
      statusCode: 200,
      body: JSON.stringify({
        response_token: `sha256=${hmac}`,
      }),
    });

// =--------------------------------------------------------------------------=
// =--= EVENT HANDLER =-------------------------------------------------------=
// =--------------------------------------------------------------------------=

  } else if (event.httpMethod === 'POST') {
    try {
      verifyTwitterSignature(event, event.body, consumer_secret);

      return cb(null, {
        statusCode: 200,
      });
    } catch (e) {
      return cb(e);
    }
  }

  return cb(null, {
    statusCode: 200,
    body: 'I have no idea what you wanted from me',
  });
};