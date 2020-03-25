const Discord = require('discord.js');
const options = require('./config/options')
const manager = new Discord.ShardingManager('./bot.js', { token: options.token })

manager.on('shardCreate', shard => console.log(`hi`))
manager.spawn(2).catch(err => console.error(err))

const express = require("express")
const app = express()

// Handle all GET requests
app.use(express.static(__dirname + '/public'))

app.get('/thanks', (request, response) => {
  response.sendFile(__dirname + '/public/thanks.html');
})

app.get('*', (request, response) => {
    response.sendFile(__dirname + '/public/index.html');
})


// Handle all POST requests
app.use(express.json())

app.post('/voted', async (req, res) => {
  // check for authentication
  if(!process.env.DBL_WEBHOOK_AUTH || req.headers.authorization != process.env.DBL_WEBHOOK_AUTH) {
    res.status(401)
    res.send()
    throw new Error('Invalid credentials when attempting to vote using a webhook.')
  }
  const json = req.body
  const collection = client.database.collection('users')
  var user = client.users.get(json.user)
  if(!user) {
    await client.fetchUser(json.user).then(u => user = u)
    .catch(console.error)
  }
  await user.fetchDBInfo().then(info => {
    collection.updateOne(
      { userID: json.user },
      {
        $set: {
          dailyClaimed: false,
          lastClaim: Date.now()
        }
      }
    )
    res.status(200)
  }).catch(err => {
    console.error(err)
    res.status(500)
  })
  res.send()
})

app.post('/donations', (req, res) => {
  console.log('Received POST /');
	console.log(req.body);
	console.log('\n\n');

	// STEP 1: read POST data
	req.body = req.body || {};
	res.status(200).send('OK');
	res.end();

	// read the IPN message sent from PayPal and prepend 'cmd=_notify-validate'
	var postreq = 'cmd=_notify-validate';
	for (var key in req.body) {
		if (req.body.hasOwnProperty(key)) {
			var value = querystring.escape(req.body[key]);
			postreq = postreq + "&" + key + "=" + value;
		}
	}

	// Step 2: POST IPN data back to PayPal to validate
	console.log('Posting back to paypal');
	console.log(postreq);
	console.log('\n\n');
	var options = {
		url: 'https://www.sandbox.paypal.com/cgi-bin/webscr',
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
				// The IPN is verified, process it
				console.log('Verified IPN!');
				console.log('\n\n');

				// assign posted variables to local variables
				var item_name = req.body['item_name'];
				var item_number = req.body['item_number'];
				var payment_status = req.body['payment_status'];
				var payment_amount = req.body['mc_gross'];
				var payment_currency = req.body['mc_currency'];
				var txn_id = req.body['txn_id'];
				var receiver_email = req.body['receiver_email'];
        var payer_email = req.body['payer_email'];
        var custom = req.body['payer_email'];

				//Lets check a variable
        console.log("Checking body");
				console.log(req.body);
				console.log('\n\n');

				// IPN message values depend upon the type of notification sent.
				// To loop through the &_POST array and print the NV pairs to the screen:
				console.log('Printing all key-value pairs...')
				for (var key in req.body) {
					if (req.body.hasOwnProperty(key)) {
						var value = req.body[key];
						console.log(key + "=" + value);
					}
				}

			} else if (body.substring(0, 7) === 'INVALID') {
				// IPN invalid, log for manual investigation
				console.log('Invalid IPN!');
				console.log('\n\n');
			}
		}
	});
})

// Listen on port 5000
app.listen(process.env.PORT || 5000, (err) => {
  if (err) throw err
  console.log('Server is running on port ' + (process.env.PORT || 5000))
})

app.on('error', function(err) {
  if (err.code === "ECONNRESET") {
      console.log("Timeout occurs");
      return;
  }
  //handle normal errors
});



