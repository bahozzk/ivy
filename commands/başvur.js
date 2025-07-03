const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require("discord.js");
const config = require('../config.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('başvuru')
        .setDescription('Yetkili başvuru formunu başlatır.'),
    execute: async (client, interaction) => {
        const basvurdata = client.storage.get(`basvurbilgi`);
        if (basvurdata) {
            return interaction.reply({ content: config.messages.basvuru.basvurularDurduruldu, ephemeral: true });
        }
        const bandata = client.storage.get(`ban.${interaction.user.id}`);
        if (bandata) {
            return interaction.reply({ content: config.messages.basvuru.banli, ephemeral: true });
        }
        const category = interaction.guild.channels.cache.get(config.ytv.basvuruKategoriId);
        if (!category) {
            return interaction.reply({ content: 'Başvuru kategorisi bulunamadı.', ephemeral: true });
        }
        await interaction.reply({ content: 'Başvuru kanalı oluşturuluyor...', ephemeral: true });
        const baschannel = await interaction.guild.channels.create({
            name: `${interaction.user.username}-başvuru`,
            type: ChannelType.GuildText,
            parent: category,
            permissionOverwrites: [
                { id: config.ytv.everyoneRolId, deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: config.ytv.adminRolId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
            ]
        });
        const sorular = [
            config.messages.basvuru.soru1,
            config.messages.basvuru.soru2,
            config.messages.basvuru.soru3,
            config.messages.basvuru.soru4,
            config.messages.basvuru.soru5,
            config.messages.basvuru.soru6,
            config.messages.basvuru.soru7
        ];
        let sayac = 0;
        const filter = m => m.author.id === interaction.user.id;
        const collector = baschannel.createMessageCollector({
            filter,
            max: sorular.length,
            time: 120000 // 2 dakika
        });
        await baschannel.send(config.messages.basvuru.hosgeldin.replace('{user}', interaction.user));
        await baschannel.send(sorular[sayac++]);
        collector.on('collect', async m => {
            if (sayac < sorular.length) {
                await m.channel.send(sorular[sayac++]);
            }
        });
        collector.on('end', async collected => {
            if (!collected.size) {
                await baschannel.send(config.messages.basvuru.sureBitti);
                setTimeout(() => {
                    baschannel.delete().catch(() => {});
                }, 5000);
                return;
            }
            await baschannel.send(config.messages.basvuru.basvuruIletildi);
            setTimeout(() => {
                baschannel.delete().catch(() => {});
            }, 5000);
            const onybuton = new ButtonBuilder()
                .setCustomId('onay')
                .setLabel('Onayla')
                .setStyle(ButtonStyle.Success);
            const redbuton = new ButtonBuilder()
                .setCustomId('red')
                .setLabel('Reddet')
                .setStyle(ButtonStyle.Danger);
            const row = new ActionRowBuilder()
                .addComponents(onybuton, redbuton);
            const embed = new EmbedBuilder()
                .setAuthor({ name: `${interaction.user.username} (${interaction.user.id})`, iconURL: interaction.user.avatarURL({ dynamic: true }) })
                .setTitle(config.messages.basvuru.yeniBasvuru)
                .setDescription(config.messages.basvuru.basvuruButonAciklama)
                .setColor('Blue')
                .addFields([
                    { name: config.messages.basvuru.soru1, value: collected.size > 0 ? `${collected.map(m => m.content)[0]}` : 'Yanıt verilmedi' },
                    { name: config.messages.basvuru.soru2, value: collected.size > 1 ? `${collected.map(m => m.content)[1]}` : 'Yanıt verilmedi' },
                    { name: config.messages.basvuru.soru3, value: collected.size > 2 ? `${collected.map(m => m.content)[2]}` : 'Yanıt verilmedi' },
                    { name: config.messages.basvuru.soru4, value: collected.size > 3 ? `${collected.map(m => m.content)[3]}` : 'Yanıt verilmedi' },
                    { name: config.messages.basvuru.soru5, value: collected.size > 4 ? `${collected.map(m => m.content)[4]}` : 'Yanıt verilmedi' },
                    { name: config.messages.basvuru.soru6, value: collected.size > 5 ? `${collected.map(m => m.content)[5]}` : 'Yanıt verilmedi' },
                    { name: config.messages.basvuru.soru7, value: collected.size > 6 ? `${collected.map(m => m.content)[6]}` : 'Yanıt verilmedi' }
                ])
                .setTimestamp()
                .setFooter({ text: config.bot.footer, iconURL: interaction.guild.iconURL() });
            const logMessage = await client.channels.cache.get(config.ytv.yetkiliLogKanalId).send({
                embeds: [embed],
                components: [row]
            });
            client.storage.set(`basvur.${logMessage.id}`, interaction.user.id);
        });
    }
};