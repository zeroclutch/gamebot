Interested in developing a game, or hosting your own version of Gamebot? Here's how to get your very own copy.

#### Requirements

Gamebot runs on Node.js. You’ll need to install Node.js if you want to run the bot. The latest version of Gamebot is compatible with version 10.x of Node.js. You should use [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) to manage multiple versions of Node. 

[**Node.js v10.18.0**](https://nodejs.org/en/blog/release/v10.18.0/) - Recommended for Gamebot

[Node.js latest release](https://nodejs.org/en/download/) - Not recommended - will run into errors

You should also have Git installed to clone the repo, but it's not required.

[**Git latest release**](https://git-scm.com/downloads)

#### Getting the bot code

First, you should clone this repository. Then open it using `cd gamebot`. 

```http
git clone https://github.com/zeroclutch/gamebot.git
cd gamebot
```

#### Create your Discord bot

After that, you will have to create your own Discord bot account. Use [this straightforward guide by discord.py](https://discordpy.readthedocs.io/en/latest/discord.html) to learn how to create a bot. You should also add your new bot to a Discord server. 

#### Configure the settings

Once you have your account, you’ll need to make an environment variables file so your bot can log in. Create a new file in your working directory and name it `.env`. Paste this into your `.env` file:

```bash
DISCORD_BOT_TOKEN=YOUR_TOKEN_HERE
OWNER_ID=YOUR_DISCORD_ID_HERE
PREFIX=&
```

Replace `YOUR_TOKEN_HERE` with the token you got from the Discord Developer Portal in the linked guide above. Your token should look something like `NzAwMjY2KDM4MDxdADMDNzZz.X0pgcjA.zDtrqfmQa5J-abcdefGh123Ijklmn`. 

Also, replace `YOUR_DISCORD_ID_HERE` with your Discord ID. If you don’t know how to get your ID, [see this article](https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-). 

#### 

Now in your command line, you should install dependencies and run the bot. 

```bash
npm install
npm run dev
```

Whenever you want to run the bot, use `npm run dev`.