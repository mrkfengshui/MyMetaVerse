// packages/ui/ScorePanel.jsx
import React, { useState } from 'react';
import { THEME } from './theme'; 
import { X, ChevronLeft, ChevronRight, Info } from 'lucide-react';

// --- 1. 定義常量 ---
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

const PALACE_ORDER = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '奴僕', '官祿', '田宅', '福德', '父母'];

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

const PATTERN_DESC = {
    // --- 吉格 ---
    "紫府同宮": "「紫府同宮，終身福厚。」帝星並坐，氣度恢弘，主福壽雙全，利於公職或管理。",
    "紫府朝垣": "「紫府朝垣，食祿萬鍾。」兩大帝星照耀，貴人運強，事業格局大，易得長輩提拔。",
    "君臣慶會": "「君臣慶會，才擅經邦。」輔佐星眾多，一呼百應，具備極佳的領導統御能力。",
    "機月同梁": "「機月同梁作吏人。」利於公職、企劃、行政或專業技術發展，風格穩健，按部就班。",
    "日月並明": "「日月並明，佐九重於堯殿。」丹墀桂墀，早年得志，富貴雙全，易早發。",
    "日月同宮": "「日月同宮，這晦那明。」陰陽調和，性格多重，具備開創與保守的雙重特質。",
    "金燦光輝": "「太陽居午，專權之貴。」光芒萬丈，主貴氣與名聲，適合進軍政商界，性格豪爽。",
    "日照雷門": "「日照雷門，富貴名揚。」旭日東昇，充滿朝氣，早年即可展露頭角，名氣大。",
    "月朗天門": "「月朗天門，進爵封侯。」太陰在亥，如月掛中天，主財運亨通，精神生活富足。",
    "明珠出海": "「明珠出海，財官雙美。」命坐未宮，日月會照，才華洋溢，名利雙收。",
    "陽梁昌祿": "「陽梁昌祿，傳臚第一名。」利於考試、競爭、學術研究，必定成名，為國家之棟樑。",
    "壽星入廟": "「天梁居午，官資清顯。」主高壽且具備長者風範，適合監察、司法或醫療事業。",
    "英星入廟": "「破軍子午，無煞官資清顯。」魄力十足，開創性極強，動盪後必有大成。",
    "石中隱玉": "「巨門子午，石中隱玉。」才華內斂，經琢磨後光華顯現，早年辛苦晚年發達，不宜鋒芒太露。",
    "七殺朝斗": "「七殺朝斗，爵祿榮昌。」權力慾強，具備大將之風，可獨當一面，雖辛勞但有大成。",
    "七殺仰斗": "「七殺仰斗，主掌權柄。」與朝斗格類似，利於武職、創業或管理，成就非凡。",
    "府相朝垣": "「府相朝垣，食祿千鍾。」衣食無憂，人際關係良好，利於輔佐與穩定發展，親情緣厚。",
    "月生滄海": "「天同居子，福壽雙全。」眉清目秀，異性緣佳，財官雙美，生活有情調。",
    "三奇加會": "「科權祿拱，名譽昭彰。」名聲顯赫，富貴雙全，人生機遇極佳，易成為行業領袖。",
    "雙祿交流": "「祿合鴛鴦，富堆金玉。」祿存與化祿交馳，財源滾滾，為富商巨賈之格。",
    "左右同宮": "「左右同宮，披羅衣紫。」人緣極佳，凡事有貴人相助，少勞多得，易居要職。",
    "坐貴向貴": "「天乙拱命，得人提攜。」天魁天鉞加持，一生多逢貴人提拔，遇難呈祥，際遇極佳。",
    "火貪格": "「貪狼遇火必英雄。」主突發橫財，爆發力強，機遇一來勢不可擋，指日高升。",
    "鈴貪格": "「鈴貪並守，將相之名。」主偏財運強，善於把握隱形機會，亦主爆發。",
    "日月有暉": "「日月有暉，貴不可言。」太陽與太陰在三方四正交會，且亮度皆佳（廟旺），主富貴雙全，聲名遠播。",
    "祿馬交馳": "「祿馬最喜交馳。」祿存與天馬在三方四正交會，主奔波生財，越動越發，利於國貿、運輸或遠地發展。",
    "文曲文昌天魁秀": "文曲文昌天魁秀，不讀詩書也可人。",
    
    // --- 凶格 ---
    "鈴昌陀武": "「鈴昌陀武，限至投河。」最忌想不開，需防重大挫折或意外，行事宜保守謹慎。",
    "巨火羊": "「巨火擎羊，終身縊死。」此為古語誇飾，實指易有感情困擾或人生波折，需修身養性，防口舌是非。",
    "命逢空劫": "劫空為害最愁人，才智英雄誤一身，只好為僧並學術，堆金積玉也須貧。",
    "馬頭帶劍": "「馬頭帶劍，鎮衛邊疆。」擎羊在午，需經艱辛奮鬥後方能大富大貴，先苦後甘。",
    "刑囚夾印": "「刑囚夾印，刑杖惟司。」易惹官非訴訟，文書簽約需特別謹慎，適合法律相關行業。",
    "泛水桃花": "「貪狼居子，泛水桃花。」異性緣過旺，易因色生災，需防桃花糾紛。",
    "廉貞七殺": "「廉殺丑未，路上埋屍。」古論意外凶險，今論運勢大起大落，需防交通意外或血光。",
    "貪狼遇文昌": "「貪狼與文昌，正事顛倒。」言行誇大，多虛少實，作事易虎頭蛇尾；但利於演藝、藝術或冷門學術發展。",
    "貪狼遇文曲": "「貪狼與文曲，正事顛倒。」言行誇大，多虛少實，作事易虎頭蛇尾；但利於演藝、藝術或冷門學術發展。",
    "空宮": "命宮無主星，需借命主星組合研判。",

    // --- 夾局 ---
    "左右夾命": "「左右夾命為貴格。」兄弟朋友得力，家世背景佳，助力無窮。",
    "昌曲夾命": "「昌曲夾命，文采風流。」書香世家，聰明多藝，學術成就高。",
    "魁鉞夾命": "「魁鉞夾命，貴人環繞。」長輩提攜，機會自動上門，一生少走彎路。",
    "紫府夾命": "「紫府夾命，權貴可期。」貴氣逼人，受人敬重，社會地位高。",
    "日月夾命": "「日月夾命，不權則富。」財運極佳，不勞而獲，主享受，物質生活優渥。",
    "空劫夾命": "「劫空夾命為敗局。」半生漂泊，六親無力，需靠自己雙手打拼，易感孤獨。",
    "火鈴夾命": "「火鈴夾命，動盪不安。」環境變動大，易焦慮不安，需培養定性。",
    "羊陀夾命": "「羊陀夾命，孤貧刑剋。」發展受限，易受親友拖累，宜離鄉發展。",
    "羊陀夾忌": "「羊陀夾忌，敗局無疑。」最凶之格，諸事不順，需極度保守忍耐，低調行事。",

    // 其他
    "化忌坐命": "「化忌入命，坎坷難行。」主個性固執，早年多波折，需經磨練方能有成。",
    "化忌沖命": "「化忌沖命，動盪不安。」對宮化忌沖照，出外易招是非，人際關係較為緊張。",
    "巨日同宮(寅)": "「巨日同宮，食祿馳名。」在寅宮，太陽旺地，主口才極佳，利於外交、傳播、法律。",
    "巨日同宮(申)": "「巨日同宮，先勤後惰。」在申宮，太陽西沉，雖有才華但易虎頭蛇尾，需持之以恆。",
    "假石中隱玉": "巨門坐命但無科權祿加會，才華雖有但難以被世人發現，易感懷才不遇。",
    "昌曲同宮": "「昌曲同宮，文章錦繡。」才華洋溢，學習能力強，利於學術、文藝發展。",
    "昌曲守照": "文昌文曲在三方四正會照，主聰明多藝，考試運佳。",
    "左右守照": "左輔右弼在三方會照，主在外有貴人助力，人際關係佳。",
    "魁鉞朝垣": "天魁天鉞在三方會照，主一生多逢貴人提拔，機遇優於常人。"
};

