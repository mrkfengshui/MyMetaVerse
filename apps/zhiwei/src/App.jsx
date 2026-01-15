import React, { useState, useEffect, useMemo } from 'react';
import { Preferences } from '@capacitor/preferences';
import 'react-calendar/dist/Calendar.css';


// 1. 引入共用 UI 和 工具
import { 
  AdBanner, AppHeader, AppInfoCard, 
  BookingSystem, BookmarkList, BottomTabBar, BuyMeCoffee, 
  InstallGuide, WebBackupManager, 
  COLORS, THEME, COMMON_STYLES
} from '@my-meta/ui';

// 2. 引入 Icon
import { 
  Bookmark, BookOpen, Briefcase,
  Calendar, CalendarCheck, ChevronLeft, ChevronRight, Compass, CloudUpload,
  DoorOpen, Download,
  Edit3, Eye, EyeOff, Grid, Lock, MapPin,
  RefreshCw, Save, Settings, Sparkles,
  Trash2, Unlock, User, X
} from 'lucide-react';

// =========================================================================
// PART A: 核心數據與邏輯
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";
const APP_NAME = "甯博紫微斗數";
const APP_VERSION = "v1.0";

// --- 核心數據定義 ---
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const PALACE_NAMES = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '奴僕', '官祿', '田宅', '福德', '父母'];

