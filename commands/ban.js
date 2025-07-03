const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config.json');
const moment = require('moment');
moment.locale('tr');

module.exports = {
    name: 'ban',
    aliases: ['yargı', 'yarra'],
    execute: async (client, message, args) => {
if (!interaction.member.roles.cache.has(config.penals.ban.staffRolId) && !interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
    return interaction.reply({ content: config.messages.ban.yetkiYok, ephemeral: true });
}

        let user = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
        let reason = args.slice(1).join(' ');
        if (!user) {
            return message.channel.send({ content: config.messages.ban.kullaniciBelirt });
        }
        if (!reason) {
            return message.channel.send({ content: config.messages.ban.sebepBelirt });
        }

        const member = await message.guild.members.fetch(user.id).catch(() => null);
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) && member && member.roles.highest.position >= message.member.roles.highest.position) {
            return message.channel.send({ content: config.messages.ban.ayniYetki });
        }

        const limit = new Map();
        if (config.penals.ban.limit > 0 && limit.has(message.author.id) && limit.get(message.author.id) >= config.penals.ban.limit) {
            return message.channel.send({ content: config.messages.ban.limitAsildi });
        }

        await message.guild.members.ban(user, { reason });

        const embed = new EmbedBuilder()
            .setDescription(
                config.messages.ban.banBilgi
                    .replace('{user}', user)
                    .replace('{userId}', user.id)
                    .replace('{reason}', reason)
                    .replace('{authorId}', message.author.id)
                    .replace('{date}', moment(Date.now()).format('LLL'))
                    .replace('{cezaNo}', client.storage.get(`ceza_${message.guild.id}`) || 0)
            );

        await message.channel.send({ embeds: [embed] });

        const logEmbed = new EmbedBuilder()
            .setColor('Red')
            .setTimestamp()
            .setAuthor({ name: message.member.displayName, iconURL: message.author.avatarURL({ dynamic: true }) })
            .setFooter({ text: config.bot.footer })
            .setDescription(
                config.messages.ban.banLog
                    .replace('{user}', user)
                    .replace('{authorId}', message.author.id)
                    .replace('{reason}', reason)
                    .replace('{date}', moment(Date.now()).format('LLL'))
                    .replace('{cezaNo}', client.storage.get(`ceza_${message.guild.id}`) || 0)
            );

        await client.channels.cache.get(config.penals.ban.logKanalId).send({ embeds: [logEmbed] });
        client.storage.set(`sicil_${user.id}`, [
            ...(client.storage.get(`sicil_${user.id}`) || []),
            config.messages.ban.sicilKaydi
                .replace('{author}', message.author)
                .replace('{date}', moment(Date.now()).format('LLL'))
                .replace('{reason}', reason)
        ]);
        client.storage.set(`points_${member.id}`, (client.storage.get(`points_${member.id}`) || 0) + config.penals.ban.points.banPoints);
        client.storage.set(`ceza_${message.guild.id}`, (client.storage.get(`ceza_${message.guild.id}`) || 0) + 1);

        if (config.penals.ban.limit > 0) {
            if (!limit.has(message.author.id)) limit.set(message.author.id, 1);
            else limit.set(message.author.id, limit.get(message.author.id) + 1);
            setTimeout(() => {
                if (limit.has(message.author.id)) limit.delete(message.author.id);
            }, 1000 * 60 * 60);
        }
    }
};