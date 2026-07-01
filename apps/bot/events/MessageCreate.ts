import {
    Events,
    EmbedBuilder,
    AttachmentBuilder,
    type Message,
} from "discord.js";
import { db, schema } from "@packages/database";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import sharp from "sharp";
import path from "node:path";
import { getMoney, getLevel } from "../src/utility/checkDb.js";

const XP_BASE = 60;
const XP_EXPONENT = 2.1;

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getXpForLevel(level: number) {
    return Math.floor(XP_BASE * level ** XP_EXPONENT);
}

async function generateLevelUpImage(
    username: string,
    level: number,
    avatarUrl: string,
    currentXp: number,
    minXp: number,
    nextXp: number,
) {
    const svgTemplate = fs.readFileSync(
        path.join(import.meta.dirname, "..", "assets", "levelup.svg"),
        "utf-8",
    );

    const totalBarWidth = 1200;
    const progressRatio = (currentXp - minXp) / (nextXp - minXp);
    const filledBarWidth = Math.max(
        0,
        Math.min(totalBarWidth, Math.floor(totalBarWidth * progressRatio)),
    );

    const svgFilled = svgTemplate
        .replace("{{username}}", username)
        .replace("{{level}}", String(level))
        .replace("{{progress_width}}", String(filledBarWidth))
        .replace("{{minXp}}", String(minXp))
        .replace("{{currentXp}}", String(currentXp))
        .replace("{{nextXp}}", String(nextXp));

    const baseImage = await sharp(Buffer.from(svgFilled)).png().toBuffer();

    const avatarResponse = await fetch(avatarUrl);
    const avatarBuffer = Buffer.from(await avatarResponse.arrayBuffer());

    const size = 128;

    const resizedAvatar = await sharp(avatarBuffer)
        .resize(size, size)
        .png()
        .toBuffer();

    const mask = Buffer.from(
        `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`,
    );

    const roundedAvatar = await sharp(resizedAvatar)
        .composite([{ input: mask, blend: "dest-in" }])
        .png()
        .toBuffer();

    const finalImage = await sharp(baseImage)
        .composite([
            {
                input: roundedAvatar,
                top: 20,
                left: 20,
            },
        ])
        .png()
        .toBuffer();

    return finalImage;
}

export default {
    name: Events.MessageCreate,
    async execute(message: Message) {
        if (message.author.bot) return;
        if (message.system) return;

        const levelData = await getLevel(message.author.id);
        const moneyData = await getMoney(message.author.id);

        const ajoutXp = getRandomInt(5, 15);
        const ajoutMoney = getRandomInt(15, 25);
        const newXp = (levelData.totalXp || 0) + ajoutXp;
        const nextNextLevelXp = getXpForLevel((levelData.level || 0) + 2);
        const nextLevelXp = getXpForLevel((levelData.level || 0) + 1);
        let levelDelta = 0;

        if (!levelData || !moneyData) {
            await db.insert(schema.levels).values({
                userId: message.author.id,
                level: 0,
                totalXp: 0,
            });

            await db.insert(schema.money).values({
                userId: message.author.id,
                money: 0,
                record: 0,
            });
        }

        if (newXp >= nextLevelXp) {
            console.log(
                `🎉 ${message.author.id} est monté au niveau ${levelData.level + 1} !`,
            );

            levelDelta++;

            const avatarUrl = message.author.displayAvatarURL({
                format: "png",
                size: 128,
            });
            const imageBuffer = await generateLevelUpImage(
                message.author.displayName,
                levelData.level + 1,
                avatarUrl,
                newXp,
                nextLevelXp,
                nextNextLevelXp,
            );

            const attachment = new AttachmentBuilder(imageBuffer, {
                name: "levelup.png",
            });

            const embed = new EmbedBuilder()
                .setColor("5e34eb")
                .setTitle(
                    `${message.author.displayName} est passé au niveau ${levelData.level + 1} !`,
                )
                .setImage("attachment://levelup.png");

            const message2 = await message.channel.send({
                embeds: [embed],
                files: [attachment],
                content: `<@${message.author.id}>`,
            });
            await message2.react("🎉");
            setTimeout(() => message2.delete(), 60000);
        }

        await db
            .update(schema.levels)
            .set({
                level: levelData.level + levelDelta,
                totalXp: newXp,
            })
            .where(eq(schema.levels.userId, message.author.id));

        let record = moneyData.record;
        if (moneyData.record < moneyData.money + ajoutMoney) {
            record = moneyData.money + ajoutMoney;
        }

        await db
            .update(schema.money)
            .set({
                money: moneyData.money + ajoutMoney,
                record,
            })
            .where(eq(schema.money.userId, message.author.id));
    },
};
