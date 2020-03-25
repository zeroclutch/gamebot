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
  console.log(req.body)
  console.log(req)
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



