// Initialize Discord bot
import Discord from './discord_mod.js';
import options from './config/options.js'
const testMode = process.argv.includes('--title=test') 
const manager = new Discord.ShardingManager('./bot.js', {
  token: options.token,
  respawn: testMode ? false : true,
  mode: 'worker'
})

const SPAWN_DELAY = 5000

manager.on('shardCreate', shard => setTimeout(() => shard.send({ testMode }), SPAWN_DELAY))
manager.spawn('auto', SPAWN_DELAY).catch(err => console.error(err))

// Add server dependencies
import bodyParser from 'body-parser'
import querystring from 'querystring';
import express from 'express'
const app = express()

// Add requests
import request from 'request'
import axios from 'axios'
import qs from 'qs';

// Create manager for custom WebUIs
import WebUIManager from './types/webui/WebUIManager.js'
const webUIManager = new WebUIManager(app)

import DatabaseClient from './types/database/DatabaseClient.js'
const dbClient = new DatabaseClient('server')
dbClient.initialize()

// Create shop manager
import ShopGenerator from './types/database/ShopGenerator.js'
const shopGenerator = new ShopGenerator({
  shopRefreshDelay: 60000
})
shopGenerator.initialize()

// 
import OAuth2Client from './types/auth/OAuth2Client.js'
const oauth2 = new OAuth2Client()
oauth2.initialize()

// Create logger
import Logger from './types/log/Logger.js'
const logger = new Logger()

import fs from 'fs'
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Update guild count
let cachedGuilds = '??'
const updateGuilds = async () => {
  let guilds = await manager.fetchClientValues('guilds.size')
  if(guilds) cachedGuilds = guilds.reduce((prev, val) => prev + val, 0)
}

setInterval(updateGuilds, 60000)

import path from 'path'

// Handle all GET requests
app.use('/', express.static(path.join(__dirname, 'public'),{ extensions:['html']}))

app.get('/docs', (request, response) => {
  response.redirect('/docs/version/' + pkg.version)
  logger.log('Docs viewed', {
    ref: request.query.ref
  })
})

app.use('/docs/version/', express.static(path.join(__dirname, 'docs', 'gamebot')))

app.get('/guilds', async (req, res) => {
  res.send({
    guilds: cachedGuilds,
    shards: manager.totalShards
  })
})

app.get('/discord', (req,res) => {
  logger.log('Discord joined', {
    ref: req.query.ref
  })
  res.redirect('https://discord.gg/7pNEJQC')
})

app.get('/invite', (req,res) => {
  logger.log('Invite used', {
    ref: req.query.ref
  })
  res.redirect('https://discord.com/oauth2/authorize?client_id=620307267241377793&scope=bot&permissions=1547041872')
})

