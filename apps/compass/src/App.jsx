import React, { useState, useEffect, useMemo } from 'react';
import { Preferences } from '@capacitor/preferences';

// 1. 引入共用 UI 和 工具
import { 
  AppHeader, 
  BottomTabBar, 
  AdBanner, 
  AppInfoCard, 
  WebBackupManager, 
  BuyMeCoffee, 
  InstallGuide,
  BookingSystem,
  BookmarkList,
  useProtection, 
  THEME, 
  COMMON_STYLES 
} from '@my-meta/ui';

// 2. 引入 Icon
import { 
  Compass, RefreshCw, ArrowLeft, Lock, Unlock, X, MapPin, 
  DoorOpen, Eye, EyeOff, AlertTriangle, Briefcase, 
  Grid, Bookmark, CalendarCheck, Settings, Save
} from 'lucide-react';

// =========================================================================
// 👇 PART A: 核心數據與邏輯 (保留原有的風水運算)
// =========================================================================

const APP_NAME = "元星風水";
const APP_VERSION = "v2.0 Pro";
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec"; // 範例 API

// --- 核心數據定義 (保持不變) ---
const MOUNTAINS = [
    { name: '子', angle: 0, gua: '坎', yuan: '天' }, { name: '癸', angle: 15, gua: '坎', yuan: '人' },
    { name: '丑', angle: 30, gua: '艮', yuan: '地' }, { name: '艮', angle: 45, gua: '艮', yuan: '天' }, { name: '寅', angle: 60, gua: '艮', yuan: '人' },
    { name: '甲', angle: 75, gua: '震', yuan: '地' }, { name: '卯', angle: 90, gua: '震', yuan: '天' }, { name: '乙', angle: 105, gua: '震', yuan: '人' },
    { name: '辰', angle: 120, gua: '巽', yuan: '地' }, { name: '巽', angle: 135, gua: '巽', yuan: '天' }, { name: '巳', angle: 150, gua: '巽', yuan: '人' },
    { name: '丙', angle: 165, gua: '離', yuan: '地' }, { name: '午', angle: 180, gua: '離', yuan: '天' }, { name: '丁', angle: 195, gua: '離', yuan: '人' },
    { name: '未', angle: 210, gua: '坤', yuan: '地' }, { name: '坤', angle: 225, gua: '坤', yuan: '天' }, { name: '申', angle: 240, gua: '坤', yuan: '人' },
    { name: '庚', angle: 255, gua: '兌', yuan: '地' }, { name: '酉', angle: 270, gua: '兌', yuan: '天' }, { name: '辛', angle: 285, gua: '兌', yuan: '人' },
    { name: '戌', angle: 300, gua: '乾', yuan: '地' }, { name: '乾', angle: 315, gua: '乾', yuan: '天' }, { name: '亥', angle: 330, gua: '乾', yuan: '人' },
    { name: '壬', angle: 345, gua: '坎', yuan: '地' }, 
];

const YIN_YANG_MAP = {
    1: { '地': 1, '天': -1, '人': -1 }, 2: { '地': -1, '天': 1, '人': 1 },
    3: { '地': 1, '天': -1, '人': -1 }, 4: { '地': -1, '天': 1, '人': 1 },
    5: { '地': -1, '天': 1, '人': 1 },  6: { '地': -1, '天': 1, '人': 1 },
    7: { '地': 1, '天': -1, '人': -1 }, 8: { '地': -1, '天': 1, '人': 1 },
    9: { '地': 1, '天': -1, '人': -1 },
};

const LUOSHU_PATH = [4, 8, 5, 6, 1, 7, 2, 3, 0]; 
const DIRECTION_MAP = { '巽': 0, '離': 1, '坤': 2, '震': 3, '中': 4, '兌': 5, '艮': 6, '坎': 7, '乾': 8 };

// --- 進階風水數據 (保持不變) ---
const EIGHT_KILLINGS = { '坎': '辰', '坤': '卯', '震': '申', '巽': '酉', '乾': '午', '兌': '巳', '艮': '寅', '離': '亥' };
const YELLOW_SPRING = { '庚': '坤', '丁': '坤', '坤': ['庚', '丁'], '丙': '巽', '乙': '巽', '巽': ['丙', '乙'], '甲': '艮', '癸': '艮', '艮': ['甲', '癸'], '壬': '乾', '辛': '乾', '乾': ['辛', '壬'] };
const EAR_LATE_WATER = { '乾': { early: '離', late: '艮' }, '坎': { early: '兌', late: '坤' }, '艮': { early: '乾', late: '震' }, '震': { early: '艮', late: '離' }, '巽': { early: '坤', late: '兌' }, '離': { early: '震', late: '乾' }, '坤': { early: '坎', late: '巽' }, '兌': { early: '巽', late: '坎' } };
const NA_JIA = { '乾': ['甲'], '坎': ['癸', '申', '子', '辰'], '艮': ['丙'], '震': ['庚', '亥', '卯', '未'], '巽': ['辛'], '離': ['壬', '寅', '午', '戌'], '坤': ['乙'], '兌': ['丁', '巳', '酉', '丑'] };
const FAN_GUA_CONFIG = { '坎': { mt: '兌', water: '坎' }, '艮': { mt: '離', water: '艮' }, '震': { mt: '坤', water: '震' }, '巽': { mt: '乾', water: '巽' }, '離': { mt: '艮', water: '離' }, '坤': { mt: '震', water: '坤' }, '兌': { mt: '坎', water: '兌' }, '乾': { mt: '巽', water: '乾' } };

const BA_ZHAI_INFO = {
    '生氣': { type: '吉', color: '#389e0d', star: '貪狼', desc: '大吉之位。主財運亨通、事業騰達。' },
    '天醫': { type: '吉', color: '#096dd9', star: '巨門', desc: '次吉之位。主健康長壽、貴人相助。' },
    '延年': { type: '吉', color: '#13c2c2', star: '武曲', desc: '中吉之位。主婚姻和諧、人際圓滿。' },
    '伏位': { type: '吉', color: '#595959', star: '輔弼', desc: '小吉之位。主平穩安定、守成待機。' },
    '絕命': { type: '凶', color: '#cf1322', star: '破軍', desc: '大凶之位。主意外傷災、破財損丁。' },
    '五鬼': { type: '凶', color: '#d46b08', star: '廉貞', desc: '大凶之位。主口舌是非、官司火災。' },
    '六煞': { type: '凶', color: '#c41d7f', star: '文曲', desc: '中凶之位。主桃花糾紛、家庭不睦。' },
    '禍害': { type: '凶', color: '#8c8c8c', star: '祿存', desc: '小凶之位。主官司訴訟、是非口舌。' }
};

