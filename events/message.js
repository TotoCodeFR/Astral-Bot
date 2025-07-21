import { Events, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { getSupabaseClient } from "../utility/supabase.js";
import fs from "fs";
import sharp from "sharp";
import path from 'path'
import { fileURLToPath } from "url";
import { getMoney, getLevel } from "../checkDb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = getSupabaseClient();

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getXpForLevel(level) {
    return Math.floor(50 * Math.pow(level, 2.25));
}

async function generateLevelUpImage(username, level, avatarUrl, currentXp, minXp, nextXp) {
    const svgTemplate = fs.readFileSync(path.join(__dirname, '..', 'assets', 'levelup.svg'), 'utf-8');

    const totalBarWidth = 1200;
    const progressRatio = (currentXp - minXp) / (nextXp - minXp);
    const filledBarWidth = Math.max(0, Math.min(totalBarWidth, Math.floor(totalBarWidth * progressRatio)));

    const svgFilled = svgTemplate
        .replace('{{username}}', username)
        .replace('{{level}}', level)
        .replace('{{progress_width}}', filledBarWidth)
        .replace('{{minXp}}', minXp)
        .replace('{{currentXp}}', currentXp)
        .replace('{{nextXp}}', nextXp);

    const baseImage = await sharp(Buffer.from(svgFilled)).png().toBuffer();

    const avatarResponse = await fetch(avatarUrl);
    const avatarBuffer = Buffer.from(await avatarResponse.arrayBuffer());

    const size = 128;

    const resizedAvatar = await sharp(avatarBuffer)
        .resize(size, size)
        .png()
        .toBuffer();

    const mask = Buffer.from(
        `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
    );

    const roundedAvatar = await sharp(resizedAvatar)
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toBuffer();

    const finalImage = await sharp(baseImage)
        .composite([
            {
                input: roundedAvatar,
                top: 20,
                left: 20
            }
        ])
        .png()
        .toBuffer();

    return finalImage;
}

export default {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const levelData = await getLevel(message.author.id);
        const moneyData = await getMoney(message.author.id)

        const ajoutXp = getRandomInt(15, 25);
        const ajoutMoney = getRandomInt(15, 25);
        const newXp = levelData.total_xp + ajoutXp;
        const nextNextLevelXp = getXpForLevel(levelData.level + 2);
        const nextLevelXp = getXpForLevel(levelData.level + 1);
        let levelDelta = 0;

        if (newXp >= nextLevelXp) {
            console.log(`🎉 ${message.author.id} est monté au niveau ${levelData.level + 1} !`);

            levelDelta++

            const avatarUrl = message.author.displayAvatarURL({ format: 'png', size: 128 });
            const imageBuffer = await generateLevelUpImage(
                message.author.displayName,
                levelData.level + 1,
                avatarUrl,
                newXp,
                nextLevelXp,
                nextNextLevelXp
            );

            const attachment = new AttachmentBuilder(imageBuffer, { name: 'levelup.png' });

            const embed = new EmbedBuilder()
                .setColor("5e34eb")
                .setTitle(`${message.author.displayName} est passé au niveau ${levelData.level + 1} !`)
                .setImage('attachment://levelup.png');

            await message.channel.send({ embeds: [embed], files: [attachment] });
        }

        const { error: levelUpdateError } = await supabase
            .from('levels')
            .update({ level: levelData.level + levelDelta, total_xp: newXp })
            .eq('user_id', message.author.id);

        if (levelUpdateError) {
            console.error(`❌ Impossible de mettre à jour le niveau pour l'utilisateur ${message.author.id}:`, updateError.message);
            return;
        }

        let record = moneyData.record;
        if (moneyData.record < moneyData.money + ajoutMoney) {
            record = moneyData.money + ajoutMoney;
        }

        const { error: moneyUpdateError } = await supabase
            .from('money')
            .update({ money: moneyData.money + ajoutMoney, record })
            .eq('user_id', message.author.id);
        
        if (moneyUpdateError) {
            console.error(`❌ Impossible de mettre à jour l'argent pour l'utilisateur ${message.author.id}:`, updateError.message);
            return;
        }
    }
};