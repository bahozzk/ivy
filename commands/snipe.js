const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const moment = require('moment');
require('moment-duration-format');
moment.locale('tr');
const config = require('../config.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Son silinen mesajı gösterir'),
    async execute(interaction) {
        if (
            !interaction.member.roles.cache.has(config.registration.staffRolId) &&
            !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
        ) {
            const msg = await interaction.reply({ content: config.messages.snipe.yetkiYok, ephemeral: true });
            setTimeout(() => {
                interaction.deleteReply().catch(() => {});
            }, 10000);
            return;
        }
        const data = interaction.client.storage.get(`snipe.${interaction.guild.id}`);
        if (!data) {
            const embed = new EmbedBuilder()
                .setColor('#40FC00')
                .setFooter({ text: config.bot.status })
                .setDescription(config.messages.snipe.mesajYok);
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        const embed = new EmbedBuilder()
            .setColor('#40FC00')
            .setFooter({ text: config.bot.status })
            .setDescription(
                config.messages.snipe.aciklama
                    .replace('{authorId}', data.mesajyazan)
                    .replace('{message}', data.mesaj)
                    .replace('{channelId}', data.kanal)
                    .replace('{timeAgo}', moment.duration(Date.now() - data.ytarihi).format('D [gün], H [saat], m [dakika], s [saniye]'))
                    .replace('{deleteTimeAgo}', moment.duration(Date.now() - data.starihi).format('D [gün], H [saat], m [dakika], s [saniye]'))
            );
        const replyMsg = await interaction.reply({ embeds: [embed], ephemeral: true });
        setTimeout(() => {
            interaction.deleteReply().catch(() => {});
        }, 20000);
    }
};
