import * as Credstash from 'nodecredstash/js';
import * as crypto from 'crypto';
import * as request from 'request-promise';

const credstash = new Credstash({ awsOpts: { region: process.env.AWS_DEFAULT_REGION } });

function verifySlackSignature(event, secret) {
  const {
    'x-slack-request-timestamp': timestamp,
    'x-slack-signature': slack_signature,
  } = event.headers;

  const body = event.body;
  if (Math.abs(Date.now() / 1000 - timestamp) > 60 * 5) throw new Error('Unauthorized');

  const computed_signature = 'v0=' + crypto.createHmac('sha256', secret)
    .update(`v0:${timestamp}:${body}`)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(computed_signature), Buffer.from(slack_signature))) {
    console.log('Event Headers', event.headers, 'computed values', computed_signature);
    throw new Error('Unauthorized');
  }
}

export const handler = async (event, context) => {
  Object.keys(event.headers)
    .forEach(header => event.headers[header.toLowerCase()] = event.headers[header]);

  const signing_secret = await credstash.getSecret({ name: 'NSN_SLACK_CLIENT_SIGNING_SECRET' });
  try {
    verifySlackSignature(event, signing_secret);
  } catch (e) {
    console.log('Something went wrong', e);
    return { statusCode: 401 };
  }

  const api_key = await credstash.getSecret({ name: 'THE_MOVIE_DB_API_KEY' });

  const movies = JSON.parse(await request
    .get(`https://api.themoviedb.org/3/discover/movie?api_key=${api_key}&with_genres=28`));

  const chosen_movie = movies.results[Math.floor(Math.random() * Math.floor(movies.results.length))]

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "text": `How about ${chosen_movie.title}?`,
      "attachments": [{
        "text": chosen_movie.overview,
        "image_url": `https://image.tmdb.org/t/p/original${chosen_movie.poster_path}`,
      }],
    }),
  };

  return response;
};