const BA_ZHAI_MAPPING = {
    '坎': { '坎': '伏位', '巽': '生氣', '震': '天醫', '離': '延年', '坤': '絕命', '艮': '五鬼', '乾': '六煞', '兌': '禍害' },
    '坤': { '坤': '伏位', '艮': '生氣', '兌': '天醫', '乾': '延年', '坎': '絕命', '巽': '五鬼', '離': '六煞', '震': '禍害' },
    '震': { '震': '伏位', '離': '生氣', '坎': '天醫', '巽': '延年', '兌': '絕命', '乾': '五鬼', '艮': '六煞', '坤': '禍害' },
    '巽': { '巽': '伏位', '坎': '生氣', '離': '天醫', '震': '延年', '艮': '絕命', '坤': '五鬼', '兌': '六煞', '乾': '禍害' },
    '乾': { '乾': '伏位', '兌': '生氣', '艮': '天醫', '坤': '延年', '離': '絕命', '震': '五鬼', '坎': '六煞', '巽': '禍害' },
    '兌': { '兌': '伏位', '乾': '生氣', '坤': '天醫', '艮': '延年', '震': '絕命', '離': '五鬼', '巽': '六煞', '坎': '禍害' },
    '艮': { '艮': '伏位', '坤': '生氣', '乾': '天醫', '兌': '延年', '巽': '絕命', '坎': '五鬼', '震': '六煞', '離': '禍害' },
    '離': { '離': '伏位', '震': '生氣', '巽': '天醫', '坎': '延年', '乾': '絕命', '兌': '五鬼', '坤': '六煞', '艮': '禍害' }
};

const KUN_REN_YI = {
    '坤': { star: '巨門', type: '吉', color: '#096dd9' }, '壬': { star: '巨門', type: '吉', color: '#096dd9' }, '乙': { star: '巨門', type: '吉', color: '#096dd9' },
    '艮': { star: '破軍', type: '凶', color: '#cf1322' }, '丙': { star: '破軍', type: '凶', color: '#cf1322' }, '辛': { star: '破軍', type: '凶', color: '#cf1322' },
    '巽': { star: '武曲', type: '吉', color: '#389e0d' }, '辰': { star: '武曲', type: '吉', color: '#389e0d' }, '亥': { star: '武曲', type: '吉', color: '#389e0d' },
    '甲': { star: '貪狼', type: '吉', color: '#389e0d' }, '癸': { star: '貪狼', type: '吉', color: '#389e0d' }, '申': { star: '貪狼', type: '吉', color: '#389e0d' },
    '丑': { star: '祿存', type: '凶', color: '#8c8c8c' }, '未': { star: '祿存', type: '凶', color: '#8c8c8c' }, '乾': { star: '祿存', type: '凶', color: '#8c8c8c' },
    '寅': { star: '廉貞', type: '凶', color: '#d46b08' }, '庚': { star: '廉貞', type: '凶', color: '#d46b08' }, '丁': { star: '廉貞', type: '凶', color: '#d46b08' },
    '卯': { star: '文曲', type: '凶', color: '#c41d7f' }, '酉': { star: '文曲', type: '凶', color: '#c41d7f' }, '午': { star: '文曲', type: '凶', color: '#c41d7f' },
    '子': { star: '左輔', type: '吉', color: '#595959' }, '戌': { star: '左輔', type: '吉', color: '#595959' }, '巳': { star: '左輔', type: '吉', color: '#595959' }
};

const SHOU_SHAN_CHU_SHA = { '子': '出煞', '午': '出煞', '卯': '收山', '酉': '收山', '乾': '收山', '坤': '出煞', '艮': '出煞', '巽': '收山', '壬': '收山', '丙': '收山', '寅': '出煞', '申': '出煞', '巳': '收山', '亥': '收山', '辰': '出煞', '戌': '出煞', '丑': '出煞', '未': '出煞', '甲': '收山', '庚': '收山', '乙': '出煞', '辛': '出煞', '丁': '出煞', '癸': '出煞' };

const DA_GUA_64 = [
    {n:'復',q:1,y:8},{n:'頤',q:1,y:3},{n:'屯',q:3,y:4},{n:'益',q:8,y:9},{n:'震',q:8,y:8},{n:'噬嗑',q:8,y:3},{n:'隨',q:4,y:7},{n:'無妄',q:2,y:2},
    {n:'明夷',q:2,y:3},{n:'賁',q:2,y:8},{n:'既濟',q:9,y:9},{n:'家人',q:4,y:4},{n:'豐',q:4,y:8},{n:'離',q:3,y:3},{n:'革',q:3,y:4},{n:'同人',q:7,y:7},
    {n:'臨',q:1,y:7},{n:'損',q:1,y:2},{n:'節',q:3,y:9},{n:'中孚',q:8,y:4},{n:'歸妹',q:8,y:7},{n:'睽',q:8,y:2},{n:'兌',q:4,y:1},{n:'履',q:2,y:6},
    {n:'泰',q:1,y:9},{n:'大畜',q:1,y:4},{n:'需',q:3,y:6},{n:'小畜',q:8,y:1},{n:'大壯',q:2,y:9},{n:'大有',q:2,y:4},{n:'夬',q:4,y:6},{n:'乾',q:9,y:1},
    {n:'姤',q:9,y:8},{n:'大過',q:9,y:3},{n:'鼎',q:7,y:4},{n:'恒',q:2,y:9},{n:'巽',q:2,y:8},{n:'井',q:2,y:3},{n:'蠱',q:6,y:7},{n:'升',q:8,y:2},
    {n:'訟',q:8,y:3},{n:'困',q:8,y:8},{n:'未濟',q:1,y:9},{n:'解',q:6,y:4},{n:'渙',q:6,y:8},{n:'坎',q:7,y:3},{n:'蒙',q:7,y:4},{n:'師',q:3,y:7},
    {n:'遯',q:9,y:7},{n:'咸',q:9,y:2},{n:'旅',q:7,y:9},{n:'小過',q:2,y:4},{n:'漸',q:2,y:7},{n:'蹇',q:2,y:2},{n:'艮',q:6,y:1},{n:'謙',q:8,y:6},
    {n:'否',q:9,y:9},{n:'萃',q:9,y:4},{n:'晉',q:7,y:6},{n:'豫',q:2,y:1},{n:'觀',q:8,y:9},{n:'比',q:8,y:4},{n:'剝',q:6,y:6},{n:'坤',q:1,y:1}
];

const STAR_COMBINATIONS = {
    '1-1': { title: '坎宮重疊', text: '雙一雙水，主漂泊、桃花、文書往來。吉則利文貴，凶則淫蕩漂流。', source: '玄空秘旨' },
    // ... (為了節省篇幅，保留原有的星組數據，此處省略中間部分，但實際代碼中請保留完整) ...
    '9-9': { title: '火曜連珠', text: '目疾、火災，吉則大發文名。', source: '玄機賦' },
};

// --- 工具函數 ---
const normalizeAngle = (angle) => { let a = angle % 360; return a < 0 ? a + 360 : a; };

const getMountain = (degree) => {
    const normalized = normalizeAngle(degree);
    let minDiff = 360; 
    let target = MOUNTAINS[0];
    for (let m of MOUNTAINS) {
        let diff = Math.abs(normalizeAngle(m.angle - normalized));
        if (diff > 180) diff = 360 - diff; 
        if (diff < minDiff) { minDiff = diff; target = m; }
    }
    return target;
};

const getGuaFromStr = (str) => {
    if (DIRECTION_MAP[str] !== undefined) return str;
    const found = MOUNTAINS.find(m => m.name === str);
    return found ? found.gua : null;
};

