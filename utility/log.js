import config from '../objectConfig.js';

async function log(interaction, type, fields) {
    const guild = interaction.guild;

    const embed = config.logs[type].getEmbed(interaction, fields);

    const channel = guild.channels.cache.find(c => c.name.includes('log'));

    await channel.send({ embeds: [embed] });
}

export { log };