const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('reboot')
        .setDescription('Botu yeniden başlatır.'),
    execute: async (client, interaction) => {
        if (interaction.user.id !== '933833033579114506') {
            return interaction.reply({ content: config.messages.reboot.yetkiYok, ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(config.messages.reboot.yenidenBasliyor);
        await interaction.reply({ embeds: [embed] });
        console.log(config.messages.reboot.yenidenBasliyor);
        client.commands.forEach(async cmd => {
            await client.unloadCommand(cmd);
        });
        process.exit(1);
    }
};