const getStarCombination = (mtStar, faceStar) => {
    const key1 = `${mtStar}-${faceStar}`;
    const key2 = `${faceStar}-${mtStar}`;
    if (STAR_COMBINATIONS[key1]) return STAR_COMBINATIONS[key1];
    if (STAR_COMBINATIONS[key2]) return STAR_COMBINATIONS[key2];
    return { title: '一般組合', text: '無特殊吉凶克應', source: '一般論斷' };
};

const getDaGua = (degree) => {
    const normalized = normalizeAngle(degree);
    const offsetDegree = normalizeAngle(normalized + 2.8125);
    const index = Math.floor(offsetDegree / 5.625);
    const safeIndex = index >= 64 ? 0 : index;
    return DA_GUA_64[safeIndex];
};

const findAuspsiciousDirections = (facingGua) => {
    const suggestions = [];
    const faceQ = facingGua.q; 
    DA_GUA_64.forEach((targetGua, idx) => {
        if (targetGua.n === facingGua.n) return;
        const targetQ = targetGua.q;
        const relations = [];
        if (targetQ === faceQ) relations.push('一卦純清');
        if (targetQ + faceQ === 10) relations.push('合十');
        if (Math.abs(targetQ - faceQ) === 5) relations.push('合生成');
        if (relations.length > 0) {
            const centerDegree = (idx * 5.625) - 2.8125;
            const startDegree = normalizeAngle(centerDegree - 2.8125);
            const endDegree = normalizeAngle(centerDegree + 2.8125);
            const mt = getMountain(centerDegree);
            suggestions.push({
                gua: targetGua,
                relations: relations,
                location: { mountain: mt.name, range: `${startDegree.toFixed(1)}°~${endDegree.toFixed(1)}°` }
            });
        }
    });
    return suggestions;
};

// --- 三元納氣法邏輯 ---
const calculateNaQi = (period, guaName) => {
    const p = Number(period);
    const guaMap = { '坎': 1, '坤': 2, '震': 3, '巽': 4, '乾': 6, '兌': 7, '艮': 8, '離': 9 };
    const doorNum = guaMap[guaName];
    if (p === 5) return { type: '平', text: '五運寄宮', color: '#fa8c16' };
    const isUpperEra = p >= 1 && p <= 4;
    const isDoorUpper = doorNum >= 1 && doorNum <= 4;
    const resultProsperous = { type: '大吉', text: '當運大發', color: '#389e0d', sub: '同元同運' };
    const resultFuture = { type: '吉', text: '未來大發', color: '#13c2c2', sub: '同元未運' };
    const resultDeclining = { type: '凶', text: '運過衰退', color: '#cf1322', sub: '同元失運/異元' };
    if (isUpperEra) {
        if (!isDoorUpper) return resultDeclining;
        else {
            if (doorNum === p) return resultProsperous;
            if (doorNum > p) return resultFuture;
            return resultDeclining;
        }
    } else {
        if (isDoorUpper) return resultDeclining;
        else {
            if (doorNum === p) return resultProsperous;
            if (doorNum > p) return resultFuture;
            return resultDeclining;
        }
    }
};

// --- 商戰核心邏輯 ---
const POSTERIOR_ELEMENTS = { '坎': '水', '艮': '土', '震': '木', '巽': '木', '離': '火', '坤': '土', '兌': '金', '乾': '金' };
const HE_TU_ELEMENTS = { '坎': '水', '坤': '火', '震': '木', '巽': '金', '中': '土', '乾': '水', '兌': '火', '艮': '木', '離': '金' };
const SHOP_NUM_ELEMENTS = { 1: '水', 6: '水', 2: '火', 7: '火', 3: '木', 8: '木', 4: '金', 9: '金', 5: '土', 10: '土', 0: '土' }; // 0處理

const getFiveElementRelation = (me, other) => {
    if (me === other) return { type: '吉', text: '吉', color: '#13c2c2' };
    const relations = {
        '水': { gen: '木', ctrl: '火' }, '火': { gen: '土', ctrl: '金' },
        '土': { gen: '金', ctrl: '水' }, '金': { gen: '水', ctrl: '木' },
        '木': { gen: '火', ctrl: '土' }
    };
    if (relations[me].ctrl === other) return { type: '大吉', text: '財旺', color: '#fa8c16' };
    if (relations[other].gen === me) return { type: '吉', text: '吉', color: '#13c2c2' };
    if (relations[me].gen === other) return { type: '凶', text: '凶', color: '#cf1322' };
    if (relations[other].ctrl === me) return { type: '凶', text: '凶', color: '#cf1322' };
    return { type: '平', text: '平', color: '#999' };
};

