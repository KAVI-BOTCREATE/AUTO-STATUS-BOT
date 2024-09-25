const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Define owner number (replace with actual owner number)
const OWNER_NUMBER = '94704467936@c.us'; // Format should be with '@c.us' for WhatsApp

// Initialize the client
const client = new Client({
    authStrategy: new LocalAuth(),
});

// Command handler setup
client.commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

// Load commands dynamically
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// Generate QR Code
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Ready event
client.on('ready', () => {
    console.log('BOT IS SUCCESSFULLY CONNECTED ✅');
    // Send message to owner upon connection
    client.sendMessage(OWNER_NUMBER, '*New bot is connected ✅*');
});

// Message event handler
client.on('message', async (message) => {
    // Check if the message starts with a dot (.) to identify as a command
    if (message.body.startsWith('.')) {
        const commandName = message.body.split(' ')[0].substring(1); // Remove the dot

        // Check if the command exists
        if (client.commands.has(commandName)) {
            const command = client.commands.get(commandName);

            // Only execute command if it's sent from the bot's number
            const chat = await message.getChat();
            const participants = await chat.getParticipants();
            const botNumber = (await client.info.wid).user + '@c.us'; // Get bot's WhatsApp number

            // If the bot itself sent the message or the bot is in the participants, execute the command
            if (message.fromMe || message.from === botNumber) {
                command.execute(message);
            }
        }
    }
});

// Initialize the client
client.initialize();
