// 1. 引入共用 UI 和 工具
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import 'react-calendar/dist/Calendar.css';

import { 
  AdBanner, Adsterra, AdsterraNarrow, AppHeader, AppInfoCard, 
  BookingSystem, BottomTabBar, BookmarkList, BuyMeCoffee, 
  InstallGuide, WebBackupManager, 
  COLORS, THEME, COMMON_STYLES,
  QIMEN_STARS_INFO, QIMEN_DOORS_INFO, QIMEN_GODS_INFO, QIMEN_YONG_SHEN, TEN_STEM_COMBINATIONS, PATTERN_INFO
} from '@my-meta/ui';

import { useProtection } from '@my-meta/ui';

// 2. 引入 Icon
import { 
  Bookmark, BookOpen, Briefcase,
  Calendar, CalendarCheck, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, Circle, Compass,
  CloudUpload, DoorOpen, Download,
  Edit3, Eye, EyeOff, Info, Grid, Lock, MapPin,
  RefreshCw, RotateCcw, RotateCw, Save, Settings, Sparkles,
  Trash2, Unlock, User, X
} from 'lucide-react';

// =========================================================================
// PART A: 核心數據與邏輯
// =========================================================================
const APP_NAME = "甯博奇門遁甲";
const APP_VERSION = "v1.3 增加宮位資訊";
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";

// --- 基礎定義 ---
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const CHINESE_NUM = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };

// 原始宮位 (洛書數)
const PALACE_BASE = {
    1: { name: '坎', star: '蓬', door: '休', element: '水', num: 1 },
    2: { name: '坤', star: '芮', door: '死', element: '土', num: 2 },
    3: { name: '震', star: '沖', door: '傷', element: '木', num: 3 },
    4: { name: '巽', star: '輔', door: '杜', element: '木', num: 4 },
    5: { name: '中', star: '禽', door: '',   element: '土', num: 5 },
    6: { name: '乾', star: '心', door: '開', element: '金', num: 6 },
    7: { name: '兌', star: '柱', door: '驚', element: '金', num: 7 },
    8: { name: '艮', star: '任', door: '生', element: '土', num: 8 },
    9: { name: '離', star: '英', door: '景', element: '火', num: 9 }
};

// 原始星門神配置
const ORIGINAL_CONFIG = {
    1: { star: '蓬', door: '休' }, 2: { star: '芮', door: '死' }, 3: { star: '沖', door: '傷' },
    4: { star: '輔', door: '杜' }, 5: { star: '禽', door: '' },   6: { star: '心', door: '開' },
    7: { star: '柱', door: '驚' }, 8: { star: '任', door: '生' }, 9: { star: '英', door: '景' }
};

// 八門五行
const DOOR_ELEMENTS = {
    '休': '水', '生': '土', '傷': '木', '杜': '木',
    '景': '火', '死': '土', '驚': '金', '開': '金'
};

const GAN_ORDER = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
const STAR_ORDER = ['蓬', '任', '沖', '輔', '英', '芮', '柱', '心']; 
const DOOR_ORDER = ['休', '生', '傷', '杜', '景', '死', '驚', '開']; 
const GOD_ORDER = ['符', '蛇', '陰', '合', '虎', '武', '九', '天'];

// 用於轉宮的順時針順序 (坎1 -> 艮8 -> 震3...)
const ROTATION_ORDER = [1, 8, 3, 4, 9, 2, 7, 6];

// Grid 渲染順序
const GRID_RENDER_ORDER = [4, 9, 2, 3, 5, 7, 8, 1, 6];

const useLunarScript = () => {
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Lunar && window.Solar) { setStatus('ready'); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/lunar-javascript@1.6.12/lunar.min.js';
    script.async = true;
    script.onload = () => { if (window.Solar) setStatus('ready'); else setStatus('error'); };
    script.onerror = () => setStatus('error');
    document.body.appendChild(script);
  }, []);
  return status;
};

const getXunInfo = (gan, zhi) => {
    const ganIdx = TIANGAN.indexOf(gan);
    const zhiIdx = DIZHI.indexOf(zhi);
    const diff = (zhiIdx - ganIdx + 12) % 12;
    if (diff === 0) return { xun: '甲子', leader: '戊' };
    if (diff === 10) return { xun: '甲戌', leader: '己' };
    if (diff === 8) return { xun: '甲申', leader: '庚' };
    if (diff === 6) return { xun: '甲午', leader: '辛' };
    if (diff === 4) return { xun: '甲辰', leader: '壬' };
    if (diff === 2) return { xun: '甲寅', leader: '癸' };
    return { xun: '未知', leader: '戊' };
};

