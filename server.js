process.env['NTBA_FIX_350'] = 1;
require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const axios = require('axios').default;

const mongo = require('./my_modules/mongo');
const {textOptions} = require('./my_modules/messages');
const commandHandlers = require('./my_modules/commandHandlers');

const PORT = process.env.PORT || config.get('PORT');
const token = process.env.TOKEN || '';
const refreshIntervalDelayInMilliseconds = 60000;

const app = express();
const bot = new TelegramBot(token, {polling: true});

/**
 * Start tg bot
 */
function start() {
  refresh('https://bushkaweb.onrender.com');
  try {
    mongo.connectToMongoDB();

    bot.on('message', (message) => {
      commandHandlers.allMessageHandler(bot, message);
    });

    Object.keys(textOptions).map((key) => {
      bot.onText(textOptions[key], (message) => {
        commandHandlers[`${key}Handler`](bot, message);
      });
    });
    bot.on('callback_query', (query) => {
      commandHandlers.callbackQueryHandler(bot, query);
    });
    bot.on('polling_error', console.log);
  } catch (error) {
    console.log(error?.body?.description);
  }
}

// refresher
/**
 *
 * @param {string} url
 */
function refresh(url) {
  let i = 0;
  setInterval(() => {
    axios.get(url)
        .then(({status}) => {
          if (i % 60 === 0) {
            console.log(status);
          }
          i++;
        })
        .catch((err) => {
          console.log(err);
        });
  }, refreshIntervalDelayInMilliseconds);
}

// express

app.get('/', (req, res) => {
  res.status(200).end('bot start');
});

app.listen(PORT, () => {
  console.log(`Server start on port ${PORT}`);
  start();
});
