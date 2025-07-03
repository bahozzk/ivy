module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        if (message.author?.bot) return;
        if (!message.guild) return;

        client.storage.set(`snipe.${message.guild.id}`, {
            mesajyazan: message.author.id,
            mesaj: message.content,
            kanal: message.channel.id,
            ytarihi: message.createdTimestamp,
            starihi: Date.now()
        });
    }
};
