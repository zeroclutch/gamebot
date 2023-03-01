// Initialize logger
import logger from 'gamebot/logger'

// Initialize Discord bot
import Discord from './discord_mod.js'
import options from './config/options.js'



// Add server dependencies
import bodyParser from 'body-parser'
import express from 'express'
const app = express()

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
import Metrics from './types/log/Metrics.js'
const metrics = new Metrics()

import fs from 'fs'
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

// Detect and enable testing
const testMode = process.argv.includes('--test') 

// Initialize ShardingManager that handles bot shards
const totalShards = process.env.SHARD_COUNT ? parseInt(process.env.SHARD_COUNT) : 'auto'
const manager = new Discord.ShardingManager('./bot.js', {
  token: options.token,
  respawn: testMode ? false : true,
  mode: 'process',
  totalShards
})

const SPAWN_DELAY = 5000

manager.on('shardCreate', shard => {
  // Intentional nesting of event handlers
  // Log messages on each shard through IPC, do not create duplicate listeners
  if(!shard.hasLogListener) {
    shard.on('message', async message => {
      shard.hasLogListener = true
      if(message.type === 'log') {
        const [level, ...args] = message.data
        logger[level](...args)
      } else if(message.type === 'webui') {
        webUIManager.create(message.data)
      }
    })
  }

  setTimeout(() => shard.send({ testMode }), SPAWN_DELAY)
})

try {
  manager.spawn({
    amount: 'auto',
    delay: SPAWN_DELAY,
    timeout: 60_000,
  }).catch(err => logger.error(err))
} catch(err) {
  console.error(err)
}

// Update guild count
let cachedGuilds = null
const updateGuilds = async () => {
  // const allShardsReady = manager.shards === manager.totalShards
  // if(!allShardsReady) return
  let guilds = await manager.fetchClientValues('guilds.cache.size')
  if(guilds) cachedGuilds = guilds.reduce((prev, val) => prev + val, 0)
}
setInterval(updateGuilds, 60 * 1000 * 5)

import axios from 'axios'

// Post DBL stats every 30 minutes
if(process.env.DBL_TOKEN) {
  setInterval(async () => {
    let botId = (await manager.fetchClientValues('user.id'))[0]
    if(cachedGuilds)
      axios({
        url: `https://top.gg/api/bots/${botId}/stats`,
        method: 'POST',
        headers: {
          'Authorization': process.env.DBL_TOKEN,
        },
        data: {
          server_count: cachedGuilds < 100 ? 34346 : cachedGuilds,
          shard_count: manager.totalShards,
        }
      })
      .then(logger.info)
      .catch(logger.error.bind(logger))
  }, 1800000)
}


app.get('/docs', (request, response) => {
  response.redirect('/docs/version/' + pkg.version)
  metrics.log('Docs viewed', {
    ref: request.query.ref
  })
})

import path from 'path'
app.use('/docs/version/', express.static(path.join(__dirname, 'docs', 'gamebot')))
app.use('/', express.static(path.join(__dirname, 'dist')))

app.get('/api/guilds', async (req, res) => {
  res.send({
    guilds: cachedGuilds,
    shards: manager.totalShards
  })
})

app.get('/discord', (req,res) => {
  metrics.log('Discord joined', {
    ref: req.query.ref
  })
  res.redirect('https://discord.gg/7pNEJQC')
})

app.get('/invite', (req,res) => {
  metrics.log('Invite used', {
    ref: req.query.ref
  })
  res.redirect(`https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot&permissions=1547041872`)
})

