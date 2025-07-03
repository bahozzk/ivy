const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Bir kullanıcının avatarını gösterir.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Avatarını görmek istediğiniz kullanıcıyı seçin.')
                .setRequired(false)),
    execute: async (client, interaction) => {
        const user = interaction.options.getUser('kullanici') || interaction.user;
        const embed = new EmbedBuilder()
            .setAuthor({ name: config.messages.avatar.baslik.replace('{userTag}', user.tag), iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setImage(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: config.bot.footer, iconURL: interaction.guild?.iconURL() });
        await interaction.reply({ embeds: [embed] });
    }
};