// 預設四化
const DEFAULT_SI_HUA = {
  '甲': { lu: '廉貞', quan: '破軍', ke: '武曲', ji: '太陽' },
  '乙': { lu: '天機', quan: '天梁', ke: '紫微', ji: '太陰' },
  '丙': { lu: '天同', quan: '天機', ke: '文昌', ji: '廉貞' },
  '丁': { lu: '太陰', quan: '天同', ke: '天機', ji: '巨門' },
  '戊': { lu: '貪狼', quan: '太陰', ke: '右弼', ji: '天機' },
  '己': { lu: '武曲', quan: '貪狼', ke: '天梁', ji: '文曲' },
  '庚': { lu: '太陽', quan: '武曲', ke: '天同', ji: '太陰' },
  '辛': { lu: '巨門', quan: '太陽', ke: '文曲', ji: '文昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '天府', ji: '武曲' },
  '癸': { lu: '破軍', quan: '巨門', ke: '太陰', ji: '貪狼' }
};

// 預設魁鉞
const DEFAULT_KUI_YUE = {
  '甲': {k:7, y:1}, '乙': {k:8, y:0}, '丙': {k:9, y:11}, '丁': {k:11, y:9},
  '戊': {k:1, y:7}, '己': {k:0, y:8}, '庚': {k:1, y:7}, '辛': {k:2, y:6},
  '壬': {k:3, y:5}, '癸': {k:5, y:3}
};

// 預設火鈴
const getHuoLingDefault = () => {
    const map = {};
    const rules = [
        { zhis: [8, 0, 4], h: 2, l: 10 }, // 申子辰 -> 寅, 戌
        { zhis: [2, 6, 10], h: 1, l: 3 }, // 寅午戌 -> 丑, 卯
        { zhis: [5, 9, 1], h: 3, l: 10 }, // 巳酉丑 -> 卯, 戌
        { zhis: [11, 3, 7], h: 9, l: 10 } // 亥卯未 -> 酉, 戌
    ];
    DIZHI.forEach((z, idx) => {
        const r = rules.find(rule => rule.zhis.includes(idx));
        if(r) map[z] = { h: r.h, l: r.l };
    });
    return map;
};
const DEFAULT_HUO_LING = getHuoLingDefault();

// 火鈴 (全集)
const getHuoLingMarket = () => {
    const map = {};
    const rules = [
        { zhis: [8, 0, 4], h: 2, l: 10 }, 
        { zhis: [2, 6, 10], h: 1, l: 3 }, 
        { zhis: [5, 9, 1], h: 9, l: 10 }, // 差異: 火星在酉
        { zhis: [11, 3, 7], h: 3, l: 10 } // 差異: 火星在卯
    ];
    DIZHI.forEach((z, idx) => {
        const r = rules.find(rule => rule.zhis.includes(idx));
        if(r) map[z] = { h: r.h, l: r.l };
    });
    return map;
};
const MARKET_HUO_LING = getHuoLingMarket();

// 預設天馬
const getTianMaDefault = () => {
    const map = {};
    const rules = [
        { zhis: [8, 0, 4], pos: 2 },
        { zhis: [2, 6, 10], pos: 8 },
        { zhis: [5, 9, 1], pos: 11 },
        { zhis: [11, 3, 7], pos: 5 }
    ];
    DIZHI.forEach((z, idx) => {
        const r = rules.find(rule => rule.zhis.includes(idx));
        if(r) map[z] = r.pos;
    });
    return map;
};
const DEFAULT_TIAN_MA = getTianMaDefault();

// 包含：主星、六吉、六煞、祿存
const STAR_GROUP_MAPPING = {
  // 祿存
  '祿存': 'A',
  
  // 六吉
  '左輔': 'A', '右弼': 'A',
  '文昌': 'A', '文曲': 'A',
  '天魁': 'A', '天鉞': 'A',
  
  // 六煞
  '擎羊': 'A', '陀羅': 'A',
  '火星': 'A', '鈴星': 'A',
  '天空': 'A', '地劫': 'A' 
};

// 星曜旺度
const STAR_BRIGHTNESS = {
  "紫微": ["地", "廟", "廟", "旺", "地", "旺", "廟", "廟", "旺", "旺", "地", "旺"],
  "天機": ["廟", "陷", "地", "旺", "旺", "地", "廟", "陷", "地", "廟", "旺", "地"],
  "太陽": ["陷", "地", "旺", "廟", "旺", "旺", "廟", "地", "地", "地", "地", "陷"],
  "武曲": ["旺", "廟", "地", "旺", "廟", "地", "旺", "廟", "地", "旺", "廟", "地"],
  "天同": ["旺", "地", "旺", "地", "地", "地", "陷", "地", "旺", "地", "地", "地"],
  "廉貞": ["地", "旺", "地", "地", "旺", "陷", "地", "旺", "廟", "地", "旺", "陷"],
  "天府": ["廟", "廟", "廟", "地", "廟", "地", "旺", "廟", "地", "旺", "廟", "地"],
  "太陰": ["廟", "廟", "陷", "陷", "陷", "陷", "陷", "地", "旺", "旺", "旺", "廟"],
  "貪狼": ["旺", "旺", "地", "地", "廟", "陷", "旺", "廟", "地", "旺", "廟", "陷"],
  "巨門": ["旺", "地", "廟", "廟", "地", "地", "旺", "地", "廟", "廟", "地", "旺"],
  "天相": ["廟", "廟", "廟", "陷", "地", "地", "地", "地", "廟", "陷", "地", "地"],
  "天梁": ["廟", "旺", "廟", "廟", "廟", "地", "廟", "旺", "陷", "地", "廟", "陷"],
  "七殺": ["旺", "廟", "廟", "旺", "地", "地", "旺", "廟", "廟", "旺", "廟", "地"],
  "破軍": ["廟", "旺", "地", "陷", "旺", "地", "廟", "旺", "陷", "陷", "旺", "地"],
  "祿存": ["廟", " ", "廟", "廟", " ", "廟", "廟", " ", "廟", "廟", " ", "廟"],
  "擎羊": ["陷", "廟", " ", "陷", "廟", " ", "陷", "廟", " ", "陷", "廟", " "],
  "陀羅": [" ", "廟", "陷", " ", "廟", "陷", " ", "廟", "陷", " ", "廟", "陷"],
  "火星": [" ", "旺", "廟", "地", " ", " ", " ", " ", " ", "旺", " ", " "],
  "鈴星": [" ", " ", " ", "廟", " ", " ", " ", " ", " ", " ", "廟", " "],
  "左輔": ["旺", "廟", "廟", "旺", "廟", "廟", "廟", "廟", "廟", "旺", "廟", "旺"],
  "右弼": ["旺", "廟", "廟", "旺", "廟", "廟", "廟", "廟", "廟", "旺", "廟", "旺"],
  "文昌": ["旺", "廟", "陷", "地", "旺", "廟", "陷", "地", "旺", "廟", "陷", "旺"],
  "文曲": ["廟", "廟", "地", "旺", "廟", "廟", "陷", "旺", "地", "廟", "陷", "旺"],
  "天空": ["地", "陷", "陷", "地", "陷", "廟", "廟", "地", "廟", "廟", "陷", "陷"],
  "地劫": ["陷", "陷", "地", "地", "陷", "旺", "廟", "地", "旺", "地", "地", "旺"]
};

// --- 1. 輔助函式 ---
const getLocalDateString = (date) => {
  if (!date || isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const useLunarScript = () => {
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    if (window.Lunar && window.Solar) { setStatus('ready'); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/lunar-javascript@1.6.12/lunar.min.js';
    script.async = true;
    script.onload = () => { if (window.Solar) setStatus('ready'); else setStatus('error'); };
    script.onerror = () => setStatus('error');
    document.body.appendChild(script);
  }, []);
  return status;
};

// 核心計算函數
const calculateZwdsResult = (formData, rulesConfig, config = { mingHasDaXian: false }) => {
    // 安全解構規則
    const safeRules = rulesConfig || {};
    const siHua = safeRules.siHua || DEFAULT_SI_HUA;
    const kuiYue = safeRules.kuiYue || DEFAULT_KUI_YUE;
    const huoLing = safeRules.huoLing || DEFAULT_HUO_LING;
    const tianMa = safeRules.tianMa || DEFAULT_TIAN_MA;
    const tianMaType = safeRules.tianMaType || 'year';

    // 解構並驗證表單資料
    const { year, month, day, hour, minute } = formData;
    const _y = parseInt(year);
    const _m = parseInt(month);
    const _d = parseInt(day);
    const _h = parseInt(hour);
    const _min = parseInt(minute);

    if (isNaN(_y)) throw new Error("年份格式錯誤");

    const solar = window.Solar.fromYmdHms(_y, _m, _d, _h, _min, 0);
    const lunar = solar.getLunar();
    
    const lunarMonth = Math.abs(lunar.getMonth());
    const lunarDay = lunar.getDay();
    const timeZhiIdx = Math.floor((_h + 1) % 24 / 2);
    const yearGan = lunar.getYearGan();
    const yearZhi = lunar.getYearZhi();
    const yearZhiIdx = DIZHI.indexOf(yearZhi);
    const yearGanIdx = TIANGAN.indexOf(yearGan);

    // 安命身宮
    let mingIndex = (2 + (lunarMonth - 1) - timeZhiIdx + 12) % 12;
    let shenIndex = (2 + (lunarMonth - 1) + timeZhiIdx) % 12;

    const palaces = [];
    for(let i=0; i<12; i++) {
        const idx = (mingIndex - i + 12) % 12; 
        palaces.push({
            name: PALACE_NAMES[i],
            zhiIdx: idx,
            zhi: DIZHI[idx],
            stars: [],
            minorStars: [],
            liuNian: [],
            daXian: null,
            xiaoXian: [],
            isShen: (idx === shenIndex)
        });
    }
    const gridPalaces = Array(12).fill(null);
    palaces.forEach(p => { gridPalaces[p.zhiIdx] = p; });

    // 起五行局
    const startGanIdx = (yearGanIdx % 5) * 2 + 2;
    palaces.forEach(p => {
       let offset = (p.zhiIdx - 2 + 12) % 12;
       p.gan = TIANGAN[(startGanIdx + offset) % 10];
    });

    const mingPalace = palaces[0];
    const mingGanZhi = mingPalace.gan + mingPalace.zhi;
    const NA_YIN_WU_XING = {
        '甲子':4, '乙丑':4, '丙寅':6, '丁卯':6, '戊辰':3, '己巳':3, '庚午':5, '辛未':5, '壬申':4, '癸酉':4,
        '甲戌':6, '乙亥':6, '丙子':2, '丁丑':2, '戊寅':5, '己卯':5, '庚辰':4, '辛巳':4, '壬午':3, '癸未':3,
        '甲申':2, '乙酉':2, '丙戌':5, '丁亥':5, '戊子':6, '己丑':6, '庚寅':3, '辛卯':3, '壬辰':2, '癸巳':2,
        '甲午':4, '乙未':4, '丙申':6, '丁酉':6, '戊戌':3, '己亥':3, '庚子':5, '辛丑':5, '壬寅':4, '癸卯':4,
        '甲辰':6, '乙巳':6, '丙午':2, '丁未':2, '戊申':5, '己酉':5, '庚戌':4, '辛亥':4, '壬子':3, '癸丑':3,
        '甲寅':2, '乙卯':2, '丙辰':5, '丁巳':5, '戊午':6, '己未':6, '庚申':3, '辛酉':3, '壬戌':2, '癸亥':2
    };
    const bureauNum = NA_YIN_WU_XING[mingGanZhi] || 2;
    const bureauName = {2:'水二局', 3:'木三局', 4:'金四局', 5:'土五局', 6:'火六局'}[bureauNum];

    // 安紫微星
    let remainder = 0, quotient = 0, ziWeiLoc = 0;
    if (lunarDay % bureauNum === 0) {
        quotient = lunarDay / bureauNum;
        ziWeiLoc = (2 + quotient - 1 + 12) % 12; 
    } else {
        remainder = lunarDay % bureauNum;
        let add = bureauNum - remainder;
        quotient = (lunarDay + add) / bureauNum;
        if (add % 2 === 1) ziWeiLoc = (2 + quotient - 1 - add + 12) % 12;
        else ziWeiLoc = (2 + quotient - 1 + add) % 12;
    }
    const tianFuLoc = (4 - ziWeiLoc + 12) % 12;

    const placeStar = (name, locIdx, type='major') => {
        gridPalaces[locIdx].stars.push({ name, type });
    };

    placeStar('紫微', ziWeiLoc);
    placeStar('天機', (ziWeiLoc - 1 + 12) % 12);
    placeStar('太陽', (ziWeiLoc - 3 + 12) % 12);
    placeStar('武曲', (ziWeiLoc - 4 + 12) % 12);
    placeStar('天同', (ziWeiLoc - 5 + 12) % 12);
    placeStar('廉貞', (ziWeiLoc - 8 + 12) % 12);

    placeStar('天府', tianFuLoc);
    placeStar('太陰', (tianFuLoc + 1) % 12);
    placeStar('貪狼', (tianFuLoc + 2) % 12);
    placeStar('巨門', (tianFuLoc + 3) % 12);
    placeStar('天相', (tianFuLoc + 4) % 12);
    placeStar('天梁', (tianFuLoc + 5) % 12);
    placeStar('七殺', (tianFuLoc + 6) % 12);
    placeStar('破軍', (tianFuLoc + 10) % 12);

    // 安輔佐煞曜 (必須先定義 zuoFuLoc, youBiLoc，後續三台八座才能使用)
    const zuoFuLoc = (4 + (lunarMonth - 1)) % 12;
    const youBiLoc = (10 - (lunarMonth - 1) + 12) % 12;
    gridPalaces[zuoFuLoc].minorStars.push('左輔');
    gridPalaces[youBiLoc].minorStars.push('右弼');

    const wenChangLoc = (10 - timeZhiIdx + 12) % 12;
    const wenQuLoc = (4 + timeZhiIdx) % 12;
    gridPalaces[wenChangLoc].minorStars.push('文昌');
    gridPalaces[wenQuLoc].minorStars.push('文曲');
    
    // 天魁天鉞
    const ky = kuiYue[yearGan] || DEFAULT_KUI_YUE[yearGan]; // 安全讀取
    if (ky) {
        gridPalaces[ky.k].minorStars.push('天魁');
        gridPalaces[ky.y].minorStars.push('天鉞');
    }

    // 祿存擎羊陀羅
    const luCunMap = { '甲':2, '乙':3, '丙':5, '丁':6, '戊':5, '己':6, '庚':8, '辛':9, '壬':11, '癸':0 };
    const luCunLoc = luCunMap[yearGan];
    if (luCunLoc !== undefined) {
        gridPalaces[luCunLoc].minorStars.push('祿存');
        gridPalaces[(luCunLoc + 1) % 12].minorStars.push('擎羊');
        gridPalaces[(luCunLoc - 1 + 12) % 12].minorStars.push('陀羅');
    }

    // 火星鈴星
    const HuoStarts = {
        '寅': 1, '午': 1, '戌': 1, // 寅午戌起丑(1)
        '申': 2, '子': 2, '辰': 2, // 申子辰起寅(2)
        '巳': 3, '酉': 3, '丑': 3, // 巳酉丑起卯(3)
        '亥': 9, '卯': 9, '未': 9  // 亥卯未起酉(9)
    };

    const LingStarts = {
        '寅': 3, '午': 3, '戌': 3, // 寅午戌起卯(3)
        '申': 10, '子': 10, '辰': 10, // 申子辰起戌(10)
        '巳': 10, '酉': 10, '丑': 10, // 巳酉丑起戌(10)
        '亥': 10, '卯': 10, '未': 10  // 亥卯未起戌(10)
    };

    const isMarketHL = JSON.stringify(huoLing) === JSON.stringify(MARKET_HUO_LING);

    if (isMarketHL) {
        // 全集：起點 + 時辰索引
        const hStart = HuoStarts[yearZhi];
        const lStart = LingStarts[yearZhi];
        
        const huoLoc = (hStart + timeZhiIdx) % 12;
        const lingLoc = (lStart + timeZhiIdx) % 12;
        
        gridPalaces[huoLoc].minorStars.push('火星');
        gridPalaces[lingLoc].minorStars.push('鈴星');
    } else {

        // 全書
        const hl = huoLing[yearZhi] || DEFAULT_HUO_LING[yearZhi];
        if (hl) {
            gridPalaces[hl.h].minorStars.push('火星');
            gridPalaces[hl.l].minorStars.push('鈴星');
        }
    }

    // 天空地劫
    const diJieLoc = (11 + timeZhiIdx) % 12; 
    const diKongLoc = (11 - timeZhiIdx + 12) % 12;
    gridPalaces[diJieLoc].minorStars.push('地劫');
    gridPalaces[diKongLoc].minorStars.push('天空');

    // 天馬
    const tianMaBaseZhi = (tianMaType === 'month') ? lunar.getMonthZhi() : yearZhi;
    const tmPos = tianMa[tianMaBaseZhi];
    if (tmPos !== undefined) {
        gridPalaces[tmPos].minorStars.push('天馬');
    }

    // 其他雜曜
    gridPalaces[(9 + (lunarMonth - 1)) % 12].minorStars.push('天刑');
    gridPalaces[(1 + (lunarMonth - 1)) % 12].minorStars.push('天姚');

    const hongLuanLoc = (3 - yearZhiIdx + 12) % 12;
    gridPalaces[hongLuanLoc].minorStars.push('紅鸞');
    gridPalaces[(hongLuanLoc + 6) % 12].minorStars.push('天喜');

    const tianChuMap = [5, 6, 0, 5, 6, 8, 2, 6, 9, 11];
    gridPalaces[tianChuMap[yearGanIdx]].minorStars.push('天廚');

    const poSuiMap = {0:1, 1:5, 2:7, 3:9, 4:1, 5:5, 6:7, 7:9, 8:1, 9:5, 10:7, 11:9};
    gridPalaces[poSuiMap[yearZhiIdx]].minorStars.push('破碎');

    const tianGuanMap = [7, 4, 5, 2, 3, 9, 11, 9, 10, 6];
    gridPalaces[tianGuanMap[yearGanIdx]].minorStars.push('天官');
    const tianFuMap = [9, 8, 0, 11, 3, 2, 6, 5, 6, 5];
    gridPalaces[tianFuMap[yearGanIdx]].minorStars.push('天福');

    gridPalaces[(6 + timeZhiIdx) % 12].minorStars.push('台輔');
    gridPalaces[(2 + timeZhiIdx) % 12].minorStars.push('封誥');

    const feiLianShift = [8, 9, 10, 5, 6, 7, 2, 3, 4, 11, 0, 1];
    gridPalaces[feiLianShift[yearZhiIdx]].minorStars.push('蜚廉');

    let guChenLoc = 0; let guaSuLoc = 0;
    if ([11, 0, 1].includes(yearZhiIdx)) { guChenLoc = 2; guaSuLoc = 10; }
    else if ([2, 3, 4].includes(yearZhiIdx)) { guChenLoc = 5; guaSuLoc = 1; }
    else if ([5, 6, 7].includes(yearZhiIdx)) { guChenLoc = 8; guaSuLoc = 4; }
    else { guChenLoc = 11; guaSuLoc = 7; }
    gridPalaces[guChenLoc].minorStars.push('孤辰');
    gridPalaces[guaSuLoc].minorStars.push('寡宿');

    const yinShaMap = [2, 0, 10, 8, 6, 4];
    gridPalaces[yinShaMap[(lunarMonth - 1) % 6]].minorStars.push('陰煞');

    const jieKongMap = {
        '甲': [8, 9], '己': [8, 9], '乙': [6, 7], '庚': [6, 7],
        '丙': [4, 5], '辛': [4, 5], '丁': [2, 3], '壬': [2, 3], '戊': [0, 1], '癸': [0, 1]
    };
    jieKongMap[yearGan].forEach(idx => gridPalaces[idx].minorStars.push('截空'));

    gridPalaces[(mingIndex + yearZhiIdx) % 12].minorStars.push('天才');
    gridPalaces[(shenIndex + yearZhiIdx) % 12].minorStars.push('天壽');

    const nianJieMap = {0:10, 1:10, 2:8, 3:8, 4:6, 5:6, 6:4, 7:4, 8:2, 9:2, 10:0, 11:0};
    gridPalaces[nianJieMap[yearZhiIdx]].minorStars.push('解神');

    const tianYueMap = [10, 5, 4, 2, 7, 3, 11, 7, 2, 6, 10, 2];
    gridPalaces[tianYueMap[(lunarMonth - 1) % 12]].minorStars.push('天月');

    const tianWuMap = [5, 8, 2, 11]; 
    gridPalaces[tianWuMap[(lunarMonth - 1) % 4]].minorStars.push('天巫');

    // 三台八座必須在 zuoFuLoc 定義之後
    gridPalaces[(zuoFuLoc + (lunarDay - 1)) % 12].minorStars.push('三台');
    gridPalaces[(youBiLoc - (lunarDay - 1) + 120) % 12].minorStars.push('八座');

    // 恩光天貴必須在 wenChangLoc 定義之後
    gridPalaces[(wenChangLoc + (lunarDay - 1)) % 12].minorStars.push('恩光');
    gridPalaces[(wenQuLoc + (lunarDay - 1)) % 12].minorStars.push('天貴');

    gridPalaces[(4 + yearZhiIdx) % 12].minorStars.push('龍池');
    gridPalaces[(10 - yearZhiIdx + 12) % 12].minorStars.push('鳳閣');

    gridPalaces[(6 - yearZhiIdx + 12) % 12].minorStars.push('天哭');
    gridPalaces[(6 + yearZhiIdx) % 12].minorStars.push('天虛');

    palaces[7].minorStars.push('天傷');
    palaces[5].minorStars.push('天使');

    // 博士與長生十二神
    const DOCTOR_STARS = ['博士', '力士', '青龍', '小耗', '將軍', '奏書', '飛廉', '喜神', '病符', '大耗', '伏兵', '官府'];
    const CHANG_SHENG_STARS = ['長生', '沐浴', '冠帶', '臨官', '帝旺', '衰', '病', '死', '墓', '絕', '胎', '養'];
    const _isMale = (formData.gender === '1');
    const _isYearYang = (yearGanIdx % 2 === 0);
    const _isClockwise = (_isMale && _isYearYang) || (!_isMale && !_isYearYang);

    if (luCunLoc !== undefined) {
        for (let i = 0; i < 12; i++) {
            const idx = _isClockwise ? (luCunLoc + i) % 12 : (luCunLoc - i + 12) % 12;
            gridPalaces[idx].doctor12 = DOCTOR_STARS[i];
        }
    }
    const csStartMap = { 2: 8, 3: 11, 4: 5, 5: 8, 6: 2 };
    const csStartIdx = csStartMap[bureauNum];
    if (csStartIdx !== undefined) {
         for (let i = 0; i < 12; i++) {
            const idx = _isClockwise ? (csStartIdx + i) % 12 : (csStartIdx - i + 12) % 12;
            gridPalaces[idx].changSheng12 = CHANG_SHENG_STARS[i];
        }
    }

    // 四化處理
    const currentSiHua = siHua[yearGan] || DEFAULT_SI_HUA[yearGan];
    
    gridPalaces.forEach(p => {
        const brightnessIndex = (config.liuNianZhiIdx !== undefined) ? config.liuNianZhiIdx : p.zhiIdx;
        p.stars.forEach(s => {
            if (s.name === currentSiHua.lu) s.hua = '祿';
            if (s.name === currentSiHua.quan) s.hua = '權';
            if (s.name === currentSiHua.ke) s.hua = '科';
            if (s.name === currentSiHua.ji) s.hua = '忌';
            if (STAR_BRIGHTNESS[s.name]) s.brightness = STAR_BRIGHTNESS[s.name][brightnessIndex];
        });
        p.minorStars = p.minorStars.map(msName => {
            let hua = '';
            if (msName === currentSiHua.lu) hua = '祿';
            if (msName === currentSiHua.quan) hua = '權';
            if (msName === currentSiHua.ke) hua = '科';
            if (msName === currentSiHua.ji) hua = '忌';
            let brightness = '';
            if (STAR_BRIGHTNESS[msName]) brightness = STAR_BRIGHTNESS[msName][brightnessIndex];
            return { name: msName, type: 'minor', hua, brightness };
        });
    });

    const gender = formData.gender === '1' ? '男' : '女';
    const yearYang = (yearGanIdx % 2 === 0);
    const isClockwiseDaXian = (gender === '男' && yearYang) || (gender === '女' && !yearYang);
    
    // 大限
    let daXianStart = bureauNum;
    for (let i = 0; i < 12; i++) {
        let idx = isClockwiseDaXian ? (mingIndex + i) % 12 : (mingIndex - i + 12) % 12;
        if (i === 0 && !config.mingHasDaXian) { gridPalaces[idx].daXian = null; continue; }
        gridPalaces[idx].daXian = `${daXianStart}-${daXianStart + 9}`;
        daXianStart += 10;
    }

    // 小限
    let xiaoXianStartIdx = 0;
    if ([2, 6, 10].includes(yearZhiIdx)) xiaoXianStartIdx = 4;
    else if ([8, 0, 4].includes(yearZhiIdx)) xiaoXianStartIdx = 10;
    else if ([5, 9, 1].includes(yearZhiIdx)) xiaoXianStartIdx = 7;
    else xiaoXianStartIdx = 1;
    const isXiaoXianClockwise = (gender === '男'); 
    
    for(let age = 1; age <= 100; age++) {
         const offset = age - 1;
         let idx = isXiaoXianClockwise ? (xiaoXianStartIdx + offset) % 12 : (xiaoXianStartIdx - offset + 120) % 12;
         if (!gridPalaces[idx].xiaoXian) gridPalaces[idx].xiaoXian = [];
         gridPalaces[idx].xiaoXian.push(age);
    }
    gridPalaces.forEach(p => {
        if(p.xiaoXian && p.xiaoXian.length > 0) {
            const mid = Math.ceil(p.xiaoXian.length / 2);
            p.xiaoXianStr = p.xiaoXian.slice(0, mid).join(' ') + '\n' + p.xiaoXian.slice(mid).join(' ');
        } else p.xiaoXianStr = '';
    });

    const mingZhuMap = {0:'貪狼', 1:'巨門', 2:'祿存', 3:'文曲', 4:'廉貞', 5:'武曲', 6:'破軍', 7:'武曲', 8:'廉貞', 9:'文曲', 10:'祿存', 11:'巨門'};
    const shenZhuMap = {0:'火星', 1:'天相', 2:'天梁', 3:'天同', 4:'文昌', 5:'天機', 6:'火星', 7:'天相', 8:'天梁', 9:'天同', 10:'文昌', 11:'天機'};
    const mingStars = mingPalace.stars.map(s => s.name).join('') || '空宮';

    return {
        id: formData.id || Date.now(),
        name: formData.name || '未命名',
        genderText: gender,
        bureau: bureauName,
        mingZhu: mingZhuMap[mingPalace.zhiIdx] || 'N/A',
        shenZhu: shenZhuMap[yearZhiIdx] || 'N/A', 
        douJun: DIZHI[(2 + (lunarMonth - 1) - timeZhiIdx + 12) % 12],
        lunarDateStr: `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}日 ${lunar.getTimeZhi()}時`,
        solarDateStr: `${formData.year}.${String(formData.month).padStart(2,'0')}.${String(formData.day).padStart(2,'0')}`,
        grid: gridPalaces,
        rawDate: formData,
        mingGongStars: `${mingStars}在${mingPalace.zhi}`
    };
};

// --- SettingsView ---
const SettingsView = ({ 
        siHuaRules, setSiHuaRules,
        kuiYueRules, setKuiYueRules,
        huoLingRules, setHuoLingRules,
        tianMaRules, setTianMaRules,
        tianMaType, setTianMaType,
        mingHasDaXian, setMingHasDaXian,
        bookmarks, setBookmarks
    }) => {
    const [openSection, setOpenSection] = useState(null);
    const toggleSection = (sec) => setOpenSection(openSection === sec ? null : sec);

  const APP_INFO = {
    appName: APP_NAME,
    version: APP_VERSION,
    about: "本程式旨在提供專業紫微斗數排盤服務，結合傳統命理與現代流暢 UI，輔助使用者進行深入的命理分析。",
    };

const ToggleSelector = ({ options, currentValue, onChange }) => (
    <div style={{ display: 'flex', backgroundColor: THEME.bgGray, borderRadius: '20px', padding: '2px' }}>
      {options.map((opt) => (
        <button key={opt.val} onClick={(e) => { e.stopPropagation(); onChange(opt.val); }} style={{ padding: '6px 14px', border: 'none', borderRadius: '18px', backgroundColor: currentValue === opt.val ? THEME.blue : 'transparent', color: currentValue === opt.val ? 'white' : THEME.gray, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{opt.label}</button>
      ))}
    </div>
  );

  const CollapsibleSection = ({ title, isOpen, onToggle, children }) => (
    <div style={{ marginBottom: '12px', border: `1px solid ${THEME.border}`, borderRadius: '12px', backgroundColor: THEME.white, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: isOpen ? THEME.bgGray : THEME.white }}>
        <span style={{ fontWeight: 'bold', fontSize: '15px', color: THEME.black }}>{title}</span>
        {isOpen ? <ChevronLeft size={20} style={{ transform: 'rotate(-90deg)', transition: '0.2s', color: THEME.gray }} /> : <ChevronLeft size={20} style={{ transform: 'rotate(0deg)', transition: '0.2s', color: THEME.gray }} />}
      </div>
      {isOpen && <div style={{ padding: '16px', borderTop: `1px solid ${THEME.border}` }}>{children}</div>}
    </div>
  );

  const handleReset = () => {
      if(window.confirm('確定要還原所有設定至「紫微斗數全書」預設值嗎？')) {
          setSiHuaRules(DEFAULT_SI_HUA);
          setKuiYueRules(DEFAULT_KUI_YUE);
          setHuoLingRules(DEFAULT_HUO_LING);
          setTianMaRules(DEFAULT_TIAN_MA);
          setTianMaType('year');
          setMingHasDaXian(false);
          alert('已還原預設值');
      }
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
        <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>設定</h2>
      </div>

      {/* 安星規則 */}
      <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>自定義安星法</h3>
      
      <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${THEME.border}`, marginBottom: '12px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>大限起限宮位</div>
          <ToggleSelector options={[{val: false, label: '命宮無大限'}, {val: true, label: '命宮有大限'}]} currentValue={mingHasDaXian} onChange={setMingHasDaXian} />
      </div>

      <CollapsibleSection title="四化星曜" isOpen={openSection === 'sihua'} onToggle={() => toggleSection('sihua')}>
          {[
            { label: '甲干化科', stem: '甲', key: 'ke', opts: [{val:'武曲', label:'武曲'}, {val:'文曲', label:'文曲'}] },
            { label: '戊干化科', stem: '戊', key: 'ke', opts: [{val:'右弼', label:'右弼'}, {val:'太陽', label:'太陽'}] },
            { label: '庚干化科', stem: '庚', key: 'ke', opts: [{val:'太陰', label:'太陰'}, {val:'天府', label:'天府'}, {val:'天同', label:'天同'}] },
            { label: '庚干化忌', stem: '庚', key: 'ji', opts: [{val:'天同', label:'天同'}, {val:'天相', label:'天相'}, {val:'太陰', label:'太陰'}] },
            { label: '辛干化科', stem: '辛', key: 'ke', opts: [{val:'文曲', label:'文曲'}, {val:'武曲', label:'武曲'}] },
            { label: '壬干化科', stem: '壬', key: 'ke', opts: [{val:'左輔', label:'左輔'}, {val:'天府', label:'天府'}] },
            { label: '癸干化科', stem: '癸', key: 'ke', opts: [{val:'太陰', label:'太陰'}, {val:'太陽', label:'太陽'}] },
        ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.label}</div>
                <ToggleSelector options={item.opts} currentValue={siHuaRules[item.stem][item.key]} onChange={(v) => setSiHuaRules({...siHuaRules, [item.stem]: {...siHuaRules[item.stem], [item.key]: v}})} />
            </div>
          ))}
      </CollapsibleSection>

      <CollapsibleSection title="天魁天鉞" isOpen={openSection === 'kuiyue'} onToggle={() => toggleSection('kuiyue')}>
          {[
            { gan: '甲', opts: [{k:1, y:7, lab:'丑未'}, {k:7, y:1, lab:'未丑'}] },
            { gan: '乙', opts: [{k:0, y:8, lab:'子申'}, {k:8, y:0, lab:'申子'}] },
            { gan: '丙', opts: [{k:9, y:11, lab:'酉亥'}, {k:11, y:9, lab:'亥酉'}] },
            { gan: '丁', opts: [{k:9, y:11, lab:'酉亥'}, {k:11, y:9, lab:'亥酉'}] },
            { gan: '戊', opts: [{k:1, y:7, lab:'丑未'}, {k:7, y:1, lab:'未丑'}] },
            { gan: '己', opts: [{k:0, y:8, lab:'子申'}, {k:8, y:0, lab:'申子'}] },
            { gan: '庚', opts: [{k:1, y:7, lab:'丑未'}, {k:7, y:1, lab:'未丑'}] },
            { gan: '辛', opts: [{k:2, y:6, lab:'寅午'}, {k:6, y:2, lab:'午寅'}] },
            { gan: '壬', opts: [{k:3, y:5, lab:'卯巳'}, {k:5, y:3, lab:'巳卯'}] },
            { gan: '癸', opts: [{k:3, y:5, lab:'卯巳'}, {k:5, y:3, lab:'巳卯'}] },
          ].map((item) => (
            <div key={item.gan} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.blue }}>{item.gan}干</div>
                <ToggleSelector options={item.opts.map(o => ({ val: `${o.k}-${o.y}`, label: o.lab }))} currentValue={`${kuiYueRules[item.gan]?.k}-${kuiYueRules[item.gan]?.y}`} onChange={(v) => { const [k, y] = v.split('-').map(Number); setKuiYueRules({ ...kuiYueRules, [item.gan]: { k, y } }); }} />
            </div>
          ))}
      </CollapsibleSection>

      <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${THEME.border}`, marginBottom: '12px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>火星鈴星</div>
          <ToggleSelector options={[{val: 'default', label: '全書'}, {val: 'market', label: '全集'}]} currentValue={JSON.stringify(huoLingRules) === JSON.stringify(MARKET_HUO_LING) ? 'market' : 'default'} onChange={(v) => setHuoLingRules(v === 'market' ? MARKET_HUO_LING : DEFAULT_HUO_LING)} />
      </div>

      <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${THEME.border}`, marginBottom: '12px' }}>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>天馬</div>
          <ToggleSelector options={[{val: 'year', label: '年馬'}, {val: 'month', label: '月馬'}]} currentValue={tianMaType} onChange={setTianMaType} />
      </div>

      {/* 共用功能區塊 */}
      <WebBackupManager data={bookmarks} onRestore={setBookmarks} prefix="ZWDS_BACKUP" />
      <AppInfoCard info={APP_INFO} />
      <BuyMeCoffee />

      <div style={{ marginTop: '24px' }}>
          <button onClick={handleReset} style={{ width: '100%', padding: '12px', backgroundColor: THEME.bgGray, color: THEME.red, border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> 還原預設值
          </button>
      </div>
    </div>
  );
};

// --- ZwdsInput ---
const ZwdsInput = ({ onCalculate, initialData }) => {
  const now = new Date();
  const [formData, setFormData] = useState(initialData || { name: '', gender: '1', year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: now.getHours(), minute: now.getMinutes() });
  
  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);
  
  const years = useMemo(() => { const arr = []; for (let i = 1900; i <= 2100; i++) arr.push(i); return arr; }, []);
  const hours = useMemo(() => Array.from({length: 24}, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({length: 60}, (_, i) => i), []);
  
  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', backgroundColor: THEME.bg }}>
       <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: `1px solid ${THEME.border}` }}>
          <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', color: THEME.black, fontSize: '18px', fontWeight: 'bold' }}>{initialData ? '修改資料' : '輸入出生資料'}</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>姓名</label>
            <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px' }} placeholder="輸入姓名" />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>性別</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => handleChange('gender', '1')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${formData.gender === '1' ? THEME.blue : THEME.border}`, backgroundColor: formData.gender === '1' ? THEME.bgBlue : THEME.white, color: formData.gender === '1' ? THEME.blue : THEME.black, fontWeight: 'bold' }}>男 (乾造)</button>
                 <button onClick={() => handleChange('gender', '0')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${formData.gender === '0' ? THEME.red : THEME.border}`, backgroundColor: formData.gender === '0' ? THEME.bgRed : THEME.white, color: formData.gender === '0' ? THEME.red : THEME.black, fontWeight: 'bold' }}>女 (坤造)</button>
              </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>西元年</label> <select value={formData.year} onChange={e => handleChange('year', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select> </div>
              <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>月</label> <select value={formData.month} onChange={e => handleChange('month', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}</option>)}</select> </div>
              <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>日</label> <select value={formData.day} onChange={e => handleChange('day', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{d}</option>)}</select> </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>出生時間</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1 }}> <select value={formData.hour} onChange={e => handleChange('hour', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select> </div>
              <span>:</span>
              <div style={{ flex: 1 }}> <select value={formData.minute} onChange={e => handleChange('minute', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select> </div>
              </div>
          </div>

          <button onClick={() => onCalculate(formData)} style={{ width: '100%', padding: '14px', backgroundColor: THEME.blue, color: 'white', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
             <Sparkles size={20} />
             {initialData ? '重新排盤' : '開始排盤'}
          </button>
       </div>
    </div>
  );
};

// --- PalaceGrid & ZwdsResult ---
const PalaceGrid = ({ 
    palace, onClick, highlightMode, siHuaMap, 
    layerMode, isDaXian, isXiaoXian, currentAge,
    daXianName, xiaoXianName, liuYueName, isLiuYue,
    liuNianZhiIdx, flowingStars, customStyle
}) => {
    if (!palace) return <div style={{flex:1}}></div>;

    const { year = {}, daXian = {}, xiaoXian = {}, liuYue = {} } = siHuaMap || {};
    const showDa = layerMode >= 1;
    const showXiao = layerMode >= 2;
    const showLiuYue = layerMode >= 3;

    const FORCE_TOP_STARS = ['祿存', '左輔', '右弼', '文昌', '文曲', '天魁', '天鉞', '擎羊', '陀羅', '火星', '鈴星', '地劫', '天空'];
    const topStars = [];
    const bottomStars = [];

    palace.stars.forEach(s => topStars.push({ ...s, type: 'major' }));
    palace.minorStars.forEach(s => {
        if (FORCE_TOP_STARS.includes(s.name)) topStars.push(s);
        else bottomStars.push(s);
    });

    const fontStyle = { fontSize: '13px', color: THEME.black, lineHeight: 1.1 };
    const palaceIdx = palace.zhiIdx;
    const fs = flowingStars || { da: {}, liu: {}, yue: {} };

    const renderFlowStarTag = (name, color, prefix) => (
        <span style={{ writingMode: 'vertical-rl', fontSize: '9px', color, fontWeight: 'bold', lineHeight: 1, margin: '1px 0' }}>{prefix}{name}</span>
    );

    const renderStar = (s, idx, isTop, customFontSize = null) => {
        const isMajor = s.type === 'major';
        let color = THEME.black;
        
        if (['紫微', '天府'].includes(s.name)) color = THEME.purple;
        else if (isMajor) color = THEME.red;
        else if (!isTop) color = '#555'; 

        const brightnessIndex = (layerMode <= 1) ? palace.zhiIdx : (liuNianZhiIdx || 0);
        const starBrightness = STAR_BRIGHTNESS[s.name] ? STAR_BRIGHTNESS[s.name][brightnessIndex] : '';
        const huaYear = year[s.name], huaDa = daXian[s.name], huaXiao = xiaoXian[s.name], huaYue = liuYue[s.name];
        
        const defaultSize = isTop ? '13px' : '11px'; 
        const fontSize = customFontSize ? customFontSize : defaultSize;
        const showBrightness = (isMajor || FORCE_TOP_STARS.includes(s.name));

        return (
            <div key={`${isTop?'t':'b'}-${idx}`} style={{ writingMode: 'vertical-rl', textOrientation: 'upright', display: 'flex', alignItems: 'right', margin: '0 0.5px' }}>
                <span style={{ fontSize: '9px', color: '#999', marginBottom: '1px', visibility: (showBrightness && starBrightness) ? 'visible' : 'hidden', minHeight: '10px' }}>
                    {starBrightness || ' '}
                </span>
                <span style={{ ...fontStyle, color, fontWeight: (isMajor || isTop) ? 'bold' : 'normal', fontSize: fontSize }}>
                    {s.name}
                </span>
                <div style={{ display: 'flex', flexDirection: 'row', marginTop: '3px', gap: '2px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: THEME.red, lineHeight: 1, display: huaYear ? 'block' : 'none' }}>{huaYear}</span>
                    {showDa && <span style={{ fontSize: '10px', fontWeight: 'bold', color: THEME.blue, lineHeight: 1, display: huaDa ? 'block' : 'none' }}>{huaDa}</span>}
                    {showXiao && <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'green', lineHeight: 1, display: huaXiao ? 'block' : 'none' }}>{huaXiao}</span>}
                    {showLiuYue && <span style={{ fontSize: '10px', fontWeight: 'bold', color: THEME.purple, lineHeight: 1, display: huaYue ? 'block' : 'none' }}>{huaYue}</span>}
                </div>
            </div>
        );
    };

    const renderXiaoXianAges = () => {
        if (!palace.xiaoXian) return null;
        const rows = [];
        for (let i = 0; i < Math.min(palace.xiaoXian.length, 8); i += 4) { rows.push(palace.xiaoXian.slice(i, i + 4)); }
        return rows.map((row, ridx) => (
            <div key={ridx} style={{ display: 'flex', justifyContent: 'center', gap: '1px', marginBottom: '1px' }}>
                {row.map(age => (
                    <span key={age} style={{ color: age === currentAge ? THEME.red : '#888', border: age === currentAge ? `1px solid ${THEME.red}` : 'none', borderRadius: '50%', minWidth: '15px', fontSize: '9px', textAlign: 'center', lineHeight: '13px' }}>{age}</span>
                ))}
            </div>
        ));
    };

    let bottomStarsFontSize = '12px';
    if (bottomStars.length > 6) bottomStarsFontSize = '10px';
    if (bottomStars.length > 8) bottomStarsFontSize = '9px';

    const getBackgroundColor = () => {
            if (highlightMode === 'target') {
                if (layerMode === 1) return '#e6f7ff'; 
                if (layerMode === 2) return '#e2fdcaff'; 
                if (layerMode === 3) return '#f9f0ff'; 
                return '#fff1f0'; 
            }
            if (highlightMode === 'related') return '#feffe6'; 
            return THEME.white;
        };

    const currentBgColor = getBackgroundColor();

    return (
        <div onClick={onClick} style={{ ...customStyle, position: 'relative', backgroundColor: currentBgColor, height: '100%', minHeight: '140px', overflow: 'hidden', padding: '2px', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', top: 2, left: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', zIndex: 2 }}>
                <div style={{ ...fontStyle, writingMode: 'vertical-rl', letterSpacing: '2px', marginBottom: '4px' }}>{palace.gan}{palace.zhi}</div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '0px' }}>
                    {showDa && ( <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> {fs.da.lu === palaceIdx && renderFlowStarTag('祿', THEME.blue, '大')} {fs.da.yang === palaceIdx && renderFlowStarTag('羊', THEME.blue, '大')} {fs.da.tuo === palaceIdx && renderFlowStarTag('陀', THEME.blue, '大')} {fs.da.ma === palaceIdx && renderFlowStarTag('馬', THEME.blue, '大')} {fs.da.kui === palaceIdx && renderFlowStarTag('魁', THEME.blue, '大')} {fs.da.yue === palaceIdx && renderFlowStarTag('鉞', THEME.blue, '大')} </div> )}
                    {showXiao && ( <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> {fs.liu.lu === palaceIdx && renderFlowStarTag('祿', 'green', '歲')} {fs.liu.yang === palaceIdx && renderFlowStarTag('羊', 'green', '歲')} {fs.liu.tuo === palaceIdx && renderFlowStarTag('陀', 'green', '歲')} {fs.liu.ma === palaceIdx && renderFlowStarTag('馬', 'green', '歲')} {fs.liu.kui === palaceIdx && renderFlowStarTag('魁', 'green', '歲')} {fs.liu.yue === palaceIdx && renderFlowStarTag('鉞', 'green', '歲')} </div> )}
                    {showLiuYue && fs.yue && ( <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> {fs.yue.lu === palaceIdx && renderFlowStarTag('祿', THEME.purple, '月')} {fs.yue.yang === palaceIdx && renderFlowStarTag('羊', THEME.purple, '月')} {fs.yue.tuo === palaceIdx && renderFlowStarTag('陀', THEME.purple, '月')} {fs.yue.ma === palaceIdx && renderFlowStarTag('馬', THEME.purple, '月')} {fs.yue.kui === palaceIdx && renderFlowStarTag('魁', THEME.purple, '月')} {fs.yue.yue === palaceIdx && renderFlowStarTag('鉞', THEME.purple, '月')} </div> )}
                </div>
            </div>
            
            <div style={{ position: 'absolute', bottom: 6, left: 2, display: 'flex', flexDirection: 'row', alignItems: 'flex-end', maxWidth: '30px', zIndex: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: '2px' }}>
                    <div style={{ ...fontStyle, writingMode: 'vertical-rl', letterSpacing: '2px' }}>{palace.name}</div>
                    {showDa && daXianName && <div style={{ fontSize: '11px', color: THEME.blue, fontWeight: 'bold', writingMode: 'vertical-rl', backgroundColor: 'rgba(230,247,255,0.8)' }}>{daXianName}</div>}
                    {showXiao && xiaoXianName && <div style={{ fontSize: '11px', color: 'green', fontWeight: 'bold', writingMode: 'vertical-rl', backgroundColor: 'rgba(246,255,237,0.8)' }}>{xiaoXianName}</div>}
                    {showLiuYue && liuYueName && <div style={{ fontSize: '11px', color: THEME.purple, fontWeight: 'bold', writingMode: 'vertical-rl', backgroundColor: 'rgba(249,240,255,0.8)' }}>{liuYueName}</div>}
                </div>
                {palace.isShen && <span style={{ backgroundColor: THEME.red, color: 'white', fontSize: '10px', borderRadius: '4px', padding: '1px 1px', lineHeight: 1, marginBottom: '2px', marginLeft: '1px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>身</span>}
            </div>

            <div style={{ position: 'absolute', bottom: 6, right: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', zIndex: 2 }}>
                {palace.changSheng12 && <span style={{ fontSize: '12px', color: COLORS.geng, writingMode: 'vertical-rl', textOrientation: 'upright', lineHeight: 1, fontWeight: 'normal' }}>{palace.changSheng12}</span>}
                {palace.doctor12 && <span style={{ fontSize: '12px', color: COLORS.jia, writingMode: 'vertical-rl', textOrientation: 'upright', lineHeight: 1 }}>{palace.doctor12}</span>}
            </div>

            <div style={{ position: 'absolute', top: 2, bottom: '36px', left: '24px', right: 2, display: 'flex', flexDirection: 'row-reverse', flexWrap: 'wrap', alignContent: 'flex-start', alignItems: 'flex-start', gap: '0px' }}>
                {topStars.map((s, i) => renderStar(s, i, true))}
                {bottomStars.map((s, i) => renderStar(s, i, false, bottomStarsFontSize))}
            </div>
            
            <div style={{ position: 'absolute', bottom: 2, left: '25px', right: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {renderXiaoXianAges()}
                <div style={{ fontSize: '12px', color: isDaXian ? THEME.red : THEME.black, fontWeight: isDaXian ? 'bold' : 'normal', marginTop: '1px' }}>{palace.daXian || '\u00A0'}</div>
            </div>
        </div>
    );
};

const ZwdsResult = ({ data, onBack, onSave }) => {
    const [chartData, setChartData] = useState(data);
    useEffect(() => { setChartData(data); }, [data]);

    const g = chartData.grid;
    const [focusedIndex, setFocusedIndex] = useState(() => g.findIndex(p => p.name === '命宮'));
    const [targetDate, setTargetDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, day: new Date().getDate() });
    const [layerMode, setLayerMode] = useState(0); 

    const handleHourAdjust = (delta) => {
        const current = chartData.rawDate;
        const dt = new Date(current.year, current.month - 1, current.day, parseInt(current.hour), current.minute);
        dt.setHours(dt.getHours() + delta);
        const newFormData = { ...current, year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate(), hour: dt.getHours(), minute: dt.getMinutes() };
        
        // 為了確保重算正確，暫時讀取 localStorage 設定 (與 SettingsView 同步)
        const getRule = (key, def) => { 
            const s = localStorage.getItem(key); 
            try { return s ? JSON.parse(s) : def; } catch(e) { return def; } 
        };
        const rulesConfig = {
            siHua: getRule('zwds_rule_sihua', DEFAULT_SI_HUA),
            kuiYue: getRule('zwds_rule_kuiyue', DEFAULT_KUI_YUE),
            huoLing: getRule('zwds_rule_huoling', DEFAULT_HUO_LING),
            tianMa: getRule('zwds_rule_tianMa', DEFAULT_TIAN_MA),
            tianMaType: localStorage.getItem('zwds_rule_tm_type') || 'year'
        };
        const mingHasDaXian = localStorage.getItem('zwds_ming_daxian') === 'true';

        try {
            const newResult = calculateZwdsResult(newFormData, rulesConfig, { mingHasDaXian });
            setChartData(newResult);
        } catch (e) { console.error("調整時辰失敗", e); }
    };

    const handleDateChange = (field, value) => { setTargetDate(prev => ({ ...prev, [field]: parseInt(value) })); };
    const getLayerTitle = () => ["本命盤", "大限盤", "歲限盤", "流月盤"][layerMode] || "本命盤";

    const birthDetails = useMemo(() => {
            try {
                const solar = window.Solar.fromYmdHms(parseInt(chartData.rawDate.year), parseInt(chartData.rawDate.month), parseInt(chartData.rawDate.day), parseInt(chartData.rawDate.hour), parseInt(chartData.rawDate.minute), 0);
                const lunar = solar.getLunar();
                let monthName = lunar.getMonthInChinese().replace('闰', '閏').replace('冬', '十一').replace('腊', '十二');
                return { bazi: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日 ${lunar.getTimeZhi()}時`, solarStr: `${chartData.rawDate.year}/${chartData.rawDate.month}/${chartData.rawDate.day}`, lunarStr: `${lunar.getYearInGanZhi()}年 ${monthName}月${lunar.getDayInChinese()}` };
            } catch (e) { return { bazi: '', solarStr: '', lunarStr: '' }; }
        }, [chartData.rawDate]);
        
    const resultParams = useMemo(() => {
        try {
            const birthSolar = window.Solar.fromYmdHms(parseInt(chartData.rawDate.year), parseInt(chartData.rawDate.month), parseInt(chartData.rawDate.day), parseInt(chartData.rawDate.hour), parseInt(chartData.rawDate.minute), 0);
            const birthLunar = birthSolar.getLunar();
            const targetSolar = window.Solar.fromYmdHms(parseInt(targetDate.year), parseInt(targetDate.month), parseInt(targetDate.day), 12, 0, 0);
            const targetLunar = targetSolar.getLunar();
            
            const finalAge = targetLunar.getYear() - birthLunar.getYear() + 1;
            const tYearGan = targetLunar.getYearGan();
            const tYearZhi = targetLunar.getYearZhi();
            const liuNianZhiIdx = DIZHI.indexOf(tYearZhi);

            let dIdx = -1; let xIdx = -1;
            g.forEach((p, i) => {
                if(p.daXian) { const [start, end] = p.daXian.split('-').map(Number); if(finalAge >= start && finalAge <= end) dIdx = i; }
                if(p.xiaoXian?.includes(finalAge)) xIdx = i;
            });

            let daXianGan = null;
            const mingPalace = g.find(p => p.name === '命宮');
            if (mingPalace && dIdx !== -1) {
                const bYearGan = birthLunar.getYearGan();
                const isMale = chartData.genderText === '男';
                const isClockwise = (isMale && (TIANGAN.indexOf(bYearGan) % 2 === 0)) || (!isMale && (TIANGAN.indexOf(bYearGan) % 2 !== 0));
                const steps = isClockwise ? (g[dIdx].zhiIdx - mingPalace.zhiIdx + 12) % 12 : (mingPalace.zhiIdx - g[dIdx].zhiIdx + 12) % 12;
                daXianGan = TIANGAN[(TIANGAN.indexOf(mingPalace.gan) + steps) % 10];
            }

            let leapMonth = 0;
            try { if (window.LunarYear) leapMonth = window.LunarYear.fromYear(targetLunar.getYear()).getLeapMonth(); } catch(e){}
            const curLunarMonth = Math.abs(targetLunar.getMonth());
            const isLeap = (targetLunar.getMonth() < 0);
            let monthOffset = curLunarMonth - 1;
            if (leapMonth > 0 && (curLunarMonth > leapMonth || isLeap)) { monthOffset += 1; }

            const douJunIdx = (liuNianZhiIdx - (Math.abs(birthLunar.getMonth()) - 1) + Math.floor((parseInt(chartData.rawDate.hour)+1)%24/2) + 12) % 12;
            const currentLiuYueIdx = (douJunIdx + monthOffset) % 12;
            const currentLiuYueGan = TIANGAN[(((TIANGAN.indexOf(tYearGan) % 5) * 2 + 2) + monthOffset) % 10];
            const getLuPos = (gan) => ({'甲':2,'乙':3,'丙':5,'丁':6,'戊':5,'己':6,'庚':8,'辛':9,'壬':11,'癸':0}[gan]);
            const stars = { da: {}, liu: {}, yue: {} };
            const lLu = getLuPos(tYearGan);
            stars.liu = { lu: lLu, yang:(lLu+1)%12, tuo:(lLu+11)%12, ma:({'申':2,'子':2,'辰':2,'寅':8,'午':8,'戌':8,'巳':11,'酉':11,'丑':11,'亥':5,'卯':5,'未':5}[tYearZhi]), kui: DEFAULT_KUI_YUE[tYearGan]?.k, yue: DEFAULT_KUI_YUE[tYearGan]?.y };
            if (daXianGan) { const dLu = getLuPos(daXianGan); stars.da = { lu: dLu, yang:(dLu+1)%12, tuo:(dLu+11)%12, kui: DEFAULT_KUI_YUE[daXianGan]?.k, yue: DEFAULT_KUI_YUE[daXianGan]?.y }; }
            if (currentLiuYueGan) { const yLu = getLuPos(currentLiuYueGan); const curMonthZhi = targetLunar.getMonthZhi(); stars.yue = { lu: yLu, yang: (yLu + 1) % 12, tuo: (yLu + 11) % 12, ma: ({'申':2,'子':2,'辰':2,'寅':8,'午':8,'戌':8,'巳':11,'酉':11,'丑':11,'亥':5,'卯':5,'未':5}[curMonthZhi]), kui: DEFAULT_KUI_YUE[currentLiuYueGan]?.k, yue: DEFAULT_KUI_YUE[currentLiuYueGan]?.y }; }
            return { currentAge: finalAge, liuNianZhiIdx, daXianIdx: dIdx, xiaoXianIdx: xIdx, currentLiuYueIdx, currentLiuYueGan, flowingStars: stars, daXianGan, currentLiuNianGan: tYearGan };
        } catch (e) { console.error("Calc Error:", e); return { currentAge: 1, flowingStars: {da:{}, liu:{}, yue:{}} }; }
    }, [chartData.rawDate, targetDate, g, chartData.genderText]);

    const { currentAge, liuNianZhiIdx, daXianIdx, xiaoXianIdx, currentLiuYueIdx, currentLiuYueGan, flowingStars, daXianGan, currentLiuNianGan } = resultParams;
    const activeSiHua = useMemo(() => {
        const getMap = (gan) => { if (!gan) return {}; const r = DEFAULT_SI_HUA[gan]; return { [r.lu]: '祿', [r.quan]: '權', [r.ke]: '科', [r.ji]: '忌' }; };
        const bGan = window.Solar.fromYmdHms(chartData.rawDate.year, chartData.rawDate.month, chartData.rawDate.day, chartData.rawDate.hour, chartData.rawDate.minute, 0).getLunar().getYearGan();
        return { year: getMap(bGan), daXian: getMap(daXianGan), xiaoXian: getMap(currentLiuNianGan), liuYue: getMap(currentLiuYueGan) };
    }, [chartData.rawDate, daXianGan, currentLiuNianGan, currentLiuYueGan]);

    const switchLayer = (d) => setLayerMode(prev => { let n=prev+d; if(n>3)n=0; if(n<0)n=3; return n; });
    
    useEffect(() => {
        if (layerMode === 0) setFocusedIndex(g.findIndex(p => p.name === '命宮'));
        else if (layerMode === 1 && daXianIdx !== -1) setFocusedIndex(daXianIdx);
        else if (layerMode === 2 && xiaoXianIdx !== -1) setFocusedIndex(xiaoXianIdx);
        else if (layerMode === 3 && currentLiuYueIdx !== -1) setFocusedIndex(currentLiuYueIdx);
    }, [layerMode, daXianIdx, xiaoXianIdx, currentLiuYueIdx, g]);

    const renderCell = (idx) => {
        const getDN = (base, cur, pre) => (base === -1 || base === undefined || isNaN(base)) ? null : pre + PALACE_NAMES[(base - cur + 12) % 12].charAt(0);
        
        const cellStyle = {
            boxSizing: 'border-box'
        };

        return (
            <PalaceGrid 
                palace={g[idx]} onClick={() => setFocusedIndex(idx)}
                highlightMode={focusedIndex === idx ? 'target' : ([(focusedIndex+4)%12, (focusedIndex+8)%12, (focusedIndex+6)%12].includes(idx) ? 'related' : null)}
                siHuaMap={activeSiHua} layerMode={layerMode} isDaXian={idx === daXianIdx} isXiaoXian={idx === xiaoXianIdx} currentAge={currentAge} liuNianZhiIdx={liuNianZhiIdx}
                daXianName={getDN(daXianIdx, idx, '大')} xiaoXianName={getDN(xiaoXianIdx, idx, '歲')} liuYueName={getDN(currentLiuYueIdx, idx, '月')} flowingStars={flowingStars}
                customStyle={cellStyle}
                />
        );
    };

    const yearOptions = useMemo(() => { const arr = []; for(let i=1940; i<=2060; i++) arr.push(i); return arr; }, []);
    const daysInMonth = useMemo(() => { const lastDay = new Date(targetDate.year, targetDate.month, 0).getDate(); return Array.from({ length: lastDay }, (_, i) => i + 1); }, [targetDate.year, targetDate.month]);
    const targetLunarDisplay = useMemo(() => { try { const solar = window.Solar.fromYmd(parseInt(targetDate.year), parseInt(targetDate.month), parseInt(targetDate.day)); const lunar = solar.getLunar(); let monthName = lunar.getMonthInChinese().replace('闰', '閏').replace('冬', '十一').replace('腊', '十二'); return `${lunar.getYearInGanZhi()}年 ${monthName}月${lunar.getDayInChinese()}`; } catch (e) { return ""; } }, [targetDate]);

    return (
        <div style={{ padding: '8px', flex: 1, overflowY: 'auto', backgroundColor: THEME.bg, display: 'flex', flexDirection: 'column' }}>
            <div style={{ 
                display: 'grid', 
                // 4欄均分
                gridTemplateColumns: '1fr 1fr 1fr 1fr', 
                // 4列均分
                gridTemplateRows: 'repeat(4, minmax(140px, 1fr))', 
                // 1. 設定 gap 為 1px，這會強制分開每個格子
                gap: '1px', 
                // 2. 設定容器背景色為深灰/邊框色，這就是露出來的線條顏色
                backgroundColor: THEME.border, 
                // 3. 設定外框
                border: `1px solid ${THEME.border}`, 
                flex: 1 
                }}>

                {/* 第一列 (巳 午 未 申) */}
                {renderCell(5)} {renderCell(6)} {renderCell(7)} {renderCell(8)}
                {/* 第二列左 (辰) */}
                {renderCell(4)}
                
                {/* 中宮 (跨越 2列 x 2欄) */}
                <div style={{ 
                    gridColumn: '2 / span 2', 
                    gridRow: '2 / span 2', 
                    backgroundColor: THEME.white, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '10px',
                    // ★ 確保中宮不會遮住任何格線
                    zIndex: 1 
                }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{chartData.name}</div>
                    <div style={{ fontSize: '11px', color: THEME.gray, textAlign: 'center', marginBottom: '8px', lineHeight: '1.4' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                        <div style={{ color: THEME.black, fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>{birthDetails.bazi}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <button onClick={() => handleHourAdjust(2)} style={{ background: 'white', border: `1px solid ${THEME.border}`, borderRadius:'3px', padding:'0px 4px', cursor: 'pointer', color: THEME.gray, display: 'flex', alignItems: 'center', height: '14px', lineHeight: 0 }} title="下個時辰"> <ChevronLeft size={10} style={{ transform: 'rotate(90deg)' }} /> </button>
                            <button onClick={() => handleHourAdjust(-2)} style={{ background: 'white', border: `1px solid ${THEME.border}`, borderRadius:'3px', padding:'0px 4px', cursor: 'pointer', color: THEME.gray, display: 'flex', alignItems: 'center', height: '14px', lineHeight: 0 }} title="上個時辰"> <ChevronRight size={10} style={{ transform: 'rotate(90deg)' }} /> </button>
                        </div>
                    </div>
                        <div>西曆 {birthDetails.solarStr}</div>
                        <div>農曆 {birthDetails.lunarStr}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 48px', alignItems: 'center', width: '100%', marginBottom: '4px' }}>
                        <button onClick={() => switchLayer(-1)} style={{ background: 'none', border: 'none', color: THEME.blue }}><ChevronLeft size={24} /></button>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>{getLayerTitle()}</span>
                        <button onClick={() => switchLayer(1)} style={{ background: 'none', border: 'none', color: THEME.blue }}><ChevronRight size={24} /></button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        <select value={targetDate.year} onChange={(e) => handleDateChange('year', e.target.value)} style={{ fontSize: '12px' }}>{yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}</select>
                        <select value={targetDate.month} onChange={(e) => handleDateChange('month', e.target.value)} style={{ fontSize: '12px' }}>{Array.from({length:12},(_,i)=>i+1).map(m => <option key={m} value={m}>{m}月</option>)}</select>
                        <select value={targetDate.day} onChange={(e) => handleDateChange('day', e.target.value)} style={{ fontSize: '12px' }}>{daysInMonth.map(d => <option key={d} value={d}>{d}日</option>)}</select>
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '8px', color: THEME.blue }}>{targetLunarDisplay}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px', fontSize: '12px', textAlign: 'left', width: '100%', paddingLeft: '20px', color: THEME.gray }}>
                            <div>命主 : {chartData.mingZhu}</div> <div>身主 : {chartData.shenZhu}</div>
                            <div>五行 : {chartData.bureau}</div> <div>性別 : {chartData.genderText}</div>
                            <div>子斗 : {chartData.douJun}</div> <div>虛歲 : {currentAge}歲</div>
                    </div>
                    {(layerMode === 1 && !daXianGan) && <div style={{ width: '100%', textAlign: 'center', color: THEME.red, fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>未入大限並無四化</div>}
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                        <button onClick={onBack} style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: THEME.blue, color: 'white', border: 'none' }}>返回</button>
                        <button onClick={() => onSave(chartData)} style={{ padding: '2px 8px', fontSize: '11px', backgroundColor: THEME.blue, color: 'white', border: 'none' }}>保存</button>
                    </div>
                </div>

                {/* 第二列右 (酉) */}
                {renderCell(9)} 
                {/* 第三列左 (卯) */}
                {renderCell(3)} 
                {/* 第三列右 (戌) */}
                {renderCell(10)}
                {/* 第四列 (寅 丑 子 亥) */}
                {renderCell(2)} {renderCell(1)} {renderCell(0)} {renderCell(11)}
            </div>
            <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '10px', color: THEME.gray, paddingBottom: '100px' }}>排盤依據明朝紫微斗數全書</div>
        </div>
    );
};

// =========================================================================
// PART B: 主程式結構 (使用共用 UI 殼)
// =========================================================================

export default function ZwdsApp() {
  // 1. 安全保護 & 載入檢查
  // useProtection(['mrkfengshui.com', 'localhost']);
  const libStatus = useLunarScript();
  
  // 2. 狀態管理
  const [view, setView] = useState('input');
  const [resultData, setResultData] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [editingData, setEditingData] = useState(null);
  
  // App 專屬狀態
  const [siHuaRules, setSiHuaRules] = useState(DEFAULT_SI_HUA);
  const [kuiYueRules, setKuiYueRules] = useState(DEFAULT_KUI_YUE);
  const [huoLingRules, setHuoLingRules] = useState(DEFAULT_HUO_LING);
  const [tianMaRules, setTianMaRules] = useState(DEFAULT_TIAN_MA);
  const [tianMaType, setTianMaType] = useState('year'); 
  const [mingHasDaXian, setMingHasDaXian] = useState(false);

  // 3. 底部導航設定
  const tabs = [
    { id: 'input', label: '排盤', icon: Grid },
    { id: 'bookmarks', label: '紀錄', icon: Bookmark },
    { id: 'booking', label: '預約', icon: CalendarCheck },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  // 4. 資料讀取 Effect
  useEffect(() => {
    const loadData = async () => {
        try {
            const { value: savedBk } = await Preferences.get({ key: 'zwds_bookmarks' });
            if (savedBk) setBookmarks(JSON.parse(savedBk));
            
            // 讀取設定
            const { value: r1 } = await Preferences.get({ key: 'zwds_rule_sihua' }); if(r1) setSiHuaRules(JSON.parse(r1));
            const { value: r2 } = await Preferences.get({ key: 'zwds_rule_kuiyue' }); if(r2) setKuiYueRules(JSON.parse(r2));
            const { value: r3 } = await Preferences.get({ key: 'zwds_rule_huoling' }); if(r3) setHuoLingRules(JSON.parse(r3));
            const { value: r4 } = await Preferences.get({ key: 'zwds_rule_tianMa' }); if(r4) setTianMaRules(JSON.parse(r4));
            const { value: r5 } = await Preferences.get({ key: 'zwds_rule_tm_type' }); if(r5) setTianMaType(r5);
            const { value: r6 } = await Preferences.get({ key: 'zwds_ming_daxian' }); if(r6 !== null) setMingHasDaXian(r6 === 'true');

        } catch (e) { console.error("Data load error:", e); }
    };
    loadData();
  }, []);

  // 儲存設定 Effect
  useEffect(() => {
    const saveData = async () => {
       await Preferences.set({ key: 'zwds_ming_daxian', value: String(mingHasDaXian) });
       await Preferences.set({ key: 'zwds_rule_sihua', value: JSON.stringify(siHuaRules) });
       await Preferences.set({ key: 'zwds_rule_kuiyue', value: JSON.stringify(kuiYueRules) });
       await Preferences.set({ key: 'zwds_rule_huoling', value: JSON.stringify(huoLingRules) });
       await Preferences.set({ key: 'zwds_rule_tianMa', value: JSON.stringify(tianMaRules) });
       await Preferences.set({ key: 'zwds_rule_tm_type', value: tianMaType });
       
       // 為確保 ZwdsResult 能即時讀取 (它使用 localStorage)，這裡進行同步寫入
       localStorage.setItem('zwds_rule_sihua', JSON.stringify(siHuaRules));
       localStorage.setItem('zwds_rule_kuiyue', JSON.stringify(kuiYueRules));
       localStorage.setItem('zwds_rule_huoling', JSON.stringify(huoLingRules));
       localStorage.setItem('zwds_rule_tianMa', JSON.stringify(tianMaRules));
       localStorage.setItem('zwds_rule_tm_type', tianMaType);
       localStorage.setItem('zwds_ming_daxian', mingHasDaXian);
    };
    saveData();
  }, [mingHasDaXian, siHuaRules, kuiYueRules, huoLingRules, tianMaRules, tianMaType]);

  // 5. 動作處理
  const handleCalculate = (formData) => {
     if (libStatus !== 'ready') return;
     try {
        const rulesConfig = { siHua: siHuaRules, kuiYue: kuiYueRules, huoLing: huoLingRules, tianMa: tianMaRules, tianMaType: tianMaType };
        const result = calculateZwdsResult(formData, rulesConfig, { mingHasDaXian });
        setResultData(result); setEditingData(null); setView('result');
     } catch(e) { console.error(e); alert('計算異常: ' + e.message); }
  };
  
  const saveBookmark = async (data) => {
        const dataToSave = {
            id: data.id || Date.now(),
            name: data.name,
            genderText: data.genderText,
            solarDate: data.solarDateStr,
            lunarDate: data.lunarDateStr,
            mingGongStars: data.mingGongStars, 
            rawDate: data.rawDate 
        };

        const existingIndex = bookmarks.findIndex(b => b.id === dataToSave.id);
        let newBk;

        if (existingIndex >= 0) { 
            newBk = [...bookmarks]; 
            newBk[existingIndex] = dataToSave; 
            alert('紀錄已更新'); 
        } else { 
            newBk = [dataToSave, ...bookmarks]; 
            alert('已保存至紀錄'); 
        }

        setBookmarks(newBk); 
        await Preferences.set({ key: 'zwds_bookmarks', value: JSON.stringify(newBk) });
    };

  const deleteBookmark = async (id) => {
      if (window.confirm('確定要刪除這條紀錄嗎？')) {
          const newBk = bookmarks.filter(b => b.id !== id);
          setBookmarks(newBk); 
          await Preferences.set({ key: 'zwds_bookmarks', value: JSON.stringify(newBk) });
      }
  };

  const openBookmark = (savedItem) => {
      if (!savedItem.rawDate) { alert('舊資料無法開啟'); return; }
      try {
          const rulesConfig = { siHua: siHuaRules, kuiYue: kuiYueRules, huoLing: huoLingRules, tianMa: tianMaRules, tianMaType: tianMaType };
          const freshResult = calculateZwdsResult(savedItem.rawDate, rulesConfig, { mingHasDaXian });
          freshResult.id = savedItem.id; 
          setResultData(freshResult); 
          setView('result');
      } catch (e) { alert('讀取失敗：' + (e.message || '未知錯誤')); }
  };

  if (libStatus === 'loading') return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>載入斗數星曆...</div>;
  if (libStatus === 'error') return <div style={{ padding: 20, textAlign: 'center' }}>載入失敗，請檢查網路連線後重新整理。</div>;

  return (
    <div style={COMMON_STYLES.fullScreen}>
      <style>{`
        @font-face { font-family: '青柳隷書SIMO2_T'; src: url('/fonts/AoyagiReishoSIMO2_T.ttf') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }
      `}</style>
      
      {/* ✅ 共用 Header */}
      <AppHeader title={APP_NAME} logoChar={{ main: '紫', sub: '微' }} />

      {/* ✅ 內容滾動區 */}
      <div style={COMMON_STYLES.contentArea}>
          {view === 'input' && (
            <>
                <ZwdsInput onCalculate={handleCalculate} initialData={editingData} />
                <AdBanner />
            </>
          )}
          
          {view === 'result' && (
            <>
                <ZwdsResult data={resultData} onBack={() => { setEditingData(null); setView('input'); }} onSave={saveBookmark} />
                <AdBanner />
            </>
          )}
            
          {view === 'bookmarks' && (
              <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                    <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>我的命盤紀錄</h2>
                  </div>
                  
                  {/* ✅ 共用 BookmarkList */}
                  <BookmarkList 
                    bookmarks={bookmarks}
                    onSelect={openBookmark}
                    onDelete={deleteBookmark}
                    onEdit={(b) => { setEditingData({...b.rawDate, id: b.id}); setView('input'); }}
                  />
                  
                  <div style={{ marginTop: '20px' }}><AdBanner /></div>
              </div>
          )}

          {/* ✅ 共用預約系統 */}
          {view === 'booking' && <BookingSystem apiUrl={API_URL} onNavigate={() => setView('input')} />}
          
          {/* ✅ 共用架構設定頁 */}
          {view === 'settings' && 
            <SettingsView 
                siHuaRules={siHuaRules} setSiHuaRules={setSiHuaRules}
                kuiYueRules={kuiYueRules} setKuiYueRules={setKuiYueRules}
                huoLingRules={huoLingRules} setHuoLingRules={setHuoLingRules}
                tianMaRules={tianMaRules} setTianMaRules={setTianMaRules}
                tianMaType={tianMaType} setTianMaType={setTianMaType}
                mingHasDaXian={mingHasDaXian} setMingHasDaXian={setMingHasDaXian}
                bookmarks={bookmarks} setBookmarks={setBookmarks}
            />
          }
      </div>

      {/* ✅ 安裝引導提示 */}
      <InstallGuide />

      {/* ✅ 共用底部導航 */}
      <BottomTabBar 
        tabs={tabs} 
        currentTab={view === 'result' ? 'input' : view} 
        onTabChange={(id) => {
          if (id === 'input') setEditingData(null);
          setView(id);
        }} 
      />
    </div>
  );
}