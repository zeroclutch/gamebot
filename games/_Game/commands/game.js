import GameCommand from '../../../types/command/GameCommand.js'
export default new GameCommand({
    name: 'game',
    usage: 'game',
    aliases: [],
    description: 'Outputs the game info',
    category: 'info',
    permissions: [],
    args: false,
    run: async function(msg, args, game) {
        let member = msg.member || msg.author.id
        if(this.settings.updatePlayersAnytime) {
            await this.removePlayer(member, null)
            this.updatePlayers()
        } else {
            await this.removePlayer(member)
        }
    }
})