# no-server-november
Lets have some fun... https://serverless.com/blog/no-server-november-challenge/

# Strategy

* All challenges will be grouped into the same folder, under the same serverless.yml, but will be
  documented separately below.

# Lorem Ipsum

For this challenge, we implement a simple lorem ipsum generator with custom text borrowed straight
from [stranger ipsum].  A single function, using Server-Side Rendering, will provide a
well-formatted HTML page, with custom text generated on every request.  We use [wizipsum] to create
the text, and [he] to encode it for HTML.  You can see the generator in action
[here](https://no-server-november.ulfhedinn.net/lorem_ipsum).

[stranger ipsum]: https://github.com/robertcoopercode/stranger-ipsum/blob/master/src/generator.js
[wizipsum]: https://github.com/wizbii/wizipsum
[he]: https://github.com/mathiasbynens/he

# Dad Bot

Lets twitter up a bot, shall we?  We create a new bot, whose name is [@NDadbot], which is using the
Twitter API to broadcast delightfully terrible jokes from the [dadbot api].  Fortunately for us,
there already exists a [dadbot client] in nodejs, as does the [twitter api], so this primarily
involved creating a new twitter account, promoting that account to a developer by applying, and
provisioning tokens.  We're using [credstash] from my private account to manage tokens, because we
are responsible adults.

[@NDadbot]: https://twitter.com/NDadbot
[credstash]: https://github.com/fugue/credstash
[dadbot api]: https://icanhazdadjoke.com/api
[dadbot client]: https://github.com/jmptr/node-icanhazdadjoke-client
[twitter api]: https://github.com/desmondmorris/node-twitter

# Linting Integrity
