const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket sistemi ile ilgili işlemler yapar.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Ticket oluşturma panelini gönderir.'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('ekle')
                .setDescription('Bir kullanıcıyı ticket kanalına ekler.')
                .addUserOption(option =>
                    option.setName('kullanici')
                        .setDescription('Eklenecek kullanıcıyı seçin.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('çıkar')
                .setDescription('Bir kullanıcıyı ticket kanalından çıkarır.')
                .addUserOption(option =>
                    option.setName('kullanici')
                        .setDescription('Çıkarılacak kullanıcıyı seçin.')
                        .setRequired(true))),
    execute: async (client, interaction) => {
        const subCommand = interaction.options.getSubcommand();
        if (subCommand === 'panel') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: config.messages.ticket.yetkiYok, ephemeral: true });
            }
            const buton = new ButtonBuilder()
                .setCustomId('ticket_create')
                .setLabel(config.messages.ticket.butonEtiket)
                .setStyle(ButtonStyle.Primary)
                .setEmoji(config.emojis.ticket);
            const row = new ActionRowBuilder().addComponents(buton);
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(config.messages.ticket.panelBaslik)
                .setDescription(config.messages.ticket.panelAciklama)
                .setFooter({ text: config.bot.footer });
            await interaction.reply({ embeds: [embed], components: [row] });
        } else if (subCommand === 'ekle') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ content: config.messages.ticket.ekleYetkiYok, ephemeral: true });
            }
            const user = interaction.options.getUser('kullanici');
            if (!user) {
                return interaction.reply({ content: config.messages.ticket.ekleHata.replace('{prefix}', config.bot.prefix[0]), ephemeral: true });
            }
            const ticketData = client.storage.get(`ticket_${interaction.channel.id}`);
            if (!ticketData || ticketData.guildId !== interaction.guild.id) {
                return interaction.reply({ content: config.messages.ticket.gecersizKanal, ephemeral: true });
            }
            await interaction.channel.permissionOverwrites.edit(user.id, {
                ViewChannel: true,
                SendMessages: true
            });
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(config.messages.ticket.ticketOlusturuldu.replace('{channel}', `<@${user.id}> ticket kanalına eklendi!`));
            await interaction.reply({ embeds: [embed] });
        } else if (subCommand === 'çıkar') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ content: config.messages.ticket.ekleYetkiYok, ephemeral: true });
            }
            const user = interaction.options.getUser('kullanici');
            if (!user) {
                return interaction.reply({ content: config.messages.ticket.cikarHata.replace('{prefix}', config.bot.prefix[0]), ephemeral: true });
            }
            const ticketData = client.storage.get(`ticket_${interaction.channel.id}`);
            if (!ticketData || ticketData.guildId !== interaction.guild.id) {
                return interaction.reply({ content: config.messages.ticket.gecersizKanal, ephemeral: true });
            }
            if (user.id === ticketData.ownerId) {
                return interaction.reply({ content: config.messages.ticket.sahipCikarHata, ephemeral: true });
            }
            await interaction.channel.permissionOverwrites.delete(user.id);
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(config.messages.ticket.ticketOlusturuldu.replace('{channel}', `<@${user.id}> ticket kanalından çıkarıldı!`));
            await interaction.reply({ embeds: [embed] });
        }
    }
};