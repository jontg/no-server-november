import * as Credstash from 'nodecredstash/js';
import * as Twilio from 'twilio';

const credstash = new Credstash({ awsOpts: { region: process.env.AWS_DEFAULT_REGION } });

export const handler = async (event, context, cb) => {
  console.log('Event', event);

  const sid = await credstash.getSecret({ name: 'TWILIO_REMIND_ME_ACCOUNT_SID' });
  const token = await credstash.getSecret({ name: 'TWILIO_REMIND_ME_AUTH_TOKEN' });
  const number = await credstash.getSecret({ name: 'TWILIO_REMIND_ME_PHONE_NUMBER' });
  const targetNumber = await credstash.getSecret({ name: 'JONTOMAS_PHONE_NUMBER' });

  const client = Twilio(sid, token);

  await client.messages
      .create({ from: number, body: 'Wake Up!', to: targetNumber })
      .then(message => console.log(message.sid))

  return {};
}
