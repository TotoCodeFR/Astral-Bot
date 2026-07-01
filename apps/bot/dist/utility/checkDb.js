import { db, schema } from "@packages/database";
import { eq, desc } from "drizzle-orm";
export async function getLevel(userId) {
    const rows = await db
        .select({
        level: schema.levels.level,
        totalXp: schema.levels.totalXp,
    })
        .from(schema.levels)
        .where(eq(schema.levels.userId, userId))
        .limit(1);
    if (rows.length === 0) {
        await db.insert(schema.levels).values({
            userId,
            level: 0,
            totalXp: 0,
        });
        return getLevel(userId);
    }
    return rows[0];
}
export async function getMoney(userId) {
    const rows = await db
        .select({
        money: schema.money.money,
        record: schema.money.record,
    })
        .from(schema.money)
        .where(eq(schema.money.userId, userId))
        .limit(1);
    if (rows.length === 0) {
        await db.insert(schema.money).values({
            userId,
            money: 0,
            record: 0,
        });
        return getMoney(userId);
    }
    return rows[0];
}
export async function getTopLevel(top = 5) {
    const rows = await db
        .select({
        userId: schema.levels.userId,
        level: schema.levels.level,
        totalXp: schema.levels.totalXp,
    })
        .from(schema.levels)
        .orderBy(desc(schema.levels.totalXp))
        .limit(top);
    return rows;
}
export async function getTopMoney(top = 5) {
    const rows = await db
        .select({
        userId: schema.money.userId,
        money: schema.money.money,
        record: schema.money.record,
    })
        .from(schema.money)
        .orderBy(desc(schema.money.money))
        .limit(top);
    return rows;
}
//# sourceMappingURL=checkDb.js.map