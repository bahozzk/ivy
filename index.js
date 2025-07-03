const fs = require('fs');
const os = require('os');
const moment = require('moment');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});
client.commands = new Collection();
client.storage = new Map();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    }
}
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Komut çalıştırılırken bir hata oluştu!', ephemeral: true });
        }
    }
});
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    client.on(event.name, (...args) => event.execute(...args, client));
}
client.once('ready', () => {
    const date = moment().format('YYYY-MM-DD HH:mm:ss');
    const used = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
    const platform = os.platform();
    const cpu = os.cpus()[0].model;
    console.clear();
    console.log('===============================================');
    console.log('                    IvyMC Discord Bot           ');
    console.log('===============================================');
    console.log(`🕒 Başlatılma Zamanı : ${date}`);
    console.log(`💾 RAM Kullanımı     : ${used} MB / ${totalMem} MB`);
    console.log(`🖥️  İşletim Sistemi  : ${platform}`);
    console.log(`🧠 CPU Modeli        : ${cpu}`);
    console.log(`🤖 Bot İsmi          : ${client.user.tag}`);
    console.log('===============================================');
    console.log('✅ Bot başarıyla başlatıldı!');
});
client.login(config.bot.token);
