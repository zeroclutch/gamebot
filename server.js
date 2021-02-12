// Configure environment variabless
const dotenv = require('dotenv')
dotenv.config()

// Initialize Discord bot
const Discord = require('./discord_mod.js');
const options = require('./config/options')
const testMode = process.argv.includes('--title=test') 
const manager = new Discord.ShardingManager('./bot.js', {
  token: options.token,
  execArgv: testMode ? ['--title=test'] : [],
  respawn: testMode ? false : true
})

manager.spawn('auto', 5000).catch(err => console.error(err))

// Add server dependencies
const request = require('request')
const bodyParser = require('body-parser')
const querystring = require('querystring');
const express = require('express')
const app = express()

// Add requests
const axios = require('axios')
const qs = require('qs');

// Create manager for custom WebUIs
const WebUIManager = require('./util/WebUIManager')
const webUIManager = new WebUIManager(app)

const DatabaseClient = require('./util/DatabaseClient')
const dbClient = new DatabaseClient('server')
dbClient.initialize()

// Create shop manager
const ShopGenerator = require('./util/ShopGenerator')
const shopGenerator = new ShopGenerator({
  shopRefreshDelay: 60000
})
shopGenerator.initialize()

// 
const OAuth2Client = require('./util/OAuth2Client')
const oauth2 = new OAuth2Client()
oauth2.initialize()

// Create logger
const Logger = require('./util/Logger')
const logger = new Logger()

const package = require('./package.json');

// Update guild count
let cachedGuilds = '??'
updateGuilds = async () => {
  let guilds = await manager.fetchClientValues('guilds.size')
  if(guilds) cachedGuilds = guilds.reduce((prev, val) => prev + val, 0)
}

setInterval(updateGuilds, 60000)

// Handle all GET requests
app.use('/', express.static(__dirname + '/public',{ extensions:['html']}))

app.get('/docs', (request, response) => {
  response.redirect('/docs/version/' + package.version)
  logger.log('Docs viewed', {
    ref: request.query.ref
  })
})

app.use('/docs/version/', express.static(__dirname + '/docs/gamebot/'))