// 核心運算
const calculateQiMenResult = (dateObj, rotateOffset = 0) => {
    // 安全檢查
    if (!dateObj || isNaN(dateObj.year)) throw new Error("無效的日期");

    const { year, month, day, hour, minute } = dateObj;
    
    // 1. 子時換日
    const calcDate = new Date(year, month - 1, day, hour, minute);
    if (hour >= 23) {
        calcDate.setDate(calcDate.getDate() + 1);
        calcDate.setHours(0);
    }

    const solar = window.Solar.fromDate(calcDate); 
    const lunar = solar.getLunar();
    const bazi = lunar.getEightChar();
    
    const yearGanZhi = bazi.getYear();
    const monthGanZhi = bazi.getMonth();
    const dayGanZhi = bazi.getDay(); 
    const timeGanZhi = bazi.getTime();
    
    const timeGan = bazi.getTimeGan();
    const timeZhi = bazi.getTimeZhi();
    
    // 定局
    const zhiNumMap = {};
    DIZHI.forEach((z, i) => zhiNumMap[z] = i + 1);
    const yNum = zhiNumMap[bazi.getYearZhi()] || 1;
    
    // --- 修正開始：改用干支月序 (寅=1) 以匹配節氣換年邏輯 ---
    // 原始代碼 (錯誤): const mNum = Math.abs(lunar.getMonth());
    
    const monthZhi = bazi.getMonthZhi(); // 獲取節氣月支 (如 '寅')
    
    // 定義道家陰盤的月份數 (寅月為1, 卯月為2 ... 丑月為12)
    const YIN_PAN_MONTH_MAP = { 
        '寅': 1, '卯': 2, '辰': 3, '巳': 4, '午': 5, '未': 6, 
        '申': 7, '酉': 8, '戌': 9, '亥': 10, '子': 11, '丑': 12 
    };
    
    // 如果找不到映射(防呆)，則回退到農曆月份
    const mNum = YIN_PAN_MONTH_MAP[monthZhi] || Math.abs(lunar.getMonth());
    const dNum = lunar.getDay();
    const hNum = zhiNumMap[timeZhi] || 1;
    
    let sum = yNum + mNum + dNum + hNum;
    let juNum = sum % 9;
    if (juNum === 0) juNum = 9;

    let jieQiName = '';
    let jieQiTimeStr = '';
    let nextJieQiStr = '';
    try { 
        const jq = lunar.getPrevJieQi(true); 
        if (jq) {
            jieQiName = jq.getName();
            jieQiTimeStr = `${jq.getName()} ${jq.getSolar().toYmdHms()}`;
        }
        const nq = lunar.getNextJieQi(false);
        if (nq) {
            nextJieQiStr = `${nq.getName()} ${nq.getSolar().toYmdHms()}`;
        }
    } catch (e) { console.warn('節氣計算異常'); }

    const YANG_JIEQI = ['冬至','小寒','大寒','立春','雨水','驚蟄','春分','清明','穀雨','立夏','小滿','芒種'];
    const isYangDun = YANG_JIEQI.includes(jieQiName);
    const dunType = isYangDun ? '陽' : '陰';

    // 地盤
    const diPanMap = {}; 
    let currGua = juNum;
    GAN_ORDER.forEach((gan) => {
        diPanMap[currGua] = gan;
        if (isYangDun) { currGua++; if (currGua > 9) currGua = 1; } 
        else { currGua--; if (currGua < 1) currGua = 9; }
    });

    // 旬首 & 值符
    const { xun, leader: xunLeaderGan } = getXunInfo(timeGan, timeZhi);
    let xunLeaderGong = 0;
    Object.keys(diPanMap).forEach(g => { if (diPanMap[g] === xunLeaderGan) xunLeaderGong = parseInt(g); });
    if (xunLeaderGong === 0) xunLeaderGong = juNum; 
    const realLeaderGong = xunLeaderGong;
    if (xunLeaderGong === 5) xunLeaderGong = 2; 

    const originStar = ORIGINAL_CONFIG[xunLeaderGong]?.star || '芮'; 
    const originDoor = ORIGINAL_CONFIG[xunLeaderGong]?.door || '死'; 

    // 天盤
    let timeGanGong = 0;
    let timeGanForFind = (timeGan === '甲') ? xunLeaderGan : timeGan;
    Object.keys(diPanMap).forEach(g => { if (diPanMap[g] === timeGanForFind) timeGanGong = parseInt(g); });
    if (timeGanGong === 0) timeGanGong = 2;
    if (timeGanGong === 5) timeGanGong = 2; 

    const starIdxBase = STAR_ORDER.indexOf(originStar);
    const GUA_CLOCKWISE = [1, 8, 3, 4, 9, 2, 7, 6];
    const targetGuaIdx = GUA_CLOCKWISE.indexOf(timeGanGong);

    const tianPanStarMap = {}; 
    GUA_CLOCKWISE.forEach((g, i) => {
        let offset = i - targetGuaIdx;
        let finalStarIdx = (starIdxBase + offset) % 8;
        if (finalStarIdx < 0) finalStarIdx += 8;
        tianPanStarMap[g] = STAR_ORDER[finalStarIdx];
    });
    tianPanStarMap[5] = ''; 

    // 天盤干
    const tianPanGanMap = {};
    Object.keys(tianPanStarMap).forEach(g => {
        const sName = tianPanStarMap[g];
        if (!sName) return;
        let homeGong = 0;
        Object.keys(ORIGINAL_CONFIG).forEach(k => {
            if (ORIGINAL_CONFIG[k].star === sName) homeGong = parseInt(k);
        });
        let ganStr = diPanMap[homeGong] || '';
        
        // 修正：如果在計算數據階段就處理「天芮星」寄宮邏輯
        // 這樣後續計算「暗干(引干)」引用天盤干時，就會自動包含雙星
        if (sName === '芮') {
            const centerGan = diPanMap[5]; // 取中宮地盤干
            if (centerGan) ganStr += centerGan;
        }
        
        tianPanGanMap[g] = ganStr;
    });

    // 八門
    const xunZhiIdx = DIZHI.indexOf(xun.substring(1));
    const timeZhiIdx = DIZHI.indexOf(timeZhi);
    let diff = timeZhiIdx - xunZhiIdx;
    if (diff < 0) diff += 12;

    let doorGong = xunLeaderGong;

    if (originStar === '芮' && realLeaderGong === 5) {
        doorGong = 5;
    }

    for (let k = 0; k < diff; k++) {
        if (isYangDun) { doorGong++; if (doorGong > 9) doorGong = 1; }
        else { doorGong--; if (doorGong < 1) doorGong = 9; }
    }
    if (doorGong === 5) doorGong = 2;

    const doorIdxBase = DOOR_ORDER.indexOf(originDoor);
    const targetDoorGuaIdx = GUA_CLOCKWISE.indexOf(doorGong);

    const menMapResult = {};
    GUA_CLOCKWISE.forEach((g, i) => {
        let offset = i - targetDoorGuaIdx;
        let finalDoorIdx = (doorIdxBase + offset) % 8;
        if (finalDoorIdx < 0) finalDoorIdx += 8;
        menMapResult[g] = DOOR_ORDER[finalDoorIdx];
    });
    menMapResult[5] = ''; 

    // 八神
    const targetGodGuaIdx = GUA_CLOCKWISE.indexOf(timeGanGong);
    const shenMapResult = {};
    GUA_CLOCKWISE.forEach((g, i) => {
        let offset = i - targetGodGuaIdx;
        if (!isYangDun) offset = -offset;
        let finalGodIdx = offset % 8;
        if (finalGodIdx < 0) finalGodIdx += 8;
        shenMapResult[g] = GOD_ORDER[finalGodIdx];
    });
    shenMapResult[5] = '';

    // 地盤八神
    const targetDiGodGuaIdx = GUA_CLOCKWISE.indexOf(xunLeaderGong);
    const diShenMapResult = {};
    GUA_CLOCKWISE.forEach((g, i) => {
        let offset = i - targetDiGodGuaIdx;
        if (!isYangDun) offset = -offset;
        let finalGodIdx = offset % 8;
        if (finalGodIdx < 0) finalGodIdx += 8;
        diShenMapResult[g] = GOD_ORDER[finalGodIdx];
    });

// --- 暗干 (引干) 邏輯：旬首入中宮飛排 ---
    const anGanMap = {};
    const FLY_PATH = [5, 6, 7, 8, 9, 1, 2, 3, 4]; // 九宮飛泊路徑

    // 1. 判定觸發條件
    // A. 時干為甲 (例如甲午時)
    // B. 時干與值使門宮位的天盤干相同 (時干受阻)
    const startGong = (doorGong === 5) ? 2 : doorGong;
    const tianAtDoor = tianPanGanMap[startGong] || "";
    const isSpecialCase = (timeGan === '甲' || tianAtDoor.includes(timeGan === '甲' ? xunLeaderGan : timeGan));

    if (isSpecialCase) {
        // 邏輯：旬首入中宮，按陽順陰逆飛泊
        // 找到旬首天干在 GAN_ORDER 中的起始索引
        let ganIdx = GAN_ORDER.indexOf(xunLeaderGan);
        
        FLY_PATH.forEach((gongNum) => {
            anGanMap[gongNum] = GAN_ORDER[ganIdx];
            
            // 根據陰陽遁決定天干前進方向
            if (isYangDun) {
                ganIdx = (ganIdx + 1) % 9;
            } else {
                ganIdx = (ganIdx - 1 + 9) % 9;
            }
        });

        // 特殊處理：將中宮 (5) 的引干併入坤二宮 (2)
        const centerGan = anGanMap[5];
        if (centerGan) {
            // 如果二宮已有引干，則合併（如：戊辛）
            anGanMap[2] = (anGanMap[2] && anGanMap[2] !== centerGan) 
                ? anGanMap[2] + centerGan 
                : centerGan;
        }
    } else {
        // --- 原有的「時干加臨值使門」轉宮邏輯 ---
        const ROTATE_PATH = [1, 8, 3, 4, 9, 2, 7, 6];
        const tianPanOrder = ROTATE_PATH.map(g => tianPanGanMap[g] || "");
        let effectiveTimeGan = (timeGan === '甲') ? xunLeaderGan : timeGan;
        
        let startGanIdx = tianPanOrder.indexOf(effectiveTimeGan);
        if (startGanIdx === -1) startGanIdx = 0;
        let startGongIdx = ROTATE_PATH.indexOf(startGong);

        for (let i = 0; i < 8; i++) {
            const curGong = ROTATE_PATH[(startGongIdx + i) % 8];
            const curGan = tianPanOrder[(startGanIdx + i) % 8];
            anGanMap[curGong] = curGan;
            if (curGong === 2) anGanMap[5] = curGan;
        }
    }
    
    // --- 轉宮邏輯 (Rotate) ---
    // 建立 "目前狀態" 的 Map
    const currentLayout = {};
    [1,2,3,4,5,6,7,8,9].forEach(g => {
        currentLayout[g] = {
            star: tianPanStarMap[g] || '',
            men: menMapResult[g] || '',
            shen: shenMapResult[g] || '',
            diShen: diShenMapResult[g] || '',
            tian: tianPanGanMap[g] || '',
            di: diPanMap[g] || '',
            an: anGanMap[g] || ''
        };
    });

    // 建立 "轉動後" 的 Map
    const rotatedLayout = { ...currentLayout }; 
    if (rotateOffset !== 0) {
        const len = ROTATION_ORDER.length; // 8
        ROTATION_ORDER.forEach((g, i) => {
            let sourceIdx = (i - rotateOffset) % len;
            if (sourceIdx < 0) sourceIdx += len;
            const sourceGua = ROTATION_ORDER[sourceIdx];
            // 轉動時，將來源宮位的內容複製到當前宮位
            // 注意：如果 sourceGua 不存在(防呆)，則維持原樣
            if (currentLayout[sourceGua]) {
                rotatedLayout[g] = currentLayout[sourceGua];
            }
        });
    }

    // --- 特殊標記 ---
    const kongWangMap = { '甲子': ['戌','亥'], '甲戌': ['申','酉'], '甲申': ['午','未'], '甲午': ['辰','巳'], '甲辰': ['寅','卯'], '甲寅': ['子','丑'] };
    const kwZhis = kongWangMap[xun] || [];
    const GUA_ZHI_MAP = { 1: ['子'], 8: ['丑','寅'], 3: ['卯'], 4: ['辰','巳'], 9: ['午'], 2: ['未','申'], 7: ['酉'], 6: ['戌','亥'] };
    const kwGongs = [];
    Object.keys(GUA_ZHI_MAP).forEach(gNum => { if (GUA_ZHI_MAP[gNum].some(z => kwZhis.includes(z))) kwGongs.push(parseInt(gNum)); });

    let maXingGong = 0;
    if (['申','子','辰'].includes(timeZhi)) maXingGong = 8;
    else if (['寅','午','戌'].includes(timeZhi)) maXingGong = 2;
    else if (['亥','卯','未'].includes(timeZhi)) maXingGong = 4;
    else if (['巳','酉','丑'].includes(timeZhi)) maXingGong = 6;

    const jiXingRules = { '戊':3, '己':2, '庚':8, '辛':9, '壬':4, '癸':4 };
    const ruMuRules = { 8: ['丁','己','庚'], 6: ['乙','丙','戊'], 4: ['辛','壬'], 2: ['癸','乙'] };

    let starFuyin = (tianPanStarMap[1] === '蓬');
    let starFanyin = (tianPanStarMap[9] === '蓬');
    let doorFuyin = (menMapResult[1] === '休');
    let doorFanyin = (menMapResult[9] === '休');

    const patterns = [];
    if (starFuyin) patterns.push('天干伏吟');
    if (starFanyin) patterns.push('天干反吟');
    if (doorFuyin) patterns.push('八門伏吟');
    if (doorFanyin) patterns.push('八門反吟');
    // if (rotateOffset !== 0) patterns.push(`轉宮${rotateOffset > 0 ? '+' : ''}${rotateOffset}`);

    // 整合顯示數據 (確保所有欄位都有值，防止 undefined 導致崩潰)
    const dayGan = bazi.getDayGan();
    const gridData = GRID_RENDER_ORDER.map(num => {
        const base = PALACE_BASE[num];
        const content = rotatedLayout[num] || { star:'', men:'', shen:'', diShen:'', tian:'', di:'', an:'' };

        let tianGanStr = content.tian || '';

        let diGanStr = content.di || '';
        if (diGanStr === diPanMap[2]) {
            const g5 = diPanMap[5];
            if (g5 && !diGanStr.includes(g5)) diGanStr += g5;
        }

        const tianMain = tianGanStr[0];
        const diMain = diGanStr[0];

        // 定義檢查函式：遍歷字串中每一個天干，檢查是否在當前宮位犯刑
        const checkXing = (str) => {
            if (!str) return false;
            // jiXingRules = { '戊':3, '己':2, '庚':8, '辛':9, '壬':4, '癸':4 }
            return str.split('').some(gan => jiXingRules[gan] === num);
        };

        // 1. 六儀擊刑 (只要天盤或地盤字串中包含犯刑的天干，即標記為刑)
        let isXing = checkXing(tianGanStr) || checkXing(diGanStr);

        // 2. 特殊自刑：辛辛、壬壬 (保留原有邏輯作為補充)
        const tianHasXin = tianGanStr.includes('辛');
        const diHasXin = diGanStr.includes('辛');
        const tianHasRen = tianGanStr.includes('壬');
        const diHasRen = diGanStr.includes('壬');

        if ((tianHasXin && diHasXin) || (tianHasRen && diHasRen)) {
            isXing = true;
        }

        const checkMu = (str) => {
            const rules = ruMuRules[num];
            if (!rules) return false;
            return str.split('').some(g => rules.includes(g));
        }
        let isMu = checkMu(tianGanStr) || checkMu(diGanStr);
        if (num === 2 && (content.shen === '符' || content.diShen === '符')) isMu = true;

        const doorEle = DOOR_ELEMENTS[content.men] || '';
        const palaceEle = base.element;
        let isPo = false;
        if (doorEle === '金' && palaceEle === '木') isPo = true;
        if (doorEle === '木' && palaceEle === '土') isPo = true;
        if (doorEle === '土' && palaceEle === '水') isPo = true;
        if (doorEle === '水' && palaceEle === '火') isPo = true;
        if (doorEle === '火' && palaceEle === '金') isPo = true;

        const isDayGan = tianGanStr.includes(dayGan);

        return {
            num: num,
            name: base.name,
            shen: content.shen || '',
            diShen: content.diShen || '',
            star: content.star || '',
            men: content.men || '',
            tian: tianGanStr,
            di: diGanStr,
            an: content.an || '',
            isKong: kwGongs.includes(num), 
            isMa: (maXingGong === num),    
            isXing: isXing,
            isMu: isMu,
            isPo: isPo,
            isDayGan: isDayGan
        };
    });

    // 局數中文
    const juNumCN = CHINESE_NUM[juNum];

    return {
        id: Date.now(),
        solarDateStr: `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,
        lunarDateStr: `${yearGanZhi}年 ${monthGanZhi}月 ${dayGanZhi}日 ${timeGanZhi}時`,
        jieQi: jieQiName,
        jieQiTime: jieQiTimeStr,
        nextJieQiTime: nextJieQiStr,
        juName: `${dunType}${juNumCN}局`, // 改為中文數字
        xunInfo: `${xun}${xunLeaderGan}`,
        zhiFuStar: `天${originStar}`,
        zhiShiDoor: `${originDoor}門`,
        grid: gridData,
        patterns: patterns,
        rawDate: dateObj
    };
};

// =========================================================================
// PART B: 視圖組件
// =========================================================================

// 快速調整按鈕 (時辰/日期) - 包含 4 個按鈕
const QuickAdjustBar = ({ currentDate, onDateChange }) => {
    if (!currentDate || isNaN(currentDate.getTime())) return null;
    const adjust = (type, val) => {
        const newDate = new Date(currentDate);
        if (type === 'day') newDate.setDate(newDate.getDate() + val);
        if (type === 'hour') newDate.setHours(newDate.getHours() + (val * 2)); 
        onDateChange(newDate);
    };
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <button onClick={() => adjust('day', -1)} style={navBtnStyle}><ChevronLeft size={14}/> 前一日</button>
            <button onClick={() => adjust('day', 1)} style={navBtnStyle}>後一日 <ChevronRight size={14}/></button>
            <button onClick={() => adjust('hour', -1)} style={navBtnStyle}><ChevronLeft size={14}/> 上時辰</button>
            <button onClick={() => adjust('hour', 1)} style={navBtnStyle}>下時辰 <ChevronRight size={14}/></button>
        </div>
    );
};
const navBtnStyle = { 
    padding: '8px 2px', borderRadius: '8px', border: `1px solid ${THEME.border}`, 
    backgroundColor: THEME.bgGray, color: THEME.black, fontSize: '11px', fontWeight: 'bold',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', whiteSpace: 'nowrap'
};

// 轉宮控制條
const RotateControlBar = ({ rotateOffset, onRotate }) => {
    const btnStyle = {
        flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${THEME.border}`,
        backgroundColor: THEME.bgGray, color: THEME.black, fontSize: '11px', fontWeight: 'bold',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
    };
    const centerStyle = { ...btnStyle, backgroundColor: THEME.bgGray, color: THEME.black, border: `1px solid ${THEME.border}` };

    return (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button onClick={() => onRotate(-1)} style={btnStyle} disabled={rotateOffset <= -7}>
                <RotateCcw size={14}/> 逆轉 (轉宮)
            </button>
            <button onClick={() => onRotate(0)} style={centerStyle}>
                原局
            </button>
            <button onClick={() => onRotate(1)} style={btnStyle} disabled={rotateOffset >= 7}>
                順轉 (轉宮) <RotateCw size={14}/>
            </button>
        </div>
    );
};

