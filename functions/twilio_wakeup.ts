import * as request from 'request-promise';
import * as Credstash from 'nodecredstash/js';

const credstash = new Credstash({ awsOpts: { region: process.env.AWS_DEFAULT_REGION } });

export const handler = async (event, context) => {
  console.log('Event', event);

  const sid = await credstash.getSecret({ name: 'TWILIO_REMIND_ME_ACCOUNT_SID' });
  const token = await credstash.getSecret({ name: 'TWILIO_REMIND_ME_AUTH_TOKEN' });
  const number = await credstash.getSecret({ name: 'TWILIO_REMIND_ME_PHONE_NUMBER' });
  const targetNumber = await credstash.getSecret({ name: 'JONTOMAS_PHONE_NUMBER' });

  return await request.post(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    auth: {
      username: sid,
      password: token,
    },
    form: {
      From: number,
      To: targetNumber,
      Body: 'Wake Up!',
    },
  });
}
