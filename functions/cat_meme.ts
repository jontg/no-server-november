import * as he from 'he';

import * as Credstash from 'nodecredstash/js';
import * as GiphyApi from 'giphy-api';

const credstash = new Credstash({ awsOpts: { region: process.env.AWS_DEFAULT_REGION } });

export const handler = async (event, context, cb) => {
  const apiKey = await credstash.getSecret({ name: 'GIPHY_API_TOKEN' });
  const giphy = GiphyApi({ apiKey, https: true, timeout: 5000 });

  let gif = await giphy.random({
    tag: 'cat',
    rating: 'G',
    fmt: 'html',
  })

  console.log(gif);

  let html = `
    <html>
      <body>
        <h1>I can haz cat gif?</h1>
        ${gif}
      </body>
    </html>
  `;

  cb(null,
    {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: html,
    }
  );
}