const InputView = ({ onCalculate, initialData }) => {
    const [date, setDate] = useState(() => {
        if (initialData) {
            const d = new Date(initialData.year, initialData.month - 1, initialData.day, initialData.hour, initialData.minute);
            return isNaN(d.getTime()) ? new Date() : d;
        }
        return new Date();
    });
    const years = useMemo(() => { const arr = []; for (let i = 1900; i <= 2100; i++) arr.push(i); return arr; }, []);
    const months = useMemo(() => Array.from({length: 12}, (_, i) => i + 1), []);
    const days = useMemo(() => {
        const d = isNaN(date.getTime()) ? new Date() : date;
        const max = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return Array.from({length: max}, (_, i) => i + 1);
    }, [date]);
    const hours = useMemo(() => Array.from({length: 24}, (_, i) => i), []);
    const minutes = useMemo(() => Array.from({length: 60}, (_, i) => i), []);

    const handleChange = (field, val) => {
        const d = new Date(date);
        if (field === 'year') d.setFullYear(val);
        if (field === 'month') d.setMonth(val - 1);
        if (field === 'day') d.setDate(val);
        if (field === 'hour') d.setHours(val);
        if (field === 'minute') d.setMinutes(val);
        setDate(d);
    };
    const handleCalculate = () => {
        const formData = {
            year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(),
            hour: date.getHours(), minute: date.getMinutes()
        };
        onCalculate(formData);
    };
    const selectStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white', fontSize: '14px', color: '#333' };
    const safeDate = isNaN(date.getTime()) ? new Date() : date;

    return (
        <div style={{ padding: '16px', backgroundColor: THEME.bg, flex: 1, overflowY: 'auto' }}>
            <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '24px', border: `1px solid ${THEME.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', color: THEME.black, fontSize: '18px', fontWeight: 'bold' }}>{initialData ? '修改時間' : '陰盤奇門排盤'}</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ flex: 1.2 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>西元年</label> <select value={safeDate.getFullYear()} onChange={e => handleChange('year', parseInt(e.target.value))} style={selectStyle}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select> </div>
                    <div style={{ flex: 0.8 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>月</label> <select value={safeDate.getMonth() + 1} onChange={e => handleChange('month', parseInt(e.target.value))} style={selectStyle}>{months.map(m => <option key={m} value={m}>{m}</option>)}</select> </div>
                    <div style={{ flex: 0.8 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>日</label> <select value={safeDate.getDate()} onChange={e => handleChange('day', parseInt(e.target.value))} style={selectStyle}>{days.map(d => <option key={d} value={d}>{d}</option>)}</select> </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: THEME.gray, marginBottom: '6px' }}>時間</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1 }}> <select value={safeDate.getHours()} onChange={e => handleChange('hour', parseInt(e.target.value))} style={selectStyle}>{hours.map(h => <option key={h} value={h}>{h}時</option>)}</select> </div>
                        <span>:</span>
                        <div style={{ flex: 1 }}> <select value={safeDate.getMinutes()} onChange={e => handleChange('minute', parseInt(e.target.value))} style={selectStyle}>{minutes.map(m => <option key={m} value={m}>{m}分</option>)}</select> </div>
                    </div>
                </div>
                
                <QuickAdjustBar currentDate={safeDate} onDateChange={setDate} />

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button onClick={() => setDate(new Date())} style={{ padding: '14px', borderRadius: '30px', border: `1px solid ${THEME.border}`, backgroundColor: THEME.white, color: THEME.gray, fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>現在</button>
                    <button onClick={handleCalculate} style={{ flex: 1, padding: '14px', backgroundColor: THEME.blue, color: 'white', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}><Sparkles size={18} />{initialData ? '重新排盤' : '開始排盤'}</button>
                </div>
            </div>
        </div>
    );
};

const PalaceCell = ({ data, patterns, extraInfo, onClick }) => {
    const combinedCellStyle = { ...cellStyle, cursor: 'pointer' };
    if (data.num === 5) {
        return (
            <div 
                style={{ ...cellStyle, backgroundColor: '#fffbe6', justifyContent: 'center' }}
                onClick={() => onClick({ ...data, patterns })}
            >
                {/* 局數 與 轉宮狀態 (顯示在同一行) */}
                <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px', color: THEME.black, fontWeight: 'bold' }}>{extraInfo.juName}</span>
                    {extraInfo.rotateStatus && (
                        <span style={{ fontSize: '10px', color: THEME.red, fontWeight: 'bold' }}>
                            {extraInfo.rotateStatus}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#555', marginBottom: '6px' }}>
                    <span>{extraInfo.xunInfo}旬 {extraInfo.timeStr}</span>
                </div>
                {/* 值符值使同行 */}
                <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: THEME.blue, fontWeight: '500' }}>
                    <span>值符: {extraInfo.zhiFuStar}</span>
                    <span>值使: {extraInfo.zhiShiDoor}</span>
                </div>
                {/* 顯示特別格局 */}
                {patterns && patterns.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', alignItems: 'center', borderTop:'2px', marginTop:'2px', paddingTop:'2px', width:'100%' }}>
                        {patterns.map((p, i) => (
                            <span key={i} style={{ fontSize: '14px', color: THEME.red, fontWeight: 'bold' }}>{p}</span>
                        ))}
                    </div>
                )}
            </div>
        );
    }
    
    // --- 絕對定位佈局 ---
    const ROW2_TOP = '24px';  // 神
    const ROW3_TOP = '48px';  // 星
    const ROW4_TOP = '74px';  // 門

    const centerStyle = { position: 'absolute', left: 0, right: 0, textAlign: 'center', width: '100%', zIndex: 1 };
    const leftStyle = { position: 'absolute', left: '4px', width: '38px', display: 'flex', justifyContent: 'center', zIndex: 2 };
    const rightStyle = { 
        position: 'absolute', 
        right: '4px',         // 統一靠右距離
        width: '42px',        // 固定寬度 (容納雙字)
        display: 'flex', 
        justifyContent: 'center', // 水平置中
        zIndex: 2 
    };
    // 安全處理 data.an (確保是字串)
    const anGan = data.an || '';

    return (
        <div style={combinedCellStyle} onClick={() => onClick(data)}>
            <div style={{ position: 'absolute', top: 2, right: 4, fontSize: '12px', fontWeight: 'bold', color: THEME.black }}>
                {data.name}
            </div>

            <div style={{ marginTop: '18px', width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* 第2行 */}
                <div style={{ position: 'absolute', top: ROW2_TOP, width: '100%' }}>
                    <div style={{ ...leftStyle, color: THEME.red, fontWeight: 'bold', fontSize: '14px' }}>
                        {data.isKong ? '空' : ''}
                    </div>
                    <div style={{ ...centerStyle, fontSize: '18px', color: THEME.purple, fontWeight: 'bold' }}>
                        {data.shen}
                    </div>
                    <div style={{ ...rightStyle, fontSize: '18px', color: THEME.gray, fontWeight: 'bold' }}>
                        {data.diShen}
                    </div>
                </div>

                {/* 第3行 */}
                <div style={{ position: 'absolute', top: ROW3_TOP, width: '100%' }}>
                    <div style={{ 
                        ...leftStyle, 
                        fontSize: '18px',     // 恢復原大小
                        color: THEME.gray, 
                        letterSpacing: anGan.length > 1 ? '-1px' : '0', // 雙字時縮減字距，防止換行或溢出
                        lineHeight: '1.6',
                        fontWeight: 'bold',   // 保持粗體
                        whiteSpace: 'nowrap'
                    }}>
                        {anGan}
                    </div>
                    <div style={{ ...centerStyle, fontSize: '18px', color: THEME.black, fontWeight: 'bold' }}>
                        {data.star}
                    </div>
                    <div style={rightStyle}>
                        <span style={{
                            display: 'inline-block',
                            fontSize: data.isDayGan && data.tian.length > 1 ? '18px' : '18px',
                            fontWeight: 'bold',
                            color: data.isDayGan ? THEME.white : THEME.black,
                            backgroundColor: data.isDayGan ? THEME.green : 'transparent',
                            borderRadius: '4px',
                            padding: data.isDayGan ? '0px 1px' : '0',
                            lineHeight: '1.6',
                            letterSpacing: data.tian.length > 1 ? '-1px' : '0' // 雙字微調，單字不加寬
                        }}>
                            {data.tian}
                        </span>
                    </div>
                </div>

                {/* 第4行 */}
                <div style={{ position: 'absolute', top: ROW4_TOP, width: '100%' }}>
                    <div style={{ ...centerStyle, fontSize: '18px', color: THEME.orange, fontWeight: 'bold' }}>
                        {data.men}
                    </div>
                    <div style={{ ...rightStyle, fontSize: '18px', color: THEME.black, fontWeight: 'bold', letterSpacing: data.di.length > 1 ? '-1px' : '0' }}>
                        {data.di}
                    </div>
                </div>
            </div>

            {/* 第5行 */}
            <div style={{ position: 'absolute', bottom: 2, width: '100%', display: 'flex', justifyContent: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: THEME.red, visibility: data.isMa ? 'visible' : 'hidden' }}>馬</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: THEME.red, visibility: data.isPo ? 'visible' : 'hidden' }}>迫</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: THEME.red, visibility: data.isXing ? 'visible' : 'hidden' }}>刑</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: THEME.red, visibility: data.isMu ? 'visible' : 'hidden' }}>墓</span>
            </div>
        </div>
    );
};

const cellStyle = {
    backgroundColor: THEME.white, border: `1px solid ${THEME.border}`, position: 'relative', height: '100%', minHeight: '125px', padding: '2px', boxSizing: 'border-box'
};

const DetailModal = ({ data, onClose }) => {
    if (!data) return null;

    // 取得各項資訊
    const starInfo = QIMEN_STARS_INFO[data.star] || { title: data.star, text: '暫無詳細定義' };
    const doorInfo = QIMEN_DOORS_INFO[data.men] || { title: data.men, text: '暫無詳細定義' };
    const godInfo = QIMEN_GODS_INFO[data.shen] || { title: data.shen, text: '暫無詳細定義' };
    
    // 從 data 中取出 patterns 與 extraInfo
    const { patterns, extraInfo } = data;

    // ================= 修改開始：處理多重天干組合 =================
    // 邏輯：如果 天=A, 地=BC
    // 組合應為：A+B (天地), A+C (天地), B+C (地盤內在/寄宮)
    
    const getStemCombinations = () => {
        const combos = [];
        // 將字串拆解為陣列 (防呆：確保是字串)
        const tianStems = (data.tian || '').split(''); // e.g., ['乙'] 或 ['戊','癸']
        const diStems = (data.di || '').split('');     // e.g., ['丙'] 或 ['辛','壬']

        // 1. 天盤 vs 地盤 (主剋應)
        // 迴圈：拿每一個天盤干 去配 每一個地盤干
        tianStems.forEach(t => {
            diStems.forEach(d => {
                combos.push({
                    top: t,
                    bottom: d,
                    type: '天盤地盤' // 標記類型
                });
            });
        });

        // 2. 地盤內部雙干 (寄宮關係)
        // 如果地盤有兩個字 (例如 BC)，則產生 B+C
        if (diStems.length > 1) {
            combos.push({
                top: diStems[0],
                bottom: diStems[1],
                type: '地盤'
            });
        }

        // 3. 天盤內部雙干 (雖然較少見，但若天禽星在天盤也可能出現雙干)
        if (tianStems.length > 1) {
            combos.push({
                top: tianStems[0],
                bottom: tianStems[1],
                type: '天盤'
            });
        }

        return combos;
    };

    const stemCombos = getStemCombinations();

    return (
        <div style={modalStyles.overlay} onClick={onClose}>
            <div style={modalStyles.content} onClick={e => e.stopPropagation()}>
                {/* 標題欄 */}
                <div style={modalStyles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ ...modalStyles.palaceTag, backgroundColor: data.num === 5 ? THEME.orange : THEME.blue }}>
                            {data.num === 5 ? '中' : data.name}宮
                        </div>
                    </div>
                    <X size={24} onClick={onClose} style={{ cursor: 'pointer', color: THEME.gray }} />
                </div>

                <div style={modalStyles.body}>
                    
                    {/* 1. 全局格局 (伏吟/反吟) */}
                    {patterns && patterns.length > 0 ? (
                        <section style={modalStyles.section}>
                            <div style={{ ...modalStyles.label, color: THEME.red }}>
                                <Info size={16} style={{ marginRight: '4px' }} />
                                全局格局
                            </div>
                            {patterns.map((p, index) => {
                                // 加入安全檢查，確保 PATTERN_INFO 有載入
                                const info = PATTERN_INFO ? PATTERN_INFO[p] : null;
                                if (!info) return (
                                    <div key={index} style={{ marginBottom: '8px', color: 'red', fontSize: '12px' }}>
                                        {p} (詳細解釋未載入)
                                    </div>
                                );
                                return (
                                    <div key={index} style={{ marginBottom: '12px', backgroundColor: '#fff5f5', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}` }}>
                                        <div style={{ fontWeight: 'bold', color: '#c0392b', marginBottom: '4px' }}>{info.title}</div>
                                        <div style={{ fontSize: '14px', color: '#555', lineHeight: '1.5' }}>{info.text}</div>
                                    </div>
                                );
                            })}
                        </section>
                    ) : (
                        // 如果是中宮且沒有伏吟反吟，顯示提示
                        data.num === 5 && (
                            <div style={{ padding: '10px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
                                此局無伏吟或反吟格局
                            </div>
                        )
                    )}

                    {/* 2. 十干克應 (動態列表渲染) */}
                    {data.num !== 5 && (
                        <section style={modalStyles.section}>
                            <div style={{ ...modalStyles.label, color: THEME.blue }}>
                                天干格局
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {stemCombos.map((combo, idx) => {
                                    const stemKey = `${combo.top}${combo.bottom}`;
                                    const info = TEN_STEM_COMBINATIONS[stemKey] || { title: `${combo.top}+${combo.bottom}`, text: '無特殊記載' };
                                    
                                    return (
                                        <div key={idx} style={{ backgroundColor: '#f0f7ff', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.blue}44` }}>
                                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 'bold', color: THEME.blue }}>
                                                    {combo.top} + {combo.bottom} <span style={{fontSize:'0.8em', color:'#666'}}>({info.title})</span>
                                                </span>
                                                <span style={{ fontSize: '10px', backgroundColor: '#fff', padding: '2px 6px', borderRadius: '4px', color: '#888', border:'1px solid #eee' }}>
                                                    {combo.type}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '14px', color: '#444', margin: 0 }}>{info.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                    
                    {/* 3. 神、星、門資訊 (非中宮才顯示) */}
                    {data.num !== 5 && (
                        <>
                             <section style={modalStyles.section}>
                                <div style={{ ...modalStyles.label, color: '#8e44ad' }}>
                                    八神：{godInfo.title}
                                </div>
                                <p style={modalStyles.text}>{godInfo.text}</p>
                            </section>

                            <section style={modalStyles.section}>
                                <div style={{ ...modalStyles.label, color: '#d35400' }}>
                                    九星：{starInfo.title}
                                </div>
                                <p style={modalStyles.text}>{starInfo.text}</p>
                            </section>

                            <section style={modalStyles.section}>
                                <div style={{ ...modalStyles.label, color: '#27ae60' }}>
                                    八門：{doorInfo.title}
                                </div>
                                <p style={modalStyles.text}>{doorInfo.text}</p>
                            </section>
                            
                            {(data.isKong || data.isMa || data.isXing || data.isMu || data.isPo) && (
                                <div style={modalStyles.warningBox}>
                                    {data.isKong && <span>空亡 </span>}
                                    {data.isMa && <span>天馬 </span>}
                                    {data.isXing && <span>擊刑 </span>}
                                    {data.isMu && <span>入墓 </span>}
                                    {data.isPo && <span>門迫 </span>}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// 精美樣式定義
const modalStyles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 9999,
        backdropFilter: 'blur(4px)'
    },
    content: {
        backgroundColor: '#fff', width: '90%', maxWidth: '380px',
        borderRadius: '20px', padding: '24px', position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        maxHeight: '60vh', overflowY: 'auto'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '12px'
    },
    palaceTag: {
        color: '#fff', padding: '2px 10px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold'
    },
    section: {
        marginBottom: '18px'
    },
    label: {
        fontSize: '15px', fontWeight: 'bold', marginBottom: '6px',
        display: 'flex', alignItems: 'center'
    },
    text: {
        fontSize: '14px', color: '#444', lineHeight: '1.6', margin: 0,
        backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px'
    },
    warningBox: {
        marginTop: '10px', padding: '10px', borderRadius: '8px',
        backgroundColor: '#fff5f5', color: '#c0392b', fontSize: '14px',
        fontWeight: 'bold', textAlign: 'center', border: '1px solid #feb2b2'
    },
    closeBtn: {
        width: '100%', marginTop: '10px', padding: '12px',
        backgroundColor: THEME.black, color: '#fff', border: 'none',
        borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
    }
};

const ResultView = ({ data, onSave, onBack, onRecalculate }) => {
    const [rotateOffset, setRotateOffset] = useState(0);
    const [selectedPalace, setSelectedPalace] = useState(null);
    useEffect(() => { setRotateOffset(0); }, [data.id]);

    if (!data) return null;
    const currentDateObj = new Date(data.rawDate.year, data.rawDate.month - 1, data.rawDate.day, data.rawDate.hour, data.rawDate.minute);
    
    const handleDateChange = (newDate) => {
        const formData = {
            year: newDate.getFullYear(), month: newDate.getMonth() + 1, day: newDate.getDate(),
            hour: newDate.getHours(), minute: newDate.getMinutes()
        };
        onRecalculate(formData);
    };

    const currentData = useMemo(() => {
        if (rotateOffset === 0) return data;
        return calculateQiMenResult(data.rawDate, rotateOffset);
    }, [data, rotateOffset]);

    const extraInfo = {
        juName: currentData.juName,
        xunInfo: currentData.xunInfo,
        zhiFuStar: currentData.zhiFuStar,
        zhiShiDoor: currentData.zhiShiDoor,
        rotateStatus: rotateOffset !== 0 ? `轉宮${rotateOffset > 0 ? '+' : ''}${rotateOffset}` : '',
        timeStr: currentData.lunarDateStr.split(' ').pop()
    };

    const handleRotate = (val) => {
        if (val === 0) setRotateOffset(0);
        else {
            const newOffset = rotateOffset + val;
            if (newOffset >= -7 && newOffset <= 7) setRotateOffset(newOffset);
        }
    };

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: THEME.bg }}>
            <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ fontSize: '13px', color: THEME.gray }}>{currentData.solarDateStr}</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: THEME.black, marginBottom: '4px' }}>{currentData.lunarDateStr}</div>
                        {/* 節氣資訊 */}
                        <div style={{ fontSize: '12px', color: THEME.purple, marginBottom: '8px', borderLeft: `3px solid ${THEME.blue}`, paddingLeft: '6px' }}>
                            <div>{data.jieQiTime}</div>
                            <div>{data.nextJieQiTime}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onBack} style={{ padding: '8px', borderRadius: '50%', border: `1px solid ${THEME.border}`, backgroundColor: 'white', color: THEME.gray }}><RefreshCw size={18} /></button>
                        <button onClick={() => onSave(currentData)} style={{ padding: '8px', borderRadius: '50%', border: `1px solid ${THEME.blue}`, backgroundColor: THEME.bgBlue, color: THEME.blue }}><Save size={18} /></button>
                    </div>
                </div>
            </div>
            
            <QuickAdjustBar currentDate={currentDateObj} onDateChange={handleDateChange} />
            <RotateControlBar rotateOffset={rotateOffset} onRotate={handleRotate} />

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gridTemplateRows: 'repeat(3, 1fr)', 
                gap: '1px', 
                backgroundColor: '#000', 
                border: `2px solid ${THEME.black}`, 
                borderRadius: '4px', 
                aspectRatio: '1/1', 
                marginBottom: '20px',
                maxWidth: '500px',       // 1. 限制最大寬度 (電腦版不會超過 600px)
                margin: '0 auto 20px',   // 2. 上0、左右自動(居中)、下20px
            }}>
                {currentData.grid.map((cell, idx) => <PalaceCell key={idx} data={cell} patterns={currentData.patterns} extraInfo={extraInfo} onClick={(palaceData) => setSelectedPalace(palaceData)}/>)}
            </div>
            {/* 彈窗組件 */}
            {selectedPalace && (
                <DetailModal 
                    data={selectedPalace} 
                    onClose={() => setSelectedPalace(null)} 
                />
            )}
            <div style={{ textAlign: 'center', fontSize: '12px', color: THEME.gray }}>十陰盤奇門遁甲</div>
        </div>
    );
};

const SettingsView = ({ bookmarks, setBookmarks }) => (
    <div style={{ padding: '16px', paddingBottom: '100px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}><h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>設定</h2></div>
        <WebBackupManager data={bookmarks} onRestore={setBookmarks} prefix="QIMEN_BACKUP" />
        <AppInfoCard info={{ appName: APP_NAME, version: APP_VERSION, about: "本程式提供道家陰盤奇門遁甲排盤功能，解說仍需專業師傅進行。" }} />
        <BuyMeCoffee />
    </div>
);

export default function QiMenApp() {
  // 全局啟用保護機制
  const isAuthorized = useProtection([]);
  if (!isAuthorized) return null;

  const libStatus = useLunarScript();
  const [view, setView] = useState('input');
  const [resultData, setResultData] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [editingData, setEditingData] = useState(null);
  const tabs = [{ id: 'input', label: '排盤', icon: Compass }, { id: 'bookmarks', label: '紀錄', icon: Bookmark }, { id: 'booking', label: '預約', icon: CalendarCheck }, { id: 'settings', label: '設定', icon: Settings }];

  useEffect(() => { const loadData = async () => { try { const { value } = await Preferences.get({ key: 'qimen_bookmarks' }); if (value) setBookmarks(JSON.parse(value)); } catch (e) { console.error("Load failed", e); } }; loadData(); }, []);
  
  const handleCalculate = (formData) => { 
      if (libStatus !== 'ready') return; 
      try { 
          const res = calculateQiMenResult(formData); 
          setResultData(res); 
          setView('result'); 
      } catch (e) { 
          console.error(e); 
          alert('排盤發生錯誤：請檢查日期是否正確或重試。'); 
      } 
  };
  
  const openBookmark = (item) => {
      if (item.rawDate) {
          setEditingData(item.rawDate);
          if (libStatus === 'ready') {
              try {
                  const res = calculateQiMenResult(item.rawDate);
                  setResultData(res);
                  setView('result');
              } catch(e) { setView('input'); }
          } else {
              setView('input');
          }
      }
  };

  const saveBookmark = async (data) => { const title = prompt("請輸入紀錄名稱", `${data.lunarDateStr.split(' ')[2]}占`); if (!title) return; const newEntry = { id: data.id, name: title, solarDate: data.solarDateStr, lunarString: data.lunarDateStr, rawDate: data.rawDate, type: 'qimen' }; const newBk = [newEntry, ...bookmarks]; setBookmarks(newBk); await Preferences.set({ key: 'qimen_bookmarks', value: JSON.stringify(newBk) }); alert('已儲存'); };
  const deleteBookmark = async (id) => { if (!confirm('確定刪除？')) return; const newBk = bookmarks.filter(b => b.id !== id); setBookmarks(newBk); await Preferences.set({ key: 'qimen_bookmarks', value: JSON.stringify(newBk) }); };

  if (libStatus === 'loading') return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>載入曆法數據...</div>;

  return (
    <div style={COMMON_STYLES.fullScreen}>
        <AppHeader title={APP_NAME} logoChar={{ main: '奇', sub: '門' }} />
        <div style={COMMON_STYLES.contentArea}>
            {view === 'input' && <><InputView onCalculate={handleCalculate} initialData={editingData} /><AdsterraNarrow /></>}
            {view === 'result' && <><ResultView data={resultData} onSave={saveBookmark} onBack={() => { setEditingData(null); setView('input'); }} onRecalculate={handleCalculate} /><AdsterraNarrow /></>}
            {view === 'bookmarks' && <div style={{ padding: '16px' }}><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}><h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>我的占事紀錄</h2></div><BookmarkList bookmarks={bookmarks} onSelect={openBookmark} onDelete={deleteBookmark} /><div style={{ marginTop: '20px' }}><Adsterra /></div></div>}
            {view === 'booking' && <BookingSystem apiUrl={API_URL} onNavigate={() => setView('input')} />}
            {view === 'settings' && <SettingsView bookmarks={bookmarks} setBookmarks={setBookmarks} />}
        </div>
        <InstallGuide />
        <BottomTabBar tabs={tabs} currentTab={view === 'result' ? 'input' : view} onTabChange={(id) => { if (id === 'input') { setEditingData(null); setView('input'); } else { setView(id); } }} />
    </div>
  );
}