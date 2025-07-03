const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config.json');
const moment = require('moment');
moment.locale('tr');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bir kullanıcıyı sunucudan banlar.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Banlanacak kullanıcıyı seçin.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Banlama sebebini belirtin.')
                .setRequired(true)),
    execute: async (client, interaction) => {
if (!interaction.member.roles.cache.has(config.penals.ban.staffRolId) && !interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
    return interaction.reply({ content: config.messages.ban.yetkiYok, ephemeral: true });
}
        const user = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep');
        if (!user) {
            return interaction.reply({ content: config.messages.ban.kullaniciBelirt, ephemeral: true });
        }
        if (!reason) {
            return interaction.reply({ content: config.messages.ban.sebepBelirt, ephemeral: true });
        }
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && member && member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: config.messages.ban.ayniYetki, ephemeral: true });
        }
        const limit = new Map();
        if (config.penals.ban.limit > 0 && limit.has(interaction.user.id) && limit.get(interaction.user.id) >= config.penals.ban.limit) {
            return interaction.reply({ content: config.messages.ban.limitAsildi, ephemeral: true });
        }
        await interaction.guild.members.ban(user, { reason });
        const embed = new EmbedBuilder()
            .setDescription(
                config.messages.ban.banBilgi
                    .replace('{user}', user)
                    .replace('{userId}', user.id)
                    .replace('{reason}', reason)
                    .replace('{authorId}', interaction.user.id)
                    .replace('{date}', moment(Date.now()).format('LLL'))
                    .replace('{cezaNo}', client.storage.get(`ceza_${interaction.guild.id}`) || 0)
            );
        await interaction.reply({ embeds: [embed] });
        const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTimestamp()
            .setAuthor({ name: interaction.member.displayName, iconURL: interaction.user.avatarURL({ dynamic: true }) })
            .setFooter({ text: config.bot.footer })
            .setDescription(
                config.messages.ban.banLog
                    .replace('{user}', user)
                    .replace('{authorId}', interaction.user.id)
                    .replace('{reason}', reason)
                    .replace('{date}', moment(Date.now()).format('LLL'))
                    .replace('{cezaNo}', client.storage.get(`ceza_${interaction.guild.id}`) || 0)
            );
        await client.channels.cache.get(config.penals.ban.logKanalId).send({ embeds: [logEmbed] });
        client.storage.set(`sicil_${user.id}`, [
            ...(client.storage.get(`sicil_${user.id}`) || []),
            config.messages.ban.sicilKaydi
                .replace('{author}', interaction.user)
                .replace('{date}', moment(Date.now()).format('LLL'))
                .replace('{reason}', reason)
        ]);
        client.storage.set(`points_${member.id}`, (client.storage.get(`points_${member.id}`) || 0) + config.penals.ban.points.banPoints);
        client.storage.set(`ceza_${interaction.guild.id}`, (client.storage.get(`ceza_${interaction.guild.id}`) || 0) + 1);
        if (config.penals.ban.limit > 0) {
            if (!limit.has(interaction.user.id)) limit.set(interaction.user.id, 1);
            else limit.set(interaction.user.id, limit.get(interaction.user.id) + 1);
            setTimeout(() => {
                if (limit.has(interaction.user.id)) limit.delete(interaction.user.id);
            }, 1000 * 60 * 60);
        }
    }
};