// --- 核心計算 ---
const calculateEverything = (degree, period, year, month = 1) => {
    const safePeriod = Number(period) || 9;
    const safeYear = Number(year) || new Date().getFullYear();
    const safeMonth = Number(month) || 1;
    const facingMt = getMountain(degree); 
    const sittingDegree = normalizeAngle(degree + 180);
    const sittingMt = getMountain(sittingDegree); 

    let baseGrid = new Array(9).fill(0);
    let curr = safePeriod;
    for (let i = 0; i < 9; i++) { baseGrid[LUOSHU_PATH[i]] = curr; curr = (curr % 9) + 1; }

    const sitIndex = DIRECTION_MAP[sittingMt.gua];
    const faceIndex = DIRECTION_MAP[facingMt.gua];
    const sitBaseStar = baseGrid[sitIndex]; 
    const faceBaseStar = baseGrid[faceIndex]; 

    const getFlightDirection = (starNum, mountainYuan) => {
        let refStar = (starNum === 5) ? safePeriod : starNum;
        return YIN_YANG_MAP[refStar] ? YIN_YANG_MAP[refStar][mountainYuan] : 1; 
    };

    const sitDir = getFlightDirection(sitBaseStar, sittingMt.yuan);
    const faceDir = getFlightDirection(faceBaseStar, facingMt.yuan);

    let mtGrid = new Array(9).fill(0);
    curr = sitBaseStar;
    for (let i = 0; i < 9; i++) {
        mtGrid[LUOSHU_PATH[i]] = curr;
        if (sitDir === 1) curr++; else curr--;
        if (curr > 9) curr = 1; if (curr < 1) curr = 9;
    }

    let faceGrid = new Array(9).fill(0);
    curr = faceBaseStar;
    for (let i = 0; i < 9; i++) {
        faceGrid[LUOSHU_PATH[i]] = curr;
        if (faceDir === 1) curr++; else curr--;
        if (curr > 9) curr = 1; if (curr < 1) curr = 9;
    }

    let annualBaseStar = (11 - (safeYear % 9)) % 9;
    if (annualBaseStar === 0) annualBaseStar = 9;
    let annualGrid = new Array(9).fill(0);
    curr = annualBaseStar;
    for (let i = 0; i < 9; i++) { annualGrid[LUOSHU_PATH[i]] = curr; curr = (curr % 9) + 1; }

    const yearBranchIdx = safeYear % 12;
    let monthlyStartStar = 0;
    if ([4, 10, 7, 1].includes(yearBranchIdx)) monthlyStartStar = 8;
    else if ([8, 2, 5, 11].includes(yearBranchIdx)) monthlyStartStar = 5;
    else monthlyStartStar = 2;
    let monthlyCenter = (monthlyStartStar - (safeMonth - 1)) % 9;
    if (monthlyCenter <= 0) monthlyCenter += 9;
    let monthlyGrid = new Array(9).fill(0);
    curr = monthlyCenter;
    for (let i = 0; i < 9; i++) { monthlyGrid[LUOSHU_PATH[i]] = curr; curr = (curr % 9) + 1; }

    let sanShaGua = '';
    if ([0, 4, 8].includes(yearBranchIdx)) sanShaGua = '離';
    else if ([6, 10, 2].includes(yearBranchIdx)) sanShaGua = '坎';
    else if ([9, 1, 5].includes(yearBranchIdx)) sanShaGua = '震';
    else sanShaGua = '兌';

    let liShiGua = '';
    if ([0, 4, 8].includes(yearBranchIdx)) liShiGua = '艮';
    else if ([3, 7, 11].includes(yearBranchIdx)) liShiGua = '坤';
    else if ([6, 10, 2].includes(yearBranchIdx)) liShiGua = '乾';
    else liShiGua = '巽';

    const TAI_SUI_MAPPING = { 4: '坎', 5: '艮', 6: '艮', 7: '震', 8: '巽', 9: '巽', 10: '離', 11: '坤', 0: '坤', 1: '兌', 2: '乾', 3: '乾' };
    const taiSuiGua = TAI_SUI_MAPPING[yearBranchIdx];
    const SUI_PO_MAPPING = { '坎': '離', '艮': '坤', '震': '兌', '巽': '乾', '離': '坎', '坤': '艮', '兌': '震', '乾': '巽' };
    const suiPoGua = SUI_PO_MAPPING[taiSuiGua];
    const wuHuangIndex = annualGrid.findIndex(n => n === 5);
    const dirNames = ["巽", "離", "坤", "震", "中", "兌", "艮", "坎", "乾"];
    const wuHuangGua = dirNames[wuHuangIndex];

    const sitPalaceMtStar = mtGrid[sitIndex];
    const sitPalaceFaceStar = faceGrid[sitIndex];
    const facePalaceMtStar = mtGrid[faceIndex];
    const facePalaceFaceStar = faceGrid[faceIndex];
    const p = safePeriod;

    let chartType = '特殊格局';
    if (sitPalaceMtStar === p && facePalaceFaceStar === p) chartType = '旺山旺向';
    else if (facePalaceMtStar === p && sitPalaceFaceStar === p) chartType = '上山下水';
    else if (facePalaceMtStar === p && facePalaceFaceStar === p) chartType = '雙星到向';
    else if (sitPalaceMtStar === p && sitPalaceFaceStar === p) chartType = '雙星到坐';

    const sha8 = EIGHT_KILLINGS[sittingMt.gua] || '無';
    let huangQuan = null;
    const yq = YELLOW_SPRING[facingMt.name] || YELLOW_SPRING[facingMt.gua];
    if (yq) huangQuan = Array.isArray(yq) ? yq.join('/') : yq;
    const waterMethod = EAR_LATE_WATER[sittingMt.gua] || {early:'-', late:'-'};
    
    const dirSequence = [7, 6, 3, 0, 1, 2, 5, 8]; 
    const currentFaceGua = facingMt.gua;
    const seqIdx = dirSequence.findIndex(d => Object.keys(DIRECTION_MAP).find(key => DIRECTION_MAP[key] === d) === currentFaceGua);
    let chengMen = { main: '計算中', sub: '計算中' };
    if (seqIdx !== -1) {
        const prevIdx = (seqIdx - 1 + 8) % 8;
        const nextIdx = (seqIdx + 1) % 8;
        const getGuaName = (idx) => Object.keys(DIRECTION_MAP).find(key => DIRECTION_MAP[key] === idx);
        chengMen.sub = getGuaName(dirSequence[prevIdx]); 
        chengMen.main = getGuaName(dirSequence[nextIdx]);
    }

    const fanGuaCfg = FAN_GUA_CONFIG[sittingMt.gua] || { mt: '無', water: '無' };
    const mountainDragon = { gua: fanGuaCfg.mt, mountains: NA_JIA[fanGuaCfg.mt] || [] };
    const waterDragon = { gua: fanGuaCfg.water, mountains: NA_JIA[fanGuaCfg.water] || [] };
    const baZhaiMap = BA_ZHAI_MAPPING[sittingMt.gua] || {};
    const faceDaGua = getDaGua(degree);
    const sitDaGua = getDaGua(sittingDegree);
    const daGuaSuggestions = findAuspsiciousDirections(faceDaGua);

    return {
        sitting: sittingMt, facing: facingMt,
        baseGrid, mtGrid, faceGrid, annualGrid, monthlyGrid,
        period: safePeriod, year: safeYear, month: safeMonth,
        chartType,
        advanced: {
            sha8, huangQuan, waterMethod, chengMen,
            mountainDragon, waterDragon, baZhaiMap,
            daGua: { sit: sitDaGua, face: faceDaGua, suggestions: daGuaSuggestions },
            yearlyAfflictions: { sanSha: sanShaGua, liShi: liShiGua, wuHuang: wuHuangGua, taiSui: taiSuiGua, suiPo: suiPoGua }
        }
    };
};

// =========================================================================
// 👇 PART B: 視圖組件 (UI Views)
// =========================================================================

