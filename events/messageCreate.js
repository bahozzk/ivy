const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const kufurKoruma = client.storage.get('sunucuayar.kufur_koruma');
        const reklamKoruma = client.storage.get('sunucuayar.reklam_koruma');

        if (kufurKoruma === 'Aktif') {
            const kufurler = config.kufurListesi || ['kötükelime1', 'kötükelime2'];
            if (kufurler.some(word => message.content.toLowerCase().includes(word))) {
                await message.delete().catch(() => {});
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(config.messages.kufurkoruma.kufurTespit);
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => msg.delete().catch(() => {}), 5000);
                return;
            }
        }

        if (reklamKoruma === 'Aktif') {
            const reklamRegex = /(https?:\/\/[^\s]+)/gi;
            if (reklamRegex.test(message.content)) {
                await message.delete().catch(() => {});
                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(config.messages.reklamkoruma.reklamTespit);
                const msg = await message.channel.send({ embeds: [embed] });
                setTimeout(() => msg.delete().catch(() => {}), 5000);
            }
        }
    }
};
