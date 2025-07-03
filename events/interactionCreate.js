const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'interactionCreate',
    execute: async (interaction, client) => {
        if (!interaction.isButton()) return;

        // Ticket oluşturma butonu
        if (interaction.customId === 'ticket_create') {
            const existingTicket = [...client.storage.entries()]
                .find(([key, value]) => key.startsWith('ticket_') && value.ownerId === interaction.user.id && value.guildId === interaction.guild.id);

            if (existingTicket) {
                return interaction.reply({ content: config.messages.ticket.zatenAcik, ephemeral: true });
            }

            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: config.ticket.categoryId,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                    { id: config.ytv.adminRolId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            client.storage.set(`ticket_${ticketChannel.id}`, {
                ownerId: interaction.user.id,
                guildId: interaction.guild.id,
                createdAt: Date.now()
            });

            const closeButton = new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel(config.messages.ticket.ticketKapatButon)
                .setStyle(ButtonStyle.Danger)
                .setEmoji(config.emojis.close);

            const row = new ActionRowBuilder().addComponents(closeButton);

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(config.messages.ticket.panelBaslik)
                .setDescription(config.messages.ticket.ticketHosgeldin.replace('{user}', interaction.user))
                .setFooter({ text: config.bot.footer });

            await ticketChannel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: config.messages.ticket.ticketOlusturuldu.replace('{channel}', ticketChannel), ephemeral: true });
            return;
        }

        // Ticket kapatma butonu
        if (interaction.customId === 'ticket_close') {
            const ticketData = client.storage.get(`ticket_${interaction.channel.id}`);
            if (!ticketData || ticketData.guildId !== interaction.guild.id) {
                return interaction.reply({ content: config.messages.ticket.gecersizKanal, ephemeral: true });
            }

            if (interaction.user.id !== ticketData.ownerId && !interaction.member.permissions.has('ManageChannels')) {
                return interaction.reply({ content: config.messages.ticket.kapatYetkiYok, ephemeral: true });
            }

            await interaction.deferUpdate();

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(config.messages.ticket.ticketKapatiliyor);
            await interaction.channel.send({ embeds: [embed] });

            const logEmbed = new EmbedBuilder()
                .setColor('Red')
                .setTitle(config.messages.ticket.panelBaslik)
                .setDescription(
                    config.messages.ticket.ticketLog
                        .replace('{ownerId}', ticketData.ownerId)
                        .replace('{timestamp}', Math.floor(Date.now() / 1000))
                        .replace('{channelName}', interaction.channel.name)
                        .replace('{channelId}', interaction.channel.id)
                        .replace('{userId}', interaction.user.id)
                )
                .setFooter({ text: config.bot.footer });

            const logChannel = client.channels.cache.get(config.ticket.logChannelId);
            if (logChannel) {
                await logChannel.send({ embeds: [logEmbed] });
            }

            const owner = await client.users.fetch(ticketData.ownerId).catch(() => null);
            if (owner) {
                try {
                    await owner.send({
                        embeds: [new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(config.messages.ticket.panelBaslik)
                            .setDescription(
                                config.messages.ticket.ticketKapandi
                                    .replace('{guildName}', interaction.guild.name)
                                    .replace('{timestamp}', Math.floor(Date.now() / 1000))
                            )
                            .setFooter({ text: config.bot.footer })]
                    });
                } catch (error) {
                    console.error('DM gönderilemedi:', error);
                }
            }

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
                client.storage.delete(`ticket_${interaction.channel.id}`);
            }, 5000);
            return;
        }

        // Başvuru butonları (onay/red)
        const basvurId = client.storage.get(`basvur.${interaction.message.id}`);
        if (basvurId) {
            const applicant = await client.users.fetch(basvurId).catch(() => null);
            const member = await interaction.guild.members.fetch(basvurId).catch(() => null);

            if (!applicant || !member) {
                await interaction.reply({ content: config.messages.basvuru.basvuruHata, ephemeral: true });
                return;
            }

            if (interaction.customId === 'onay') {
                try {
                    const roller = config.ytv.yetkiliRolleri;
                    if (roller && roller.length > 0) {
                        await member.roles.add(roller);
                        await interaction.reply({ content: config.messages.basvuru.basvuruOnay.replace('{userTag}', applicant.tag), ephemeral: true });
                    } else {
                        await interaction.reply({ content: config.messages.basvuru.basvuruOnayHata.replace('{userTag}', applicant.tag), ephemeral: true });
                    }
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: config.messages.basvuru.rolEklemeHata.replace('{error}', error.message), ephemeral: true });
                }
            } else if (interaction.customId === 'red') {
                await interaction.reply({ content: config.messages.basvuru.basvuruRed.replace('{userTag}', applicant.tag), ephemeral: true });
            }
            return;
        }

        // Kilit butonları
        const everyone = interaction.guild.roles.cache.find(r => r.name === '@everyone');
        if (interaction.customId === '1') {
            if (interaction.user.id !== interaction.message.embeds[0].description.match(/<@!?(\d+)>/)[1]) {
                return interaction.reply({ content: config.messages.kilit.yetkiHata.replace('{user}', `<@${interaction.message.embeds[0].description.match(/<@!?(\d+)>/)[1]}>`), ephemeral: true });
            }

            await interaction.deferUpdate();
            await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: false });

            const newEmbeds = new EmbedBuilder()
                .setColor('Green')
                .setDescription(
                    config.messages.kilit.kilitlendi
                        .replace('{emojiYes}', config.emojis.yes)
                        .replace('{userId}', interaction.user.id)
                        .replace('{channelId}', interaction.channel.id)
                );

            await interaction.message.edit({
                embeds: [newEmbeds],
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('3').setLabel('Kanalı Aç').setStyle(ButtonStyle.Primary)
                )]
            });
        } else if (interaction.customId === '2') {
            if (interaction.user.id !== interaction.message.embeds[0].description.match(/<@!?(\d+)>/)[1]) {
                return interaction.reply({ content: config.messages.kilit.yetkiHata.replace('{user}', `<@${interaction.message.embeds[0].description.match(/<@!?(\d+)>/)[1]}>`), ephemeral: true });
            }

            await interaction.deferUpdate();
            const hayir = new EmbedBuilder()
                .setColor('Red')
                .setDescription(
                    config.messages.kilit.reddedildi
                        .replace('{emojiNo}', config.emojis.no)
                        .replace('{userId}', interaction.user.id)
                );

            await interaction.message.edit({ embeds: [hayir], components: [] });
            setTimeout(() => interaction.message.delete().catch(() => {}), 5000);
        } else if (interaction.customId === '3') {
            if (interaction.user.id !== interaction.message.embeds[0].description.match(/<@!?(\d+)>/)[1]) {
                return interaction.reply({ content: config.messages.kilit.yetkiHata.replace('{user}', `<@${interaction.message.embeds[0].description.match(/<@!?(\d+)>/)[1]}>`), ephemeral: true });
            }

            await interaction.deferUpdate();
            await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: true });

            const kilitac = new EmbedBuilder()
                .setColor('Green')
                .setDescription(config.messages.kilit.kilitAcildi.replace('{emojiYes}', config.emojis.yes));

            await interaction.message.edit({ embeds: [kilitac], components: [] });
            setTimeout(() => interaction.message.delete().catch(() => {}), 5000);
        }
    }
};