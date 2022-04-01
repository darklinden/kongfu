import { ICharacter, ISkill } from "./Character";
import { SeedRandom } from "./SeedRandom";

export namespace WarCalc {

    // 战斗时长5分钟
    const time_limit = 5 * 60 * 1000;

    // 一级属性等级下限一阶
    const property_min = 5;

    // 满级属性等级上限一阶
    const property_len = 1000;

    // 满级为1000级
    const level_max = 1000;

    // 用来截取对数曲线
    const magic_number_gold = (1 - 0.618) * 10;

    // 玩家默认暴击百分比
    const player_default_cirt_percent = 10; // %
    const player_default_uncirt_percent = 3; // %

    // Boss默认暴击百分比
    const boss_default_cirt_percent = 5; // %
    const boss_default_uncirt_percent = 1; // %

    // 玩家默认命中
    const player_default_hit_percent = 100; // %
    const player_default_miss_percent = 3; // %

    // boss默认命中
    const boss_default_hit_percent = 100; // %
    const boss_default_miss_percent = 3; // %

    // 破防 防御 计算
    const player_default_penetrate_percent = 10; // %
    const player_default_defense_percent = 5; // %

    // 破防 防御 计算
    const boss_default_penetrate_percent = 10; // %
    const boss_default_defense_percent = 5; // %

    // 获取等级对应属性多少点换算一阶百分比
    export function propertyLevel(level: number) {
        // Logistic模型 对数曲线
        const c = (magic_number_gold * 2) * level / level_max - magic_number_gold;
        const d = 1.0 / (1.0 + Math.exp(-c));
        return property_min + (d * property_len);
    }

    // 属性等级压制计算
    export function propPercent(
        affect_char_level: number,
        affect_char_prop: number,
        affect_percent_default: number,
        unaffect_char_level: number,
        unaffect_char_prop: number,
        unaffect_percent_default: number) {
        // 施放者当前等级对应每百分比奇效点数
        const affect_level_prop = propertyLevel(affect_char_level);
        // 被施放者当前等级对应每百分比逆效点数
        const target_level_prop = propertyLevel(unaffect_char_level);
        // 效果点数 = 施放者装备起效点数 + 施放者等级对应默认起效点数 - 被施放者装备逆效点数 - 被施放者等级对应默认逆效点数
        const totalProperty = affect_char_prop + (affect_level_prop * affect_percent_default) - unaffect_char_prop - (target_level_prop * unaffect_percent_default);
        // 起效百分比 = 效果点数 / 被施放者当前等级对应每百分比逆效点数 效果是加在被施放者身上的，默认使用被施放者等级对应
        return totalProperty / target_level_prop;
    }

    // 命中等级 - 闪避等级
    export function hitPercent(
        atkLevel: number, hit: number, default_hit_per: number,
        defLevel: number, miss: number, default_miss_per: number) {
        return propPercent(atkLevel, hit, default_hit_per, defLevel, miss, default_miss_per)
    }

    // 暴击等级 - 韧性等级
    export function critPercent(
        atkLevel: number, crit: number, defaul_crit_per: number,
        defLevel: number, uncrit: number, default_uncrit_per: number) {
        return propPercent(atkLevel, crit, defaul_crit_per, defLevel, uncrit, default_uncrit_per);
    }

    // 破防等级 - 防御等级
    export function penetratePercent(
        atkLevel: number, hit: number, default_hit_per: number,
        defLevel: number, miss: number, default_miss_per: number) {
        return propPercent(atkLevel, hit, default_hit_per, defLevel, miss, default_miss_per)
    }

    function changeHp(atk: ICharacter, tgt: ICharacter, skill: ISkill, sr: SeedRandom) {

        console.log(atk.name, '对', tgt.name, '发动了', skill.name);

        const miss = sr.int32() % 101 >= atk.hit_per;
        if (miss) {
            // 未命中
            console.log(tgt.name, '躲开了');
            return;
        }

        let damage = skill.atkMul * atk.attack;
        const crit = sr.int32() % 101 >= atk.crit_per;
        if (crit) {
            damage *= 2;
            console.log('暴击！');
        }

        const mul = (atk.pene_per + 100) / 100.0;

        damage *= mul;

        tgt.hp -= damage;

        if (tgt.hp >= 0) {
            console.log(tgt.name, '受到了', damage, '点伤害！剩余生命值：', tgt.hp);
        }
        else {
            console.log(tgt.name, '受到了', damage, '点伤害！', -tgt.hp, '过量伤害');
        }
    }

