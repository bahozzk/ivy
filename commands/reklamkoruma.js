const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('reklamkoruma')
        .setDescription('Reklam koruma sistemini açar veya kapatır.')
        .addStringOption(option =>
            option.setName('islem')
                .setDescription('Yapılacak işlemi seçin: aç veya kapat')
                .setRequired(true)
                .addChoices(
                    { name: 'Aç', value: 'aç' },
                    { name: 'Kapat', value: 'kapat' }
                )),
    execute: async (client, interaction) => {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Bu komut sadece sunucularda kullanılabilir.', ephemeral: true });
        }
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: config.messages.reklamkoruma.yetkiYok, ephemeral: true });
        }
        const sec = interaction.options.getString('islem');
        const prefix = client.storage.get('prefix.') || config.bot.prefix;
        if (!sec) {
            const embed = new EmbedBuilder()
                .setColor('Random')
                .setFooter({ text: config.bot.footer })
                .setTimestamp()
                .addFields({
                    name: 'Reklam Koruma Nedir?',
                    value: config.messages.reklamkoruma.aciklama.replace('{prefix}', prefix[0])
                });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        if (sec === 'aç') {
            if (client.storage.get(`sunucuayar.reklam_koruma`)) {
                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setDescription(config.messages.reklamkoruma.zatenAcik.replace('{prefix}', prefix[0]));
                return interaction.reply({ embeds: [embed], ephemeral: true }).then(msg => {
                    setTimeout(() => msg.deleteReply().catch(() => {}), 5000);
                });
            }
            client.storage.set(`sunucuayar.reklam_koruma`, 'Aktif');
            const embed = new EmbedBuilder()
                .setColor('Random')
                .setDescription(config.messages.reklamkoruma.aktifEdildi.replace('{guildName}', interaction.guild.name));
            return interaction.reply({ embeds: [embed] }).then(msg => {
                setTimeout(() => msg.deleteReply().catch(() => {}), 5000);
            });
        }
        if (sec === 'kapat') {
            if (!client.storage.get(`sunucuayar.reklam_koruma`)) {
                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setDescription(config.messages.reklamkoruma.zatenKapali.replace('{prefix}', prefix[0]));
                return interaction.reply({ embeds: [embed], ephemeral: true }).then(msg => {
                    setTimeout(() => msg.deleteReply().catch(() => {}), 5000);
                });
            }
            client.storage.delete(`sunucuayar.reklam_koruma`);
            const embed = new EmbedBuilder()
                .setColor('Random')
                .setDescription(config.messages.reklamkoruma.deaktifEdildi.replace('{guildName}', interaction.guild.name));
            return interaction.reply({ embeds: [embed] }).then(msg => {
                setTimeout(() => msg.deleteReply().catch(() => {}), 5000);
            });
        }
    }
};