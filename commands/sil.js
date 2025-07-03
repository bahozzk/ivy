const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sil')
        .setDescription('Mesajları siler')
        .addIntegerOption(option =>
            option.setName('miktar')
                .setDescription('Silinecek mesaj sayısı (1-100)')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: config.messages.sil.yetkiYok, ephemeral: true });
        }
        const amount = interaction.options.getInteger('miktar');
        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: config.messages.sil.sayiAralik, ephemeral: true });
        }
        try {
            const deleted = await interaction.channel.bulkDelete(amount, true);
            const replyMessage = config.messages.sil.mesajSilindi.replace('{count}', deleted.size);
            await interaction.reply({ content: replyMessage, ephemeral: true });
            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 5000);

        } catch (err) {
            interaction.reply({ content: config.messages.sil.hata.replace('{error}', err.message), ephemeral: true });
        }
    }
};
