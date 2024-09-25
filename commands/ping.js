// commands/ping.js

module.exports = {
    name: 'ping',
    description: 'Responds with pong',
    execute(message) {
        message.reply('pong ✅');
    }
};
