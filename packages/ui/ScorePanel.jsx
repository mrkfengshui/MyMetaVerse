// packages/ui/ScorePanel.jsx
import React, { useState } from 'react';
import { THEME, PATTERN_DESC } from '@my-meta/ui';
import { X, ChevronLeft, ChevronRight, Info } from 'lucide-react';

// --- 1. 定義常量 ---
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

const PALACE_ORDER = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '奴僕', '官祿', '田宅', '福德', '父母'];

const goodJia = ['財蔭夾印', '科權祿夾', '紫府夾命', '日月夾命', '左右夾命', '昌曲夾命', '魁鉞夾命'];
const badPatterns = [
    '風流彩杖', '因財持刀', '兩重華蓋', '梁馬飄蕩', '巨逢四煞', 
    '路上埋屍', '桃花滾浪', '鈴昌陀武', '巨火羊', '馬頭帶劍', 
    '泛水桃花', '刑囚夾印', '火鈴夾命', '空劫夾命', '羊陀夾忌',
    '化忌入命', '化忌沖命', '貪狼遇文昌', '貪狼遇文曲', '命逢空劫'
];

const getSanFangSiZheng = (centerIdx) => {
    // 安全取餘數函數，確保結果為正整數
    const safeIdx = (centerIdx + 120) % 12;
    return [
        safeIdx,            // 0: 本宮
        (safeIdx + 4) % 12, // 1: 三方
        (safeIdx + 8) % 12, // 2: 三方
        (safeIdx + 6) % 12  // 3: 對宮
    ];
};

const getRelativePalaceName = (centerIdx, targetIdx) => {
    // 避免 NaN 導致的錯誤
    if (isNaN(centerIdx) || isNaN(targetIdx)) return '';
    const offset = (centerIdx - targetIdx + 120) % 12; // +120 防止負數
    return PALACE_ORDER[offset] || '';
};

/**
 * 計算評分與格局 (安全版)
 */
