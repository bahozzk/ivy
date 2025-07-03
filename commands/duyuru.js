const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('duyuru')
        .setDescription('Belirtilen kanala bir duyuru gönderir.')
        .addChannelOption(option =>
            option.setName('kanal')
                .setDescription('Duyurunun gönderileceği kanalı seçin.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Duyuru mesajını girin.')
                .setRequired(true)),
    execute: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return interaction.reply({ content: config.messages.duyuru.yetkiYok, ephemeral: true });
        }
        const kanal = interaction.options.getChannel('kanal');
        const duyuru = interaction.options.getString('mesaj');
        if (!kanal) {
            return interaction.reply({ content: config.messages.duyuru.kanalBelirt, ephemeral: true });
        }
        if (!duyuru) {
            return interaction.reply({ content: config.messages.duyuru.mesajBelirt, ephemeral: true });
        }
        await interaction.reply({ content: 'Duyuru gönderiliyor...', ephemeral: true });
        await kanal.send(`||@everyone||`);
        const embed = new EmbedBuilder()
            .setColor('#2c2f33')
            .setDescription(duyuru)
            .setTimestamp();

        await kanal.send({ embeds: [embed] });
    }
};