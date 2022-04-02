
export interface ISkill {
    // 名称
    name: string;

    // 技能倍率
    atkMul: number;

    // 持续时间
    duration: number;

    // 冷却时间
    coolDown: number;

    // 上次使用时间戳
    lastUse?: number;
}

export interface ICharacter {
    // 名称
    name: string;
    // 等级
    level: number;
    // 攻击强度
    attack: number;
    // 生命值
    hp: number;
    // 生命值
    hpMax: number;
    // 生命恢复
    heal: number;

    // 护甲
    defense: number;
    // 破甲
    penetrate: number;

    // 命中
    hit: number;
    // 闪避
    miss: number;

    // 暴击
    cirt: number;
    // 韧性
    uncrit: number;

    // 技能列表
    skills: ISkill[];

    // 计算使用

    hit_per?: number;
    crit_per?: number;
    pene_per?: number;
}
