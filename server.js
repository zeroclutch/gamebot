// Configure environment variabless
const dotenv = require('dotenv')
dotenv.config()

// Initialize Discord bot
const Discord = require('./discord_mod.js');
const options = require('./config/options')
const manager = new Discord.ShardingManager('./bot.js', {
  token: options.token
})

manager.spawn('auto', 5000).catch(err => console.error(err))

// Add server dependencies
const request = require('request')
const bodyParser = require('body-parser')
const querystring = require('querystring');
const express = require('express')
const app = express()

// Create manager for custom WebUIs
const WebUIManager = require('./util/WebUIManager')
const webUIManager = new WebUIManager(app)

const package = require('./package.json')

// Handle all GET requests
app.use('/', express.static(__dirname + '/public',{ extensions:['html']}))

app.use('/docs', express.static(__dirname + '/docs/gamebot/' + package.version))

app.get('/thanks', (request, response) => {
  response.sendFile(__dirname + '/public/thanks.html');
})

app.get('/invite', (req,res) => {
  res.redirect('https://discord.com/oauth2/authorize?client_id=620307267241377793&scope=bot&permissions=1547041872')
})

// Handle all POST requests

// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, parameterLimit:50000 }));

// Parse application/json
app.use(bodyParser.json({limit: "100mb"}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }))


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
    res.send(__dirname + '/public/404.html')
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
  this.fetchUser('${userID}', false).then(info => {
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
	var options = {
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

	request(options, function callback(error, response, body) {
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
          manager.shards.first().eval(`this.users.get('${userID}').createDM().then(channel => channel.sendMsgEmbed('You were refunded \$${PAYMENT_AMOUNT} USD from Gamebot.', 'Refunded!', 3510190)).catch(err => console.error(err))`)
          return
        }

        // update database
        manager.shards.first().eval(`\
        this.database.collection('users').findOneAndUpdate( {\
          userID: '${userID}'\
        }, {\
          $inc: { balance: ${creditsEarned} }\
        })`)

        manager.shards.first().eval(`this.users.get('${userID}').createDM().then(channel => channel.sendMsgEmbed('Thank you for your contribution to Gamebot! You spent \$${PAYMENT_AMOUNT} USD and received ${creditsEarned} credits.', 'Success!', 3510190)).catch(err => console.error(err))`)
        
			} else if (body.substring(0, 7) === 'INVALID') {
				// IPN invalid, log for manual investigation
        console.error('A payment did not go through at ' + Date.now() + ' for user ' + userID)
        console.error(req.body)
        if(req.body.custom) {
          manager.shards.first().eval(`this.users.get('${req.body.custom}').createDM().then(channel => channel.sendMsgEmbed('There was an error processing your purchase. Please message @zero#1234 or join the Gamebot support server to have this issue resolved.', 'Error!')).catch(err => console.error(err))`)
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