/**
 * 計算評分與格局 (安全版)
 */
const calculateScoreAndFormations = (grid, centerIdx, targetName = '命', activeGan = null, siHuaRules = null) => {
    // 預設回傳值
    const defaultResult = { score: 50, formations: [], details: { good: [], bad: [] }, luckRatio: 50, baseScore: 50 };

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
        const inSelf = (star) => starMap[star] === 0;
        const inOpposite = (star) => starMap[star] === 3;
        const isBright = (b) => ['廟', '旺'].includes(b);
        // 安全存取地支
        const currentZhi = selfPalace.zhi || '';

        // 吉格
        if (inSelf('紫微') && inSelf('天府')) formations.push("紫府同宮");
        if (has('紫微') && has('天府') && !inSelf('紫微')) formations.push("紫府朝垣");
        if (inSelf('紫微')) {
            let count = 0;
            ['左輔','右弼','文昌','文曲','天魁','天鉞','天府','天相'].forEach(s => { if(has(s)) count++; });
            if (count >= 4) formations.push("君臣慶會");
        }
        if (has('天機') && has('太陰') && has('天同') && has('天梁')) formations.push("機月同梁");
        
        // 日月有暉
        if (has('太陽') && has('太陰') && isBright(sunBrightness) && isBright(moonBrightness)) {
            const sunPos = grid.find(p => safeStars(p).some(s => s.name === '太陽'))?.zhi;
            const moonPos = grid.find(p => safeStars(p).some(s => s.name === '太陰'))?.zhi;
            if (sunPos && moonPos && sunPos !== moonPos) {
                 formations.push("日月有暉");
            }
        }

        if (inSelf('太陽') && currentZhi === '午') formations.push("金燦光輝");
        if (inSelf('太陽') && currentZhi === '卯') formations.push("日照雷門");
        if (inSelf('太陰') && currentZhi === '亥') formations.push("月朗天門");
        if (currentZhi === '未' && isEmptyPalace && has('太陽') && has('太陰')) formations.push("明珠出海");
        if (has('太陽') && has('天梁') && has('文昌') && (has('祿存') || huaMap['祿']>0)) formations.push("陽梁昌祿");
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
        if (huaMap['祿'] > 0 && huaMap['權'] > 0 && huaMap['科'] > 0) formations.push("三奇加會");
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
        if (inSelf('廉貞') && inSelf('七殺') && (has('擎羊') || has('陀羅') || has('化忌'))) formations.push("廉貞七殺");

        // 夾宮
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
        if (finalScore < 10) finalScore = 10;

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
    currentMonth, onMonthChange, // ★ 新增：接收當前月份與切換函數
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
    } else {
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
                         <div style={{ fontSize: '18px', fontWeight: 'bold', color: themeColor, minWidth: '40px', textAlign: 'center' }}>{title}</div>
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
                            {/* 年份選單 */}
                            <span style={{ fontSize: '12px', color: '#666' }}>{viewMode === 3 ? '流月:' : '流年:'}</span>
                            <select value={currentYear} onChange={(e) => onYearChange(parseInt(e.target.value))} style={{ padding: '1px 4px', borderRadius: '4px', border: `1px solid #ccc`, fontSize: '12px', color: '#333', backgroundColor: '#fff' }}>
                                {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
                            </select>

                            {/* ★ 新增：月份選單 (僅在流月模式顯示) */}
                            {viewMode === 3 && (
                                <select 
                                    value={currentMonth || 1} 
                                    onChange={(e) => onMonthChange && onMonthChange(parseInt(e.target.value))} 
                                    style={{ padding: '1px 4px', borderRadius: '4px', border: `1px solid #ccc`, fontSize: '12px', color: '#333', backgroundColor: '#fff' }}
                                >
                                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
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
                                            const isBad = f.includes('忌') || f.includes('空') || f.includes('沖') || f.includes('凶') || f.includes('遇') || f.includes('敗') || f.includes('夾');
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