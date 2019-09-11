const options = require('./../../config/options')

module.exports = {
    name: 'donate',
    usage: 'donate',
    aliases: ['patreon', 'paypal', 'support'],
    description: 'Get credits and rewards for donating to Gamebot!',
    category: 'economy',
    permissions: [],
    dmCommand: true,
    args: false,
    run: function(msg, args) {


//`https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=pranav.grover%40gmail.com&item_name=Gamebot&currency_code=USD&source=url&return_url=&notify_url=`

//https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=3NHGJNR5VHPLN&lc=US&item_name=Pokecord&no_note=1&no_shipping=1&rm=1&return=https%3a%2f%2fwww%2epokecord%2ecom%2fdonation%2dthanks&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted&custom=354442895119351809

        console.log(`https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=user%40example.com&item_name=Gamebot&currency_code=USD&source=url&return=${encodeURIComponent(process.env.BASE_URL + '/thanks')}&notify_url=${encodeURIComponent(process.env.BASE_URL + '/donations')}&custom=${msg.author.id}`)
    }
  }