// import all dependencies

const clean = text => {
  if (typeof(text) === 'string')
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
  else if(typeof(text) == 'object' || typeof(text) == 'map' || typeof(text) == 'collection') 
    return JSON.stringify(text, null, 2)
  return text;
}

module.exports = {
  name: 'eval',
  usage: 'eval',
  aliases: [],
  description: 'Test code',
  category: 'dev',
  permissions: ["GOD"],
  dmCommand: true,
  args: true,
  run: async function(msg, args) {
    var response = '';
    args = msg.content.split(" ").slice(1);
    try {
      response = await eval('(function(){'+msg.content.substring(6,msg.content.length)+'})();')
      msg.channel.send("```css\neval completed```\nResponse Time: `" + (Date.now()-msg.createdTimestamp) + "ms`\nresponse:```json\n" + clean(response) + "```\nType: `" + typeof(response) + "`");
    } catch (err) {
      msg.channel.send("```diff\n- eval failed -```\nResponse Time: `" + (Date.now()-msg.createdTimestamp) + "ms`\nerror:```json\n" + clean(err) + "```");
    }
  }
}