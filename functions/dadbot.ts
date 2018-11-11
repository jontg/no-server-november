import * as T from 'twitter';
import * as Credstash from 'nodecredstash/js';
import * as DadJokes from 'dadjokes-wrapper';

const credstash = new Credstash({ awsOpts: { region: process.env.AWS_DEFAULT_REGION } });

export const handler = async (event, context, cb) => {
  const consumer_key = await credstash.getSecret({ name: 'TWITTER_DADBOT_CONSUMER_KEY' });
  const consumer_secret = await credstash.getSecret({ name: 'TWITTER_DADBOT_CONSUMER_SECRET' });
  const access_token_key = await credstash.getSecret({ name: 'TWITTER_DADBOT_ACCESS_TOKEN' });
  const access_token_secret = await credstash.getSecret({ name: 'TWITTER_DADBOT_ACCESS_TOKEN_SECRET' });

  const twitter_client = new T({
    consumer_key,
    consumer_secret,
    access_token_key,
    access_token_secret,
  });

  const dadjokes_client = new DadJokes();

  try {
    const joke = await dadjokes_client.randomJoke();

    let twitter_response = await new Promise((resolve, reject) =>
      twitter_client.post('statuses/update', {
          status: joke,
        },
        (error, tweet, response) => {
          if (error) return reject(error);
          console.log(tweet)
          resolve(response);
        }
      )
    );

    cb(null, {
      joke,
    });
  } catch (e) {
    cb(e);
  }
};