app.get('/thanks', (request, response) => {
  response.sendFile(__dirname + '/public/thanks.html');
})

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

    let item = await dbClient.fetchItemInfo(itemID)

    if(info.balance < item.cost) {
      res.send({
        error: 'Not enough credits, purchase could not be completed.'
      })
      return
    }

    if(info.goldBalance < item.goldCost) {
      res.send({
        error: 'Not enough gold, purchase could not be completed.'
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
            $inc: { balance: -item.cost, goldBalance: -item.goldCost }
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


const fs = require('fs')
const commands = [];
const commandFiles = fs.readdirSync('./commands');

// add commands to list
for (const commandFolder of commandFiles) {
  //search through each folder
  if(commandFolder == 'economy') continue
  if(!commandFolder.includes('.DS_Store')) {
    const folder = fs.readdirSync(`./commands/${commandFolder}`)
    for(const file of folder) {
      if(file == '.DS_Store') continue
      const command = require(`./commands/${commandFolder}/${file}`)
      if(command.category !== 'dev' && command.category !== 'mod')
      commands.push({
        name: command.name,
        usage: command.usage,
        aliases: command.aliases,
        description: command.description,
        category: command.category,
        permissions: command.permissions,
        args: command.args,
      })
    }
  }
}

app.get('/fetchCommands', (req, res) => {
  res.status(200)
  res.send(commands)
})

app.get('/userInfo', async (req, res) => {
  const userID = req.query.userID
  // validate request
  if(await oauth2.validate(userID, req.header('authorization'))) {
    try {
      let info = await dbClient.fetchDBInfo(userID)
      res.status(200)
      res.send(info)
    } catch (err) {
      res.status(500)
      res.send({
        error: err.message
      })
    }
  } else {
    res.status(401)
    res.send({
      error: 'Invalid authorization, user info could not be fetched.'
    })
  }
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
    logger.log('User voted')
    res.status(200)
    res.send()
  }).catch(err => {
    console.error(err)
    res.status(500)
    res.send()
  })
})

const chargebee = require('chargebee')
chargebee.configure({
    site: process.env.CHARGEBEE_SITE, 
    api_key : process.env.CHARGEBEE_API_KEY
});


const SubscriptionManager = require('./types/database/SubscriptionManager.js')
const subscriptionManager = new SubscriptionManager({ sweepInterval: 60000 })
subscriptionManager.init()
// Chargebee
// Handle GAMEPLAY endpoint
app.post('/checkout/generateHostedPage', async (req, res) => {
  //console.log(req.body.customerID, req.header('authorization'))
  let validated = await oauth2.validate(req.body.customerID, req.header('authorization'))
  if(!validated) {
    res.status(401)
    res.send({
      error: 'Invalid authorization, log in and try again.',
      redirect: '/login'
    })
    return
  }

  console.log(req.body)

  if(!req.body.plan) {
    res.status(400)
    res.send({
      error: 'Bad request.',
    })
    return
  }

  // Validate purchase
  let plan_id =  req.body.plan.id
  let plan_quantity = req.body.plan.quantity || 1

  if(plan_id === 'gold_0001' && plan_quantity < 1) {
    res.status(400)
    res.send({
      error: 'Bad request, please enter a valid quantity.',
    })
    return
  } else if(plan_id === 'credit_0001' && plan_quantity < 100) {
    res.status(400)
    res.send({
      error: 'Bad request, please enter a valid quantity.',
    })
    return
  }

  chargebee.hosted_page.checkout_new({
    subscription: {
      plan_id,
      plan_quantity
    },
    cf_discord_user_id: req.body.customerID
  }).request(function(error, result) {
    if(error) {
      //handle error
      console.log(error)
      res.status(500)
      res.send({ error: error.message })
    } else {
      //console.log(result)
      subscriptionManager.add(result.hosted_page)
      res.send(result)
    }
  })
})

app.post('/checkout/confirmHostedPage', async (req, res) => {
  // Validate ID
  let userID = req.body.customerID
  let validated = await oauth2.validate(req.body.customerID, req.header('authorization'))
  if(!validated) {
    res.status(401)
    res.send({
      error: 'Invalid authorization, log in and try again.',
      redirect: '/login'
    })
  }

  chargebee.hosted_page.retrieve(req.body.hostedPageID).request(async function(error,result) {
    if(error){
      //handle error
      console.log(error);
      res.status(500)
      res.send(error.message)
      return
    } else {
      //console.log(result.hosted_page.content);
      // Credit user with their purchase
      let content = result.hosted_page.content;
      if(result.hosted_page.state !== 'succeeded') {
        res.status(402)
        res.send({
          error: 'Payment required, purchase not successful.',
        })
        return
      }
      if(content.subscription.status === 'non_renewing') {
        chargebee.subscription.cancel(
          content.subscription.id,
          {
            contract_term_cancel_option: 'terminate_immediately' 
          })
      } else {
        res.status(403)
        res.send({
          error: 'Rewards already claimed.'
        })
        return
      }

      // remove subscription
      let subscriptionExists = subscriptionManager.subscriptions.delete(req.body.hostedPageID)
      if(!subscriptionExists) {
        res.status(403)
        res.send({
          error: 'Rewards already claimed.'
        })
        return
      }

      await dbClient.fetchDBInfo(userID)

      // Handle payment
      const PLAN_IDS = {
        'credit_1000': { $inc: { balance: Math.floor(content.subscription.plan_quantity * 1000) } },
        'credit_0001': { $inc: { balance: Math.floor(content.subscription.plan_quantity) } },
        'gold_0001': { $inc: { goldBalance: Math.round(content.subscription.plan_quantity) } },
      }
      let newUser = await dbClient.database.collection('users').findOneAndUpdate(
        { userID },
        PLAN_IDS[content.subscription.plan_id],
        { returnOriginal: false }
      )
      res.status(200).send(newUser)
      return
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
