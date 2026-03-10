// 1. 引入共用 UI 和 工具
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import 'react-calendar/dist/Calendar.css';

import { 
  AdBanner, Adsterra, AdsterraNarrow, AppHeader, AppInfoCard, 
  BookingSystem, BottomTabBar, BookmarkList, BuyMeCoffee, 
  InstallGuide, WebBackupManager, 
  COLORS, THEME, COMMON_STYLES, useProtection,
  STAR_COMBINATIONS
} from '@my-meta/ui';

// 2. 引入 Icon
import { 
  Bookmark, BookOpen, Briefcase,
  Calendar, CalendarCheck, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, Circle, Compass,
  CloudUpload, DoorOpen, Download,
  Edit3, Eye, EyeOff, Info, Grid, Lock, Map, MapPin,
  RefreshCw, RotateCcw, RotateCw, Save, Settings, Sparkles,
  Trash2, Unlock, User, X
} from 'lucide-react';

// =========================================================================
// PART A: 核心數據與邏輯
// =========================================================================
const APP_NAME = "甯博風水";
const APP_VERSION = "v1.3 增加防盜水印";
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";

// 引入 Lunar 庫
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

// 加入流月地支轉換表
const ZHI_TO_NUM = {
    '寅': 1, '卯': 2, '辰': 3, '巳': 4, '午': 5, '未': 6,
    '申': 7, '酉': 8, '戌': 9, '亥': 10, '子': 11, '丑': 12
};

const getPreciseFengShuiDate = (dateObj) => {
    // 安全檢查
    if (!window.Solar) {
        return { year: dateObj.getFullYear(), month: 1, period: 9, yearGanZhi: '', monthGanZhi: '' }; 
    }

    // 1. 建立 Solar 和 Lunar 物件
    const solar = window.Solar.fromDate(dateObj);
    const lunar = solar.getLunar();

    // 2. 獲取精確的「月支」 (基於節氣，精確到分秒)
    const monthZhi = lunar.getMonthZhiExact(); 
    const fsMonth = ZHI_TO_NUM[monthZhi]; 

    // 3. 【關鍵修正】獲取精確的「風水年」 (Solar Year / GanZhi Year)
    // 邏輯：比較「當前日期的精確年干支」與「當年年中(如8月15)的年干支」
    // 如果一樣，代表是當年；如果不一樣，代表處於年初的「立春前」或「立春後但農曆年前」的交界
    
    const gregYear = dateObj.getFullYear();
    
    // A. 獲取當前日期的精確年干支 (基於立春)
    const currentGanZhi = lunar.getYearInGanZhiExact();
    
    // B. 獲取該西曆年「標準」的年干支 (取 8月15日 作為基準，此時絕對穩定位於該干支年內)
    // 這樣可以避免手動維護干支表，直接利用庫的計算
    const standardSolar = window.Solar.fromYmd(gregYear, 8, 15);
    const standardGanZhi = standardSolar.getLunar().getYearInGanZhiExact();

    // C. 判定風水年份
    let fsYear = gregYear;
    if (currentGanZhi !== standardGanZhi) {
        // 如果當下的干支與本年標準干支不同，說明還在上一年的氣場中 (例如 2026年1月 或 2026年2月3日)
        // 注意：2026年2月15日，current="丙午", standard="丙午"，兩者相等，所以 fsYear = 2026 (正確)
        // 如果是 2026年2月1日，current="乙巳", standard="丙午"，不等，所以 fsYear = 2025 (正確)
        fsYear = gregYear - 1;
    }

    // 4. 計算元運 (三元九運完整版: 1900-2100)
    let period;
    if (fsYear >= 2084) period = 3;      // 上元三運 (2084-2103)
    else if (fsYear >= 2064) period = 2; // 上元二運 (2064-2083)
    else if (fsYear >= 2044) period = 1; // 上元一運 (2044-2063)
    else if (fsYear >= 2024) period = 9; // 下元九運 (2024-2043)
    else if (fsYear >= 2004) period = 8; // 下元八運 (2004-2023)
    else if (fsYear >= 1984) period = 7; // 下元七運 (1984-2003)
    else if (fsYear >= 1964) period = 6; // 下元六運 (1964-1983)
    else if (fsYear >= 1944) period = 5; // 中元五運 (1944-1963)
    else if (fsYear >= 1924) period = 4; // 中元四運 (1924-1943)
    else if (fsYear >= 1904) period = 3; // 上元三運 (1904-1923)
    else period = 2;                     // 上元二運 (1884-1903，涵蓋 1900-1903

    return {
        year: fsYear,           // 風水年份 (數字，用於飛星計算)
        month: fsMonth,         // 風水月份 (1=寅, 2=卯...)
        period: period,
        yearGanZhi: currentGanZhi,   // 年干支 (如 丙午)
        monthGanZhi: lunar.getMonthInGanZhiExact(), // 月干支 (如 庚寅)
        solarDateStr: `${dateObj.getFullYear()}-${dateObj.getMonth()+1}-${dateObj.getDate()}`
    };
};

// 數字轉中文對照表 (全域使用)
const PERIOD_MAP_CHART = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };

const GUA_TO_DIR = {
    '坎': '北', '離': '南', '震': '東', '兌': '西',
    '巽': '東南', '坤': '西南', '艮': '東北', '乾': '西北'
};

// --- 核心數據定義 ---
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

const EIGHT_KILLINGS = { '坎': '辰', '坤': '卯', '震': '申', '巽': '酉', '乾': '午', '兌': '巳', '艮': '寅', '離': '亥' };
const YELLOW_SPRING = { '庚': '坤', '丁': '坤', '坤': ['庚', '丁'], '丙': '巽', '乙': '巽', '巽': ['丙', '乙'], '甲': '艮', '癸': '艮', '艮': ['甲', '癸'], '壬': '乾', '辛': '乾', '乾': ['辛', '壬'] };
const EAR_LATE_WATER = { '乾': { early: '離', late: '艮' }, '坎': { early: '兌', late: '坤' }, '艮': { early: '乾', late: '震' }, '震': { early: '艮', late: '離' }, '巽': { early: '坤', late: '兌' }, '離': { early: '震', late: '乾' }, '坤': { early: '坎', late: '巽' }, '兌': { early: '巽', late: '坎' } };
const NA_JIA = { '乾': ['甲'], '坎': ['癸', '申', '子', '辰'], '艮': ['丙'], '震': ['庚', '亥', '卯', '未'], '巽': ['辛'], '離': ['壬', '寅', '午', '戌'], '坤': ['乙'], '兌': ['丁', '巳', '酉', '丑'] };
const FAN_GUA_CONFIG = { '坎': { mt: '兌', water: '坎' }, '艮': { mt: '離', water: '艮' }, '震': { mt: '坤', water: '震' }, '巽': { mt: '乾', water: '巽' }, '離': { mt: '艮', water: '離' }, '坤': { mt: '震', water: '坤' }, '兌': { mt: '坎', water: '兌' }, '乾': { mt: '巽', water: '乾' } };

const BA_ZHAI_INFO = {
    '生氣': { type: '吉', color: THEME.green, star: '貪狼', desc: '大吉之位。主財運亨通、事業騰達。' },
    '天醫': { type: '吉', color: THEME.blue, star: '巨門', desc: '次吉之位。主健康長壽、貴人相助。' },
    '延年': { type: '吉', color: '#13c2c2', star: '武曲', desc: '中吉之位。主婚姻和諧、人際圓滿。' },
    '伏位': { type: '吉', color: THEME.gray, star: '輔弼', desc: '小吉之位。主平穩安定、守成待機。' },
    '絕命': { type: '凶', color: THEME.red, star: '破軍', desc: '大凶之位。主意外傷災、破財損丁。' },
    '五鬼': { type: '凶', color: THEME.orange, star: '廉貞', desc: '大凶之位。主口舌是非、官司火災。' },
    '六煞': { type: '凶', color: '#c41d7f', star: '文曲', desc: '中凶之位。主桃花糾紛、家庭不睦。' },
    '禍害': { type: '凶', color: THEME.lightgray, star: '祿存', desc: '小凶之位。主官司訴訟、是非口舌。' }
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
    '坤': { star: '巨門', type: '吉', color: THEME.blue }, '壬': { star: '巨門', type: '吉', color: THEME.blue }, '乙': { star: '巨門', type: '吉', color: THEME.blue },
    '艮': { star: '破軍', type: '凶', color: THEME.red }, '丙': { star: '破軍', type: '凶', color: THEME.red }, '辛': { star: '破軍', type: '凶', color: THEME.red },
    '巽': { star: '武曲', type: '吉', color: THEME.green }, '辰': { star: '武曲', type: '吉', color: THEME.green }, '亥': { star: '武曲', type: '吉', color: THEME.green },
    '甲': { star: '貪狼', type: '吉', color: THEME.green }, '癸': { star: '貪狼', type: '吉', color: THEME.green }, '申': { star: '貪狼', type: '吉', color: THEME.green },
    '丑': { star: '祿存', type: '凶', color: THEME.lightgray }, '未': { star: '祿存', type: '凶', color: THEME.lightgray }, '乾': { star: '祿存', type: '凶', color: THEME.lightgray },
    '寅': { star: '廉貞', type: '凶', color: THEME.orange }, '庚': { star: '廉貞', type: '凶', color: THEME.orange }, '丁': { star: '廉貞', type: '凶', color: THEME.orange },
    '卯': { star: '文曲', type: '凶', color: '#c41d7f' }, '酉': { star: '文曲', type: '凶', color: '#c41d7f' }, '午': { star: '文曲', type: '凶', color: '#c41d7f' },
    '子': { star: '左輔', type: '吉', color: THEME.gray }, '戌': { star: '左輔', type: '吉', color: THEME.gray }, '巳': { star: '左輔', type: '吉', color: THEME.gray }
};

