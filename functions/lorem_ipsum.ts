import * as wizipsum from 'wizipsum';
import * as he from 'he';

const generator = wizipsum([
  'Friends don\'t lie.',
  'It\'s just, sometimes... people don\'t really say what they\'re really thinking. But when you capture the right moment, it says more.',
  'This is not yours to fix alone. You act like you’re all alone out there in the world, but you’re not. You’re not alone.',
  'Why are you keeping this curiosity door lock?',
  'Do you know anything about sensory deprivation tanks? Specifically how to build one?',
  'If anyone asks where I am, I\'ve left the country.',
  'YOU BETTER RUN! She\'s our friend, and she\'s crazy!',
  'Mouth-breather.',
  'Nancy, seriously, you\'re gonna be so cool now, it\'s ridiculous.',
  'Um, I\'m happy you\'re home.',
  'You’re going to take out the demigorgon with a slingshot?',
  'Mornings are for coffee and contemplation.',
  'You shouldn\'t like things because people tell you you\'re supposed to.',
  'No... no El, you\'re not the monster. You saved me. Do you understand? You saved me.',
  'We never would\'ve upset you if we knew you had superpowers.',
  'Just wait till we tell Will that Jennifer Hayes was crying at his funeral.',
  'You\'re an idiot, Steve Harrington. You\'re beautiful, Nancy Wheeler.',
  'Oh... candy, leftovers, Eggo\'s... she really likes Eggo\'s.',
  'Don’t take it so personally, okay? I don’t like most people. He’s in the vast majority.',
  'Why do we even need weapons anyway? We have her.',
  'She shut one door! With her mind!',
  'He’s a sensitive kid. Lonnie used to say he was queer. Called him a fag. Is he? He’s missing, is what he is!',
  'Yeah, I want a date with Bo Derek. We all want things.',
  'It’s finger-lickin’ good.',
  'You’re going to be home by 8, listening to the Talking Heads and reading Vonnegut or something. That sounds like a nice night.',
  'You’re right. You are a freak…. Who would you rather be friends with: Bowie or Kenny Rogers?',
  'Nobody normal ever accomplished anything meaningful in this world.',
  'You are such a nerd. No wonder you only hang out with boys.',
  'If we’re both going crazy, then we’ll go crazy together, right?',
  'You’re pretty cute, you know that?', 'I need my paddles!', 'Why’s he gotta kick the door?', 'Hey kiddo, would you like a balloon?', 'Mistakes have been made.', 'Let’s burn that lab to the ground.', 'You act like you want me to be your friend and then you treat me like garbage.', 'It’s about the shadow monster, isn’t it?',
  'So, Jonathan, how was the pull-out?',
  'Bitchin\''
]);

export const handler = (event, context, cb) => {
  let html = `
    <html>
      <body>
        <h1>In the beginning</h1>
        <p>${he.encode(generator.paragraph().trim())}</p>
        <h1>Near the middle...</h1>
        <p>${he.encode(generator.paragraph().trim())}</p>
        <h1>And in conclusion</h1>
        <p>${he.encode(generator.paragraph().trim())}</p>
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