// 1. 商戰彈窗 (CommercialView)
const CommercialView = ({ isOpen, onClose, sittingMt, facingMt }) => {
    const [shopSector, setShopSector] = useState(null); 
    const [shopTotal, setShopTotal] = useState(10); 
    const [shopIndex, setShopIndex] = useState(1);
    
    if (!isOpen) return null;

    const handleTotalChange = (e) => {
        const val = e.target.value;
        if (val === '') { setShopTotal(''); return; }
        const newTotal = parseInt(val, 10);
        if (isNaN(newTotal) || newTotal < 1) return;
        setShopTotal(newTotal);
        if (typeof shopIndex === 'number' && shopIndex > newTotal) setShopIndex(newTotal);
    };

    const handleIndexChange = (e) => {
        const val = e.target.value;
        if (val === '') { setShopIndex(''); return; }
        const newIndex = parseInt(val, 10);
        if (isNaN(newIndex) || newIndex < 1) return;
        const currentTotal = Number(shopTotal) || 1;
        setShopIndex(newIndex > currentTotal ? currentTotal : newIndex);
    };

    const safeTotal = Number(shopTotal) || 0;
    const safeIndex = Number(shopIndex) || 0;
    const mallElement = POSTERIOR_ELEMENTS[sittingMt.gua];
    const sectorElement = shopSector ? HE_TU_ELEMENTS[shopSector] : null; 
    const mallRelation = (mallElement && sectorElement) ? getFiveElementRelation(sectorElement, mallElement) : null;
    const hasValidInput = safeTotal > 0 && safeIndex > 0;
    const myNumKey = safeIndex > 0 ? safeIndex % 10 || 10 : 0; 
    const myElementText = SHOP_NUM_ELEMENTS[myNumKey] || '-';
    const corridorVal = safeTotal - safeIndex + 1;
    const corridorKey = corridorVal > 0 ? corridorVal % 10 || 10 : 0;
    const corridorElementText = SHOP_NUM_ELEMENTS[corridorKey] || '-';
    const corridorRelation = (hasValidInput && myElementText !== '-' && corridorElementText !== '-') ? getFiveElementRelation(myElementText, corridorElementText) : null;
    const guas = ['巽', '離', '坤', '震', '中', '兌', '艮', '坎', '乾'];

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }} onClick={onClose}>
            <div style={{ background: '#f5f5f5', width: '100%', maxWidth: '450px', borderRadius: '16px', padding: '20px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:'1px solid #ddd', paddingBottom:'10px'}}>
                    <h3 style={{margin:0, display:'flex', alignItems:'center', gap:'8px', color:'#333'}}><Briefcase size={20}/> 商戰揀舖要訣</h3>
                    <button onClick={onClose} style={{border:'none', background:'none', cursor:'pointer'}}><X size={24} color="#666"/></button>
                </div>
                <div style={{background:'white', borderRadius:'10px', padding:'16px', marginBottom:'16px'}}>
                    <div style={{fontSize:'15px', fontWeight:'bold', marginBottom:'12px', color:'#096dd9'}}>大廈坐向 vs 舖位宮位</div>
                    <div style={{marginBottom:'10px', fontSize:'14px'}}>大廈坐{sittingMt.name}向{facingMt.name}</div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', marginBottom:'12px'}}>
                        {guas.map(g => (
                            <button key={g} onClick={() => setShopSector(g)} style={{ padding:'12px', borderRadius:'6px', border:`1px solid ${shopSector === g ? '#096dd9' : '#ddd'}`, background: shopSector === g ? '#e6f7ff' : 'white', color: shopSector === g ? '#096dd9' : '#333', cursor:'pointer', fontWeight: shopSector === g ? 'bold' : 'normal', fontSize: '16px' }}>{g}</button>
                        ))}
                    </div>
                    {mallRelation && (
                        <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'6px', borderLeft:`4px solid ${mallRelation.color}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontSize:'13px'}}>此舖宮位</div><div style={{fontWeight:'bold', color:mallRelation.color, fontSize:'16px'}}>{mallRelation.text}</div>
                        </div>
                    )}
                </div>
                <div style={{background:'white', borderRadius:'10px', padding:'16px', marginBottom:'16px'}}>
                    <div style={{fontSize:'15px', fontWeight:'bold', marginBottom:'12px', color:'#722ed1'}}>舖位序號</div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'16px'}}>
                        <div><label style={{display:'block', fontSize:'12px', color:'#666', marginBottom:'4px'}}>總舖位數</label><input type="number" min="1" value={shopTotal} onChange={handleTotalChange} style={{width:'100%', padding:'12px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'16px', boxSizing: 'border-box'}}/></div>
                        <div><label style={{display:'block', fontSize:'12px', color:'#666', marginBottom:'4px'}}>心儀舖位序號</label><input type="number" min="1" max={safeTotal} value={shopIndex} onChange={handleIndexChange} style={{width:'100%', padding:'12px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'16px', boxSizing: 'border-box'}}/></div>
                    </div>
                    {hasValidInput && corridorRelation && (
                        <div style={{background:'#f9f9f9', padding:'10px', borderRadius:'6px', borderLeft:`4px solid ${corridorRelation.color}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontSize:'13px'}}>此舖位數</div><div style={{fontWeight:'bold', color:corridorRelation.color, fontSize:'16px'}}>{corridorRelation.text}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 2. 詳情彈窗 (DetailModal)
const DetailModal = ({ isOpen, onClose, data, facingDaGua }) => {
    if (!isOpen || !data) return null;
    const { mt, face, base, annual, monthly, guaName, combination, baZhaiStar } = data;
    const baZhaiDetail = baZhaiStar ? BA_ZHAI_INFO[baZhaiStar] : null;
    const palaceMountains = MOUNTAINS.filter(m => m.gua === guaName);

    const getDaGuaRelations = (targetGua, refGua) => {
        const rels = [];
        if (targetGua.y === refGua.y) rels.push({t:'同元一氣', c:'#722ed1'});
        if (targetGua.q + refGua.q === 10) rels.push({t:'卦氣合十', c:'#c41d7f'});
        if (targetGua.y + refGua.y === 10) rels.push({t:'卦運合十', c:'#eb2f96'});
        if (Math.abs(targetGua.q - refGua.q) === 5) rels.push({t:'卦氣生成', c:'#13c2c2'});
        return rels;
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={onClose}>
            <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '24px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer'}}><X size={24} color="#666"/></button>
                <h3 style={{marginTop: 0, fontSize: '20px', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px'}}>{guaName}宮詳解</h3>
                <div style={{display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0', alignItems:'center'}}>
                    <div style={{textAlign: 'center'}}><div style={{fontSize: '32px', fontWeight: 'bold', color: '#333'}}>{mt}</div><div style={{fontSize: '14px', fontWeight: 'bold', color: '#722ed1'}}>(年{annual})</div></div>
                    <div style={{textAlign: 'center'}}><div style={{fontSize: '24px', fontWeight: 'bold', color: '#999'}}>{base}</div></div>
                    <div style={{textAlign: 'center'}}><div style={{fontSize: '32px', fontWeight: 'bold', color: '#d32f2f'}}>{face}</div><div style={{fontSize: '14px', fontWeight: 'bold', color: '#fa8c16'}}>(月{monthly})</div></div>
                </div>
                <div style={{background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '16px'}}>
                    <div style={{fontSize: '16px', fontWeight: 'bold', color: '#096dd9', marginBottom: '4px'}}>🚀 {combination.title}</div>
                    <div style={{fontSize: '14px', color: '#333', marginBottom: '10px'}}>{combination.text}</div>
                    <div style={{fontSize: '12px', color: '#888', fontStyle: 'italic'}}>📖 {combination.source}</div>
                </div>
                {baZhaiDetail && (
                    <div style={{background: '#fff0f6', padding: '16px', borderRadius: '8px', border: `1px solid ${baZhaiDetail.color}`, marginBottom: '16px'}}>
                        <div style={{fontSize: '16px', fontWeight: 'bold', color: baZhaiDetail.color}}>🏠 {baZhaiStar} <span style={{fontSize: '12px', background: baZhaiDetail.color, color: 'white', padding: '2px 6px', borderRadius: '4px'}}>{baZhaiDetail.star}</span></div>
                        <div style={{fontSize: '14px', color: '#333'}}>{baZhaiDetail.desc}</div>
                    </div>
                )}
                {/* 簡單顯示玄空大卦 */}
                <div style={{background: '#f6ffed', padding: '16px', borderRadius: '8px', border: '1px solid #b7eb8f'}}>
                    <div style={{fontSize: '16px', fontWeight: 'bold', color: '#389e0d', marginBottom: '8px'}}>☯️ 玄空大卦</div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                        {palaceMountains.map(pm => {
                            const mountainGua = getDaGua(pm.angle);
                            const relations = getDaGuaRelations(mountainGua, facingDaGua);
                            return (
                                <div key={pm.name} style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px dashed #d9d9d9', paddingBottom:'4px'}}>
                                    <div style={{fontWeight:'bold', color:'#333'}}>{pm.name}山</div>
                                    <div style={{fontSize:'12px', color:'#555'}}>{mountainGua.n}</div>
                                    <div style={{display:'flex', gap:'2px'}}>{relations.length > 0 ? relations.map((r, idx) => <span key={idx} style={{fontSize:'10px', background:r.c, color:'white', padding:'1px 3px', borderRadius:'3px'}}>{r.t}</span>) : <span style={{fontSize:'10px', color:'#999'}}>無</span>}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3. 羅庚視圖 (CompassView)
const CompassView = ({ heading, setHeading, isFrozen, setIsFrozen, onAnalyze }) => {
    const requestAccess = () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => { if (response === 'granted') window.addEventListener('deviceorientation', handleOrientation); })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    };

    const handleOrientation = (e) => {
        if (isFrozen) return;
        let compass = e.webkitCompassHeading || (e.alpha ? 360 - e.alpha : 0);
        setHeading(compass);
    };

    useEffect(() => { return () => window.removeEventListener('deviceorientation', handleOrientation); }, [isFrozen]);    
    
    // 防呆：確保 MOUNTAINS 有資料，否則避免報錯
    const safeHeading = heading || 0;
    const facingMt = getMountain(safeHeading);
    const sittingMt = getMountain(safeHeading + 180);

    return (
        <div style={{
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            // background: '#222', // 移除這裡的背景，改由外層容器控制，避免重複渲染
            color: '#fff', 
            position: 'relative', 
            overflow: 'hidden', 
            width: '100%',     // 確保寬度佔滿
            height: '100%'     // 確保高度佔滿
        }}>
             {/* 修正重點：
                原本 top: 20 會被 Header (高度約 60px) 擋住。
                改為 top: 100，確保按鈕出現在 Header 下方。
             */}
             {!isFrozen && (
                <button onClick={requestAccess} style={{
                    position:'absolute', 
                    top: 100, // <--- 改這裡 (原本是 20)
                    padding:'8px 16px', 
                    background:'rgba(255,255,255,0.2)', 
                    color:'#fff', 
                    border:'none', 
                    borderRadius:'20px', 
                    zIndex: 10,
                    cursor: 'pointer'
                }}>
                   <Compass size={14} style={{display:'inline', marginRight:5}}/> 啟用羅庚
                </button>
            )}

            {/* 十字線 (確保有 zIndex 避免被背景吃掉) */}
            <div style={{position:'absolute', width:'100%', height:'1px', background:'red', zIndex:5, opacity:0.6, pointerEvents: 'none'}}></div>
            <div style={{position:'absolute', width:'1px', height:'100%', background:'red', zIndex:5, opacity:0.6, pointerEvents: 'none'}}></div>

            {/* 羅盤本體 */}
            <div style={{ 
                width: '80vw', height: '80vw', maxWidth:'320px', maxHeight:'320px', 
                borderRadius: '50%', border: '6px solid #8B4513', background: '#e0c38c', 
                transform: `rotate(${-safeHeading}deg)`, 
                transition: isFrozen ? 'none' : 'transform 0.1s linear', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)', 
                position: 'relative',
                zIndex: 1 // 確保羅盤層級正確
            }}>
                 {MOUNTAINS.map((m, i) => (
                    <div key={i} style={{ position: 'absolute', top: '10px', left: '50%', height: '45%', width: '1px', transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${m.angle}deg)` }}>
                        <span style={{display:'block', fontSize:'14px', color:'#333', fontWeight:'bold', transform:'rotate(180deg)'}}>{m.name}</span>
                    </div>
                 ))}
                 <div style={{width:'20%', height:'20%', background:'white', borderRadius:'50%', border:'2px solid red'}}></div>
            </div>

            {/* 下方資訊區 */}
            <div style={{marginTop: '30px', textAlign:'center', zIndex: 10, paddingBottom: '20px'}}>
                <div style={{fontSize:'48px', fontWeight:'bold', fontFamily:'monospace', color: '#ffd700'}}>{safeHeading.toFixed(1)}°</div>
                <div style={{fontSize: '24px', fontWeight:'bold', marginTop:'5px'}}>{sittingMt.gua}卦 - {sittingMt.name}山{facingMt.name}向</div>
                
                <div style={{display:'flex', gap:'20px', justifyContent:'center', marginTop:'20px'}}>
                    <button onClick={() => setIsFrozen(!isFrozen)} style={{padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', background: isFrozen ? THEME.red : THEME.blue, color:'white'}}>
                        {isFrozen ? <Unlock size={18}/> : <Lock size={18}/>} {isFrozen ? "解鎖" : "定格"}
                    </button>
                    {isFrozen && (
                        <button onClick={onAnalyze} style={{padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', background: THEME.green, color:'white'}}>
                            <RefreshCw size={18}/> 排盤
                        </button>
                    )}
                </div>
                
                {!isFrozen && (
                    <div style={{marginTop:'20px'}}>
                        <input type="range" min="0" max="360" value={safeHeading} onChange={e=>setHeading(Number(e.target.value))} style={{width:'200px', opacity: 0.5}}/>
                    </div>
                )}
            </div>
        </div>
    );
};

// 4. 排盤視圖 (ChartView)
const ChartView = ({ heading, period, setPeriod, year, setYear, month, setMonth, onSave }) => {
    const [selectedSector, setSelectedSector] = useState(null);
    const [naQiDoor, setNaQiDoor] = useState(null); 
    const [showAnnual, setShowAnnual] = useState(true);
    const [showMonthly, setShowMonthly] = useState(true);
    const [showCommercial, setShowCommercial] = useState(false);
    
    const data = useMemo(() => {
        try { return calculateEverything(heading, period, year, month); } catch (e) { return null; }
    }, [heading, period, year, month]);

    useEffect(() => { if (data) setNaQiDoor(data.facing.gua); }, [data]);

    if (!data) return <div style={{padding:20, color:'red'}}>資料計算異常。</div>;

    const gridOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8]; 
    const dirNames = ["巽", "離", "坤", "震", "中", "兌", "艮", "坎", "乾"];
    const naQiGuas = ["坎", "坤", "震", "巽", "乾", "兌", "艮", "離"];
    const cardStyle = { background: THEME.white, borderRadius:'12px', padding:'16px', marginBottom:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' };
    const sectionTitle = { fontSize:'15px', fontWeight:'bold', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px', color:'#333', borderBottom:'2px solid #f0f0f0', paddingBottom:'6px' };
    const tagStyle = { fontSize:'10px', padding:'2px 4px', borderRadius:'4px', color:'#fff', fontWeight:'bold', whiteSpace:'nowrap', lineHeight: '1' };

    const getGridTags = (idx) => {
        const dirGua = dirNames[idx]; 
        if (dirGua === '中') return []; 
        const tags = [];
        const { advanced } = data;
        if (dirGua === advanced.waterMethod.early) tags.push({ text: '先天', color: '#096dd9' }); 
        if (dirGua === advanced.waterMethod.late) tags.push({ text: '後天', color: '#389e0d' }); 
        if (dirGua === advanced.chengMen.main) tags.push({ text: '正城', color: '#fa8c16' }); 
        if (advanced.sha8 && getGuaFromStr(advanced.sha8) === dirGua) tags.push({ text: '曜煞', color: '#cf1322' }); 
        return tags;
    };

    const handleSectorClick = (idx) => {
        const guaName = dirNames[idx];
        if (guaName === '中') return; 
        setSelectedSector({
            mt: data.mtGrid[idx], face: data.faceGrid[idx], base: data.baseGrid[idx],
            annual: data.annualGrid[idx], monthly: data.monthlyGrid[idx],
            guaName: guaName, combination: getStarCombination(data.mtGrid[idx], data.faceGrid[idx]),
            baZhaiStar: data.advanced.baZhaiMap[guaName]
        });
    };

    const getBaZhaiDisplay = (idx) => {
        const guaName = dirNames[idx];
        const starName = data.advanced.baZhaiMap[guaName];
        return starName ? { name: starName, color: BA_ZHAI_INFO[starName].color } : null;
    };

    const getYearlyBadges = (idx) => {
        if (!showAnnual) return [];
        const guaName = dirNames[idx];
        const { yearlyAfflictions } = data.advanced;
        const badges = [];
        if (yearlyAfflictions.wuHuang === guaName) badges.push('五黃');
        if (yearlyAfflictions.sanSha === guaName) badges.push('三煞');
        if (yearlyAfflictions.liShi === guaName) badges.push('力士');
        return badges;
    };

    const naQiResult = naQiDoor ? calculateNaQi(period, naQiDoor) : null;

    return (
        <div style={{padding:'16px', paddingBottom:'80px'}}>
             <div style={cardStyle}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <div style={{fontWeight:'bold', fontSize:'18px'}}>{data.sitting.name}山{data.facing.name}向 <span style={{fontSize:'14px', color:'#666', fontWeight:'normal'}}>({data.sitting.gua}/{data.facing.gua})</span></div>
                    <button onClick={() => onSave({id: Date.now(), sitting: data.sitting, facing: data.facing, period: period, year: year})} style={{border:'none', background:'none', color:THEME.blue, display:'flex', alignItems:'center', cursor:'pointer'}}><Save size={18}/> 儲存</button>
                </div>
                
                <div style={{display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px'}}>
                    <label style={{fontSize:'14px'}}>運: <select value={period} onChange={e => setPeriod(Number(e.target.value))} style={{border:'1px solid #ddd'}}>{[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
                    <label style={{fontSize:'14px'}}>年: <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{width:'55px', border:'1px solid #ddd'}}/></label>
                    <label style={{fontSize:'14px'}}>月: <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{border:'1px solid #ddd'}}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
                </div>
                <div style={{display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap'}}>
                     <button onClick={() => setShowAnnual(!showAnnual)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', border: '1px solid #722ed1', background: showAnnual ? '#f9f0ff' : 'white', color: '#722ed1'}}>{showAnnual ? <Eye size={12}/> : <EyeOff size={12}/>} 流年</button>
                     <button onClick={() => setShowMonthly(!showMonthly)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', border: '1px solid #fa8c16', background: showMonthly ? '#fff7e6' : 'white', color: '#fa8c16'}}>{showMonthly ? <Eye size={12}/> : <EyeOff size={12}/>} 流月</button>
                     <button onClick={() => setShowCommercial(true)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', background: '#333', color: 'white', border:'none', marginLeft:'auto'}}><Briefcase size={12}/> 商戰</button>
                </div>
            </div>

            <div style={{...cardStyle, padding:'4px', background:'#8B4513'}}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', aspectRatio:'1/1'}}>
                    {gridOrder.map((idx) => {
                        const tags = getGridTags(idx);
                        const baZhai = getBaZhaiDisplay(idx); 
                        const yearlyBadges = getYearlyBadges(idx);
                        return (
                            <div key={idx} onClick={() => handleSectorClick(idx)} style={{ background: '#fffcf5', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow:'hidden', cursor: 'pointer', transition: 'background 0.2s' }}>
                                <div style={{position:'absolute', top:'4px', left:'6px', display:'flex', flexDirection:'column', alignItems:'center'}}>
                                    <div style={{fontSize:'20px', fontWeight:'900', color:'#ff0000ff', lineHeight:'1'}}>{data.mtGrid[idx]}</div>
                                    {showAnnual && <div style={{fontSize:'14px', fontWeight:'bold', color:'#722ed1'}}>{data.annualGrid[idx]}</div>}
                                </div>
                                <div style={{position:'absolute', top:'4px', right:'6px', display:'flex', flexDirection:'column', alignItems:'center'}}>
                                    <div style={{fontSize:'20px', fontWeight:'900', color:'#1500ffff', lineHeight:'1'}}>{data.faceGrid[idx]}</div>
                                    {showMonthly && <div style={{fontSize:'14px', fontWeight:'bold', color:'#fa8c16'}}>{data.monthlyGrid[idx]}</div>}
                                </div>
                                <div style={{fontSize:'36px', fontWeight:'bold', color:'#e0e0e0', marginTop:'-10px'}}>{data.baseGrid[idx]}</div>
                                {idx !== 4 && (
                                    <>
                                        {yearlyBadges.length > 0 && <div style={{position:'absolute', top:'40%', right:'2px', display:'flex', flexDirection:'column', gap:'1px'}}>{yearlyBadges.map(b => <span key={b} style={{fontSize:'9px', background: b==='五黃'||b==='三煞'?'#cf1322':'#d48806', color:'white', borderRadius:'2px', padding:'0 2px'}}>{b}</span>)}</div>}
                                        <div style={{position:'absolute', bottom:'2px', width:'100%', display:'flex', flexDirection:'column', alignItems:'center'}}>
                                            <div style={{display:'flex', gap:'1px', flexWrap:'wrap', justifyContent:'center', width:'95%'}}>{tags.map((t, i) => <span key={i} style={{...tagStyle, background: t.color}}>{t.text}</span>)}</div>
                                            <div style={{fontSize:'12px', color:'#888', fontWeight:'bold'}}>{dirNames[idx]}</div>
                                        </div>
                                    </>
                                )}
                                {baZhai && <div style={{position: 'absolute', bottom: '4px', right: '4px', fontSize: '11px', fontWeight: 'bold', color: baZhai.color, background: 'rgba(255,255,255,0.8)', padding: '1px 3px', borderRadius: '4px'}}>{baZhai.name}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={cardStyle}>
                <div style={{...sectionTitle, color:'#c41d7f'}}>⚠️ 凶煞警示</div>
                <div style={{fontSize:'14px', display:'flex', flexDirection:'column', gap:'4px'}}>
                     {showAnnual && <div style={{color:'#cf1322'}}>流年凶方: 五黃({data.advanced.yearlyAfflictions.wuHuang}) / 三煞({data.advanced.yearlyAfflictions.sanSha})</div>}
                     <div>龍上八煞: 忌{data.advanced.sha8}方</div>
                     <div>八路黃泉: {data.advanced.huangQuan ? `忌${data.advanced.huangQuan}方` : '無'}</div>
                </div>
            </div>

            <div style={cardStyle}>
                <div style={{...sectionTitle, color:'#096dd9'}}>💨 三元納氣 (門/窗)</div>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center', marginBottom:'12px'}}>
                    {naQiGuas.map(gua => <button key={gua} onClick={() => setNaQiDoor(gua)} style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid #ddd', background: naQiDoor === gua ? '#1890ff' : 'white', color: naQiDoor === gua ? 'white' : '#333' }}>{gua}</button>)}
                </div>
                {naQiResult && (
                    <div style={{ background: naQiResult.type.includes('吉') ? '#f6ffed' : '#fff1f0', border: `1px solid ${naQiResult.color}`, borderRadius:'8px', padding:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div><div style={{fontSize:'12px', color:'#666'}}>納氣：<span style={{fontWeight:'bold'}}>{naQiDoor}方</span></div><div style={{fontSize:'18px', fontWeight:'bold', color: naQiResult.color}}>{naQiResult.text}</div></div>
                        <DoorOpen size={24} color={naQiResult.color}/>
                    </div>
                )}
            </div>

            <AdBanner />

            <CommercialView isOpen={showCommercial} onClose={() => setShowCommercial(false)} sittingMt={data.sitting} facingMt={data.facing} />
            <DetailModal isOpen={!!selectedSector} onClose={() => setSelectedSector(null)} data={selectedSector} facingDaGua={data.advanced.daGua.face} />
        </div>
    );
};

// 5. 設定頁 (SettingsView)
const SettingsView = ({ bookmarks, setBookmarks }) => {
    const APP_INFO = { appName: APP_NAME, version: APP_VERSION, about: "專業玄空飛星排盤，結合商戰與三元納氣。" };
    return (
        <div style={{ padding: '16px', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>設定</h2>
            </div>
            <WebBackupManager data={bookmarks} onRestore={setBookmarks} prefix="FENGSHUI_BACKUP" />
            <AppInfoCard info={APP_INFO} />
            <BuyMeCoffee />
            <div style={{ marginTop: '24px' }}>
                <button onClick={() => { if(window.confirm('確定清除所有紀錄?')) setBookmarks([]); }} style={{ width: '100%', padding: '12px', backgroundColor: THEME.bgGray, color: THEME.red, border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={16} /> 清除所有紀錄
                </button>
            </div>
        </div>
    );
};

// =========================================================================
// 👇 PART C: 主程式 Shell
// =========================================================================

export default function FengShuiApp() {
    // 1. 安全與狀態
    useProtection(['mrkfengshui.com', 'mrkcompass.vercel.app', 'localhost']);
    const [view, setView] = useState('input'); // input(compass), result(chart), bookmarks, booking, settings
    const [bookmarks, setBookmarks] = useState([]);
    
    // 風水狀態
    const [heading, setHeading] = useState(180); 
    const [isFrozen, setIsFrozen] = useState(false);
    const [period, setPeriod] = useState(9);
    const [year, setYear] = useState(new Date().getFullYear()); 
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    // 2. 底部導航
    const tabs = [
        { id: 'input', label: '羅庚', icon: Compass },
        { id: 'bookmarks', label: '紀錄', icon: Bookmark },
        { id: 'booking', label: '預約', icon: CalendarCheck },
        { id: 'settings', label: '設定', icon: Settings },
    ];

    // 3. 資料讀取
    useEffect(() => {
        const loadData = async () => {
            const { value: savedBk } = await Preferences.get({ key: 'fengshui_bookmarks' });
            if (savedBk) setBookmarks(JSON.parse(savedBk));
        };
        loadData();
    }, []);

    // 4. 動作處理
    const handleAnalyze = () => {
        // 從羅庚進入分析，預設運、年、月
        setPeriod(9);
        setYear(new Date().getFullYear());
        setMonth(new Date().getMonth() + 1);
        setView('result');
    };

    const saveBookmark = async (data) => {
        const newItem = {
            id: data.id,
            title: `${data.sitting.name}山${data.facing.name}向`,
            sub: `${data.period}運 / ${data.year}年`,
            timestamp: new Date().toISOString(),
            raw: data // 儲存原始設定
        };
        const newBk = [newItem, ...bookmarks];
        setBookmarks(newBk);
        await Preferences.set({ key: 'fengshui_bookmarks', value: JSON.stringify(newBk) });
        alert('已儲存紀錄');
    };

    const deleteBookmark = async (id) => {
        const newBk = bookmarks.filter(b => b.id !== id);
        setBookmarks(newBk);
        await Preferences.set({ key: 'fengshui_bookmarks', value: JSON.stringify(newBk) });
    };

    const openBookmark = (item) => {
        const raw = item.raw;
        // 恢復數據
        const m = MOUNTAINS.find(mt => mt.name === raw.sitting.name);
        if (m) {
            // 恢復羅庚角度 (坐山 - 180 = 向首)
            let h = m.angle - 180;
            if (h < 0) h += 360;
            setHeading(h); 
            setPeriod(raw.period);
            setYear(raw.year);
            setView('result');
        }
    };

    return (
        <div style={COMMON_STYLES.fullScreen}>
            {/* Header: 羅庚模式下浮動在上方，其他模式固定 */}
            {view === 'input' ? (
                <div style={{position:'absolute', top:0, left:0, width:'100%', zIndex:20}}>
                     <AppHeader title="元星風水" isPro={true} logoChar={{ main: '羅', sub: '庚' }} />
                </div>
            ) : (
                 <AppHeader title="元星風水" isPro={true} logoChar={{ main: '羅', sub: '庚' }} />
            )}

            <div style={{...COMMON_STYLES.contentArea, background: view === 'input' ? '#222' : THEME.bg}}>
                {view === 'input' && (
                    <CompassView 
                        heading={heading} 
                        setHeading={setHeading} 
                        isFrozen={isFrozen} 
                        setIsFrozen={setIsFrozen} 
                        onAnalyze={handleAnalyze} 
                    />
                )}

                {view === 'result' && (
                    <>
                        {/* 簡易導航列 */}
                        <div style={{padding:'10px 16px', background: THEME.white, borderBottom:`1px solid ${THEME.border}`, display:'flex', alignItems:'center', gap:'8px'}}>
                            <button onClick={() => setView('input')} style={{background:'none', border:'none', display:'flex', alignItems:'center', gap:'4px', cursor:'pointer'}}><ArrowLeft size={20}/> 返回</button>
                            <span style={{fontWeight:'bold'}}>排盤分析</span>
                        </div>
                        <ChartView 
                            heading={heading} setHeading={setHeading}
                            period={period} setPeriod={setPeriod}
                            year={year} setYear={setYear}
                            month={month} setMonth={setMonth}
                            onSave={saveBookmark}
                        />
                    </>
                )}

                {view === 'bookmarks' && (
                    <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                            <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>我的風水紀錄</h2>
                        </div>
                        <BookmarkList 
                            bookmarks={bookmarks}
                            onSelect={openBookmark}
                            onDelete={deleteBookmark}
                        />
                        <div style={{ marginTop: '20px' }}><AdBanner /></div>
                    </div>
                )}

                {view === 'booking' && <BookingSystem apiUrl={API_URL} onNavigate={() => setView('input')} />}

                {view === 'settings' && <SettingsView bookmarks={bookmarks} setBookmarks={setBookmarks} />}
            </div>

            <InstallGuide />
            
            <BottomTabBar 
                tabs={tabs} 
                currentTab={view === 'result' ? 'input' : view} 
                onTabChange={(id) => setView(id)} 
            />
        </div>
    );
}