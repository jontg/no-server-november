import { facts } from '../src/one_direction_facts';

const getRandomInt = (min, max) => Math.floor(Math.random() * ((max - min))) + min;

export const handler = (event, context, cb) => {
  console.log('Incoming Intent', event);

  cb(null, {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: facts[getRandomInt(0, facts.length)],
      },
      shouldEndSession: true,
    },
  });
}
