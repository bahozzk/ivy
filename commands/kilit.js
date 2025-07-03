const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const config = require('../config.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('kilit')
        .setDescription('Kanalı kilitlemek veya açmak için kullanılır.'),
    execute: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels) && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'Komutu kullanabilmek için geçerli yetkin olmalı', ephemeral: true }).then(msg => {
                setTimeout(() => msg.deleteReply().catch(() => {}), 10000);
            });
        }
        const everyone = interaction.guild.roles.cache.find(r => r.name === '@everyone');
        const buton1 = new ButtonBuilder()
            .setCustomId('1')
            .setLabel('Evet')
            .setStyle(ButtonStyle.Success);
        const buton2 = new ButtonBuilder()
            .setCustomId('2')
            .setLabel('Hayır')
            .setStyle(ButtonStyle.Danger);
        const buton3 = new ButtonBuilder()
            .setCustomId('3')
            .setLabel('Kanalı Aç')
            .setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder().addComponents(buton1, buton2);
        try {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`${interaction.user} kanalı kilitlemek istediğine emin misin?`);
            const oldMsg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });
            const filter = i => i.user.id === interaction.user.id;
            const collector = oldMsg.createMessageComponentCollector({ filter, time: 9999999 });
            collector.on('collect', async button => {
                await button.deferUpdate();
                if (button.customId === '1') {
                    if (button.user.id !== interaction.user.id) {
                        return button.reply({ content: `Komutu sadece ${interaction.user} yani komutu kullanan kişi kullanabilir.`, ephemeral: true });
                    }
                    await interaction.followUp({ content: config.emojis.yes, ephemeral: true }).catch(() => {});
                    await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: false });
                    const newEmbeds = new EmbedBuilder()
                        .setColor('Green')
                        .setDescription(`${config.emojis.yes} <@${interaction.user.id}> tarafından <#${interaction.channel.id}> kanalı kilitlendi.\nAçmak ister isen aşağıdaki butondan açabilirsin.`);

                    await oldMsg.edit({ embeds: [newEmbeds], components: [new ActionRowBuilder().addComponents(buton3)] });
                }
                if (button.customId === '2') {
                    if (button.user.id !== interaction.user.id) {
                        return button.reply({ content: `Komutu sadece ${interaction.user} yani komutu kullanan kişi kullanabilir.`, ephemeral: true });
                    }
                    await interaction.followUp({ content: config.emojis.no, ephemeral: true }).catch(() => {});
                    const hayir = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`${config.emojis.no} ${interaction.user} tarafından kanal kilitlenme reddedildi.`);
                    await oldMsg.edit({ embeds: [hayir], components: [] });
                    setTimeout(() => oldMsg.delete().catch(() => {}), 5000);
                }
                if (button.customId === '3') {
                    if (button.user.id !== interaction.user.id) {
                        return button.reply({ content: `Komutu sadece ${interaction.user} yani komutu kullanan kişi kullanabilir.`, ephemeral: true });
                    }
                    await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: true });
                    const kilitac = new EmbedBuilder()
                        .setColor('Green')
                        .setDescription(`${config.emojis.yes} Kanalın kilidi açıldı.`);

                    await oldMsg.edit({ embeds: [kilitac], components: [] });
                    setTimeout(() => oldMsg.delete().catch(() => {}), 5000);
                }
            });
        } catch (error) {
            await interaction.followUp({ content: 'Bir hata oluştu', ephemeral: true });
            console.error(error);
        }
    }
};