const calculateScoreAndFormations = (grid, centerIdx, targetName = '命', activeGan = null, siHuaRules = null) => {
    // 預設回傳值
    const defaultResult = { score: 40, formations: [], details: { good: [], bad: [] }, luckRatio: 50, baseScore: 40 };

    // 1. 強力防呆：檢查索引是否為數字且有效，檢查 grid 是否存在
    if (
        centerIdx === undefined || 
        centerIdx === null || 
        typeof centerIdx !== 'number' || 
        isNaN(centerIdx) || 
        centerIdx < 0 || 
        !grid || 
        !grid[centerIdx]
    ) {
        return defaultResult;
    }

    try {
        const indices = getSanFangSiZheng(centerIdx);
        const activeRules = (activeGan && siHuaRules) ? siHuaRules[activeGan] : null;

        // --- 1. 計算基礎分 ---
        let baseScore = 50; 
        let formations = [];
        
        const selfPalace = grid[centerIdx];
        const oppPalace = grid[indices[3]]; 
        
        // 防呆：確保 star 陣列存在
        const safeStars = (palace) => (palace && Array.isArray(palace.stars)) ? palace.stars : [];
        const safeMinorStars = (palace) => (palace && Array.isArray(palace.minorStars)) ? palace.minorStars : [];

        const MAJOR_STARS = ['紫微','天機','太陽','武曲','天同','廉貞','天府','太陰','貪狼','巨門','天相','天梁','七殺','破軍'];
        const selfMajors = safeStars(selfPalace).filter(s => MAJOR_STARS.includes(s.name));
        const isEmptyPalace = selfMajors.length === 0;
        
        // 若空宮，借對宮
        let starsToEval = isEmptyPalace ? safeStars(oppPalace).filter(s => MAJOR_STARS.includes(s.name)) : selfMajors;
        
        if (isEmptyPalace) formations.push("空宮");

        if (starsToEval.length > 0) {
            let brightnessScoreSum = 0;
            starsToEval.forEach(s => {
                let b = 50; 
                if (s.brightness === '廟') b = 85;
                else if (s.brightness === '旺') b = 65;
                else if (s.brightness === '地') b = 55;
                else if (s.brightness === '陷') b = 45;
                brightnessScoreSum += b;
            });
            baseScore = brightnessScoreSum / starsToEval.length;
            if (isEmptyPalace) { 
                baseScore *= 0.8; 
                if (baseScore < 30) baseScore = 30;
            }
        } else {
            baseScore = 40; 
        }

        // --- 2. 計算吉凶能量 ---
        let totalGoodPoints = 0.01; 
        let totalBadPoints = 0.01;
        let goodStarsList = [];
        let badStarsList = [];
        
        let allStars = [];
        let starMap = {}; 
        let huaMap = { '祿': 0, '權': 0, '科': 0, '忌': 0 };
        let sunBrightness = null;
        let moonBrightness = null;

        const POS_WEIGHTS = [4, 1.5, 1.5, 3]; 

        indices.forEach((idx, relPos) => {
            const palace = grid[idx];
            if (!palace) return;
            const weight = POS_WEIGHTS[relPos];
            const isSelf = relPos === 0;
            const isOpposite = relPos === 3;

            const relName = getRelativePalaceName(centerIdx, idx);
            const palaceNameSuffix = isSelf ? ` (${targetName}宮)` : ` (${relName})`;

            [...safeStars(palace), ...safeMinorStars(palace)].forEach(s => {
                if(!s || !s.name) return; // 防呆
                allStars.push(s.name);
                starMap[s.name] = relPos;
                if (s.name === '太陽') sunBrightness = s.brightness;
                if (s.name === '太陰') moonBrightness = s.brightness;

                // 判斷四化
                let currentHua = s.hua;
                if (activeRules) {
                    if (s.name === activeRules.lu) currentHua = '祿';
                    else if (s.name === activeRules.quan) currentHua = '權';
                    else if (s.name === activeRules.ke) currentHua = '科';
                    else if (s.name === activeRules.ji) currentHua = '忌';
                }

                if (currentHua) huaMap[currentHua] = (huaMap[currentHua] || 0) + 1;

                // 吉曜計分
                let gPt = 0;
                if (currentHua !== '忌') {
                    if (currentHua === '祿') gPt = 30;
                    else if (currentHua === '權') gPt = 20;
                    else if (currentHua === '科') gPt = 15;
                    else if (['祿存'].includes(s.name)) gPt = 18;
                    else if (['左輔','右弼','天魁','天鉞'].includes(s.name)) gPt = 10;
                    else if (['文昌','文曲'].includes(s.name)) gPt = 8;
                }

                if (gPt > 0) {
                    totalGoodPoints += gPt * weight;
                    goodStarsList.push(`${s.name}${currentHua ? '化'+currentHua : ''}${palaceNameSuffix}`);
                }

                // 凶曜計分
                let bPt = 0;
                if (currentHua === '忌') {
                    bPt = 40;
                    if (isSelf) formations.push("化忌入命");
                    if (isOpposite) formations.push("化忌沖命");
                }
                else if (['地劫', '天空'].includes(s.name)) bPt = 12;
                else if (['擎羊', '陀羅'].includes(s.name)) bPt = 15;
                else if (['火星', '鈴星'].includes(s.name)) bPt = 15;

                if (bPt > 0) {
                    totalBadPoints += bPt * weight;
                    badStarsList.push(`${s.name}${currentHua ? '化'+currentHua : ''}${palaceNameSuffix}`);
                }
            });
        });

        // --- 3. 格局偵測 (Pattern Detection) ---
        const has = (star) => allStars.includes(star);
        const inSelf = (star) => starMap[star] === 0;       // 在命宮
        const inOpposite = (star) => starMap[star] === 3;   // 在遷移宮
        const inSanFang = (star) => [1, 2].includes(starMap[star]); // 在財帛或官祿
        const isBright = (b) => ['廟', '旺'].includes(b);
        const currentZhi = selfPalace.zhi || '';
        
        // 判斷煞星數量 (命宮)
        const selfShaCount = ['擎羊','陀羅','火星','鈴星','地劫','天空'].filter(s => inSelf(s)).length;

        // --- 夾局判斷專用邏輯 ---
        // 取得鄰宮 (兄弟/父母) 的所有星曜與四化
        const getNeighborInfo = (offset) => {
            const idx = (centerIdx + offset + 120) % 12;
            const p = grid[idx];
            if (!p) return { stars: [], huas: [] };
            
            let stars = [];
            let huas = [];
            
            [...safeStars(p), ...safeMinorStars(p)].forEach(s => {
                if(s && s.name) {
                    stars.push(s.name);
                    // 判斷四化
                    let h = s.hua;
                    if (activeRules) {
                        if (s.name === activeRules.lu) h = '祿';
                        else if (s.name === activeRules.quan) h = '權';
                        else if (s.name === activeRules.ke) h = '科';
                        else if (s.name === activeRules.ji) h = '忌';
                    }
                    if(h) huas.push(h);
                }
            });
            return { stars, huas };
        };

        const prevInfo = getNeighborInfo(-1); // 兄弟宮方向
        const nextInfo = getNeighborInfo(1);  // 父母宮方向

        // 判斷是否被某兩個條件夾 (支援星曜名稱或四化名稱)
        // condition1/2 可以是 '天梁' (星名) 或 '祿' (四化)
        const isClampedBy = (cond1, cond2) => {
            const check = (info, cond) => info.stars.includes(cond) || info.huas.includes(cond);
            return (check(prevInfo, cond1) && check(nextInfo, cond2)) || 
                   (check(prevInfo, cond2) && check(nextInfo, cond1));
        };

        // ================= 富貴與權祿格局 =================
        
        // 極向離明: 紫微在午宮坐命，無煞
        if (inSelf('紫微') && currentZhi === '午' && selfShaCount === 0) {
            formations.push("極向離明");
        }

        // 機巨同臨: 天機巨門在卯宮
        if (inSelf('天機') && inSelf('巨門') && currentZhi === '卯') {
            formations.push("機巨同臨");
        }

        // 雄宿朝元: 廉貞在寅申獨坐 (廉貞在寅申必獨坐，對宮貪狼)
        if (inSelf('廉貞') && !inSelf('七殺') && !inSelf('破軍') && !inSelf('貪狼') && !inSelf('天府') && ['寅', '申'].includes(currentZhi)) {
            formations.push("雄宿朝元");
        }

        // 財蔭夾印: 天相被化祿(財)與天梁(蔭)所夾
        if (inSelf('天相') && isClampedBy('祿', '天梁')) {
            formations.push("財蔭夾印");
        }

        // 將星得地: 武曲在辰戌丑未
        if (inSelf('武曲') && ['辰', '戌', '丑', '未'].includes(currentZhi)) {
            formations.push("將星得地");
        }

        // 權祿巡逢: 化祿與化權在命宮或三方 (這裡簡化為三方四正有)
        if (huaMap['祿'] > 0 && huaMap['權'] > 0) {
            formations.push("權祿巡逢");
        }

        // 科權祿夾: 命宮被科、權、祿任二者所夾
        // 邏輯：檢查鄰宮是否有科權祿，且合計數量 >= 2 (左右各一)
        const countJiaHua = (type) => (prevInfo.huas.includes(type) ? 1 : 0) + (nextInfo.huas.includes(type) ? 1 : 0);
        const jiaLu = countJiaHua('祿');
        const jiaQuan = countJiaHua('權');
        const jiaKe = countJiaHua('科');
        // 簡單判斷：只要左右鄰宮充滿吉化即可，不嚴格限制排列
        if ((jiaLu + jiaQuan + jiaKe) >= 2 && !prevInfo.huas.includes('忌') && !nextInfo.huas.includes('忌')) {
            formations.push("科權祿夾");
        }

        // 文星拱命: 昌曲在三方四正 (不含本宮) 拱照
        if ((inSanFang('文昌') || inOpposite('文昌')) && (inSanFang('文曲') || inOpposite('文曲'))) {
            formations.push("文星拱命");
        }

        // 輔拱文星: 昌曲坐命，左右拱照
        if ((inSelf('文昌') || inSelf('文曲')) && (inSanFang('左輔') || inSanFang('右弼') || inOpposite('左輔') || inOpposite('右弼'))) {
            formations.push("輔拱文星");
        }

        // 天府朝垣: 天府在戌/辰坐命
        if (inSelf('天府') && ['戌', '辰'].includes(currentZhi)) {
            formations.push("天府朝垣");
        }

        // 祿合鴛鴦: 祿存與化祿，一在命一在遷 (或三方匯聚)
        // 嚴格定義：命有祿存，遷有化祿；或命有化祿，遷有祿存
        if ((inSelf('祿存') && inOpposite('祿')) || (inSelf('祿') && inOpposite('祿存'))) {
            formations.push("祿合鴛鴦");
        } else if (has('祿存') && huaMap['祿'] > 0 && !inSelf('祿存') && !inSelf('祿')) {
            // 寬鬆定義：雙祿交流 (已在下方舊代碼包含，這裡可保留鴛鴦的嚴格定義)
        }

        // ================= 特殊與凶局 =================

        // 風流彩杖: 貪狼廉貞同宮 (必在巳亥)
        if (inSelf('貪狼') && inSelf('廉貞')) {
            formations.push("風流彩杖");
        }

        // 因財持刀: 武曲七殺同宮 (必在卯酉)，見擎羊
        if (inSelf('武曲') && inSelf('七殺') && has('擎羊')) {
            formations.push("因財持刀");
        }

        // 兩重華蓋: 祿存或化祿坐命，遇空劫
        if ((inSelf('祿存') || inSelf('祿')) && (inSelf('地劫') || inSelf('天空'))) {
            formations.push("兩重華蓋");
        }

        // 梁馬飄蕩: 天梁天馬同宮 (巳亥申寅)
        if (inSelf('天梁') && inSelf('天馬')) {
            formations.push("梁馬飄蕩");
        }

        // 巨逢四煞: 巨門坐命，三方四正見羊陀火鈴 (這裡設為見2煞以上即警示)
        if (inSelf('巨門')) {
            const shaCount = (has('擎羊')?1:0) + (has('陀羅')?1:0) + (has('火星')?1:0) + (has('鈴星')?1:0);
            if (shaCount >= 2) formations.push("巨逢四煞");
        }

        // 刑忌夾印: 天相受 化忌+天梁 夾，或 化忌+擎羊 夾
        if (inSelf('天相')) {
            if (isClampedBy('忌', '天梁') || isClampedBy('忌', '擎羊')) {
                formations.push("刑忌夾印");
            }
        }

        // 馬落空亡: 天馬遇空亡星
        if (inSelf('天馬') && (inSelf('地劫') || inSelf('天空') || inSelf('截空'))) {
            formations.push("馬落空亡");
        }

        // 太陽太陰系列格局

        // 1. 日月同宮 (丑未)
        if (inSelf('太陽') && inSelf('太陰')) {
            formations.push("日月同宮");
        }

        // 2. 明珠出海 (命宮在未，空宮，日月廟旺拱照)
        // 修正：必須檢查亮度(廟旺)，避免誤判「日月在丑(陷)沖命」的格局
        if (currentZhi === '未' && isEmptyPalace && has('太陽') && has('太陰')) {
            if (isBright(sunBrightness) && isBright(moonBrightness)) {
                formations.push("明珠出海");
            }
        }

        // 3. 日月並明 (丹墀桂墀的另一種說法，或指日月皆在廟旺之地照命)
        // 定義：太陽在巳/辰，太陰在酉/戌
        if (has('太陽') && has('太陰') && isBright(sunBrightness) && isBright(moonBrightness)) {
            // 排除掉已經是「明珠出海」的情況，避免重複顯示
            if (!formations.includes("明珠出海")) {
                 // 檢查位置是否符合典型的並明 (日巳月酉 或 日辰月戌)
                 const sunZhi = grid.find(p => safeStars(p).some(s => s.name === '太陽'))?.zhi;
                 const moonZhi = grid.find(p => safeStars(p).some(s => s.name === '太陰'))?.zhi;
                 
                 // 嚴格定義：太陽在辰巳，太陰在酉戌
                 if (['辰','巳'].includes(sunZhi) && ['酉','戌'].includes(moonZhi)) {
                     formations.push("丹墀桂墀");
                 }
                 // 日月有暉
                 if (has('太陽') && has('太陰') && isBright(sunBrightness) && isBright(moonBrightness)) {
                    const sunPos = grid.find(p => safeStars(p).some(s => s.name === '太陽'))?.zhi;
                    const moonPos = grid.find(p => safeStars(p).some(s => s.name === '太陰'))?.zhi;
                    if (sunPos && moonPos && sunPos !== moonPos) {
                        formations.push("日月有暉");
                 }
        }
            }
        }

        // 4. 日月反背 (太陽在戌亥子，太陰在卯辰巳)
        // 修正：除了命宮主星外，若命宮無主星借到反背的日月，也算
        let isFanBei = false;
        
        // 情況A: 命宮主星反背
        if ((inSelf('太陽') && ['戌', '亥', '子'].includes(currentZhi)) || 
            (inSelf('太陰') && ['卯', '辰', '巳'].includes(currentZhi))) {
            isFanBei = true;
        }
        
        // 情況B: 命宮空宮，借對宮(遷移)日月反背 (例如命宮在辰空宮，對宮戌有太陽)
        if (isEmptyPalace) {
            const oppSun = safeStars(oppPalace).find(s => s.name === '太陽');
            const oppMoon = safeStars(oppPalace).find(s => s.name === '太陰');
            
            // 檢查對宮太陽是否落陷
            if (oppSun && ['戌', '亥', '子'].includes(oppPalace.zhi)) isFanBei = true;
            // 檢查對宮太陰是否落陷
            if (oppMoon && ['卯', '辰', '巳'].includes(oppPalace.zhi)) isFanBei = true;
        }
        if (isFanBei) formations.push("日月反背");

        // 5. 其他單星亮度格局
        if (inSelf('太陽') && currentZhi === '卯') formations.push("日照雷門");
        if (inSelf('太陰') && currentZhi === '亥') formations.push("月朗天門");
        // 日麗中天: 太陽在午宮，無煞 (嚴格來說要廟旺，午宮必廟)
        if (inSelf('太陽') && currentZhi === '午' && selfShaCount === 0) {
            formations.push("日麗中天");
        }
        // 水澄桂萼: 太陰在子宮，夜生人更吉 (此處僅判斷星位)
        if (inSelf('太陰') && currentZhi === '子') {
            formations.push("水澄桂萼");
        }
        // 陽梁昌祿
        if (has('太陽') && has('天梁') && has('文昌') && (has('祿存') || huaMap['祿']>0)) formations.push("陽梁昌祿");
        // 桃花滾浪: 巨門太陽 (寅申) 加會桃花 (紅鸞天喜文曲咸池)
        if (inSelf('巨門') && inSelf('太陽')) {
            const peachCount = (has('紅鸞')?1:0) + (has('天喜')?1:0) + (has('文曲')?1:0) + (has('咸池')?1:0) + (has('天姚')?1:0);
            if (peachCount >= 2) {
                formations.push("桃花滾浪");
            }
        }
        // 巨日同宮
        if (inSelf('巨門') && inSelf('太陽')) {
            if (!formations.includes("桃花滾浪")) {
                if (currentZhi === '寅') formations.push("巨日同宮(寅)");
                else if (currentZhi === '申') formations.push("巨日同宮(申)");
            }
        }

        // 吉格
        if (inSelf('紫微') && inSelf('天府')) formations.push("紫府同宮");
        if (has('紫微') && has('天府') && !inSelf('紫微')) formations.push("紫府朝垣");
        if (inSelf('紫微')) {
            let count = 0;
            ['左輔','右弼','文昌','文曲','天魁','天鉞','天府','天相'].forEach(s => { if(has(s)) count++; });
            if (count >= 4) formations.push("君臣慶會");
        }
        if (has('天機') && has('太陰') && has('天同') && has('天梁')) formations.push("機月同梁");

        if (inSelf('天梁') && currentZhi === '午') formations.push("壽星入廟");
        if (inSelf('破軍') && (currentZhi === '子' || currentZhi === '午')) formations.push("英星入廟");
        if (inSelf('巨門') && (currentZhi === '子' || currentZhi === '午')) {
            if (huaMap['祿']>0 || huaMap['權']>0 || huaMap['科']>0) formations.push("石中隱玉");
            else formations.push("假石中隱玉");
        }
        if (inSelf('七殺')) {
            if (['寅','申'].includes(currentZhi)) formations.push("七殺朝斗");
            if (['子','午'].includes(currentZhi)) formations.push("七殺仰斗");
        }
        if (has('天府') && has('天相')) formations.push("府相朝垣");
        if (inSelf('天同') && inSelf('太陰') && currentZhi === '子') formations.push("月生滄海");
        if (huaMap['祿'] > 0 && huaMap['權'] > 0 && huaMap['科'] > 0) formations.push("三奇嘉會");
        if (has('祿存') && huaMap['祿'] > 0) formations.push("雙祿交流");
        if (has('祿存') && has('天馬')) formations.push("祿馬交馳");
        if (has('左輔') && has('右弼')) { 
            if (inSelf('左輔') && inSelf('右弼')) formations.push("左右同宮");
        }
        if (has('天魁') && has('天鉞')) { 
            if (inSelf('天魁') && inOpposite('天鉞') || inSelf('天鉞') && inOpposite('天魁')) formations.push("坐貴向貴"); 
        }
        if (has('貪狼')) {
            if (has('火星')) formations.push("火貪格");
            if (has('鈴星')) formations.push("鈴貪格");
        }
        if (has('天魁')) {
            if (has('文曲') && has('文昌')) formations.push("文曲文昌天魁秀");
        }
        // 補：昌曲同宮 (丑未)
        if (inSelf('文昌') && inSelf('文曲')) {
            formations.push("昌曲同宮");
        }

        // 凶格
        if (has('貪狼')) {
            if (has('文曲')) formations.push("貪狼遇文昌");
            if (has('文昌')) formations.push("貪狼遇文曲");
        }  
        if (has('鈴星') && has('文昌') && has('陀羅') && has('武曲')) formations.push("鈴昌陀武");
        if (has('巨門') && has('火星') && has('擎羊')) formations.push("巨火羊");
        if (inSelf('地劫') || inSelf('天空')) formations.push("命逢空劫");
        if (currentZhi === '午' && inSelf('擎羊')) formations.push("馬頭帶劍");
        if (has('廉貞') && has('天相') && has('擎羊') && currentZhi === '午') formations.push("刑囚夾印");
        if (inSelf('貪狼') && currentZhi === '子') formations.push("泛水桃花");
        if (inSelf('廉貞') && inSelf('七殺') && !['丑', '未'].includes(currentZhi) && (has('擎羊') || has('陀羅') || has('化忌'))) {
            formations.push("路上埋屍");
        }

        const getPalaceStars = (idx) => {
            const safeIdx = (idx + 120) % 12;
            const p = grid[safeIdx]; if (!p) return []; 
            let stars = [];
            [...safeStars(p), ...safeMinorStars(p)].forEach(s => {
                if(s && s.name) {
                    stars.push(s.name);
                    if (activeRules) { if (s.name === activeRules.ji) stars.push('忌'); }
                    else { if (s.hua === '忌') stars.push('忌'); }
                }
            });
            return stars;
        };
        const prevStars = getPalaceStars(centerIdx - 1); // JS Modulo fix handled in func
        const nextStars = getPalaceStars(centerIdx + 1);
        const isJia = (s1, s2) => (prevStars.includes(s1) && nextStars.includes(s2)) || (prevStars.includes(s2) && nextStars.includes(s1));

        if (isJia('火星', '鈴星')) formations.push("火鈴夾命");
        if (isJia('地劫', '天空')) formations.push("空劫夾命");
        if (isJia('擎羊', '陀羅')) {
            if (huaMap['忌'] > 0 || prevStars.includes('忌') || nextStars.includes('忌')) formations.push("羊陀夾忌");
        }

        const isClampedByStars = (s1, s2) => {
            return (prevInfo.stars.includes(s1) && nextInfo.stars.includes(s2)) || 
                   (prevInfo.stars.includes(s2) && nextInfo.stars.includes(s1));
        };
        // 1. 紫府夾命 (命宮在寅申，紫微天府夾)
        if (isClampedByStars('紫微', '天府')) formations.push("紫府夾命");
        // 2. 日月夾命 (命宮在丑未，太陽太陰夾)
        if (isClampedByStars('太陽', '太陰')) formations.push("日月夾命");
        // 3. 左右夾命 (左輔右弼夾)
        if (isClampedByStars('左輔', '右弼')) formations.push("左右夾命");
        // 4. 昌曲夾命 (文昌文曲夾)
        if (isClampedByStars('文昌', '文曲')) formations.push("昌曲夾命");
        // 5. 魁鉞夾命 (天魁天鉞夾 - 辰戌宮較常見)
        if (isClampedByStars('天魁', '天鉞')) formations.push("魁鉞夾命");

        // --- 4. 分數合成 ---
        const luckRatio = Math.round((totalGoodPoints / (totalGoodPoints + totalBadPoints)) * 100);
        const modifierFactor = (luckRatio - 50) / 50; 
        let adjustment = 0;
        if (modifierFactor > 0) {
            const boost = Math.min(totalGoodPoints / 3, 30);
            adjustment = boost * modifierFactor;
        } else {
            const penalty = Math.min(totalBadPoints / 2.5, 40);
            adjustment = penalty * Math.abs(modifierFactor) * -1;
        }

        let finalScore = baseScore + adjustment;
        if (finalScore > 99) finalScore = 99;
        if (finalScore < 20) finalScore = 20;

        return { 
            score: Math.round(finalScore), 
            formations: [...new Set(formations)],
            details: { good: goodStarsList, bad: badStarsList },
            luckRatio: luckRatio,
            baseScore: Math.round(baseScore)
        };
    } catch (e) {
        console.error("Score Calc Error:", e);
        return defaultResult;
    }
};