app.get('/login', (req, res) => {
  res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.BASE_URL)}%2Fauthenticate&response_type=token&scope=identify`)
})

app.get('/shopItems', async (req, res) => {
  let validated, shopItems
  if(req.query.userID)
    validated = await oauth2.validate(req.query.userID, req.header('authorization'))
  if(validated)
    shopItems = await shopGenerator.fetchShopItems(req.query.userID).catch(console.error)
  else
    shopItems = await shopGenerator.fetchShopItems().catch(console.error)
  res.send(shopItems)
})

// Handle all POST requests

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, parameterLimit:50000 }));

// Parse application/json
app.use(bodyParser.json({limit: "100mb"}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }))

// Handle SHOP endpoints
app.post('/purchase', async (req, res) => {
  const userID = req.body.userID
  const itemID = req.body.itemID
  // validate request
  if(await oauth2.validate(userID, req.header('authorization'))) {
    // Checkout
    // check if user has enough currency
    let info = await dbClient.fetchDBInfo(userID)
    let balance = info.balance

    let item = await dbClient.fetchItemInfo(itemID)

    if(balance < item.cost) {
      res.send({
        error: 'Not enough credits, purchase could not be completed.',
      })
      return
    }

    if(info.unlockedItems.includes(itemID)) {
      res.send({
        error: 'This item is already unlocked, purchase could not be completed.'
      })
      return
    }

    // submit purchase
    let updatedUser = await dbClient.database.collection('users').findOneAndUpdate(
        { userID },
        { 
            $push: { unlockedItems: item.itemID },
            $inc: { balance: -item.cost }
        },
        { returnOriginal: false }
    ).catch(err => {
      console.error(err)
      res.status(500)
    })

    const result = {
      itemID: item.itemID,
      item: item.friendlyName,
      cost: item.cost,
      remainingBalance: updatedUser.value.balance
  }
    res.status(200)
    res.send(result)
    logger.log('Item Purchased', result)
  } else {
    res.status(401)
    res.send({
      error: 'Invalid authorization, purchase could not be completed.'
    })
  }
  // 
})

// Handle GAMEPLAY endpoint
app.get('/game/:ui_id', (req, res) => {
  // Fetch the webpage from the WebUIManager
  const UI_ID = req.params.ui_id
  // Return the webpage
  webUIManager.getWebpage(UI_ID).then(webpage => {
    res.send(webpage)
  }).catch(err => {
    console.error(err)
    res.status(404).redirect('/404')
  })
})

// Handle GAMEPLAY RESPONSE endpoint
app.post('/response/:ui_id', (req, res) => {
  // Fetch the webpage from the WebUIManager
  const UI_ID = req.params.ui_id
  const UI = webUIManager.UIs.get(UI_ID)

  // Check if UI ID is registered
  if(!UI) {
    res.status(404)
    res.send(path.join(__dirname, 'public', '404'))
    throw new Error('Response webpage not found.')
  }

  let data = JSON.stringify({...req.body, id: UI_ID})

  manager.broadcastEval(`if(this.shard.id == ${UI.shard}) {
    this.webUIClient.receive(${data})
  }`)
  .then(value => {
    // Return the success webpage
    res.status(302)
    res.redirect('/success')
    webUIManager.UIs.delete(UI_ID)
  })
  .catch(err => {
    console.error(err)
    res.status(404)
    res.redirect('/404')
  })
})

app.post('/createui', (req, res) => {
  // check for authentication
  if(req.headers['web-ui-client-token'] != process.env.WEB_UI_CLIENT_TOKEN) {
    res.status(403)
    res.redirect('/404')
    throw new Error('Invalid credentials when creating a new Web UI.')
  }
  webUIManager.create(req.body)
  res.status(200).end('success')
})

app.post('/voted', async (req, res) => {
  // check for authentication
  if(!process.env.DBL_WEBHOOK_AUTH || req.headers.authorization != process.env.DBL_WEBHOOK_AUTH) {
    res.status(401)
    res.send()
    throw new Error('Invalid credentials when attempting to vote using a webhook.')
  }
  const userID = req.body.user

  manager.shards.first().eval(`
  this.users.fetch('${userID}', false).then(info => {
    this.database.collection('users').findOneAndUpdate(
    {
      userID: '${userID}'
    },
    {
      $set: {
        dailyClaimed: false,
        lastClaim: Date.now()
      }
    })
  }).catch(console.error)
  `).then(() => {
    logger.log('User voted')
    res.status(200)
    res.send()
  }).catch(err => {
    console.error(err)
    res.status(500)
    res.send()
  })
})

app.post('/donations', (req, res) => {

	// STEP 1: read POST data
	req.body = req.body || {};
	res.status(200).send('OK');
	res.end();

	// read the IPN message sent from PayPal and prepend 'cmd=_notify-validate'
	var postreq = 'cmd=_notify-validate';
	for (var key in req.body) {
    var value = querystring.escape(req.body[key])
    postreq = postreq + "&" + key + "=" + value
	}

	// Step 2: POST IPN data back to PayPal to validate
	console.log('Posting back to paypal');
	console.log(postreq);
	console.log('\n\n');
	var reqOptions = {
		url: 'https://ipnpb.paypal.com/cgi-bin/webscr',
		method: 'POST',
		headers: {
			'Connection': 'close'
		},
		body: postreq,
		strictSSL: true,
		rejectUnauthorized: false,
		requestCert: true,
		agent: false
	};

	request(reqOptions, function callback(error, response, body) {
		if (!error && response.statusCode === 200) {
			// inspect IPN validation result and act accordingly
			if (body.substring(0, 8) === 'VERIFIED') {

				// assign posted variables to local variables
        const PAYMENT_AMOUNT = req.body['mc_gross'];
        const userID = req.body['custom']

        const creditsEarned = Math.floor(PAYMENT_AMOUNT * 1000)

				// IPN message values depend upon the type of notification sent.
        // check for refund
        if(creditsEarned < 0) {
          manager.shards.first().eval(`this.users.fetch('${userID}', false).then(user => user.createDM().then(channel => channel.sendMsgEmbed('You were refunded \$${PAYMENT_AMOUNT} USD from Gamebot.', 'Refunded!', ${options.colors.economy})).catch(err => console.error(err)))`)
          return
        }

        // update database
        manager.shards.first().eval(`\
        this.database.collection('users').findOneAndUpdate( {\
          userID: '${userID}'\
        }, {\
          $inc: { balance: ${creditsEarned} }\
        })`)

        manager.shards.first().eval(`this.users.fetch('${userID}', false).then(user => user.createDM().then(channel => channel.sendMsgEmbed('Thank you for your contribution to Gamebot! You spent \$${PAYMENT_AMOUNT} USD and received ${creditsEarned} credits.', 'Success!', ${options.colors.economy})).catch(err => console.error(err)))`)
        
        logger.log('User donated', {
          amount: PAYMENT_AMOUNT
        })

			} else if (body.substring(0, 7) === 'INVALID') {
				// IPN invalid, log for manual investigation
        console.error('A payment did not go through at ' + Date.now() + ' for user ' + userID)
        console.error(req.body)
        if(req.body.custom) {
          manager.shards.first().eval(`this.users.fetch('${userID}', false).then((user => user.createDM().then(channel => channel.sendMsgEmbed('There was an error processing your purchase. Please message @zero#1234 or join the Gamebot support server to have this issue resolved.', 'Error!')).catch(err => console.error(err)))`)
        }
			}
		}
	});
})

// Catch all 404s
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/404.html')
});

app.on('error', function(err) {
  if (err.code === "ECONNRESET") {
      console.log("Timeout occurs");
      return;
  }
  //handle normal errors
});


// Listen on port 5000
app.listen(process.env.PORT || 5000, (err) => {
  if (err) throw new Error(err)
  console.log('Server is running on port ' + (process.env.PORT || 5000))
})
