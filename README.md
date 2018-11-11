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
