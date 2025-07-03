const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('destek')
        .setDescription('Destek talebi oluşturur.')
        .addStringOption(option =>
            option.setName('mesaj')
                .setDescription('Destek talebiniz için mesajınızı girin.')
                .setRequired(true)),
    execute: async (client, interaction) => {
        const destekKanal = config.destekKanalId;
        let isEnabled = false;
        const mesaj = interaction.options.getString('mesaj');
        if (!mesaj) {
            return interaction.reply({ content: config.messages.destek.mesajBelirt.replace('{prefix}', config.bot.prefix[0]), ephemeral: true });
        }
        await interaction.reply({ content: config.messages.destek.talepGonderildi, ephemeral: true });
        const chan = interaction.channel;
        const embed = new EmbedBuilder()
            .setTitle(config.messages.destek.talepBilgi)
            .setColor('Blue')
            .setDescription(
                config.messages.destek.talepAciklama
                    .replace('{guildName}', interaction.guild.name)
                    .replace('{guildId}', interaction.guild.id)
                    .replace('{channelName}', interaction.channel.name)
                    .replace('{channelId}', interaction.channel.id)
                    .replace('{userTag}', interaction.user.tag)
                    .replace('{userId}', interaction.user.id)
                    .replace('{message}', mesaj)
            )
            .setFooter({ text: config.bot.footer })
            .setTimestamp();
        const destekChannel = client.channels.cache.get(destekKanal);
        if (!destekChannel) {
            return interaction.followUp({ content: 'Destek kanalı bulunamadı.', ephemeral: true });
        }
        await destekChannel.send({ embeds: [embed] });
        await destekChannel.send(config.messages.destek.talepGeldi);
        const collector = destekChannel.createMessageCollector({
            filter: m => m.content === 'katıl' || m.content === 'kapat',
            time: 86400000
        });
        collector.on('collect', async m => {
            if (m.content === 'kapat') {
                collector.stop('aborted');
            }
            if (m.content === 'katıl') {
                collector.stop('success');
            }
        });
        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                return interaction.followUp({ content: config.messages.destek.zamanAsimi, ephemeral: true });
            }
            if (reason === 'aborted') {
                await interaction.followUp({ content: config.messages.destek.redEdildi, ephemeral: true });
                await destekChannel.send(config.messages.destek.redEdildiLog);
            }
            if (reason === 'success') {
                await destekChannel.send(config.messages.destek.baglantiAcildi);
                await chan.send(
                    config.messages.destek.baglantiAcildiKullanici.replace('{user}', interaction.user)
                );
                isEnabled = true;
                client.on('messageCreate', message => {
                    if (!isEnabled || message.author.id === client.user.id) return;
                    if (message.content === 'kapat') {
                        message.channel.send(config.messages.destek.aramaKapatildi);
                        if (message.channel.id === chan.id) {
                            destekChannel.send(config.messages.destek.aramaKarsiKapatildi);
                        }
                        if (message.channel.id === destekKanal) {
                            chan.send(config.messages.destek.aramaKarsiKapatildi);
                        }
                        isEnabled = false;
                        return;
                    }
                    if (message.channel.id === chan.id) {
                        destekChannel.send(`**${message.author.tag}**: ${message.content}`);
                    }
                    if (message.channel.id === destekKanal) {
                        chan.send(`**${message.author.tag}**: ${message.content}`);
                    }
                });
            }
        });
    }
};