app.get('/api/shopItems', async (req, res) => {
  let validated, shopItems
  if(req.query.userID)
    validated = await oauth2.validate(req.query.userID, req.header('authorization')).catch(logger.error.bind(logger))
  if(validated === true)
    shopItems = await shopGenerator.fetchShopItems(req.query.userID).catch(logger.error.bind(logger))
  else
    shopItems = await shopGenerator.fetchShopItems().catch(logger.error.bind(logger))
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
app.post('/api/purchase', async (req, res) => {
  const userID = req.body.userID
  const itemID = req.body.itemID
  // validate request
  let isValidated = await oauth2.validate(userID, req.header('authorization')).catch(logger.error.bind(logger))
  if(isValidated === true) {
    // Checkout
    // check if user has enough currency
    let info = await dbClient.fetchDBInfo(userID) || {}
    let item = await dbClient.fetchItemInfo(itemID) || {}

    // Test for currency
    if((item.cost && isNaN(info.balance)) || info.balance < item.cost) {
      res.send({
        error: 'Not enough credits, purchase could not be completed.',
      })
      return
    }

    // Test for gold
    if((item.goldCost && isNaN(info.goldBalance)) || info.goldBalance < item.goldCost) {
      res.send({
        error: 'Not enough gold, purchase could not be completed.'
      })
      return
    }

    // Test to see if item has already been unlocked
    if(info.unlockedItems.includes(itemID)) {
      res.send({
        error: 'This item is already unlocked, purchase could not be completed.'
      })
      return
    }

    // Validate costs
    if(item.cost < 0 || isNaN(item.cost) || item.goldCost < 0 || isNaN(item.goldCost)) {
      res.send({
        error: 'Invalid cost, purchase could not be completed.'
      })

      logger.warn({ userID, itemID }, 'Invalid cost')
      return
    }

    // submit purchase
    await dbClient.database.collection('users').updateOne(
        { userID },
        { 
            $push: { unlockedItems: item.itemID },
            $inc: { balance: -item.cost, goldBalance: -item.goldCost }
        },
        { returnOriginal: false }
    ).catch(err => {
      logger.error(err)
      res.status(500)
    })

    let updatedUser = await dbClient.fetchDBInfo(userID)

    // This should never happen, but just in case
    if(updatedUser.balance < 0)     logger.warn({ userID }, 'User has negative balance') 
    if(updatedUser.goldBalance < 0) logger.warn({ userID }, 'User has negative gold balance')
    
    const result = {
      itemID: item.itemID,
      item: item.friendlyName,
      cost: item.cost,
      remainingBalance: updatedUser.balance
    }

    res.status(200)
    res.send(result)
    metrics.log('Item Purchased', result)
  } else {
    res.status(401)
    res.send({
      error: 'Invalid authorization, purchase could not be completed.'
    })
  }
  // 
})

// import fs from 'fs'
const commands = [];
const commandFiles = fs.readdirSync('./commands');

// add commands to list
for (const commandFolder of commandFiles) {
  //search through each folder
  if(!commandFolder.includes('.DS_Store')) {
    const folder = fs.readdirSync(`./commands/${commandFolder}`)
    for(const file of folder) {
      if(file == '.DS_Store') continue
      const command = (await import(`./commands/${commandFolder}/${file}`)).default
      if(command.category !== 'dev' && command.category !== 'mod') {
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
}

app.get('/api/fetchCommands', (req, res) => {
  res.status(200)
  res.send(commands)
})

app.get('/api/userInfo', async (req, res) => {
  const userID = req.query.userID
  // validate request
  let validated = await oauth2.validate(userID, req.header('authorization')).catch(logger.error.bind(logger))
  if(validated === true) {
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
app.get('/api/ui/:ui_id', (req, res) => {
  // Fetch the webpage from the WebUIManager
  const UI_ID = req.params.ui_id
  // Return the webpage
  try {
    let ui = webUIManager.get(UI_ID)

    if(ui) {
      res.status(200)
      res.send(ui)
    } else {
      res.status(404)
      res.send({
        error: 'UI not found'
      })
    }
  } catch (err) {
    logger.error(err)
  }

})

// Handle GAMEPLAY RESPONSE endpoint
app.post('/api/ui/:ui_id', (req, res) => {
  // Fetch the webpage from the WebUIManager
  const UI_ID = req.params.ui_id
  const UI = webUIManager.UIs.get(UI_ID)

  // Check if UI ID is registered
  if(!UI) {
    res.status(404)
    res.redirect('/404')
    return
  }

  let data = {...req.body, id: UI_ID}

  manager.broadcastEval(function(client, context) {
    let [UI, data] = context
    if(client.shard.ids[0] == UI.shard) {
      client.webUIClient.receive(data)
    }
  }, {
    context: [UI, data]
  })
  .then(value => {
    // Return the success webpage
    res.status(302)
    res.redirect('/success')
    webUIManager.UIs.delete(UI_ID)
  })
  .catch(err => {
    res.status(404)
    res.redirect('/404')
    webUIManager.UIs.delete(UI_ID)
    logger.error(err)
  })
})

app.post('/voted', async (req, res) => {
  // check for authentication
  if(!process.env.DBL_WEBHOOK_AUTH || req.headers.authorization != process.env.DBL_WEBHOOK_AUTH) {
    res.status(401)
    res.send()
    throw new Error('Invalid credentials when attempting to vote using a webhook.')
  }
  const userID = req.body.user

  // Check if first ever vote
  let firstVote = false
  let user = await dbClient.fetchDBInfo(userID)
  if(user.lastClaim < 0) {
    firstVote = true
  }

  dbClient.database.collection('users').findOneAndUpdate(
    {
      userID: userID
    },
    {
      $set: {
        dailyClaimed: false,
        lastClaim: Date.now(),
        firstVote
      }
    }).then(() => {
      logger.trace({ user: userID }, 'User voted.')
      metrics.log('User voted')
      res.status(200)
      res.send()
  }).catch(err => {
    logger.error({ user: userID}, err)
    res.status(500)
    res.send()
  })
})

import chargebee from 'chargebee'
chargebee.configure({
    site: process.env.CHARGEBEE_SITE, 
    api_key : process.env.CHARGEBEE_API_KEY
});


import SubscriptionManager from './types/database/SubscriptionManager.js'
const subscriptionManager = new SubscriptionManager({ sweepInterval: 60000 })
subscriptionManager.init()
// Chargebee
// Handle CHECKOUT endpoint
app.post('/api/checkout/generateHostedPage', async (req, res) => {
  //logger.info(req.body.customerID, req.header('authorization'))
  let validated = await oauth2.validate(req.body.customerID, req.header('authorization'))
  if(validated !== true) {
    res.status(401)
    res.send({
      error: 'Invalid authorization, log in and try again.',
      redirect: '/login'
    })
    return
  }

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
    customer: {
      cf_discord_user_id: req.body.customerID
    }
  }).request(function(error, result) {
    if(error) {
      //handle error
      logger.error(error)
      res.status(500)
      res.send({ error: error.message })
    } else {
      logger.trace({ user: req.body.customerID }, 'Generated hosted page.')
      subscriptionManager.add(result.hosted_page)
      res.send(result)
    }
  })
})

app.post('/api/checkout/confirmHostedPage', async (req, res) => {
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
    if(error) {
      //handle error
      logger.info(error);
      res.status(500)
      res.send(error.message)
      return
    } else {
      // Credit user with their purchase
      let content = result.hosted_page.content;
      if(result.hosted_page.state !== 'succeeded') {
        res.status(402)
        logger.trace({ user: userID }, 'Payment required.')
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
      
      // Create user if not exists
      await dbClient.fetchDBInfo(userID)

      // Handle payment
      const PLAN_IDS = {
        'credit_1000': { $inc: { balance: Math.floor(content.subscription.plan_quantity * 1000), amountDonated: content.invoice.total } },
        'credit_0001': { $inc: { balance: Math.floor(content.subscription.plan_quantity), amountDonated: content.invoice.total } },
        'gold_0001':   { $inc: { goldBalance: Math.round(content.subscription.plan_quantity), amountDonated: content.invoice.total } },
      }
      await dbClient.database.collection('users').updateOne(
        { userID },
        PLAN_IDS[content.subscription.plan_id]
      )
 
      let newUser = await dbClient.fetchDBInfo(userID).catch(() => {
        logger.error({
          user: userID,
          plan_id: content.subscription.plan_id,
          plan_quantity: content.subscription.plan_quantity,
          content: content.invoice.total
        }, 'Error purchasing credits.')
      })

      if(newUser) {
        logger.info(newUser, 'User successfully purchased credits.')
      }

      res.status(200).send(newUser)
      return
    }
  });
  
})


// Catch all 404s
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/dist/index.html')
});

app.on('error', function(err) {
  if (err.code === "ECONNRESET") {
      logger.info("Timeout occurred");
      return;
  }
  //handle normal errors
  logger.error(err)
});


// Listen on port 5000
app.listen(process.env.PORT || 5000, (err) => {
  if (err) throw new Error(err)
  logger.info('Server is running on port ' + (process.env.PORT || 5000))
})

process.on('unhandledRejection', err => {
  logger.error(err.stack, 'error')
})