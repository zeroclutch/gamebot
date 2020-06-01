module.exports = {
  name: 'draw',
  usage: 'draw',
  aliases: [''],
  description: 'Sends a link to a drawing page',
  category: 'dev',
  permissions: [],
  dmCommand: true,
  args: false,
  run: function (msg, args) {
    msg.client.webUIClient.createWebUI(msg.member, data => msg.channel.send({
      embed: {
        color: 5301186,
        author: {
          name: `${msg.author.tag}'s drawing`,
          icon_url: msg.author.avatarURL
        },
        image: {
          url: 'attachment://file.png'
        }
      },
      files: [{
        name: 'file.png',
        attachment: Buffer.from(data, 'base64')
      }]
    }), {
      type: 'drawing',
      duration: 600
    }).then(url => msg.channel.send({
      embed: {
        description: `[Click here](${url}) for your drawing page, ${msg.author}!`,
        color: 5301186
      }
    }))
  }
}