    export function calcWinner(player: ICharacter, boss: ICharacter, sr: SeedRandom) {

        // 根据等级计算 玩家 和 Boss 命中率
        player.hit_per = hitPercent(player.level, player.hit, player_default_hit_percent, boss.level, boss.miss, boss_default_miss_percent);
        boss.hit_per = hitPercent(boss.level, boss.hit, boss_default_hit_percent, player.level, player.miss, player_default_miss_percent);

        // 根据等级计算 玩家 和 Boss 暴击率
        player.crit_per = critPercent(player.level, player.cirt, player_default_cirt_percent, boss.level, boss.uncrit, boss_default_uncirt_percent);
        boss.crit_per = critPercent(boss.level, boss.cirt, boss_default_cirt_percent, player.level, player.uncrit, player_default_uncirt_percent);

        // 根据等级计算 玩家 和 Boss 减伤增伤
        player.pene_per = penetratePercent(player.level, player.penetrate, player_default_penetrate_percent, boss.level, boss.defense, boss_default_defense_percent);
        boss.pene_per = penetratePercent(boss.level, boss.penetrate, boss_default_penetrate_percent, player.level, player.defense, player_default_defense_percent);

        let winner: ICharacter = null;

        do {
            let t = 0; // 毫秒

            let playerSkills: ISkill[] = [...player.skills];
            let bossSkills: ISkill[] = [...boss.skills];

            // 随机获取一个技能
            let pi = sr.int32() % playerSkills.length;
            let player_attack = playerSkills.splice(pi, 1)[0];
            // 标记时间戳
            player_attack.lastUse = t;
            // 将技能放在数组末尾
            playerSkills.push(player_attack);

            changeHp(player, boss, player_attack, sr);

            // dead check
            if (boss.hp <= 0) {
                console.log(boss.name, '倒下了！');
                winner = player;
                break;
            }

            // 随机获取一个技能
            let bi = sr.int32() % bossSkills.length;
            let boss_attack = bossSkills.splice(bi, 1)[0];
            // 标记时间戳
            boss_attack.lastUse = t;
            // 将技能放在数组末尾
            bossSkills.push(boss_attack);

            changeHp(boss, player, boss_attack, sr);

            // dead check
            if (player.hp <= 0) {
                console.log(player.name, '倒下了！');
                winner = boss;
                break;
            }

            while (t < time_limit && player.hp > 0 && boss.hp > 0) {

                const player_next = player_attack.lastUse + player_attack.duration;
                const boss_next = boss_attack.lastUse + boss_attack.duration;

                if (player_next < boss_next) {
                    t = player_next;
                    // 玩家回合，玩家攻击
                    console.log('玩家回合, 玩家攻击');

                    pi = sr.int32() % (playerSkills.length - 1);
                    player_attack = playerSkills.splice(pi, 1)[0];
                    // 标记时间戳
                    player_attack.lastUse = t;
                    // 将技能放在数组末尾
                    playerSkills.push(player_attack);

                    changeHp(player, boss, player_attack, sr);

                    // dead check
                    if (boss.hp <= 0) {
                        console.log(boss.name, '倒下了！');
                        winner = player;
                        break;
                    }
                }
                else {
                    t = boss_next;
                    // Boss回合，Boss攻击
                    console.log('Boss回合, Boss攻击');

                    bi = sr.int32() % (bossSkills.length - 1);
                    boss_attack = bossSkills.splice(bi, 1)[0];
                    // 标记时间戳
                    boss_attack.lastUse = t;
                    // 将技能放在数组末尾
                    bossSkills.push(boss_attack);

                    changeHp(boss, player, boss_attack, sr);

                    // dead check
                    if (player.hp <= 0) {
                        console.log(player.name, '倒下了！');
                        winner = boss;
                        break;
                    }
                }
            }
        } while (false);

        console.log('胜利者是', winner.name);
    }
}