// import all dependencies

const clean = text => {
  if (typeof(text) === 'string')
    return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
  else if(typeof(text) == 'object' || typeof(text) == 'map' || typeof(text) == 'collection') 
  try {
    let response = JSON.stringify(text, null, 2)
    text = response
  } catch {
    console.info(text)
    text = 'Unable to stringify. Output in console.'
  }
  return text;
}

module.exports = {
  name: 'eval',
  usage: 'eval',
  aliases: ['ev'],
  description: 'Test code',
  category: 'dev',
  permissions: ["GOD"],
  dmCommand: true,
  args: true,
  run: async function(msg, args) {
    var response = '';
    try {
      response = await eval('(()=>{'+args.join(' ')+'})()')
      msg.channel.send("```css\neval completed```\nResponse Time: `" + (Date.now()-msg.createdTimestamp) + "ms`\nresponse:```json\n" + clean(response) + "```\nType: `" + typeof(response) + "`");
    } catch (err) {
      console.error(err)
      msg.channel.send("```diff\n- eval failed -```\nResponse Time: `" + (Date.now()-msg.createdTimestamp) + "ms`\nerror:```json\n" + err + "```");
    }
  }
}