export const ScorePanel = ({ 
    grid, mingIdx, 
    daXianIdx, xiaoXianIdx, liuYueIdx, 
    currentYear, onYearChange, yearOptions, 
    currentMonth, onMonthChange, // 接收參數
    onClose, 
    siHuaRules, 
    daXianGan, liuNianGan, liuYueGan 
}) => {

    // 0: 本命, 1: 大限, 2: 歲限, 3: 流月
    const [viewMode, setViewMode] = useState(0); 
    const [selectedPattern, setSelectedPattern] = useState(null);

    const switchView = (delta) => {
        setViewMode(prev => {
            let next = prev + delta;
            if (next > 3) next = 0;
            if (next < 0) next = 3;
            return next;
        });
    };

    let centerIdx = -1;
    let title = "";
    let themeColor = THEME.black;
    let activeGan = null;

    // 邏輯判定區
    if (viewMode === 0) {
        centerIdx = mingIdx;
        title = "本命";
        themeColor = THEME.black;
        activeGan = null; 
    } else if (viewMode === 1) {
        centerIdx = daXianIdx;
        title = "大限";
        themeColor = THEME.blue;
        activeGan = daXianGan; 
    } else if (viewMode === 2) {
        centerIdx = xiaoXianIdx; 
        title = "歲限";
        themeColor = THEME.green;
        activeGan = liuNianGan;
    } else if (viewMode === 3) {
        centerIdx = liuYueIdx; 
        title = "流月"; 
        themeColor = THEME.purple;
        activeGan = liuYueGan;
    }

    // 計算分數：如果 centerIdx 無效，calculateScoreAndFormations 會回傳安全預設值
    let dataMing = calculateScoreAndFormations(grid, centerIdx, '命', activeGan, siHuaRules);

    // 安全計算官祿與財帛宮索引
    const guanIdx = typeof centerIdx === 'number' ? (centerIdx + 8) % 12 : -1;
    const caiIdx  = typeof centerIdx === 'number' ? (centerIdx + 4) % 12 : -1;

    const dataGuan = calculateScoreAndFormations(grid, guanIdx, '官', activeGan, siHuaRules);
    const dataCai  = calculateScoreAndFormations(grid, caiIdx, '財', activeGan, siHuaRules);

    // 拉分調整
    const subAvg = (dataGuan.score + dataCai.score) / 2;
    const diff = subAvg - dataMing.score;
    if (Math.abs(diff) > 15) {
        let adjust = diff * 0.4;
        let newScore = dataMing.score + adjust;
        if (newScore > 99) newScore = 99;
        if (newScore < 10) newScore = 10;
        dataMing = { ...dataMing, score: Math.round(newScore) };
    }

    const ScoreCard = ({ title, data }) => {
        const ratio = data.luckRatio || 50;
        const scoreColor = data.score >= 75 ? '#1890ff' : (data.score <= 50 ? '#ff4d4f' : '#faad14');
        const barColor = ratio >= 60 ? '#52c41a' : (ratio <= 40 ? '#ff4d4f' : '#faad14');

        return (
            <div style={{ 
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '8px 4px', 
                backgroundColor: '#fff', border: `1px solid ${THEME.border}`, borderRadius: '10px',
                minHeight: '70px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
            }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: scoreColor, lineHeight: 1, marginBottom: '6px' }}>
                    {data.score}
                </div>
                <div style={{ width: '100%', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                    <div style={{ width: '70%', height: '3px', backgroundColor: '#f0f0f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${ratio}%`, height: '100%', backgroundColor: barColor, transition: 'width 0.5s' }}></div>
                    </div>
                </div>
            </div>
        );
    };

    // 檢查是否可以顯示內容：centerIdx 必須是有效的數字且大於等於 0
    const isValidIdx = typeof centerIdx === 'number' && !isNaN(centerIdx) && centerIdx >= 0;

    return (
        <div style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            zIndex: 10,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
        }} onClick={onClose}>
            
            <div style={{ 
                width: '100%', 
                maxWidth: '380px', 
                maxHeight: '70vh', 
                backgroundColor: '#fff', borderRadius: '16px',
                position: 'relative',
                zIndex: 3,
                overflow: 'hidden', 
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }} onClick={e => e.stopPropagation()}>
                
                {/* 標題欄 */}
                <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                         <button onClick={() => switchView(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                             <ChevronLeft size={20} />
                         </button>
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                             <div style={{ fontSize: '18px', fontWeight: 'bold', color: themeColor, textAlign: 'center' }}>
                                 {title}
                             </div>
                             <div style={{ fontSize: '10px', color: '#999', marginTop: '2px', fontWeight: 'normal' }}>
                                 評分只供娛樂，論命需參照大運流限
                             </div>
                         </div>
                         <button onClick={() => switchView(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                             <ChevronRight size={20} />
                         </button>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#999' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* 內容區域 */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '20px',
                    paddingBottom: '40px' 
                }}>
                    
                    {/* 年份/月份選擇器 */}
                    {(viewMode === 2 || viewMode === 3) && (
                    <div style={{ padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>{viewMode === 3 ? '西曆:' : '流年:'}</span>
                        <select 
                            value={currentYear} 
                            onChange={(e) => onYearChange(parseInt(e.target.value))}
                            style={{ padding: '1px 4px', borderRadius: '4px', border: `1px solid #ccc`, fontSize: '12px' }}
                        >
                            {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
                        </select>

                        {/* 關鍵：實裝流月切換選單 */}
                        {viewMode === 3 && (
                            <select 
                                value={currentMonth} 
                                onChange={(e) => onMonthChange(parseInt(e.target.value))}
                                style={{ padding: '1px 4px', borderRadius: '4px', border: `1px solid #ccc`, fontSize: '12px' }}
                            >
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                    <option key={m} value={m}>{m}月</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}
                    
                    {!isValidIdx ? (
                         <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                             <Info size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                             <div>尚未進入此運限或資料不足</div>
                             <div style={{ fontSize: '12px', marginTop: '8px' }}>請調整時間或檢查出生資料</div>
                         </div>
                    ) : (
                        <>
                            {/* 分數卡片 */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                <ScoreCard title={title === '本命' ? '總運' : '運勢'} data={dataMing} />
                                <ScoreCard title="事業" data={dataGuan} />
                                <ScoreCard title="財運" data={dataCai} />
                            </div>

                            {/* 主要格局 */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <div style={{ width: '4px', height: '16px', backgroundColor: '#d9363e', borderRadius: '2px' }}></div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>主要格局</div>
                                </div>
                                
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                                    gap: '8px' 
                                }}>
                                    {dataMing.formations.length > 0 ? (
                                        dataMing.formations.map((f, idx) => {
                                            let isBad = badPatterns.includes(f);
                                            if (!isBad && !goodJia.includes(f)) {
                                                    isBad = f.includes('忌') || f.includes('空') || f.includes('沖') || 
                                                            f.includes('凶') || f.includes('遇') || f.includes('敗') || 
                                                            (f.includes('夾') && !goodJia.includes(f));
                                                }
                                            return (
                                                <button 
                                                    key={idx} 
                                                    onClick={() => setSelectedPattern(f)} 
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        padding: '8px 4px', 
                                                        fontSize: '12px',
                                                        fontWeight: 'bold', 
                                                        cursor: 'pointer', 
                                                        border: `1px solid ${isBad ? '#ffccc7' : '#d9f7be'}`, 
                                                        borderRadius: '6px', 
                                                        color: isBad ? '#cf1322' : '#389e0d', 
                                                        backgroundColor: isBad ? '#fff1f0' : '#f6ffed',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                    {f}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div style={{ fontSize: '13px', color: '#999', gridColumn: 'span 2' }}>無特殊格局</div>
                                    )}
                                </div>
                            </div>

                            {/* 吉凶曜詳情 */}
                            <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '4px', height: '16px', backgroundColor: '#1890ff', borderRadius: '2px' }}></div>
                                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666' }}>吉凶曜詳情</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {/* 吉曜框 */}
                                    <div style={{ flex: 1, border: '1px solid #d9f7be', borderRadius: '8px', backgroundColor: '#f6ffed', padding: '12px' }}>
                                        <div style={{ fontSize: '12px', color: '#389e0d', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #d9f7be', paddingBottom: '4px', display:'flex', justifyContent:'space-between' }}>
                                            <span>吉曜</span> <span>{dataMing.details.good.length}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#389e0d', lineHeight: '1.5' }}>
                                            {dataMing.details.good.length > 0 ? (
                                                dataMing.details.good.map((star, index) => (
                                                    <div key={index} style={{ marginBottom: '2px' }}>{star}</div>
                                                ))
                                            ) : '無'}
                                        </div>
                                    </div>
                                    
                                    {/* 凶曜框 */}
                                    <div style={{ flex: 1, border: '1px solid #ffccc7', borderRadius: '8px', backgroundColor: '#fff1f0', padding: '12px' }}>
                                        <div style={{ fontSize: '12px', color: '#cf1322', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #ffccc7', paddingBottom: '4px', display:'flex', justifyContent:'space-between' }}>
                                            <span>凶曜</span> <span>{dataMing.details.bad.length}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#cf1322', lineHeight: '1.5' }}>
                                            {dataMing.details.bad.length > 0 ? (
                                                dataMing.details.bad.map((star, index) => (
                                                    <div key={index} style={{ marginBottom: '2px' }}>{star}</div>
                                                ))
                                            ) : '無'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 彈窗：詳細說明 */}
            {selectedPattern && (
                <div onClick={(e) => { e.stopPropagation(); setSelectedPattern(null); }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', maxWidth: '100%', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'popIn 0.2s ease-out', borderLeft: `6px solid ${THEME.red}` }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Info size={20} color={THEME.red} /> 
                            {selectedPattern}
                        </div>
                        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
                            {PATTERN_DESC[selectedPattern] || "此為特殊格局，詳見命理說明。"}
                        </div>
                        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#999' }}>(點擊任意處返回)</div>
                    </div>
                </div>
            )}
        </div>
    );
};