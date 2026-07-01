import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import { getLevel } from "../../src/utility/checkDb.js";
import fs from "node:fs";
import sharp from "sharp";
import path from "node:path";

function getXpForLevel(level: number) {
    return Math.floor(50 * Math.pow(level, 2.25));
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
        path.join(import.meta.dirname, "..", "..", "assets", "levelup.svg"),
        "utf-8",
    );

    const totalBarWidth = 1200;
    const progressRatio =
        (currentXp - minXp) / (nextXp - minXp);
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
    data: new SlashCommandBuilder()
        .setName("niveau")
        .setDescription("Affiche le niveau actuel de l'utilisateur.")
        .addUserOption((option) =>
            option
                .setName("utilisateur")
                .setDescription(
                    "L'utilisateur dont vous voulez afficher le niveau.",
                )
                .setRequired(false),
        ),
    async execute(
        interaction: any,
    ) {
        await interaction.deferReply();
        const user =
            interaction.options.getUser("utilisateur") || interaction.user;

        const levelData = await getLevel(user.id);

        const nextNextLevelXp = getXpForLevel(levelData.level + 1);
        const nextLevelXp = getXpForLevel(levelData.level);

        const avatarUrl = user.displayAvatarURL({
            format: "png",
            size: 128,
        });
        const imageBuffer = await generateLevelUpImage(
            user.displayName,
            levelData.level,
            avatarUrl,
            levelData.totalXp,
            nextLevelXp,
            nextNextLevelXp,
        );

        const attachment = new AttachmentBuilder(imageBuffer, {
            name: "levelup.png",
        });

        await interaction.editReply({
            files: [attachment],
        });
    },
};
