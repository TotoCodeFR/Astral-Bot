export declare function getLevel(userId: string): Promise<{
    level: number;
    totalXp: number;
}>;
export declare function getMoney(userId: string): Promise<{
    money: number;
    record: number;
}>;
export declare function getTopLevel(top?: number): Promise<{
    userId: string;
    level: number;
    totalXp: number;
}[]>;
export declare function getTopMoney(top?: number): Promise<{
    userId: string;
    money: number;
    record: number;
}[]>;
//# sourceMappingURL=checkDb.d.ts.map