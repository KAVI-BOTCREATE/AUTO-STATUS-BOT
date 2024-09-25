const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Define owner number (replace with actual owner number)
const OWNER_NUMBER = '1234567890@c.us'; // Replace with your actual owner number

// Initialize the client
const client = new Client({
    authStrategy: new LocalAuth(),
});

// Path to the runningData file
const runningDataPath = path.join(__dirname, 'runningData.json');

// Initialize runningData file if it doesn't exist
if (!fs.existsSync(runningDataPath)) {
    fs.writeFileSync(runningDataPath, JSON.stringify({ botActive: true }));
}

// Function to get bot status from runningData.json
function getBotStatus() {
    const data = fs.readFileSync(runningDataPath);
    return JSON.parse(data).botActive;
}

// Function to update bot status in runningData.json
function setBotStatus(status) {
    const data = { botActive: status };
    fs.writeFileSync(runningDataPath, JSON.stringify(data));
}

// Command handler setup
client.commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

// Load commands dynamically
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// Plugin handler setup
client.plugins = new Map();
const pluginFiles = fs.readdirSync(path.join(__dirname, 'plugins')).filter(file => file.endsWith('.js'));

// Load plugins dynamically
for (const file of pluginFiles) {
    const plugin = require(`./plugins/${file}`);
    client.plugins.set(plugin.name, plugin);
}

// Generate QR Code
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Ready event
client.on('ready', () => {
    console.log('BOT IS SUCCESSFULLY CONNECTED ✅');
    // Send message to owner upon connection
    client.sendMessage(OWNER_NUMBER, 'New bot is connected ✅');
});

// Message event handler
client.on('message', async (message) => {
    const isOwner = message.from === OWNER_NUMBER;  // Check if the message is from the owner

    // Check bot status
    const botActive = getBotStatus();

    // Check if the message starts with a dot (.) to identify as a command
    if (message.body.startsWith('.')) {
        const commandName = message.body.split(' ')[0].substring(1); // Remove the dot

        // Owner specific commands (shutdown/restart)
        if (isOwner) {
            if (commandName === 'shutdown') {
                // Disable all non-owner commands
                setBotStatus(false); // Update runningData to mark the bot as inactive
                message.reply('Bot has been shut down. Only owner commands will work.');
                console.log('Bot is now in shutdown mode.');

            } else if (commandName === 'restart') {
                // Enable all commands if bot is currently shutdown
                if (!botActive) {
                    setBotStatus(true); // Update runningData to mark the bot as active
                    message.reply('Bot has been restarted.');
                    console.log('Bot has been restarted and is fully active now.');
                } else {
                    message.reply('Bot is already running.');
                }
            }
        }

        // Only execute commands if bot is active or if the owner sends the command
        if (botActive || isOwner) {
            // Check if the command exists
            if (client.commands.has(commandName)) {
                const command = client.commands.get(commandName);

                // Execute the command
                command.execute(message);
            } else {
                message.reply('Command not found.');
            }
        } else {
            message.reply('⚠️ The bot is currently in shutdown mode. Only owner commands are allowed.');
        }
    } else {
        // Check if any plugin should be triggered
        for (const [name, plugin] of client.plugins) {
            plugin.execute(message, client);  // Pass client for plugin access
        }
    }
});

// Initialize the client
client.initialize();