const SHOU_SHAN_CHU_SHA = { '辰': '出煞', '戌': '出煞', '丑': '出煞', '未': '出煞', 
                            '乙': '出煞', '辛': '出煞', '丁': '出煞', '癸': '出煞', 
                            '寅': '出煞', '申': '出煞', '子': '出煞', '午': '出煞', 
                            '艮': '出煞', '坤': '出煞', 
                            '卯': '收山', '酉': '收山', '乾': '收山', '巽': '收山', 
                            '壬': '收山', '丙': '收山', '巳': '收山', '亥': '收山', 
                            '甲': '收山', '庚': '收山' };

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

const getSTAR_COMBINATIONS = (mtStar, faceStar) => {
    const key1 = `${mtStar}-${faceStar}`;
    const key2 = `${faceStar}-${mtStar}`;
    // 這裡直接調用引入的變數
    if (STAR_COMBINATIONS[key1]) return STAR_COMBINATIONS[key1];
    if (STAR_COMBINATIONS[key2]) return STAR_COMBINATIONS[key2];
    return { title: '一般組合', text: '無特殊吉凶克應', source: '一般論斷' };
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
    // 納氣：1坎, 2坤, 3震, 4巽, 6乾, 7兌, 8艮, 9離
    const guaMap = { '坎': 1, '坤': 2, '震': 3, '巽': 4, '乾': 6, '兌': 7, '艮': 8, '離': 9 };
    const doorNum = guaMap[guaName];
    
    if (p === 5) return { type: '平', text: '五運寄宮', color: THEME.green };

    // 定義元運：上元(1,2,3,4) 下元(6,7,8,9)
    const isPeriodUpper = p >= 1 && p <= 4;
    const isDoorUpper = doorNum >= 1 && doorNum <= 4;
    const isSameYuan = isPeriodUpper === isDoorUpper;

    if (isSameYuan) {
        if (doorNum === p) {
            return { type: '大吉', text: '當運大發', color: THEME.orange };
        } else if (doorNum > p) {
            return { type: '吉', text: '未來大發', color: THEME.tael };
        } else {
            return { type: '平', text: '運過平安', color: THEME.green };
        }
    } else {
        return { type: '凶', text: '運過衰退', color: THEME.red };
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
    if (relations[me].ctrl === other) return { type: '大吉', text: '財旺', color: THEME.orange };
    if (relations[other].gen === me) return { type: '吉', text: '吉', color: '#13c2c2' };
    if (relations[me].gen === other) return { type: '凶', text: '凶', color: THEME.red };
    if (relations[other].ctrl === me) return { type: '凶', text: '凶', color: THEME.red };
    return { type: '平', text: '平', color: '#999' };
};

// --- 核心計算 ---
const calculateEverything = (degree, period, fsYear, fsMonth = 1) => {
    const safePeriod = Number(period) || 9;
    const safeYear = Number(fsYear); // 必須是風水年
    const safeMonth = Number(fsMonth) || 1; // 必須是 1-12
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
// PART B: 視圖組件 (UI Views)
// =========================================================================
// 商戰彈窗 (保持不變)
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
                    <div style={{fontSize:'15px', fontWeight:'bold', marginBottom:'12px', color:THEME.blue}}>大廈坐向 vs 舖位宮位</div>
                    <div style={{marginBottom:'10px', fontSize:'14px'}}>大廈坐{sittingMt.name}向{facingMt.name}</div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px', marginBottom:'12px'}}>
                        {guas.map(g => (
                            <button key={g} onClick={() => setShopSector(g)} style={{ padding:'12px', borderRadius:'6px', border:`1px solid ${shopSector === g ? THEME.blue : '#ddd'}`, background: shopSector === g ? '#e6f7ff' : 'white', color: shopSector === g ? THEME.blue : '#333', cursor:'pointer', fontWeight: shopSector === g ? 'bold' : 'normal', fontSize: '16px' }}>{g}</button>
                        ))}
                    </div>
                    {mallRelation && (
                        <div style={{background:THEME.white, padding:'10px', borderRadius:'6px', borderLeft:`4px solid ${mallRelation.color}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontSize:'13px'}}>此舖宮位</div><div style={{fontWeight:'bold', color:mallRelation.color, fontSize:'16px'}}>{mallRelation.text}</div>
                        </div>
                    )}
                </div>
                <div style={{background:'white', borderRadius:'10px', padding:'16px', marginBottom:'16px'}}>
                    <div style={{fontSize:'15px', fontWeight:'bold', marginBottom:'12px', color:'#722ed1'}}>舖位序號</div>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'16px'}}>
                        <div><label style={{display:'block', fontSize:'12px', color:THEME.gray, marginBottom:'4px'}}>總舖位數</label><input type="number" min="1" value={shopTotal} onChange={handleTotalChange} style={{width:'100%', padding:'12px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'16px', boxSizing: 'border-box'}}/></div>
                        <div><label style={{display:'block', fontSize:'12px', color:THEME.gray, marginBottom:'4px'}}>心儀舖位序號</label><input type="number" min="1" max={safeTotal} value={shopIndex} onChange={handleIndexChange} style={{width:'100%', padding:'12px', borderRadius:'6px', border:'1px solid #ddd', fontSize:'16px', boxSizing: 'border-box'}}/></div>
                    </div>
                    {hasValidInput && corridorRelation && (
                        <div style={{background:THEME.white, padding:'10px', borderRadius:'6px', borderLeft:`4px solid ${corridorRelation.color}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{fontSize:'13px'}}>此舖位數</div><div style={{fontWeight:'bold', color:corridorRelation.color, fontSize:'16px'}}>{corridorRelation.text}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 詳情彈窗
const DetailModal = ({ isOpen, onClose, data, facingDaGua }) => {
    if (!isOpen || !data) return null;

    const { mt, face, base, annual, monthly, guaName, combination, baZhaiStar } = data;
    const isCenter = guaName === '中';
    const baZhaiDetail = baZhaiStar ? BA_ZHAI_INFO[baZhaiStar] : null;

    const palaceMountains = MOUNTAINS.filter(m => m.gua === guaName);
    const getDaGuaRelations = (targetGua, refGua) => {
        if (!refGua || !targetGua) return [];
        const rels = [];
        // 1. 一卦純清 (卦運相同)
        if (targetGua.y === refGua.y) rels.push({t:'同元一氣', c:'#722ed1'}); // 紫色
        // 2. 合十 (卦氣相加=10)
        if (targetGua.q + refGua.q === 10) rels.push({t:'卦氣合十', c:'#c41d7f'}); // 深粉
        // 3. 卦運合十
        if (targetGua.y + refGua.y === 10) rels.push({t:'卦運合十', c:'#eb2f2f'}); // 淺粉
        // 4. 生成 (卦氣差5)
        if (Math.abs(targetGua.q - refGua.q) === 5) rels.push({t:'卦氣生成', c:'#13c2c2'}); // 青色
        return rels;
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={onClose}>
            <div style={{
                background: 'white', width: '100%', maxWidth: '400px', borderRadius: '16px',
                padding: '24px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                maxHeight: '60vh', overflowY: 'auto', overscrollBehavior: 'contain'
            }} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} style={{position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer'}}>
                    <X size={24} color="#666"/>
                </button>

                <h3 style={{marginTop: 0, fontSize: '20px', textAlign: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px'}}>
                    {guaName}宮詳解
                </h3>

                <div style={{display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0', alignItems:'center'}}>
                    <div style={{textAlign: 'center', position:'relative'}}>
                        <div style={{fontSize: '12px', color: THEME.gray}}>山星</div>
                        <div style={{fontSize: '32px', fontWeight: 'bold', color: '#333'}}>{mt}</div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '12px', color: THEME.gray}}>運星</div>
                        <div style={{fontSize: '32px', fontWeight: 'bold', color: '#999'}}>{PERIOD_MAP_CHART[base]}</div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '12px', color: THEME.gray}}>向星</div>
                        <div style={{fontSize: '32px', fontWeight: 'bold', color: THEME.red}}>{face}</div>
                    </div>
                </div>

                {/* 雙星斷事 */}
                <div style={{background: THEME.white, padding: '16px', borderRadius: '8px', marginBottom: '16px'}}>
                    <div style={{fontSize: '16px', fontWeight: 'bold', color: THEME.blue, marginBottom: '4px'}}>
                        🚀 玄空飛星：{combination.title}
                    </div>
                    <div style={{fontSize: '14px', lineHeight: '1.5', color: '#333', marginBottom: '10px'}}>
                        {combination.text}
                    </div>
                    
                    {/* 動態渲染所有存在的 source 欄位 */}
                    <div style={{marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #eee'}}>
                        {['source', 'source2', 'source3', 'source4', 'source5'].map((key) => (
                            combination[key] ? (
                                <div key={key} style={{fontSize: '12px', color: '#888', fontStyle: 'italic', marginBottom: '4px', display: 'flex', gap: '4px'}}>
                                    <span style={{flexShrink:0}}>📖</span>
                                    <span>{combination[key]}</span>
                                </div>
                            ) : null
                        ))}
                    </div>
                </div>

                {baZhaiDetail && (
                    <div style={{background: '#fff0f6', padding: '16px', borderRadius: '8px', border: `1px solid ${baZhaiDetail.color}`, marginBottom: '16px'}}>
                        <div style={{fontSize: '16px', fontWeight: 'bold', color: baZhaiDetail.color, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                            🏠 八宅法：{baZhaiStar} <span style={{fontSize: '12px', background: baZhaiDetail.color, color: 'white', padding: '2px 6px', borderRadius: '4px'}}>{baZhaiDetail.star}</span>
                        </div>
                        <div style={{fontSize: '14px', lineHeight: '1.5', color: '#333'}}>
                            {baZhaiDetail.desc}
                        </div>
                    </div>
                )}

                {!isCenter && (
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px'}}>
                        <div style={{background: '#fff7e6', padding: '12px', borderRadius: '8px', border: '1px solid #ffd591'}}>
                            <div style={{fontSize: '14px', fontWeight: 'bold', color: THEME.orange, marginBottom: '8px'}}>
                                ⛰️ 收山出煞
                            </div>
                            <div style={{display: 'flex', flexDirection:'column', gap: '4px'}}>
                                {palaceMountains.map(pm => {
                                    const type = SHOU_SHAN_CHU_SHA[pm.name];
                                    const isShou = type === '收山';
                                    return (
                                        <div key={pm.name} style={{fontSize:'12px', display:'flex', justifyContent:'space-between'}}>
                                            <span>{pm.name}山</span>
                                            <span style={{fontWeight:'bold', color: isShou ? '#874d00' : THEME.blue}}>
                                                {type} ({isShou ? '宜收藏' : '宜張揚'})
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{background: '#f0f5ff', padding: '12px', borderRadius: '8px', border: '1px solid #adc6ff'}}>
                            <div style={{fontSize: '14px', fontWeight: 'bold', color: '#1d39c4', marginBottom: '8px'}}>
                                🌊 坤壬乙訣
                            </div>
                            <div style={{display: 'flex', flexDirection:'column', gap: '4px'}}>
                                {palaceMountains.map(pm => {
                                    const kry = KUN_REN_YI[pm.name];
                                    return (
                                        <div key={pm.name} style={{fontSize:'12px', display:'flex', justifyContent:'space-between'}}>
                                            <span>{pm.name}山</span>
                                            <span style={{fontWeight:'bold', color: kry.color}}>{kry.star}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {!isCenter && (
                    <div style={{background: '#f6ffed', padding: '16px', borderRadius: '8px', border: '1px solid #b7eb8f'}}>
                        <div style={{fontSize: '16px', fontWeight: 'bold', color: THEME.green, marginBottom: '8px'}}>
                            ☯️ 玄空大卦：坐向剋應
                        </div>
                                            <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>
                         向首: {facingDaGua.n}卦 氣{facingDaGua.q} / 運{facingDaGua.y}
                    </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                            {palaceMountains.map(pm => {
                                // 1. 計算該山的大卦
                                const myDaGua = getDaGua(pm.angle); 
                                // 2. 與向首大卦比較
                                const relations = getDaGuaRelations(myDaGua, facingDaGua);

                                return (
                                    <div key={pm.name} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        fontSize: '13px', padding: '4px 0', borderBottom: '1px dashed #e8e8e8'
                                    }}>
                                        <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                                            <span style={{fontWeight:'bold', width:'30px', textAlign:'center', background:'#f0f0f0', borderRadius:'3px'}}>{pm.name}山</span>
                                            <span style={{color:'#666', fontSize:'12px'}}>
                                                {myDaGua ? `${myDaGua.n}卦 氣${myDaGua.q} / 運${myDaGua.y}` : '無'}
                                            </span>
                                        </div>
                                        <div style={{display:'flex', gap:'4px'}}>
                                            {relations.length > 0 ? (
                                                relations.map((r, i) => (
                                                    <span key={i} style={{
                                                        fontSize:'10px', color:'white', background: r.c,
                                                        padding:'2px 5px', borderRadius:'4px', fontWeight:'bold'
                                                    }}>
                                                        {r.t}
                                                    </span>
                                                ))
                                            ) : <span style={{color:'#ccc', fontSize:'12px'}}>-</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div style={{fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '16px'}}>
                    * 點擊遮罩層即可關閉
                </div>
            </div>
        </div>
    );
};

// 羅庚頁面
const CompassView = ({ heading, setHeading, isFrozen, setIsFrozen, onAnalyze }) => {
    const isFrozenRef = React.useRef(isFrozen);
    useEffect(() => { isFrozenRef.current = isFrozen; }, [isFrozen]);

    // 新增：校正偏移量 (用來微調手機硬體磁偏角與真實羅庚的誤差)
    const [offset, setOffset] = useState(0);

    const handleOrientation = React.useCallback((e) => {
        if (isFrozenRef.current) return;
        
        let compass;
        
        // 1. 優先取用 iOS 特有的絕對指南針方位 (需嚴謹判斷)
        if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
            compass = e.webkitCompassHeading;
        } 
        // 2. 針對 Android 的絕對方向，或無硬體支援時的相對方向降級
        else if (e.alpha !== null) {
            compass = 360 - e.alpha;
        } else {
            return;
        }

        // 3. 加入螢幕轉向補償 (解決手機橫放或倒放時造成的偏差)
        const screenOrientation = window.screen?.orientation?.angle || window.orientation || 0;
        compass = (compass + screenOrientation) % 360;
        if (compass < 0) compass += 360;

        setHeading(prev => Math.abs(compass - prev) > 0.2 ? compass : prev);
    }, [setHeading]);

    const requestAccess = () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ 必須主動請求權限
            DeviceOrientationEvent.requestPermission()
                .then(response => { 
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true); 
                    } else {
                        alert("需允許取用方向權限，羅庚才能獲取真正的絕對方位！");
                    }
                })
                .catch(console.error);
        } else {
            // Android 優先監聽 deviceorientationabsolute (真北/磁北)
            if ('ondeviceorientationabsolute' in window) {
                window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            } else {
                window.addEventListener('deviceorientation', handleOrientation, true);
            }
        }
    };

    useEffect(() => { 
        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
            window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
        };
    }, [handleOrientation]);
    
    // 將硬體度數加上手動微調的偏移量
    const finalHeading = normalizeAngle(heading + offset);
    
    const facingMt = getMountain(finalHeading);
    const sittingMt = getMountain(finalHeading + 180);
    const sitDirName = GUA_TO_DIR[sittingMt.gua];
    const faceDirName = GUA_TO_DIR[facingMt.gua];

    const CARDINALS = [
        { text: '北', angle: 0, color: THEME.teal },
        { text: '東', angle: 90, color: '#333' },
        { text: '南', angle: 180, color: THEME.red },
        { text: '西', angle: 270, color: '#333' }
    ];

    return (
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#222', color: '#fff', position: 'relative', overflow: 'hidden', height: '100%', width: '100%'}}>
            
            {/* 羅庚與十字星 */}
            <div style={{ position: 'relative', width: 'min(80vw, 45vh)', height: 'min(80vw, 45vh)', maxWidth: '350px', maxHeight: '350px', aspectRatio: '1 / 1', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '10px 0', flexShrink: 0 }}>
                <div style={{ position:'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', height: '20%', width: '2px', background:'red', zIndex: 20, boxShadow: '0 0 2px rgba(255,0,0,0.8)' }}></div>
                <div style={{ position:'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '20%', height: '2px', background:'red', zIndex: 20, boxShadow: '0 0 2px rgba(255,0,0,0.8)' }}></div>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '6px solid #8B4513', background: '#e0c38c', transform: `rotate(${-finalHeading}deg)`, transition: isFrozen ? 'none' : 'transform 0.1s linear', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', boxSizing: 'border-box' }}>
                     {MOUNTAINS.map((m, i) => (
                        <div key={i} style={{ position: 'absolute', top: '10px', left: '50%', height: '45%', width: '1px', transformOrigin: 'bottom center', transform: `translateX(-50%) rotate(${m.angle}deg)` }}>
                            <span style={{display:'block', fontSize:'14px', color:'#333', fontWeight:'bold', transform:'rotate(180deg)', whiteSpace:'nowrap'}}>{m.name}</span>
                        </div>
                     ))}
                     {CARDINALS.map((c, i) => (
                        <div key={`card-${i}`} style={{ 
                            position: 'absolute', 
                            top: '50%', left: '50%', 
                            height: '28%', 
                            width: '0px', 
                            transformOrigin: 'top center', 
                            transform: `rotate(${c.angle + 180}deg)` 
                        }}>
                             <div style={{
                                 position: 'absolute',
                                 bottom: '0', 
                                 left: '50%',
                                 transform: 'translateX(-50%) rotate(0deg)',
                                 fontSize: '18px',
                                 fontWeight: '900',
                                 color: c.color,
                                 whiteSpace: 'nowrap'
                             }}>
                                 {c.text}
                             </div>
                        </div>
                     ))}
                     <div style={{ width:'20%', height:'20%', background:'white', borderRadius:'50%', border:'2px solid red', boxSizing: 'border-box' }}></div>
                </div>
            </div>

            {/* 底部數據與控制 */}
            <div style={{textAlign:'center', zIndex: 10, marginTop: '10px'}}>
                <div style={{fontSize:'14px', color:'#aaa'}}>{isFrozen ? '已定格' : '請轉動手機或移動下方橫桿微調'}</div>
                <div style={{fontSize:'48px', fontWeight:'bold', fontFamily:'monospace', color: '#ffd700'}}>{finalHeading.toFixed(1)}°</div>
                <div style={{fontSize: '20px', fontWeight:'bold', marginTop:'5px'}}>
                    {sittingMt.gua}卦 - {sittingMt.name}山{facingMt.name}向 <span style={{fontSize: '15px', fontWeight: 'normal', color: '#ccc'}}>(坐{sitDirName}向{faceDirName})</span>
                </div>

                {/* 按鈕區 */}
                <div style={{display:'flex', gap:'16px', justifyContent:'center', marginTop:'20px'}}>
                    <button onClick={() => setIsFrozen(!isFrozen)} style={{padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', background: isFrozen ? THEME.red : THEME.blue, color:'white'}}>
                        {isFrozen ? <Unlock size={18}/> : <Lock size={18}/>} {isFrozen ? "解鎖羅庚" : "定格方位"}
                    </button>
                    
                    {!isFrozen && (
                        <button onClick={requestAccess} style={{padding: '12px 24px', borderRadius: '30px', border: '1px solid white', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', background: 'transparent', color:'white'}}>
                            <Compass size={18}/> 啟用羅庚
                        </button>
                    )}

                    {isFrozen && (
                        <button onClick={() => {
                            setHeading(finalHeading); // 排盤前確保寫入加上 offset 後的結果
                            onAnalyze();
                        }} style={{padding: '12px 24px', borderRadius: '30px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', gap:'5px', background: THEME.green, color:'white'}}>
                            <RefreshCw size={18}/> 進入排盤
                        </button>
                    )}
                </div>
                
                {/* 增加手動微調偏移量的拉桿 (風水師必備功能) */}
                {!isFrozen && (
                    <div style={{marginTop:'20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px'}}>
                            <span style={{fontSize: '13px', color: '#ccc', width: '90px', textAlign: 'left'}}>
                                磁偏校正: {offset > 0 ? '+' : ''}{offset}°
                            </span>
                            <input type="range" min="-30" max="30" value={offset} onChange={e=>setOffset(Number(e.target.value))} style={{width:'120px'}}/>
                            <button onClick={()=>setOffset(0)} style={{background: 'none', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer'}}>重設</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 4. 排盤視圖 (ChartView) - 圓盤佈局優化 (凶煞在上，雜項在下)
const ChartView = ({ heading, period, setPeriod, gregYear, setGregYear, gregMonth, setGregMonth, onSave, chartMode = 'traditional', isLoggedIn }) => {
    const [selectedSector, setSelectedSector] = useState(null);
    const [naQiDoor, setNaQiDoor] = useState(null); 
    const [showAnnual, setShowAnnual] = useState(true);
    const [showMonthly, setShowMonthly] = useState(false);
    const [showCommercial, setShowCommercial] = useState(false);
    const [isRound, setIsRound] = useState(false); 

    // 1. 將西曆輸入轉換為風水曆法
    const fsData = useMemo(() => {
        const refDate = new Date(gregYear, gregMonth -1, 15);
        return getPreciseFengShuiDate(refDate);
    }, [gregYear, gregMonth]);

    // 2. 排盤計算
    const data = useMemo(() => {
        try { 
            return calculateEverything(heading, period, fsData.year, fsData.month); 
        } catch (e) { return null; }
    }, [heading, period, fsData]);

    useEffect(() => { if (data) setNaQiDoor(data.facing.gua); }, [data]);

    if (!data) return <div style={{padding:20, color:'red'}}>資料計算異常。</div>;

    const naQiRow1 = ['坎', '坤', '震', '巽'];
    const naQiRow2 = ['乾', '兌', '艮', '離'];
    const dirNames = ["巽", "離", "坤", "震", "中", "兌", "艮", "坎", "乾"];

    // =======================================================
    // 1. 方位映射邏輯
    // =======================================================
    const isModern = chartMode === 'modern';

    // A. 方盤 Grid 順序
    const gridOrder = isModern ? [8, 7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7, 8];

    // B. 圓盤位置 (順時針)
    const POSITIONS = [
        { angle: 0 }, { angle: 45 }, { angle: 90 }, { angle: 135 }, 
        { angle: 180 }, { angle: 225 }, { angle: 270 }, { angle: 315 }
    ];

    let visualMap = []; 
    if (isModern) {
        visualMap = [7, 6, 3, 0, 1, 2, 5, 8]; 
    } else {
        visualMap = [1, 2, 5, 8, 7, 6, 3, 0];
    }

    const cardStyle = { background: THEME.white, borderRadius:'12px', padding:'16px', marginBottom:'16px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' };
    const sectionTitle = { fontSize:'15px', fontWeight:'bold', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px', color:'#333', borderBottom:'2px solid #f0f0f0', paddingBottom:'6px' };
    const btnStyle = { padding: '6px 12px', backgroundColor: THEME.bgGray, borderRadius: '20px', border: `1px solid ${THEME.border}`, color: THEME.black, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' };
    const tagStyle = { fontSize:'9px', padding:'1px 3px', borderRadius:'2px', color:'#fff', fontWeight:'bold', whiteSpace:'nowrap', lineHeight: '1.2' };

    // 取得格子內的標籤 (不分圓盤方盤，統一顯示所有重要資訊)
    const getGridTags = (idx) => {
        const dirGua = dirNames[idx]; 
        if (dirGua === '中') return []; 
        const tags = [];
        const { advanced } = data;
        
        // 1. 曜煞 & 黃泉 (最重要)
        if (advanced.sha8 && advanced.sha8 !== '無' && getGuaFromStr(advanced.sha8) === dirGua) 
            tags.push({ text: `曜煞: ${advanced.sha8}`, color: THEME.red });
        
        if (advanced.huangQuan) {
            const hqArr = advanced.huangQuan.split('/');
            hqArr.forEach(hq => {
                if (getGuaFromStr(hq) === dirGua) tags.push({ text: `黃泉水: ${hq}`, color: THEME.red });
            });
        }
        
        // 2. 城門
        if (dirGua === advanced.chengMen.main) tags.push({ text: '正城門', color: THEME.orange }); 
        if (dirGua === advanced.chengMen.sub) tags.push({ text: '副城門', color: THEME.orange }); 
        
        // 3. 山龍
        const mtDragons = advanced.mountainDragon.mountains;
        const mtMatches = mtDragons.filter(m => getGuaFromStr(m) === dirGua);
        if (mtMatches.length > 0) {
            tags.push({ text: `山龍: ${mtMatches.join('')}`, color: '#c41d7f' });
        }

        // 4. 水龍 (圓盤空間有限，若太多標籤可考慮隱藏部分，目前全開)
        const waterDragons = advanced.waterDragon.mountains;
        const waterMatches = waterDragons.filter(m => getGuaFromStr(m) === dirGua);
        if (waterMatches.length > 0) {
            tags.push({ text: `水龍: ${waterMatches.join('')}`, color: THEME.blue });
        }

        // 5. 水法
        if (dirGua === advanced.waterMethod.early) tags.push({ text: '先天水', color: THEME.blue }); 
        if (dirGua === advanced.waterMethod.late) tags.push({ text: '後天水', color: THEME.green }); 

        return tags;
    };

    const getYearlyBadges = (idx) => {
        if (!showAnnual) return [];
        const guaName = dirNames[idx];
        const { yearlyAfflictions } = data.advanced;
        const badges = [];
        if (yearlyAfflictions.wuHuang === guaName) badges.push({t:'五黃', c:THEME.red});
        if (yearlyAfflictions.sanSha === guaName) badges.push({t:'三煞', c:THEME.red});
        if (yearlyAfflictions.liShi === guaName) badges.push({t:'力士', c:'#d48806'});
        if (yearlyAfflictions.taiSui === guaName) badges.push({t:'太歲', c:THEME.red});
        if (yearlyAfflictions.suiPo === guaName) badges.push({t:'歲破', c:THEME.red});
        return badges;
    };

    const handleSectorClick = (idx) => {
        const guaName = dirNames[idx];
        setSelectedSector({
            mt: data.mtGrid[idx], face: data.faceGrid[idx], base: data.baseGrid[idx],
            annual: data.annualGrid[idx], monthly: data.monthlyGrid[idx],
            guaName: guaName, combination: getSTAR_COMBINATIONS(data.mtGrid[idx], data.faceGrid[idx]),
            baZhaiStar: data.advanced.baZhaiMap[guaName]
        });
    };

    const handleSaveClick = () => {
        const locationName = window.prompt("請輸入地點", "");
        if (locationName === null) return; 
        onSave({ id: Date.now(), sitting: data.sitting, facing: data.facing, period: period, year: gregYear, month: gregMonth, location: locationName || '' });
    };

    const naQiResult = naQiDoor ? calculateNaQi(period, naQiDoor) : null;
    const sitDir = GUA_TO_DIR ? GUA_TO_DIR[data.sitting.gua] : '';
    const faceDir = GUA_TO_DIR ? GUA_TO_DIR[data.facing.gua] : '';
    const years = []; for (let y = 1900; y <= 2100; y++) years.push(y);
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    
    const getDirDisplayName = (name) => {
        const dir = GUA_TO_DIR[name];
        if (!dir) return name;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1.1' }}>
                <span>{name}</span>
                <span style={{ fontSize: '10px', fontWeight: 'normal' }}>({dir})</span>
            </div>
        );
    };

    // ==========================================
    // 渲染單個宮位內容
    // ==========================================
    const [floorPlan, setFloorPlan] = useState(null); 
    const [imgConfig, setImgConfig] = useState({ opacity: 0.6, scale: 1, rotate: 0, x: 0, y: 0 });
    const [showFloorPlanPanel, setShowFloorPlanPanel] = useState(false);
    
    // 處理背景色邏輯
    const cellBgColor = floorPlan ? 'rgba(255, 252, 245, 0.4)' : '#fffcf5';
    const gridBorderColor = '#8b4513';

    const renderCellContent = (idx, isCenter = false) => {
        const tags = getGridTags(idx);
        const yearly = getYearlyBadges(idx);
        const guaName = dirNames[idx];
        const dir = GUA_TO_DIR[guaName];
        const baZhai = data.advanced.baZhaiMap[guaName];

        // --- 1. 定義樣式常數 (圓盤/方盤分離) ---
        
        // 字體大小配置
        const FONT = {
            mtFace: isRound ? '13px' : '20px',      // 山向星：圓盤改小
            subStar: isRound ? '9px' : '14px',      // 流年/流月小數字
            base: isRound ? '18px' : '24px',        // 運星(底數)
            tag: isRound ? '8px' : '10px',          // 標籤文字
            gua: isRound ? '10px' : '12px',         // 宮名
            dir: isRound ? '8px' : '10px',          // 方向(東南西北)
            baZhai: isRound ? '8px' : '11px'        // 八宅
        };

        // 位置配置
        const POS = {
            // 山向星位置：圓盤模式下，side 要大(往內縮)，top 要大(往下降)，避開扇形邊緣
            starTop: isRound ? (isCenter ? '12px' : '14px') : (isCenter ? '4px' : '4px'), 
            starSide: isRound ? (isCenter ? '22px' : '19px') : (isCenter ? '6px' : '6px'),
            
            // 標籤容器位置
            tagBottom: isRound ? '26px' : '30px', 
            
            // 運星位置
            baseBottom: isRound ? '4px' : '4px',

            // 宮名位置 (圓盤改為置中底部，方盤維持左下角)
            guaPos: isRound 
                ? { bottom: '60px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' } 
                : { bottom: '4px', left: '4px', textAlign: 'left' },

            // 八宅位置 (圓盤往內縮，方盤維持右下角)
            baZhaiPos: isRound 
                ? { bottom: '6px', right: '50%', transform: 'translateX(50%)' } // 圓盤：放在運星上方一點，或底部置中
                : { bottom: '4px', right: '4px' }
        };
        
        // 針對圓盤八宅位置的特殊調整：為了不擋運星，圓盤模式下我們把八宅稍微藏在向星下方或側邊
        // 修正：圓盤空間太小，八宅改為放在"向星"的下方稍微偏右，或者放在運星上面
        // 這裡採用：方盤不變，圓盤放在右側中間偏下，避開角落
        const roundBaZhaiStyle = isRound 
            ? { top: '68px', right: '15px' } // 圓盤：放在向星下方
            : { bottom: '4px', right: '4px' }; // 方盤：右下角

        // 標籤容器樣式
        const gridTagContainerStyle = {
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1px', // 間距更緊密
            width: isRound ? '80%' : '96%', // 圓盤限制寬度，避免碰到邊緣
        };

        // 單個標籤樣式
        const gridTagItemStyle = (color) => ({
            ...tagStyle,
            background: color,
            width: 'fit-content',
            maxWidth: isRound ? '50px' : '55%', // 圓盤模式下強制限制標籤最大寬度
            padding: isRound ? '1px 2px' : '1px 4px', // 圓盤減少內邊距
            borderRadius: '4px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis', // 超出變...
            boxSizing: 'border-box',
            fontSize: FONT.tag,
            lineHeight: '1.2'
        });

        // --- 2. 開始渲染 ---
        return (
            <div style={{ 
                width: '100%', height: '100%', position: 'relative', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' 
            }}>
                
                {/* 1. 山星 (左上) & 向星 (右上) */}
                <div style={{
                    position:'absolute', 
                    top: POS.starTop, 
                    left: POS.starSide,
                    display:'flex', flexDirection:'column', alignItems:'center'
                }}>
                    <div style={{
                        fontSize: FONT.mtFace, fontWeight:'900', color:THEME.red, lineHeight:'1', 
                        // 改用 textShadow 創造完美的 1px 白邊 + 微光暈
                        textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 4px #fff'
                    }}>
                        {data.mtGrid[idx]}
                    </div>
                    {showAnnual && <div style={{
                        fontSize: FONT.subStar, fontWeight:'bold', color:'#722ed1',
                        textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
                    }}>
                        {data.annualGrid[idx]}
                    </div>}
                </div>

                <div style={{
                    position:'absolute', 
                    top: POS.starTop, 
                    right: POS.starSide,
                    display:'flex', flexDirection:'column', alignItems:'center'
                }}>
                    <div style={{
                        fontSize: FONT.mtFace, fontWeight:'900', color:THEME.blue, lineHeight:'1',
                        // 同樣改用 textShadow
                        textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 0 4px #fff'
                    }}>
                        {data.faceGrid[idx]}
                    </div>
                    {showMonthly && <div style={{
                        fontSize: FONT.subStar, fontWeight:'bold', color:THEME.orange,
                        textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff'
                    }}>
                        {data.monthlyGrid[idx]}
                    </div>}
                </div>

                {/* 2. 歲煞 (中上) */}
                {yearly.length > 0 && !isCenter && (
                    <div style={{ 
                        position: 'absolute', 
                        top: isRound ? '2px' : '2px', // 圓盤貼頂
                        left: '50%', transform: 'translateX(-50%)', 
                        display: 'flex', gap: '1px', flexWrap: 'wrap', justifyContent: 'center', 
                        width: '100%', zIndex: 10, pointerEvents: 'none'
                    }}>
                        {yearly.map((y, i) => (
                            <span key={i} style={{ ...tagStyle, background: y.c, fontSize: isRound ? '8px' : '9px', padding: '1px 2px' }}>{y.t}</span>
                        ))}
                    </div>
                )}

                {/* 3. 其他標籤 (運星上方) */}
                {tags.length > 0 && (
                    <div style={{ 
                        position:'absolute', 
                        bottom: POS.tagBottom,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 2,
                        ...gridTagContainerStyle 
                    }}>
                        {tags.map((t, i) => <span key={i} style={gridTagItemStyle(t.color)}>{t.text}</span>)}
                    </div>
                )}

                {/* 4. 運星 (中下) */}
                <div style={{ 
                    position: 'absolute', 
                    bottom: POS.baseBottom, 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    fontSize: FONT.base, 
                    fontWeight: 'bold', 
                    color: '#e0e0e0',
                    lineHeight: 1, 
                    zIndex: 0 
                }}>
                    {PERIOD_MAP_CHART[data.baseGrid[idx]]}
                </div>

                {/* 5. 底部角落資訊 (僅非中宮顯示) */}
                {idx !== 4 && (
                    <>
                        {/* 左下 - 宮名 (方向) */}
                        <div style={{ 
                            position: 'absolute',
                            zIndex: 5,
                            textShadow: isRound ? '0 0 2px white' : 'none',
                            display: 'flex',
                            flexDirection: isRound ? 'row' : 'column', // 圓盤改為橫排
                            alignItems: 'center',
                            gap: isRound ? '2px' : '0px',
                            lineHeight: 1,
                            ...POS.guaPos // 套用位置樣式
                        }}>
                            <span style={{ fontSize: FONT.gua, fontWeight: 'bold', color: isRound ? '#333' : THEME.lightgray }}>{guaName}</span>
                            {dir && (
                                <span style={{ 
                                    fontSize: FONT.dir, 
                                    fontWeight: 'normal',
                                    color: isRound ? '#666' : THEME.lightgray,
                                    transform: isRound ? 'none' : 'scale(0.9)',
                                    transformOrigin: 'center top'
                                }}>
                                    {`(${dir})`} 
                                </span>
                            )}
                        </div>

                        {/* 右下 - 八宅 */}
                        {baZhai && (
                            <div style={{
                                position: 'absolute', 
                                zIndex: 5,
                                fontSize: FONT.baZhai, 
                                fontWeight: 'bold', 
                                color: BA_ZHAI_INFO[baZhai].color, 
                                background: 'rgba(255,255,255,0.8)', 
                                padding: '0px 2px', 
                                borderRadius: '3px',
                                ...roundBaZhaiStyle // 套用位置樣式
                            }}>
                                {baZhai}
                            </div>
                        )}
                    </>
                )}

                {/* 中宮特殊顯示 (Chart Type) */}
                {idx === 4 && (
                    <div style={{ 
                        position:'absolute', 
                        bottom: isRound ? '24px' : '30px', 
                        fontSize: isRound ? '8px' : '10px', 
                        fontWeight:'bold', 
                        background:'rgba(83, 29, 171, 0.1)', 
                        padding:'1px 5px', 
                        borderRadius:'4px', 
                        color: '#531dab', 
                        whiteSpace: 'nowrap'
                    }}>
                        {data.chartType}
                    </div>
                )}
            </div>
        );
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFloorPlan(reader.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div style={{padding:'16px', paddingBottom:'80px'}}>
             <div style={cardStyle}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <div style={{fontWeight:'bold', fontSize:'18px'}}>
                        {data.sitting.name}山{data.facing.name}向
                        <span style={{fontSize:'14px', color:THEME.gray, fontWeight:'normal'}}> (坐{sitDir}向{faceDir})</span>
                    </div>
                    <button onClick={handleSaveClick} style={btnStyle}><Save size={14}/> 保存</button>
                </div>
                
                <div style={{display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px'}}>
                    <label style={{fontSize:'14px'}}>
                        運: <select value={period} onChange={e => setPeriod(Number(e.target.value))} style={{border:'1px solid #ddd', marginLeft:'4px', padding: '2px'}}>{[1,2,3,4,5,6,7,8,9].map(n => (<option key={n} value={n}>{PERIOD_MAP_CHART[n]}運</option>))}</select>
                    </label>
                    <label style={{fontSize:'14px'}}>
                        <select value={gregYear} onChange={e => setGregYear(Number(e.target.value))} style={{border:'1px solid #ddd', padding: '2px'}}>{years.map(y => (<option key={y} value={y}>{y}</option>))}</select>年
                    </label>
                    <label style={{fontSize:'14px'}}>
                        <select value={gregMonth} onChange={e => setGregMonth(Number(e.target.value))} style={{border:'1px solid #ddd', padding: '2px'}}>{months.map(m => (<option key={m} value={m}>{m}</option>))}</select>月
                    </label>
                </div>

                {/* --- 按鈕工具列 --- */}
                <div style={{display:'flex', gap:'8px', marginTop:'10px', flexWrap:'wrap', alignItems:'center'}}>
                    <button onClick={() => setShowAnnual(!showAnnual)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', border: '1px solid #722ed1', background: showAnnual ? '#f9f0ff' : 'white', color: '#722ed1', cursor:'pointer'}}>{showAnnual ? <Eye size={12}/> : <EyeOff size={12}/>} 流年</button>
                    <button onClick={() => setShowMonthly(!showMonthly)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', border: '1px solid #fa8c16', background: showMonthly ? '#fff7e6' : 'white', color: THEME.orange, cursor:'pointer'}}>{showMonthly ? <Eye size={12}/> : <EyeOff size={12}/>} 流月</button>
                    <button onClick={() => setShowCommercial(true)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', background: '#333', color: 'white', border:'none', marginLeft:'auto', cursor:'pointer'}}><Briefcase size={12}/> 商戰</button>
                    <button onClick={() => setIsRound(!isRound)} style={{fontSize:'12px', padding:'4px 8px', borderRadius:'12px', border: 'none', background: isRound ? '#333' : 'white', color: isRound ? 'white' : '#333', display: 'flex', alignItems: 'center', cursor:'pointer'}}>
                        {isRound ? <Circle size={12}/> : <Grid size={12}/>} {isRound ? '圓盤' : '方盤'}
                    </button>
                    <button 
                        onClick={() => setShowFloorPlanPanel(!showFloorPlanPanel)} 
                        style={{
                            fontSize:'12px', padding:'4px 8px', borderRadius:'12px', 
                            border: showFloorPlanPanel ? `1px solid ${'white'}` : '1px solid #333', // 開啟時變藍色
                            background: showFloorPlanPanel ? '#333' : 'white', // 開啟時變淺藍底
                            color: showFloorPlanPanel ? 'white' : '#333',
                            display: 'flex', alignItems: 'center', cursor:'pointer'
                        }}
                    >
                        <Map size={12}/> 平面圖
                    </button>
                </div>

                {/* --- 平面圖控制面板 (只在 showFloorPlanPanel 為 true 時顯示) --- */}
                {showFloorPlanPanel && (
                    <div style={{...cardStyle, backgroundColor: '#f0f2f5', marginTop: '10px', animation: 'fadeIn 0.3s'}}>
                        <div style={sectionTitle}><Map size={16}/> 平面圖設置</div>
                        
                        <div style={{display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center'}}>
                            <input type="file" accept="image/*" onChange={handleFileUpload} style={{fontSize:'12px'}} />
                            {floorPlan && (
                                <button onClick={() => setFloorPlan(null)} style={{...btnStyle, color: THEME.red}}>移除底圖</button>
                            )}
                        </div>
                        
                        {floorPlan && (
                            <div style={{marginTop:'10px', display:'flex', flexDirection:'column', gap:'12px'}}>
                                {/* 第一排：透明度與縮放 */}
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                                    <label style={{fontSize:'12px'}}>透明度: 
                                        <input type="range" min="0" max="1" step="0.1" value={imgConfig.opacity} 
                                            onChange={e => setImgConfig({...imgConfig, opacity: parseFloat(e.target.value)})} 
                                            style={{width:'100%'}} />
                                    </label>
                                    <label style={{fontSize:'12px'}}>縮放: 
                                        <input type="range" min="0.2" max="3" step="0.05" value={imgConfig.scale} 
                                            onChange={e => setImgConfig({...imgConfig, scale: parseFloat(e.target.value)})} 
                                            style={{width:'100%'}} />
                                    </label>
                                </div>

                                {/* 第二排：旋轉 */}
                                <label style={{fontSize:'12px'}}>旋轉 ({imgConfig.rotate}°): 
                                    <input type="range" min="-180" max="180" value={imgConfig.rotate} 
                                        onChange={e => setImgConfig({...imgConfig, rotate: parseInt(e.target.value)})} 
                                        style={{width:'100%'}} />
                                </label>

                                {/* 第三排：X / Y 位移 (XY軸調教) */}
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', background:'#e6f7ff', padding:'8px', borderRadius:'8px'}}>
                                    <label style={{fontSize:'12px'}}>↔ 水平 (X軸): 
                                        <input type="range" min="-200" max="200" value={imgConfig.x} 
                                            onChange={e => setImgConfig({...imgConfig, x: parseInt(e.target.value)})} 
                                            style={{width:'100%'}} />
                                    </label>
                                    <label style={{fontSize:'12px'}}>↕ 垂直 (Y軸): 
                                        <input type="range" min="-200" max="200" value={imgConfig.y} 
                                            onChange={e => setImgConfig({...imgConfig, y: parseInt(e.target.value)})} 
                                            style={{width:'100%'}} />
                                    </label>
                                </div>
                                
                                <div style={{display:'flex', justifyContent:'flex-end'}}>
                                    <button onClick={() => setImgConfig({ opacity: 0.6, scale: 1, rotate: 0, x: 0, y: 0 })} 
                                            style={{fontSize:'11px', color:THEME.blue, border:'none', background:'none', cursor:'pointer'}}>
                                        ↺ 重置設定
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                {isRound ? (
                    // ================= 圓盤模式 (八線分隔版) =================
                    <div style={{
                        position: 'relative', width: '340px', height: '340px',
                        background: floorPlan ? 'transparent' : '#fffcf5', // 若有圖，底圓變透明
                        borderRadius: '50%',
                        border: `3px solid ${gridBorderColor}`,
                        overflow: 'hidden'
                    }}>
                        {/* 底圖層 */}
                        {floorPlan && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                zIndex: 0, opacity: imgConfig.opacity,
                                // 修改這裡：加入 translate，並放在最前面以確保方向正確
                                transform: `translate(${imgConfig.x}px, ${imgConfig.y}px) scale(${imgConfig.scale}) rotate(${imgConfig.rotate}deg)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible'
                            }}>
                                <img src={floorPlan} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            </div>
                        )}
                        {/* 八宮分隔線 */}
                        {[0, 45, 90, 135].map(angle => (
                            <div key={angle} style={{
                                position: 'absolute',
                                top: '50%', left: '0',
                                width: '100%', height: '1px',
                                background: '#8B4513', // 深棕色線條，像羅庚的格線
                                opacity: 0.6,
                                transform: `translateY(-50%) rotate(${angle + 22.5}deg)`, // 偏移 22.5 度以避開正中方位，形成分隔
                                zIndex: 0
                            }} />
                        ))}


                        {/* 中宮 */}
                        <div 
                            onClick={() => handleSectorClick(4)}
                            style={{
                                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                width: '80px', height: '80px', // 稍微加大一點點以完美遮蓋線頭
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, #fff 40%, #f7e6d4 100%)', 
                                border: '2px solid #bfa07a',
                                zIndex: 20, // 確保蓋過分隔線
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                boxShadow: '0 0 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            {renderCellContent(4, true)}
                        </div>

                        {/* --- 4. 八方宮位內容 (背景透明，只留文字) --- */}
                        {visualMap.map((dataIdx, i) => {
                            const pos = POSITIONS[i];
                            const radius = 115; 
                            
                            // 修正旋轉邏輯，解決離坤消失問題
                            const rotation = pos.angle - 90;
                            const rotateStyle = `rotate(${rotation}deg) translate(${radius}px) rotate(${-rotation}deg)`;
                            
                            const isSelected = selectedSector && selectedSector.guaName === dirNames[dataIdx];

                            return (
                                <div 
                                    key={dataIdx}
                                    onClick={() => handleSectorClick(dataIdx)}
                                    style={{
                                        position: 'absolute', top: '50%', left: '50%',
                                        width: '90px', height: '90px', 
                                        marginTop: '-45px', marginLeft: '-45px', 
                                        transform: rotateStyle, 
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', zIndex: 10, 
                                        // 改動：背景透明，移除預設邊框
                                        background: 'transparent', 
                                        borderRadius: '50%', // 選中時圓形亮起比較好看，或者保持 '8px' 圓角
                                        // 改動：只有被選中時才顯示邊框和淡背景
                                        border: isSelected ? `2px solid ${THEME.blue}` : 'none',
                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.6)' : 'transparent'
                                    }}
                                >
                                    {renderCellContent(dataIdx)}
                                </div>
                            );
                        })}
                        {!isLoggedIn && <Watermark />}
                    </div>
                ) : (
                    // ================= 方盤模式 (已優化透明邏輯) =================
                    <div style={{
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: floorPlan ? '0' : '2px', 
                        background: floorPlan ? 'transparent' : gridBorderColor,
                        border: `1px solid ${gridBorderColor}`,
                        padding: '2px', 
                        borderRadius: '4px',
                        width: '100%', 
                        maxWidth: '350px', 
                        aspectRatio: '1/1',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* 底圖層 */}
                        {floorPlan && (
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                zIndex: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: imgConfig.opacity,
                                // 修改這裡：同樣加入 translate
                                transform: `translate(${imgConfig.x}px, ${imgConfig.y}px) scale(${imgConfig.scale}) rotate(${imgConfig.rotate}deg)`,
                                pointerEvents: 'none', overflow: 'visible'
                            }}>
                                <img src={floorPlan} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', width: 'auto', height: 'auto' }} />
                            </div>
                        )}

                        {/* 格子層 */}
                        {gridOrder.map((idx) => (
                            <div key={idx} onClick={() => handleSectorClick(idx)} style={{ 
                                background: floorPlan ? 'rgba(255, 252, 245, 0.4)' : '#fffcf5', 
                                border: floorPlan ? `1px solid ${gridBorderColor}` : 'none',
                                boxSizing: 'border-box',
                                cursor: 'pointer', 
                                position: 'relative', 
                                zIndex: 1
                            }}>
                                {renderCellContent(idx, idx === 4)}
                            </div>
                        ))}
                        {!isLoggedIn && <Watermark />}
                    </div>
                )}
            </div>

            <div style={cardStyle}>
                <div style={{...sectionTitle, color:'#c41d7f'}}>⚠️ 凶煞警示</div>
                <div style={{fontSize:'14px', display:'flex', flexDirection:'column', gap:'4px'}}>
                     {showAnnual && <div style={{color:THEME.red}}>流年凶方: 五黃({data.advanced.yearlyAfflictions.wuHuang}) / 三煞({data.advanced.yearlyAfflictions.sanSha})</div>}
                     <div>龍上八煞: 忌{data.advanced.sha8}方</div>
                     <div>八路黃泉: {data.advanced.huangQuan ? `忌${data.advanced.huangQuan}方` : '無'}</div>
                </div>
            </div>

            <div style={cardStyle}>
                <div style={{...sectionTitle, color:THEME.blue}}>💨 三元納氣</div>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center', marginBottom:'4px'}}>
                    {naQiRow1.map(gua => (<button key={gua} onClick={() => setNaQiDoor(gua)} style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid #ddd', background: naQiDoor === gua ? THEME.blue : 'white', color: naQiDoor === gua ? 'white' : '#333', cursor:'pointer' }}>{gua}</button>))}
                </div>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center', marginBottom:'12px'}}>
                    {naQiRow2.map(gua => (<button key={gua} onClick={() => setNaQiDoor(gua)} style={{ padding:'6px 10px', borderRadius:'6px', border:'1px solid #ddd', background: naQiDoor === gua ? THEME.blue : 'white', color: naQiDoor === gua ? 'white' : '#333', cursor:'pointer' }}>{gua}</button>))}
                </div>
                {naQiResult && (
                    <div style={{ background: naQiResult.type === '凶' ? '#fff1f0' : (naQiResult.type === '平' ? '#fff7e6' : '#f6ffed'), border: `1px solid ${naQiResult.color}`, borderRadius:'8px', padding:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                            <div style={{fontSize:'12px', color:THEME.gray}}>納氣口：<span style={{fontWeight:'bold'}}>{naQiDoor}宮</span></div>
                            <div style={{fontSize:'18px', fontWeight:'bold', color: naQiResult.color}}>{naQiResult.text}</div>
                        </div>
                        <DoorOpen size={24} color={naQiResult.color}/>
                    </div>
                )}
            </div>

            <AdsterraNarrow />
            <CommercialView isOpen={showCommercial} onClose={() => setShowCommercial(false)} sittingMt={data.sitting} facingMt={data.facing} />
            <DetailModal isOpen={!!selectedSector} onClose={() => setSelectedSector(null)} data={selectedSector} facingDaGua={data.advanced.daGua.face} />
        </div>
    );
};

// 5. 設定頁 (SettingsView) - 更新版
const SettingsView = ({ bookmarks, setBookmarks, chartMode, setChartMode, isLoggedIn, setIsLoggedIn }) => {
    const [password, setPassword] = useState('');
        const APP_INFO = { 
        appName: APP_NAME, 
        version: APP_VERSION, 
        about: "本程式旨在提供專業風水排盤，輔助使用者進行理氣分析，巒頭剋應尚需專業地師實地判斷。電子羅庚並不保證向真確，如有疑慮請找甯博師傅作專業風水勘察。" 
    };

    const handleModeChange = (mode) => {
        setChartMode(mode);
        Preferences.set({ key: 'fengshui_chart_mode', value: mode });
    };
    
    return (
        <div style={{ padding: '16px', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>設定</h2>
            </div>

            <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black, marginBottom: '12px' }}>排盤模式</div>
                <div style={{ display: 'flex', backgroundColor: THEME.bgGray, borderRadius: '20px', padding: '2px' }}>
                    <button 
                        onClick={() => handleModeChange('traditional')} 
                        style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '18px', backgroundColor: chartMode === 'traditional' ? THEME.blue : 'transparent', color: chartMode === 'traditional' ? 'white' : THEME.gray, fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                    >
                        風水羅庚盤
                    </button>
                    <button 
                        onClick={() => handleModeChange('modern')} 
                        style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '18px', backgroundColor: chartMode === 'modern' ? THEME.blue : 'transparent', color: chartMode === 'modern' ? 'white' : THEME.gray, fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                    >
                        現代指南針
                    </button>
                </div>
                <div style={{ fontSize: '11px', color: THEME.gray, marginTop: '8px', paddingLeft: '4px' }}>
                    * 風水羅庚盤為天南地北，左東右西。<br/>
                    * 現代指南針為上北下南，左西右東。
                </div>
            </div>
            
            <WebBackupManager data={bookmarks} onRestore={setBookmarks} prefix="FENGSHUI_BACKUP" />
            <AppInfoCard info={APP_INFO} />
            <BuyMeCoffee />
            
            <div style={{ marginTop: '24px' }}>
                      <button onClick={() => { if(window.confirm('還原預設?')) { setChartMode('traditional'); } }} style={{ width: '100%', padding: '12px', backgroundColor: THEME.bgGray, color: THEME.red, border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                          <RefreshCw size={16} /> 還原預設值
                      </button>
                  </div>
        </div>
    );
};

// =========================================================================
// PART C: 主程式 Shell
// =========================================================================

export default function FengShuiApp() {
    const isAuthorized = useProtection([]);
    const libStatus = useLunarScript();

    // 2. 初始狀態 - 使用西曆 (Gregorian)
    const [period, setPeriod] = useState(9);
    const [gregYear, setGregYear] = useState(new Date().getFullYear());
    const [gregMonth, setGregMonth] = useState(new Date().getMonth() + 1);
    
    const [view, setView] = useState('input');
    const [bookmarks, setBookmarks] = useState([]);
    const [heading, setHeading] = useState(180); 
    const [isFrozen, setIsFrozen] = useState(false);
    const [chartMode, setChartMode] = useState('traditional');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const tabs = [
        { id: 'input', label: '羅庚', icon: Compass },
        { id: 'bookmarks', label: '紀錄', icon: Bookmark },
        { id: 'booking', label: '預約', icon: CalendarCheck },
        { id: 'settings', label: '設定', icon: Settings },
    ];

    useEffect(() => {
        const checkUnlockStatus = async () => {
            try {
                const { value } = await Preferences.get({ key: 'fs_unlocked' });
                if (value === 'true') {
                    setIsLoggedIn(true);
                }
            } catch (e) {
                console.error("讀取解鎖狀態失敗:", e);
            }
        };
        checkUnlockStatus();
    }, []);

    // ★ 3. 處理點擊鎖頭的邏輯
    const handleUnlock = async () => {
        if (isLoggedIn) {
            // 如果已解鎖，詢問是否要重新鎖定
                setIsLoggedIn(false);
                await Preferences.set({ key: 'fs_unlocked', value: 'false' });
        } else {
            // 如果未解鎖，彈出密碼輸入框
            const pwd = window.prompt("請登入", "");
            if (pwd === "mrk888") { // 密碼可以自己改
                setIsLoggedIn(true);
                await Preferences.set({ key: 'fs_unlocked', value: 'true' });
            } else if (pwd !== null) {
                alert('密碼錯誤！');
            }
        }
    };

    // 3. 監聽 Library 狀態，載入完成後自動計算當下時間的元運
    useEffect(() => {
        if (libStatus === 'ready') {
            const now = new Date();
            // 僅在第一次載入時設置為當前時間 (如果 gregYear 是預設值)
            // 這裡可以不用特別操作，因為 useState 初始值已經是當下了
        }
    }, [libStatus]);

    // 監聽流年變化，自動更新元運
    useEffect(() => {
        if (libStatus === 'ready') {
            // 計算選定日期的元運
            // 取 15 日做基準即可，因為我們現在有專業的 getPreciseFengShuiDate
            const refDate = new Date(gregYear, gregMonth - 1, 15);
            const fsData = getPreciseFengShuiDate(refDate);
            
            // 如果計算出的元運與當前 period 不同，則自動更新
            // 這讓用戶選 2023 時自動跳 8 運，選 2024 自動跳 9 運
            if (fsData.period !== period) {
                setPeriod(fsData.period);
            }
        }
    }, [gregYear, gregMonth, libStatus]); // 當年或月改變時觸發

    useEffect(() => {
        const loadBookmarks = async () => {
            try {
                // 使用與存儲時相同的 Key: 'fengshui_bookmarks'
                const { value } = await Preferences.get({ key: 'fengshui_bookmarks' });
                if (value) {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        setBookmarks(parsed);
                    }
                }
            } catch (e) {
                console.error("讀取書籤失敗:", e);
            }
        };
        loadBookmarks();
    }, []);
    
    const handleAnalyze = () => {
        setView('result');
    };

    if (!isAuthorized) return null;
    if (libStatus === 'loading') return <div style={{padding: 40, textAlign:'center'}}>載入風水曆法中...</div>;
    if (libStatus === 'error') return <div style={{padding: 40, textAlign:'center'}}>曆法載入失敗，請檢查網絡。</div>;
    
    const saveBookmark = async (data) => {
        const dataToSave = {
            id: data.id,
            name: data.location || `${data.sitting.name}山${data.facing.name}向`,
            solarDate: new Date().toISOString().split('T')[0],
            period: data.period,
            mountain: data.sitting.name,
            facing: data.facing.name,
            gwaType: '下卦',
            address: data.location,
            rawConfig: { 
                period: data.period, 
                year: data.year, // 這裡是西曆
                month: data.month, // 這裡是西曆
                sitting: data.sitting, 
                facing: data.facing 
            }
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
        await Preferences.set({ key: 'fengshui_bookmarks', value: JSON.stringify(newBk) });
    };

    const deleteBookmark = async (id) => {
        if(window.confirm('確定要刪除這條紀錄嗎？')) {
            const newBk = bookmarks.filter(b => b.id !== id);
            setBookmarks(newBk);
            await Preferences.set({ key: 'fengshui_bookmarks', value: JSON.stringify(newBk) });
        }
    };

    const openBookmark = (item) => {
        const raw = item.rawConfig;
        if (raw && raw.sitting) {
            let h = raw.sitting.angle - 180;
            if (h < 0) h += 360;
            setHeading(h); 
            setPeriod(raw.period);
            setGregYear(raw.year || new Date().getFullYear()); // 兼容舊數據
            setGregMonth(raw.month || 1); // 兼容舊數據
            setView('result');
        } else {
            alert('無法讀取舊格式資料');
        }
    };

    return (
        <div style={COMMON_STYLES.fullScreen}>
            {view === 'input' ? (
                <div style={{position:'absolute', top:0, left:0, width:'100%', zIndex:20}}>
                     <AppHeader title={APP_NAME} logoChar={{ main: '風', sub: '水' }} />
                </div>
            ) : (
                 <AppHeader title={APP_NAME} logoChar={{ main: '風', sub: '水' }} />
            )}

            <div style={{...COMMON_STYLES.contentArea, background: view === 'input' ? '#222' : THEME.bg}}>
                {view === 'input' && (
                    <CompassView 
                        heading={heading} setHeading={setHeading} 
                        isFrozen={isFrozen} setIsFrozen={setIsFrozen} 
                        onAnalyze={handleAnalyze} 
                    />
                )}

                {view === 'result' && (
                    <>
                        <div style={{
                            position: 'relative', padding:'10px 16px', background: THEME.white, 
                            borderBottom:`1px solid ${THEME.border}`, display:'flex', alignItems:'center', justifyContent: 'center', height: '44px'
                        }}>
                            <button onClick={() => setView('input')} style={{
                                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                                background:'none', border:'none', display:'flex', alignItems:'center', gap:'4px', cursor:'pointer', color: THEME.blue, zIndex: 1
                            }}>
                                <ChevronLeft size={20}/>
                            </button>
                            <span style={{fontWeight:'bold', color: THEME.black, fontSize: '16px'}}>排盤分析</span>

                            {/* 在標題列右側加入解鎖 Icon */}
                            <button onClick={handleUnlock} style={{
                                position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                                background:'none', border:'none', display:'flex', alignItems:'center', cursor:'pointer', 
                                color: isLoggedIn ? THEME.lightGray : THEME.lightGray, zIndex: 1
                            }}>
                                {isLoggedIn ? <Unlock size={16}/> : <Lock size={16}/>}
                            </button>
                        </div>

                        <ChartView 
                            heading={heading} setHeading={setHeading}
                            period={period} setPeriod={setPeriod}
                            gregYear={gregYear} setGregYear={setGregYear}
                            gregMonth={gregMonth} setGregMonth={setGregMonth}
                            onSave={saveBookmark}
                            chartMode={chartMode} 
                            isLoggedIn={isLoggedIn}
                        />
                    </>
                )}

                {view === 'bookmarks' && (
                    <div style={{ padding: '16px', paddingBottom: '100px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                            <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>我的堪察紀錄</h2>
                        </div>
                        <BookmarkList bookmarks={bookmarks} onSelect={openBookmark} onDelete={deleteBookmark} />
                        <div style={{ marginTop: '20px' }}><Adsterra /></div>
                    </div>
                )}
                {view === 'booking' && <BookingSystem apiUrl={API_URL} onNavigate={() => setView('input')} />}
                {view === 'settings' && (
                    <SettingsView 
                        bookmarks={bookmarks} setBookmarks={setBookmarks}
                        chartMode={chartMode} setChartMode={setChartMode} 
                        isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}
                    />
                )}
            </div>
            <InstallGuide />
            <BottomTabBar tabs={tabs} currentTab={view === 'result' ? 'input' : view} onTabChange={(id) => setView(id)} />
        </div>
    );
}

// =========================================================================
// 水印樣式定義
// =========================================================================
const watermarkStyle = {
    // 1. 定位：絕對定位，填滿父容器
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    
    // 2. 層疊：必須在最上方 (蓋過底圖、格線、文字)
    zIndex: 100, 
    
    // 3. 佈局：置中顯示
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    
    // 4. 屬性：不擋點擊事件 (非常重要：否則用戶無法點擊宮位看詳情)
    pointerEvents: 'none', 
    
    // 5. 內容樣式
    color: 'rgba(0, 0, 0, 0.13)', // 非常淺的黑色 (主色)
    fontSize: '48px',
    fontWeight: '900',
    fontFamily: 'STHeiti, "Microsoft JhengHei", sans-serif', // 粗體字型
    lineHeight: '1.3',
    letterSpacing: '2px',
    textAlign: 'center',
    
    // 6. 白邊文字效果 (Text Stroke) 
    // 使用 `-webkit-text-stroke` 實現，兼容大部份現代瀏覽器
    WebkitTextStroke: '2px rgba(255, 255, 255, 0.8)', // 半透明白邊
};

const Watermark = () => (
    <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        // 旋轉 -45 度 (從左下到右上，這是最經典的水印方向。若要左上到右下可改為 45deg)
        transform: 'translate(-50%, -50%) rotate(-25deg)', 
        zIndex: 100, // 確保在最上層
        pointerEvents: 'none', // 絕對不能擋住下方宮位的點擊
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        
        // --- 顏色與邊框設定 ---
        color: 'rgba(0, 0, 0, 0.2)', // 極淺的黑色，幾乎透明
        WebkitTextStroke: '2px rgba(255, 255, 255, 0.5)', // 明顯的半透明白邊
        
        // --- 字體設定 (涵蓋各平台的標楷體) ---
        fontFamily: '"LiSu", "隸書", "STLiti", "華文隸書", "BiauKai", "DFKai-SB", "KaiTi", "標楷體", serif', 
        whiteSpace: 'nowrap', // 確保不換行
    }}>
        {/* 主標題：字體放大以橫跨排盤 */}
        <div style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            letterSpacing: '16px', 
            marginLeft: '16px', // 抵銷 letter-spacing 造成的視覺偏移，確保絕對置中
            lineHeight: '1.1'
        }}>
            許甯博
        </div>
        
        {/* 副標題 */}
        <div style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            letterSpacing: '32px', 
            marginLeft: '32px', // 同樣抵銷偏移
            marginTop: '4px' 
        }}>
            版權所有
        </div>
    </div>
);