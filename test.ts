export { };

import { ICharacter } from "./Character";
import { SeedRandom } from "./SeedRandom";
import { WarCalc } from "./WarCalc";

// // 暴击 韧性 计算
// {
//     const attacker_level = 300;
//     const attacker_crit_propery = 30000;
//     const attacker_default_cirt_percent = 10; // 10%

//     const target_level = 300;
//     const target_uncrit_propery = 3000;
//     const target_default_uncirt_percent = 3; // 3%

//     const critPercent = WarCalc.critPercent(attacker_level, attacker_crit_propery, attacker_default_cirt_percent, target_level, target_uncrit_propery, target_default_uncirt_percent);

//     console.log('critPercent:', critPercent);
// }

// // 命中 闪避 计算
// {
//     const attacker_level = 300;
//     const attacker_hit_propery = 3000;
//     const attacker_default_hit_percent = 100; // 10%

//     const target_level = 1;
//     const target_miss_propery = 3000;
//     const target_default_miss_percent = 3; // 3%

//     const hitPercent = WarCalc.hitPercent(attacker_level, attacker_hit_propery, attacker_default_hit_percent, target_level, target_miss_propery, target_default_miss_percent);

//     console.log('hitPercent:', hitPercent);
// }

// // 破防 防御 计算
// {
//     const attacker_level = 1;
//     const attacker_hit_propery = 10000;
//     const attacker_default_hit_percent = 1; // 10%

//     const target_level = 999;
//     const target_miss_propery = 1000 * 100;
//     const target_default_miss_percent = 5; // 3%

//     const penetratePercent = WarCalc.penetratePercent(attacker_level, attacker_hit_propery, attacker_default_hit_percent, target_level, target_miss_propery, target_default_miss_percent);

//     console.log('penetratePercent:', penetratePercent);
// }

const player: ICharacter = {
    name: '玩家',
    level: 111,
    attack: 30000,
    hp: 1000000,
    defense: 6000,
    penetrate: 6000,
    hit: 3000,
    miss: 6000,
    cirt: 10000,
    uncrit: 10000,
    skills: [
        {
            name: '普通攻击',
            atkMul: 1,
            duration: 800,
            coolDown: 700
        },
        {
            name: '挖鼻孔',
            atkMul: 2,
            duration: 1200,
            coolDown: 2000
        },
        {
            name: '抓头发',
            atkMul: 2,
            duration: 1200,
            coolDown: 2000
        },
        {
            name: '戳眼睛',
            atkMul: 2,
            duration: 1200,
            coolDown: 2000
        },
        {
            name: '踢jj',
            atkMul: 4,
            duration: 3000,
            coolDown: 5000
        },
    ]
}

const boss: ICharacter = {
    name: 'Boss',
    level: 111,
    attack: 30000,
    hp: 1000000,
    defense: 6000,
    penetrate: 6000,
    hit: 3000,
    miss: 6000,
    cirt: 10000,
    uncrit: 10000,
    skills: [
        {
            name: '普通攻击',
            atkMul: 1,
            duration: 1000,
            coolDown: 0
        },
        {
            name: '挖鼻孔',
            atkMul: 1.5,
            duration: 2000,
            coolDown: 3000
        },
        {
            name: '抓头发',
            atkMul: 2,
            duration: 1200,
            coolDown: 2000
        },
        {
            name: '戳眼睛',
            atkMul: 2,
            duration: 1200,
            coolDown: 2000
        },
        {
            name: '踢jj',
            atkMul: 4,
            duration: 3000,
            coolDown: 5000
        },
    ]
}

WarCalc.calcWinner(player, boss, new SeedRandom('' + Math.random()));