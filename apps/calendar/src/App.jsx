// 1. 引入共用 UI 和 工具
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';
import 'react-calendar/dist/Calendar.css';

import { 
  AdBanner, Adsterra, AdsterraNarrow, AppHeader, AppInfoCard, 
  BookingSystem, BottomTabBar, BookmarkList, BuyMeCoffee, 
  InstallGuide, WebBackupManager, useProtection,
  COLORS, THEME, COMMON_STYLES
} from '@my-meta/ui';

import {
  DONG_GONG_RULES, XIU_INFO, JIAN_CHU_INFO, WUTU_POEMS
} from '@my-meta/ui';

// 2. 引入 Icon
import { 
  Bookmark, BookOpen, Briefcase,
  Calendar, CalendarCheck, CalendarPlus, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, Circle, Compass,
  CloudUpload, DoorOpen, Download,
  Edit3, Eye, EyeOff, Info, Grid, Lock, MapPin,
  RefreshCw, RotateCcw, RotateCw, Save, Settings, Sparkles,
  Trash2, Unlock, User, X
} from 'lucide-react';

// =========================================================================
// PART A: 核心數據與邏輯
// =========================================================================
const APP_NAME = "甯博進氣萬年曆";
const APP_VERSION = "v2.0 增加加入擇日書籤日期至日曆App";
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const SAN_NIANG_DAYS = [3, 7, 13, 18, 22, 27];
const JIE_QI_FIX_MAP = {
  '惊蛰': '驚蟄', '谷雨': '穀雨', '小满': '小滿', '芒种': '芒種', '处暑': '處暑'
};

const STEM_COLORS = [COLORS.jia, COLORS.yi, COLORS.bing, COLORS.ding, COLORS.wu, COLORS.ji, COLORS.geng, COLORS.xin, COLORS.ren, COLORS.gui];
const BRANCH_COLORS = [COLORS.ren, COLORS.ji, COLORS.jia, COLORS.yi, COLORS.wu, COLORS.ding, COLORS.bing, COLORS.ji, COLORS.geng, COLORS.xin, COLORS.wu, COLORS.gui];

const QI_RULES = {
  stems: [[[-2, 4], [8, 14]], [[-3, 3], [7, 13]], [[-4, 2], [6, 12]], [[5, 11]], [[4, 10]], [[3, 9]], [[2, 8]], [[1, 7]], [[0, 6]], [[-1, 5], [9, 15]]],
  branches: [[[-2, 5], [10, 17]], [[-1, 5], [11, 17]], [[0, 6]], [[1, 7]], [[2, 8]], [[3, 9]], [[4, 10]], [[5, 11]], [[-6, 3], [6, 15]], [[-5, 4], [7, 16]], [[-4, 2], [8, 14]], [[-3, 5], [9, 17]]]
};

// 計算天赦日
const getTianShe = (monthZhi, dayGanZhi) => {
  // 春 (寅卯辰) -> 戊寅
  if (['寅', '卯', '辰'].includes(monthZhi) && dayGanZhi === '戊寅') return true;
  // 夏 (巳午未) -> 甲午
  if (['巳', '午', '未'].includes(monthZhi) && dayGanZhi === '甲午') return true;
  // 秋 (申酉戌) -> 戊申
  if (['申', '酉', '戌'].includes(monthZhi) && dayGanZhi === '戊申') return true;
  // 冬 (亥子丑) -> 甲子
  if (['亥', '子', '丑'].includes(monthZhi) && dayGanZhi === '甲子') return true;
  
  return false;
};

// 計算謝灶日 (農曆十二月)
const getXieZao = (lunarMonth, lunarDay) => {
  // 檢查是否為臘月 (12月)
  // 注意：lunar-javascript 的 getMonth() 回傳數字，正數為正常月，負數為閏月
  // 謝灶通常只在正常臘月，若遇閏臘月(極罕見)依俗通常算第一個或依節氣，這裡簡化只看數字
  if (Math.abs(lunarMonth) !== 12) return null;

  if (lunarDay === 23) return '謝灶 (官祀)';
  if (lunarDay === 24) return '謝灶 (民祀)';
  return null;
};

// 斗首擇日法
const DOU_SHOU_MOUNTAIN_MAP = {
  '壬': '土', '子': '土', '癸': '火', '丑': '火',
  '艮': '木', '寅': '木', '甲': '水', '卯': '水',
  '乙': '金', '辰': '金', '巽': '土', '巳': '土',
  '丙': '火', '午': '火', '丁': '木', '未': '木',
  '坤': '水', '申': '水', '庚': '金', '酉': '金',
  '辛': '土', '戌': '土', '乾': '火', '亥': '火'
};

const MOUNTAIN_LIST = ['壬', '子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥'];

// 斗首天干化氣
const DOU_SHOU_STEM_MAP = {
  '甲': '土', '己': '土',
  '乙': '金', '庚': '金',
  '丙': '水', '辛': '水',
  '丁': '木', '壬': '木',
  '戊': '火', '癸': '火'
};

// 斗首關係判定 (Host=山, Guest=干)
const getDouShouStar = (hostEl, guestEl) => {
  if (hostEl === guestEl) return { star: '元辰', fan: '元辰', luck: '吉', desc: '山家比和' };
  
  // 生剋關係判定
  const relations = {
    '木': { produce: '火', overcome: '土', producedBy: '水', overcomeBy: '金' },
    '火': { produce: '土', overcome: '金', producedBy: '木', overcomeBy: '水' },
    '土': { produce: '金', overcome: '水', producedBy: '火', overcomeBy: '木' },
    '金': { produce: '水', overcome: '木', producedBy: '土', overcomeBy: '火' },
    '水': { produce: '木', overcome: '火', producedBy: '金', overcomeBy: '土' }
  };

  const rel = relations[hostEl];
  if (guestEl === rel.producedBy) return { star: '貪狼', fan: '鬼破', luck: '凶', desc: '剋入山家' };
  if (guestEl === rel.overcomeBy) return { star: '鬼破', fan: '子孫', luck: '凶', desc: '山家生出' };
  if (guestEl === rel.produce)    return { star: '廉子', fan: '武財', luck: '吉', desc: '山家剋出' };
  if (guestEl === rel.overcome)   return { star: '武財', fan: '貪狼', luck: '吉', desc: '生入山家' };

  return { star: '未知', fan: '未知', luck: '平', desc: '' };
};

// 烏兔太陽太陰日計算
const WUTU_YANG_STEMS = ['甲', '丁', '戊', '己', '壬', '癸']; // 陽干順行
// 地支對應九宮起始點 (子1, 丑寅8, 卯3, 辰巳4, 午9, 未申2, 酉7, 戌亥6)
// 索引 0-11 對應 子-亥
const WUTU_BRANCH_MAP = [1, 8, 8, 3, 4, 4, 9, 2, 2, 7, 6, 6]; 
const WUTU_STAR_MAP = {
  8: { name: '太陽', 吉: true, color: THEME.orange, desc: '富貴大吉' }, // 艮
  2: { name: '太陰', 吉: true, color: THEME.purple, desc: '人發財興' }, // 坤
  1: { name: '水星', 吉: true, color: COLORS.ren, desc: '福祿盈門' },   // 坎
  3: { name: '木星', 吉: true, color: COLORS.jia, desc: '紫氣催官' },   // 震
  7: { name: '金星', 吉: true, color: COLORS.geng, desc: '倉箱盈積' },  // 兌
  9: { name: '火星', 吉: false, color: THEME.red, desc: '瘟疫火災' },   // 離
  5: { name: '土星', 吉: false, color: COLORS.wu, desc: '禍事多端' },   // 中
  6: { name: '羅睺', 吉: false, color: THEME.dark, desc: '官非鼎鑊' },  // 乾
  4: { name: '計都', 吉: false, color: THEME.dark, desc: '財散人亡' }   // 巽
};
const WUTU_ABBR = {
    '太陽': '日', '太陰': '月',
    '木星': '木', '水星': '水', '金星': '金', '火星': '火', '土星': '土',
    '羅睺': '羅', '計都': '計'
};

const getWuTuSolarStar = (lunar) => {
    try {
        // 1. 取得該農曆月的初一
        const lYear = lunar.getYear();
        const lMonth = lunar.getMonth();
        const firstDayLunar = window.Lunar.fromYmd(lYear, lMonth, 1);
        const firstDaySolar = firstDayLunar.getSolar();
        
        // 2. 尋找初一(含)之前的最近一個「卯日」
        let maoDayLunar = null;
        let offsetDays = 0;
        
        // 往回找最多13天
        for (let i = 0; i < 13; i++) {
             const d = new Date(firstDaySolar.getYear(), firstDaySolar.getMonth() - 1, firstDaySolar.getDay());
             d.setDate(d.getDate() - i);
             const l = window.Solar.fromYmd(d.getFullYear(), d.getMonth()+1, d.getDate()).getLunar();
             if (l.getDayZhi() === '卯') {
                 maoDayLunar = l;
                 offsetDays = i; // 初一 與 卯日 的距離 (0=同天, 1=差1天...)
                 break;
             }
        }
        if (!maoDayLunar) return null;

        // 3. 階段一：尋初一落宮 (依「卯日」天干定順逆)
        const maoGan = maoDayLunar.getDayGan();
        const isMaoYang = WUTU_YANG_STEMS.includes(maoGan);
        const dir1 = isMaoYang ? 1 : -1;

        // 卯日從「子(索引0)」起算，推至初一
        let firstDayBranchIdx = (0 + dir1 * offsetDays) % 12;
        if (firstDayBranchIdx < 0) firstDayBranchIdx += 12;
        
        // 查截法圖 (地支 -> 九宮起點)
        const startGua = WUTU_BRANCH_MAP[firstDayBranchIdx];

        // 4. 階段二：推當日值星 (依「初一」天干定順逆) *修正處*
        const l1Gan = firstDayLunar.getDayGan();
        const isL1Yang = WUTU_YANG_STEMS.includes(l1Gan);
        const dir2 = isL1Yang ? 1 : -1;

        // 從初一(startGua)起，一日一宮飛佈
        const currentDayDiff = lunar.getDay() - 1; // 初一為1 (diff=0)
        
        let finalGuaIdx = (startGua - 1 + dir2 * currentDayDiff) % 9;
        if (finalGuaIdx < 0) finalGuaIdx += 9;
        const finalGua = finalGuaIdx + 1;

        return WUTU_STAR_MAP[finalGua];

    } catch (e) {
        console.error("WuTu Error", e);
        return null;
    }
};

// 烏兔太陽太陰「時」對照表
// 口訣：甲己未申，丁壬申寅，乙庚申巳，丙辛辰丑戌，戊癸卯午
const WUTU_TIME_LOOKUP = {
    '甲': { sun: '未', moon: '丑、戌' }, // 甲己未時停, 甲己丑戌求
    '己': { sun: '未', moon: '丑、戌' },
    '乙': { sun: '申', moon: '巳' },     // 乙庚申, 乙庚巳位任君遊
    '庚': { sun: '申', moon: '巳' },
    '丙': { sun: '辰', moon: '丑、戌' }, // 丙辛辰, 丙辛丑戌求
    '辛': { sun: '辰', moon: '丑、戌' },
    '丁': { sun: '申', moon: '寅' },     // 丁壬乙庚申(丁壬申), 丁壬虎(寅)上
    '壬': { sun: '申', moon: '寅' },
    '戊': { sun: '卯', moon: '午' },     // 戊癸卯, 戊癸逢馬(午)
    '癸': { sun: '卯', moon: '午' }
};

// 烏兔太陽太陰「方位」計算
// 節氣對應起宮與順逆 (順=1, 逆=-1)
// 涵蓋三個節氣：該節氣本身 + 後兩個 (一卦管三山/三節氣之意)
const WUTU_DIR_MAP = {
    '冬至': { start: 1, dir: 1 }, '小寒': { start: 1, dir: 1 }, '大寒': { start: 1, dir: 1 }, // 坎一
    '立春': { start: 8, dir: 1 }, '雨水': { start: 8, dir: 1 }, '驚蟄': { start: 8, dir: 1 }, // 艮八
    '春分': { start: 3, dir: 1 }, '清明': { start: 3, dir: 1 }, '穀雨': { start: 3, dir: 1 }, // 震三
    '立夏': { start: 4, dir: 1 }, '小滿': { start: 4, dir: 1 }, '芒種': { start: 4, dir: 1 }, // 巽四
    '夏至': { start: 9, dir: -1 }, '小暑': { start: 9, dir: -1 }, '大暑': { start: 9, dir: -1 }, // 離九 (逆)
    '立秋': { start: 2, dir: -1 }, '處暑': { start: 2, dir: -1 }, '白露': { start: 2, dir: -1 }, // 坤二 (逆)
    '秋分': { start: 7, dir: -1 }, '寒露': { start: 7, dir: -1 }, '霜降': { start: 7, dir: -1 }, // 兌七 (逆)
    '立冬': { start: 6, dir: -1 }, '小雪': { start: 6, dir: -1 }, '大雪': { start: 6, dir: -1 }  // 乾六 (逆)
};

const GUA_NAMES = {
    1: '坎 (正北)', 2: '坤 (西南)', 3: '震 (正東)', 4: '巽 (東南)', 
    5: '中宮', 6: '乾 (西北)', 7: '兌 (正西)', 8: '艮 (東北)', 9: '離 (正南)'
};

// 60甲子索引 (甲子=0, ... 癸亥=59)
const getGanZhiIndex = (ganZhi) => {
    // 簡單查表法或計算，這裡假設傳入的是字串如 "甲子"
    const GANS = "甲乙丙丁戊己庚辛壬癸";
    const ZHIS = "子丑寅卯辰巳午未申酉戌亥";
    const ganIdx = GANS.indexOf(ganZhi[0]);
    const zhiIdx = ZHIS.indexOf(ganZhi[1]);
    // 公式: (ganIdx * 6 + zhiIdx * 5 + ?). 
    // 更簡單: 暴力迴圈找
    for(let i=0; i<60; i++) {
        const g = GANS[i % 10];
        const z = ZHIS[i % 12];
        if (g+z === ganZhi) return i;
    }
    return 0;
};

const getWuTuDetails = (lunar) => {
    try {
        const gan = lunar.getDayGan();
        const timeInfo = WUTU_TIME_LOOKUP[gan];

        // 計算方位
        // 1. 找最近的節氣
        const prevJieQi = lunar.getPrevJieQi(true); // true=包含當天
        const jieQiName = prevJieQi ? prevJieQi.getName() : '冬至';
        const setting = WUTU_DIR_MAP[jieQiName] || { start: 1, dir: 1 }; // 預設坎一順

        // 2. 計算「日」的宮位 (甲子起遁)
        const dayGanZhi = lunar.getDayInGanZhi();
        const dayIdx = getGanZhiIndex(dayGanZhi); // 0-59
        
        // 公式：(起點 - 1 + 方向 * 天數偏移) % 9
        // 注意 JavaScript 的負數取餘數問題
        let dayPalaceIdx = (setting.start - 1 + setting.dir * dayIdx) % 9;
        if (dayPalaceIdx < 0) dayPalaceIdx += 9;
        const dayPalace = dayPalaceIdx + 1; // 1-9

        // 3. 起九星 (從本日宮位起土星，依次順行)
        // 順序：土1 金2 火3 羅4 水5 日6 月7 計8 木9
        // 太陽是第6顆 (索引+5)，太陰是第7顆 (索引+6)
        // 注意：九星飛佈通常不論冬夏皆順飛 (口訣：依次行)
        
        const sunPalace = ((dayPalace - 1 + 5) % 9) + 1;     // 太陽到方
        const moonPalace = ((dayPalace - 1 + 6) % 9) + 1;    // 太陰到方
        const venusPalace = ((dayPalace - 1 + 1) % 9) + 1;   // 金星到方
        const jupiterPalace = ((dayPalace - 1 + 8) % 9) + 1; // 木星到方

        return {
            ...timeInfo,
            sunPos: GUA_NAMES[sunPalace],
            moonPos: GUA_NAMES[moonPalace],
            venusPos: GUA_NAMES[venusPalace],
            jupiterPos: GUA_NAMES[jupiterPalace],
            jieQi: jieQiName,
            dayPalace: GUA_NAMES[dayPalace] // 除錯用，可顯示本日落宮
        };

    } catch (e) {
        console.error(e);
        return null;
    }
};

// 月將與貴人登天門計算常數
const MOON_GENERAL_MAP = {
  '大寒': '子', '立春': '子',
  '雨水': '亥', '驚蟄': '亥',
  '春分': '戌', '清明': '戌',
  '穀雨': '酉', '立夏': '酉',
  '小滿': '申', '芒種': '申',
  '夏至': '未', '小暑': '未',
  '大暑': '午', '立秋': '午',
  '處暑': '巳', '白露': '巳',
  '秋分': '辰', '寒露': '辰',
  '霜降': '卯', '立冬': '卯',
  '小雪': '寅', '大雪': '寅',
  '冬至': '丑', '小寒': '丑'
};

const NOBLE_MAN_MAP = {
  '甲': { yang: '未', yin: '丑' },
  '戊': { yang: '丑', yin: '未' },
  '庚': { yang: '丑', yin: '未' },
  '乙': { yang: '申', yin: '子' }, 
  '己': { yang: '子', yin: '申' },
  '丙': { yang: '酉', yin: '亥' },
  '丁': { yang: '亥', yin: '酉' },
  '壬': { yang: '卯', yin: '巳' },
  '癸': { yang: '巳', yin: '卯' },
  '辛': { yang: '寅', yin: '午' }
};

const ZHI_INDEX = { '子':0, '丑':1, '寅':2, '卯':3, '辰':4, '巳':5, '午':6, '未':7, '申':8, '酉':9, '戌':10, '亥':11 };
const ZHI_ARRAY = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 計算貴人登天門時
const getGuiRenTimes = (lunar) => {
    try {
        // 1. 取得月將 (依據最近的一個節氣或中氣)
        // lunar.getPrevJieQi(false) 會包含當天的節氣
        const prevJieQi = lunar.getPrevJieQi(false); 
        const jieQiName = prevJieQi ? prevJieQi.getName() : '大寒'; // 預設fallback
        const moonGeneral = MOON_GENERAL_MAP[jieQiName] || '子';
        const generalIdx = ZHI_INDEX[moonGeneral];

        // 2. 取得日干貴人
        const dayGan = lunar.getDayGan();
        const noblePos = NOBLE_MAN_MAP[dayGan];
        
        if (!noblePos) return null;
        
        const calcTime = (nobleZhi) => {
            const nobleIdx = ZHI_INDEX[nobleZhi];
            // 亥的索引是 11
            let shift = 11 - nobleIdx; 
            let timeIdx = (generalIdx + shift) % 12;
            if (timeIdx < 0) timeIdx += 12;
            return ZHI_ARRAY[timeIdx];
        };

        return {
            yang: calcTime(noblePos.yang),
            yin: calcTime(noblePos.yin),
            general: moonGeneral
        };
    } catch (e) {
        console.error(e);
        return null;
    }
};

// 產生並下載 ICS 日曆檔案
const downloadICS = async (date, lunarStr, ganZhiStr) => {
    if (!date || isNaN(date.getTime())) return;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;

    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    const nYear = nextDay.getFullYear();
    const nMonth = String(nextDay.getMonth() + 1).padStart(2, '0');
    const nDay = String(nextDay.getDate()).padStart(2, '0');
    const nextDateString = `${nYear}${nMonth}${nDay}`;

    // ICS 內容格式
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MrkFengshui//CalendarApp//TW
BEGIN:VEVENT
DTSTART;VALUE=DATE:${dateString}
DTEND;VALUE=DATE:${nextDateString}
SUMMARY:擇日提醒: ${lunarStr} ${ganZhiStr}日
DESCRIPTION:您在「甯博進氣萬年曆」中儲存的擇日書籤。
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:明日是您預定的擇日書籤
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const fileName = `擇日提醒_${dateString}.ics`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });

    // 1. 優先嘗試 Web Share API (iOS/Android 手機原生分享彈窗)
    // 這樣可以讓 iOS 直接顯示「加入行事曆」的選項，完美繞過 Safari 下載限制
    const file = new File([blob], fileName, { type: 'text/calendar' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: '加入日曆',
                text: '將擇日書籤加入您的手機日曆',
                files: [file],
            });
            return; // 成功呼叫分享選單就結束
        } catch (error) {
            // 用戶取消分享不算是錯誤，忽略 AbortError
            if (error.name !== 'AbortError') {
                console.error('分享失敗，嘗試備用方法:', error);
            } else {
                return; 
            }
        }
    }

    // 2. 備用方法 (給電腦版或是無法 Share 的舊瀏覽器)
    try {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        // iOS 如果走到這裡 (通常是不支援 Share 的極舊版)，改用 Data URI 強制跳轉
        if (isIOS) {
            window.location.href = 'data:text/calendar;charset=utf8,' + encodeURIComponent(icsContent);
            return;
        }

        // 一般 Android / 電腦版下載方式
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch(e) {
        console.error("產生日曆檔失敗", e);
        alert("產生日曆檔失敗，請確認瀏覽器權限。");
    }
};

const YI_JI_MAP = {
  '开': '開', '满': '滿', '执': '執', '闭': '閉', '壮': '壯', '冲': '沖',
  '节': '節', '纳': '納', '采': '採', '动': '動', '竖': '豎', '画': '畫',
  '斋': '齋', '盖': '蓋', '齐': '齊', '发': '髮', '财': '財', '钻': '鑽',
  '缝': '縫', '针': '針', '经': '經', '络': '絡', '酝': '醞', '酿': '釀',
  '扫': '掃', '饰': '飾', '墙': '牆', '帐': '帳', '马': '馬', '医': '醫',
  '灵': '靈', '堕': '墮', '订': '訂', '归': '歸', '宁': '寧', '阳': '陽',
  '阴': '陰', '戏': '戲', '击': '擊', '乐': '樂', '词': '詞', '讼': '訟',
  '猎': '獵', '网': '網', '罗': '羅', '种': '種', '鱼': '魚', '补': '補',
  '寿': '壽', '会': '會', '亲': '親', '进': '進', '头': '頭', '粮': '糧',
  '仓': '倉', '库': '庫', '窑': '窯', '养': '養', '门': '門', '厨': '廚',
  '涂': '塗', '厕': '廁', '临': '臨', '启': '啟', '殡': '殯', '殓': '殮', 
  '谢': '謝', '设': '設', '驾': '駕', '筑': '築', '坟': '墳', '绘': '繪', 
  '产': '產', '馀': '餘', '丧': '喪', '问': '問', '车': '車', '诸': '諸',
  '坏': '壞', '机': '機', '梁': '樑', '货': '貨',
};

const toTraditionalYiJi = (str) => {
  if (!str) return '';
  return str.split('').map(char => YI_JI_MAP[char] || char).join('');
};

const JIAN_FIX_MAP = { '满': '滿', '执': '執', '开': '開', '闭': '閉', '建': '建', '除': '除', '平': '平', '定': '定', '破': '破', '危': '危', '成': '成', '收': '收' };
const XIU_FIX_MAP = { '虚': '虛', '娄': '婁', '毕': '畢', '参': '參', '张': '張', '轸': '軫', '角': '角', '亢': '亢', '氐': '氐', '房': '房', '心': '心', '尾': '尾', '箕': '箕', '斗': '斗', '牛': '牛', '女': '女', '虛': '虛', '危': '危', '室': '室', '壁': '壁', '奎': '奎', '婁': '婁', '胃': '胃', '昴': '昴', '畢': '畢', '觜': '觜', '參': '參', '井': '井', '鬼': '鬼', '柳': '柳', '星': '星', '張': '張', '翼': '翼', '軫': '軫' };
const JIAN_CHU_COLOR_MAP = { '建': THEME.red, '除': THEME.blue, '滿': THEME.red, '平': THEME.red, '定': THEME.blue, '執': THEME.blue, '破': THEME.red, '危': THEME.red, '成': THEME.blue, '收': THEME.red, '開': THEME.blue, '閉': THEME.red };
const XIU_COLOR_MAP = { '角': THEME.blue, '房': THEME.blue, '心': THEME.red, '箕': THEME.blue, '斗': THEME.blue, '牛': THEME.red, '女': THEME.red, '虛': THEME.red, '危': THEME.red, '室': THEME.blue, '壁': THEME.blue, '奎': THEME.red, '婁': THEME.blue, '胃': THEME.blue, '亢': THEME.red, '氐': THEME.red, '尾': THEME.blue, '鬼': THEME.red, '柳': THEME.red, '星': THEME.red, '張': THEME.blue, '翼': THEME.red, '軫': THEME.blue, '畢': THEME.blue, '觜': THEME.red, '參': THEME.blue, '井': THEME.blue, '昴': THEME.red };
const XIU_FULL_NAME_MAP = { '角': '角木蛟', '亢': '亢金龍', '氐': '氐土貉', '房': '房日兔', '心': '心月狐', '尾': '尾火虎', '箕': '箕水豹', '斗': '斗木獬', '牛': '牛金牛', '女': '女土蝠', '虛': '虛日鼠', '危': '危月燕', '室': '室火豬', '壁': '壁水貐', '奎': '奎木狼', '婁': '婁金狗', '胃': '胃土雉', '昴': '昴日雞', '畢': '畢月烏', '觜': '觜火猴', '參': '參水猿', '井': '井木犴', '鬼': '鬼金羊', '柳': '柳土獐', '星': '星日馬', '張': '張月鹿', '翼': '翼火蛇', '軫': '軫水蚓' };

const GET_SHI_CHEN_MAPPING = (rule) => {
  const base = [
    { name: '丑', time: '01:00-03:00', hour: 2 }, { name: '寅', time: '03:00-05:00', hour: 4 }, { name: '卯', time: '05:00-07:00', hour: 6 },
    { name: '辰', time: '07:00-09:00', hour: 8 }, { name: '巳', time: '09:00-11:00', hour: 10 }, { name: '午', time: '11:00-13:00', hour: 12 },
    { name: '未', time: '13:00-15:00', hour: 14 }, { name: '申', time: '15:00-17:00', hour: 16 }, { name: '酉', time: '17:00-19:00', hour: 18 },
    { name: '戌', time: '19:00-21:00', hour: 20 }, { name: '亥', time: '21:00-23:00', hour: 22 }
  ];
  return rule === 'ziShi' 
    ? [{ name: '子', time: '23:00-01:00', hour: 0 }, ...base]
    : [{ name: '早子', time: '00:00-01:00', hour: 0 }, ...base, { name: '夜子', time: '23:00-24:00', hour: 23 }];
};

const getDefaultTimeIndex = (hour, rule) => {
  const mapping = GET_SHI_CHEN_MAPPING(rule);
  if (rule === 'ziShi') {
    if (hour >= 23 || hour < 1) return 0;
    for (let i = 1; i < mapping.length; i++) { if (hour >= mapping[i].hour && hour < mapping[i].hour + 2) return i; }
  } else {
    if (hour === 23) return 12; if (hour === 0) return 0;
    for (let i = 1; i < mapping.length - 1; i++) { if (hour >= mapping[i].hour && hour < mapping[i].hour + 2) return i; }
  }
  return 6; 
};

// 流月進退氣核心邏輯
// 天干五行屬性 (0:甲, 1:乙...) -> 木木火火土土金金水水
const STEM_ELEMENTS = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'];

// [獨立函數] 檢查 A 是否剋 B (且必須是同性相剋，即七殺，如: 乙木剋己土)
// 修正邏輯：
// 1. 嚴格檢查陰陽屬性：必須「同性」才算七殺。
// 2. 異性相剋(如甲剋己)為正官或合，不退氣。
const checkMonthlyRetreat = (stemIdxA, stemIdxB) => {
    // 參數安全檢查
    if (stemIdxA < 0 || stemIdxA > 9 || stemIdxB < 0 || stemIdxB > 9) return false;

    // 1. 陰陽屬性檢查：
    // JavaScript 取餘數：0(甲)%2=0, 1(乙)%2=1, ..., 5(己)%2=1
    // 若餘數不同 (一奇一偶)，則為異性，不退氣。
    // 甲(0) vs 己(5) -> 0!=1 -> 回傳 false (不退氣) -> 正確
    // 乙(1) vs 己(5) -> 1==1 -> 通過檢查 (繼續檢查五行)
    if (stemIdxA % 2 !== stemIdxB % 2) return false;

    // 2. 五行剋制檢查 (同性前提下)
    const elA = STEM_ELEMENTS[stemIdxA];
    const elB = STEM_ELEMENTS[stemIdxB];
    
    // 木剋土 (乙木剋己土)
    if (elA === 'wood' && elB === 'earth') return true;
    // 火剋金 (丁火剋辛金)
    if (elA === 'fire' && elB === 'metal') return true;
    // 土剋水 (己土剋癸水)
    if (elA === 'earth' && elB === 'water') return true;
    // 金剋木 (辛金剋乙木)
    if (elA === 'metal' && elB === 'wood') return true;
    // 水剋火 (癸水剋丁火)
    if (elA === 'water' && elB === 'fire') return true;
    
    return false;
};

// 計算某一日是否處於流月天干進氣狀態
const getMonthlyStemQiStatus = (date, lunar) => {
    try {
        // 1. 取得當前經歷的 "節" (Jie)
        const jieQiTable = lunar.getJieQiTable();
        let currentJieDate = null;
        let midQiDate = null; // 用來輔助判斷範圍，雖天干主要看節

        // 搜尋範圍：前後 35 天
        for (let i = 15; i >= -20; i--) {
            const tempDate = new Date(date);
            tempDate.setDate(date.getDate() - i);
            const tempSolar = window.Solar.fromYmd(tempDate.getFullYear(), tempDate.getMonth()+1, tempDate.getDate());
            const tempLunar = tempSolar.getLunar();
            const jq = tempLunar.getJieQi();
            
            // 必須是 "節"
            if (jq && tempLunar.getJie() === jq) { 
                currentJieDate = tempDate;
                break;
            }
        }

        if (!currentJieDate) return false;

        // 2. 確定流月天干 (看節氣當日)
        // 使用 23:59:59 確保抓到換月後的干支
        const jieSolar = window.Solar.fromYmdHms(currentJieDate.getFullYear(), currentJieDate.getMonth()+1, currentJieDate.getDate(), 23, 59, 59);
        const monthGan = jieSolar.getLunar().getEightChar().getMonthGan(); 
        const monthGanIdx = TIANGAN.indexOf(monthGan);

        if (monthGanIdx === -1) return false;

        // 3. 計算 "實際進氣日" (Start Date)
        let actualStartDate = null;
        const jieDayGan = jieSolar.getLunar().getEightChar().getDayGan();
        const jieDayGanIdx = TIANGAN.indexOf(jieDayGan);

        // 檢查節氣當日是否剋流月 (使用 checkMonthlyRetreat)
        const isJieDayClash = checkMonthlyRetreat(jieDayGanIdx, monthGanIdx);

        // A. 若節氣當日不剋，嘗試 "提早進氣" (往回找 5 天)
        if (!isJieDayClash) {
            for (let d = 5; d >= 1; d--) {
                const lookBackDate = new Date(currentJieDate);
                lookBackDate.setDate(currentJieDate.getDate() - d);
                const lbSolar = window.Solar.fromYmd(lookBackDate.getFullYear(), lookBackDate.getMonth()+1, lookBackDate.getDate());
                const lbGan = lbSolar.getLunar().getEightChar().getDayGan();
                
                // 找到同天干 -> 提早進氣
                if (lbGan === monthGan) {
                    actualStartDate = lookBackDate;
                    break;
                }
            }
        }

        // B. 若沒能提早 (剋 或 找不到同天干)，則 "往後找" (包含節氣當日)
        // 規則：一定在節氣後 5 天內找到同天干
        if (!actualStartDate) {
            for (let d = 0; d <= 5; d++) {
                const lookFwdDate = new Date(currentJieDate);
                lookFwdDate.setDate(currentJieDate.getDate() + d);
                const lfSolar = window.Solar.fromYmd(lookFwdDate.getFullYear(), lookFwdDate.getMonth()+1, lookFwdDate.getDate());
                const lfGan = lfSolar.getLunar().getEightChar().getDayGan();

                // 找到同天干 -> 這天才是進氣日
                // (如果是節氣當天 d=0 且同天干，就會在這裡被選中)
                if (lfGan === monthGan) {
                    actualStartDate = lookFwdDate;
                    break;
                }
            }
        }
        
        // 防呆：理論上一定找得到，若無則 fallback 到節氣當日
        if (!actualStartDate) actualStartDate = currentJieDate;

        // 如果當前日期 < 實際進氣日 -> 尚未進氣
        if (date < actualStartDate) return false;

        // 4. 模擬進退氣狀態
        let isActive = true; // 起始日必定是同天干，所以是進氣
        
        const diffDays = Math.floor((date - actualStartDate) / (1000 * 60 * 60 * 24));
        
        for (let i = 1; i <= diffDays; i++) {
            const checkDate = new Date(actualStartDate);
            checkDate.setDate(actualStartDate.getDate() + i);
            
            const cSolar = window.Solar.fromYmd(checkDate.getFullYear(), checkDate.getMonth()+1, checkDate.getDate());
            const cGan = cSolar.getLunar().getEightChar().getDayGan();
            const cGanIdx = TIANGAN.indexOf(cGan);

            if (isActive) {
                // 遇剋 -> 退氣
                if (checkMonthlyRetreat(cGanIdx, monthGanIdx)) isActive = false;
            } else {
                // 退氣後遇同干 -> 進氣
                if (cGan === monthGan) isActive = true;
            }
        }

        return { isActive, color: STEM_COLORS[monthGanIdx], stemIdx: monthGanIdx };

    } catch (e) {
        console.error("Stem Qi Calc Error", e);
        return false;
    }
};

// 檢查地支是否退氣
// 0:子, 1:丑, 2:寅, 3:卯, 4:辰, 5:巳, 6:午, 7:未, 8:申, 9:酉, 10:戌, 11:亥
const BRANCH_CLASH_MAP = {
    2:  [8],   // 寅 (2) 被 申 (8) 剋
    3:  [9],   // 卯 (3) 被 酉 (9) 剋
    4:  [10],  // 辰 (4) 被 戌 (10) 剋
    5:  [11],  // 巳 (5) 被 亥 (11) 剋
    6:  [0],   // 午 (6) 被 子 (0) 剋
    7:  [1],   // 未 (7) 被 丑 (1) 剋
    8:  [6],   // 申 (8) 被 午 (6) 剋
    9:  [5],   // 酉 (9) 被 巳 (5) 剋
    10: [4],   // 戌 (10) 被 辰 (4) 剋
    11: [7],   // 亥 (11) 被 未 (7) 剋
    0:  [10],  // 子 (0) 被 戌 (10) 剋
    1:  [7]    // 丑 (1) 被 未 (7) 剋
};

// 檢查地支是否相剋 (退氣)
// branchIdxA: 日支 (Attack / 剋者)
// branchIdxB: 流月支 (Target / 被剋者)
const checkBranchClash = (branchIdxA, branchIdxB) => {
    // 參數安全檢查
    if (branchIdxA < 0 || branchIdxA > 11 || branchIdxB < 0 || branchIdxB > 11) return false;

    // 取得該流月(B) 會被誰剋的清單
    const attackers = BRANCH_CLASH_MAP[branchIdxB];

    // 如果清單存在，且日支(A)在清單中，則回傳 true (退氣)
    if (attackers && attackers.includes(branchIdxA)) {
        return true;
    }

    return false;
};

// 用於區分 "節" 與 "氣" 的清單
const JIE_NAMES = ['立春', '驚蟄', '清明', '立夏', '芒種', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];

// 計算流月地支進氣狀態
const getMonthlyBranchQiStatus = (date, lunar) => {
    try {
        // 1. 尋找當月所屬的 "中氣" (Mid-Qi)
        let midQiDate = null;
        let foundTerm = null;
        let foundDate = null;

        // A. 往回找最近節氣
        for (let i = 0; i <= 20; i++) {
            const tempDate = new Date(date);
            tempDate.setDate(date.getDate() - i);
            const tempSolar = window.Solar.fromYmd(tempDate.getFullYear(), tempDate.getMonth()+1, tempDate.getDate());
            const tempLunar = tempSolar.getLunar();
            const jq = tempLunar.getJieQi();
            
            if (jq) {
                foundTerm = jq;
                foundDate = tempDate;
                break;
            }
        }

        // B. 區分節與氣
        if (foundTerm) {
            if (JIE_NAMES.includes(foundTerm)) {
                // 找到的是節，往後找氣
                for (let i = 1; i <= 20; i++) {
                    const tempDate = new Date(foundDate);
                    tempDate.setDate(foundDate.getDate() + i);
                    const tempSolar = window.Solar.fromYmd(tempDate.getFullYear(), tempDate.getMonth()+1, tempDate.getDate());
                    const tempLunar = tempSolar.getLunar();
                    if (tempLunar.getJieQi()) {
                        midQiDate = tempDate;
                        break;
                    }
                }
            } else {
                midQiDate = foundDate;
            }
        }

        if (!midQiDate) return false;

        // 2. 確定流月地支 (取中氣當日 12:00 的月支)
        const qiSolar = window.Solar.fromYmdHms(midQiDate.getFullYear(), midQiDate.getMonth()+1, midQiDate.getDate(), 12, 0, 0);
        const qiLunar = qiSolar.getLunar();
        const monthZhi = qiLunar.getEightChar().getMonthZhi();
        const monthZhiIdx = DIZHI.indexOf(monthZhi);

        if (monthZhiIdx === -1) return false;

        // 3. 計算 "實際進氣日"
        let actualStartDate = null;
        
        const qiDayZhi = qiLunar.getEightChar().getDayZhi();
        const qiDayZhiIdx = DIZHI.indexOf(qiDayZhi);
        
        // 檢查中氣當日是否剋/沖流月
        const isQiDayClash = checkBranchClash(qiDayZhiIdx, monthZhiIdx);

        // A. 若不沖，嘗試 "提早進氣" (往回找 6 天)
        if (!isQiDayClash) {
            for (let d = 6; d >= 1; d--) {
                const lookBackDate = new Date(midQiDate);
                lookBackDate.setDate(midQiDate.getDate() - d);
                const lbSolar = window.Solar.fromYmd(lookBackDate.getFullYear(), lookBackDate.getMonth()+1, lookBackDate.getDate());
                const lbZhi = lbSolar.getLunar().getEightChar().getDayZhi();
                
                // 找到同地支 -> 提早進氣
                if (lbZhi === monthZhi) {
                    actualStartDate = lookBackDate;
                    break;
                }
            }
        }

        // B. 若沒能提早 (沖 或 找不到同地支)，則 "往後找" (包含中氣當日)
        if (!actualStartDate) {
            for (let d = 0; d <= 6; d++) {
                const lookFwdDate = new Date(midQiDate);
                lookFwdDate.setDate(midQiDate.getDate() + d);
                const lfSolar = window.Solar.fromYmd(lookFwdDate.getFullYear(), lookFwdDate.getMonth()+1, lookFwdDate.getDate());
                const lfZhi = lfSolar.getLunar().getEightChar().getDayZhi();
                
                // 找到同地支 -> 這天才是進氣日
                if (lfZhi === monthZhi) {
                    actualStartDate = lookFwdDate;
                    break;
                }
            }
        }
        
        if (!actualStartDate) actualStartDate = midQiDate;

        if (date < actualStartDate) return false;

        // 4. 模擬進退氣
        let isActive = true; 
        const diffDays = Math.floor((date - actualStartDate) / (1000 * 60 * 60 * 24));
        
        for (let i = 1; i <= diffDays; i++) {
            const checkDate = new Date(actualStartDate);
            checkDate.setDate(actualStartDate.getDate() + i);
            
            const cSolar = window.Solar.fromYmd(checkDate.getFullYear(), checkDate.getMonth()+1, checkDate.getDate());
            const cZhi = cSolar.getLunar().getEightChar().getDayZhi();
            const cZhiIdx = DIZHI.indexOf(cZhi);

            if (isActive) {
                if (checkBranchClash(cZhiIdx, monthZhiIdx)) isActive = false;
            } else {
                if (cZhi === monthZhi) isActive = true;
            }
        }

        return { isActive, color: BRANCH_COLORS[monthZhiIdx], branchIdx: monthZhiIdx };

    } catch (e) {
        console.error("Branch Qi Calc Error", e);
        return false;
    }
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

const getLocalDateString = (date) => {
  if (!date || isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getShiGan = (dayGan, timeZhiName) => {
  if (!dayGan) return '';
  const dayGanIdx = TIANGAN.indexOf(dayGan);
  const zhiMap = { '子':0, '早子':0, '丑':1, '寅':2, '卯':3, '辰':4, '巳':5, '午':6, '未':7, '申':8, '酉':9, '戌':10, '亥':11, '夜子':12 };
  const zhiIdx = zhiMap[timeZhiName] ?? 0;
  return TIANGAN[((dayGanIdx % 5) * 2 + zhiIdx) % 10];
};

// =========================================================================
// PART B: UI 組件
// =========================================================================

// B-1: 可點擊的資訊項目 (用於 Modal 內)
const InfoItem = ({ label, value, yi, ji, source }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    // 點擊時，顯示 source (典故/詳細解釋)
    if (source) {
        alert(`【${label} - ${value}】典故\n\n${source}`);
    } else {
        alert(`暫無 ${value} 的詳細典故資料`);
    }
  };

  return (
    <div 
      onClick={handleClick}
      style={{ 
        background: '#f9f9f9', padding: '12px', borderRadius: '12px', 
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        border: '1px solid transparent', transition: 'all 0.2s',
        height: '100%',
        boxSizing: 'border-box' 
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#ccc'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
    >
      {/* 頂部：標籤與數值 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
          <span style={{ fontSize: '12px', color: '#888', display:'flex', alignItems:'center', gap:'4px' }}>
            {label} <Info size={12}/>
          </span>
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{value}</span>
      </div>

      {/* 宜忌區域：長期顯示 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ 
                  color: '#389e0d', // 綠色
                  background: '#f6ffed', 
                  padding: '1px 4px', 
                  borderRadius: '4px', 
                  fontSize: '11px',
                  flexShrink: 0
              }}>宜</span>
              <span style={{ color: '#555', lineHeight: '1.4' }}>{yi || '無'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
               <span style={{ 
                  color: '#cf1322', // 紅色
                  background: '#fff1f0', 
                  padding: '1px 4px', 
                  borderRadius: '4px', 
                  fontSize: '11px',
                  flexShrink: 0
              }}>忌</span>
              <span style={{ color: '#555', lineHeight: '1.4' }}>{ji || '無'}</span>
          </div>
      </div>
    </div>
  );
};

// B-2: 摺疊區塊
const AccordionSection = ({ title, children, defaultOpen = false, color = '#333' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${THEME.border}`, borderRadius: '12px', marginBottom: '12px', overflow: 'hidden', background: THEME.white }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: '12px 16px', background: isOpen ? `${color}08` : '#fafafa', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', fontWeight: 'bold', color: color, fontSize: '14px'
        }}
      >
        <span>{title}</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>
      {isOpen && <div style={{ padding: '16px', borderTop: `1px solid ${THEME.border}` }}>{children}</div>}
    </div>
  );
};

// B-3: 底部摘要面板 (點擊可展開詳細資訊，點擊時柱可換時辰)
const BottomSummaryPanel = ({ info, onDetailClick, onTimeClick, isBookmarked, onToggleBookmark }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 當日期改變時，自動收合 (可選)
  useEffect(() => {
    setIsExpanded(false);
  }, [info?.dateStr]);

  if (!info) return null;

  const dgColor = info.dongGongRating.includes('吉') ? THEME.blue : (info.dongGongRating.includes('平') ? THEME.gray : THEME.red);

  const BookmarkBtn = () => (
    <button 
      onClick={(e) => { 
        e.stopPropagation(); // 阻止冒泡，避免觸發面板展開
        onToggleBookmark(); 
      }}
      style={{ 
        background: 'none', border: 'none', padding: '4px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', marginLeft: '4px'
      }}
    >
      <Bookmark 
        size={20} 
        fill={isBookmarked ? THEME.red : 'none'} 
        color={isBookmarked ? THEME.red : '#ccc'} 
      />
    </button>
  );

  // --- 1. 摺疊狀態 (只顯示簡單資訊) ---
  if (!isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        style={{ 
          backgroundColor: THEME.white, 
          borderTop: `1px solid ${THEME.border}`, 
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
          zIndex: 100,
          cursor: 'pointer',
          padding: '12px 16px',
          paddingBottom: '32px', // iPhone Home Bar space
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}
      >
         <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: THEME.black }}>{info.dateStr}</span>
            <span style={{ fontSize: '14px', color: THEME.gray }}>週{info.weekDay}</span>
            <span style={{ fontSize: '14px', color: THEME.primary, fontWeight: '500' }}>{info.lunarStr} {info.bazi.dayGan}{info.bazi.dayZhi}日</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* 原本的書籤按鈕 */}
                <BookmarkBtn />
                
                {/* 新增的加入系統日曆按鈕 */}
                {isBookmarked && (
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            // 傳入需要的標題資訊
                            downloadICS(info.dateStr, info.lunarStr, info.bazi.dayGan + info.bazi.dayZhi); 
                        }}
                        style={{ 
                            background: '#fff8f0', border: `1px solid ${THEME.orange}`, 
                            padding: '4px 8px', borderRadius: '12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            color: THEME.orange, fontSize: '11px', fontWeight: 'bold'
                        }}
                    >
                        <CalendarPlus size={14} />
                        日曆
                    </button>
                )}
            </div>
         </div>
         <div style={{ color: THEME.blue }}>
            <ChevronUp size={24} />
         </div>
      </div>
    );
  }

  // --- 2. 展開狀態 ---
  return (
    <div 
      style={{ 
        backgroundColor: THEME.white, 
        borderTop: `1px solid ${THEME.border}`, 
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        zIndex: 100,
        cursor: 'pointer',
        padding: '12px 16px',
        paddingBottom: '24px' // iPhone Home Bar space
      }}
      onClick={onDetailClick} 
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
         <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: THEME.black }}>{info.dateStr}</span>
            <span style={{ fontSize: '14px', color: THEME.gray }}>週{info.weekDay}</span>
            <span style={{ fontSize: '14px', color: THEME.primary, fontWeight: '500' }}>{info.lunarStr} {info.bazi.dayGan}{info.bazi.dayZhi}日</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* 原本的書籤按鈕 */}
                <BookmarkBtn />
                
                {/* 新增的加入系統日曆按鈕 */}
                {isBookmarked && (
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            // 傳入需要的標題資訊
                            downloadICS(info.dateStr, info.lunarStr, info.bazi.dayGan + info.bazi.dayZhi); 
                        }}
                        style={{ 
                            background: '#fff8f0', border: `1px solid ${THEME.orange}`, 
                            padding: '4px 8px', borderRadius: '12px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            color: THEME.orange, fontSize: '11px', fontWeight: 'bold'
                        }}
                    >
                        <CalendarPlus size={14} />
                        日曆
                    </button>
                )}
            </div>
         </div>
         
         {/* 這裡改為收合按鈕，阻止冒泡以免觸發 onDetailClick */}
         <div 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: THEME.blue, fontSize: '12px', padding: '4px' }}
         >
            <ChevronDown size={24} />
         </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '13px', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', color: THEME.black }}>
                    建除：<b>{info.jian}</b>
                  </span>
                  <span style={{ fontSize: '13px', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', color: THEME.black }}>
                    星宿：<b>{info.xiu}</b>
                  </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '13px', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', color: THEME.black }}>
                    烏兔：<span style={{ fontWeight: 'bold', color: info.wutu?.color }}>{info.wutuStr}</span>
                  </span>
                  <span style={{ fontSize: '13px', background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', color: THEME.black }}>
                    董公：<span style={{ fontWeight: 'bold', color: dgColor }}>{info.dongGongShort}</span>
                  </span>
              </div>
          </div>

          <div style={{ display: 'flex', gap: '4px', textAlign: 'center' }}>
              <div 

                onClick={(e) => { e.stopPropagation(); onTimeClick(); }} 
                style={{ background: '#e6f7ff', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', border: `1px solid ${THEME.blue}` }}
              >
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>時</div>
                  <div style={{ fontWeight: 'bold', color: THEME.black}}>{info.bazi.timeGan}</div>
                  <div style={{ fontWeight: 'bold', color: THEME.black }}>{info.bazi.timeZhi}</div>
              </div>
              <div style={{ background: '#f9f9f9', borderRadius: '6px', padding: '4px 6px' }}>
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>日</div>
                  <div style={{ fontWeight: 'bold', color: THEME.black }}>{info.bazi.dayGan}</div>
                  <div style={{ fontWeight: 'bold', color: THEME.black }}>{info.bazi.dayZhi}</div>
              </div>
              <div style={{ background: '#f9f9f9', borderRadius: '6px', padding: '4px 6px' }}>
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>月</div>
                  <div style={{ fontWeight: 'bold', color: THEME.black }}>{info.bazi.monthGan}</div>
                  <div style={{ fontWeight: 'bold', color: THEME.black }}>{info.bazi.monthZhi}</div>
              </div>
              <div style={{ background: '#f9f9f9', borderRadius: '6px', padding: '4px 6px' }}>
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>年</div>
                  <div style={{ fontWeight: 'bold', color: THEME.black }}>{info.bazi.yearGan}</div>
                  <div style={{ fontWeight: 'bold', color: THEME.black }}>{info.bazi.yearZhi}</div>
              </div>
          </div>
      </div>
    </div>
  );
};

// B-4: 詳細資訊彈出視窗 (Modal)
const DayDetailModal = ({ isOpen, onClose, date, info, toggleBookmark, isBookmarked }) => {
  if (!isOpen || !date || !info) return null;

    // 董公
    const DONG_GONG_INTRO = `大富貴人用事與平常富貴者迥異，夫大富貴人擇日，惟合吉時即可成立定局，縱日干凶煞，一被其時內吉神化解，兼被其威勢節制，凶煞自退，用之無妨。平常富貴人用之，終不能獲吉。而平民百姓用之，難免招非破財之事。故用日宜擇吉兼參照本命而行，無不獲善也。

同一吉日，可能利甲某人而不利乙某人。如嫁娶需同參主人年歲合局、洞房花燭之吉時；移居需同參主人入宅、敬神時辰為吉。故嫁娶、開張、出行、起造、移居等事，除擇吉日之外，擇時亦十分重要。古雲：年吉不如月吉，月吉不如日吉，日吉不如時吉也。若吉日能合吉時，則萬事大吉利也。

如遇煞入中宮或白虎入中宮之日，不可在庭院之中釘釘及鼓樂喧嘩之聲浪，凡此種日干，即使有煞貢、直星、人專、天德、月德星臨，似可化解、然已生疑及旁觀，故避用為上策。又或起造者雲有水星化解、嫁娶者雲有文星化解、或雲可用字元鎮壓化解，皆不可信，需知凡嫁娶、起造等事，如犯五鬼凶日、黑煞星臨，或白虎入中宮之日，速者百日內，緩者一年內外見官司、傷亡等凶禍之事。實不容忽視之。`;

    // 貴人登天門時
    const guiRenData = useMemo(() => {
        if(!date) return null;
        try {
            const solar = window.Solar.fromYmd(date.getFullYear(), date.getMonth()+1, date.getDate());
            return getGuiRenTimes(solar.getLunar());
        } catch(e) { return null; }
    }, [date]);

    // 烏兔太陽太陰日
    const [showWuTuPoem, setShowWuTuPoem] = useState(false);
    const wuTuData = useMemo(() => {
        if(!date) return null;
        try {
            const solar = window.Solar.fromYmd(date.getFullYear(), date.getMonth()+1, date.getDate());
            return getWuTuSolarStar(solar.getLunar());
        } catch(e) { return null; }
    }, [date]);

    const wuTuDetail = useMemo(() => {
        if(!date) return null;
        try {
            const solar = window.Solar.fromYmd(date.getFullYear(), date.getMonth()+1, date.getDate());
            return getWuTuDetails(solar.getLunar());
        } catch(e) { return null; }
    }, [date]);

    // 斗首擇日法
    const [selectedMtn, setSelectedMtn] = useState('壬'); // 預設壬山

    const selectedMtnRef = useRef(selectedMtn);
    selectedMtnRef.current = selectedMtn;

    const douShouAnalysis = useMemo(() => {
        if (!info || !info.bazi) return null;
        const hostEl = DOU_SHOU_MOUNTAIN_MAP[selectedMtn];
        
        // 計算四柱
        const pillars = [
            { label: '年', gan: info.bazi.yearGan, zhi: info.bazi.yearZhi },
            { label: '月', gan: info.bazi.monthGan, zhi: info.bazi.monthZhi },
            { label: '日', gan: info.bazi.dayGan, zhi: info.bazi.dayZhi },
            { label: '時', gan: info.bazi.timeGan, zhi: info.bazi.timeZhi }
        ].map(p => {
            const guestEl = DOU_SHOU_STEM_MAP[p.gan];
            return { ...p, guestEl, ...getDouShouStar(hostEl, guestEl) };
        });

        const lianZiCount = pillars.filter(p => p.star === '廉子').length;
        const yunQiCount = pillars.filter(p => p.star === '元氣').length;
        return { hostEl, pillars, lianZiCount, yunQiCount };
    }, [info, selectedMtn]);

    const mountainScrollRef = useRef(null);
        const ITEM_HEIGHT = 30; // 每一行的高度 (px)

        // 1. 初始化或 Modal 開啟時，滾動到目前選中的位置
        const setScrollRef = useCallback((node) => {
            mountainScrollRef.current = node;
            if (node) {
                const currentMtn = selectedMtnRef.current;
                const index = MOUNTAIN_LIST.indexOf(currentMtn);
                if (index !== -1) {
                    // 直接設定 scrollTop (不需 smooth)，確保展開瞬間即在正確位置
                    node.scrollTop = index * ITEM_HEIGHT;
                }
            }
        }, []);

        // 2. 處理滾動事件：計算目前停在哪一個項目
        const handleWheelScroll = (e) => {
            const scrollTop = e.target.scrollTop;
            const index = Math.round(scrollTop / ITEM_HEIGHT);
            
            if (index >= 0 && index < MOUNTAIN_LIST.length) {
                const newMtn = MOUNTAIN_LIST[index];
                if (newMtn !== selectedMtn) {
                    setSelectedMtn(newMtn);
                }
            }
        };
        
        // 3. 點擊項目時直接滾動到位
        const handleItemClick = (index) => {
            if (mountainScrollRef.current) {
                mountainScrollRef.current.scrollTo({
                    top: index * ITEM_HEIGHT,
                    behavior: 'smooth'
                });
            }
        };

        return (
            <div style={{
                // ... (Modal 外層樣式保持不變) ...
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', zIndex: 1200,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }} onClick={onClose}>
            <div style={{
                // ... (Modal 內層樣式保持不變) ...
                background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '20px',
                height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }} onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
<div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: THEME.black }}>
                  {date.getMonth()+1}月{date.getDate()}日 <span style={{fontSize:'16px', color:'#6666663f'}}>週{info.weekDay}</span>
                </div>
                <div style={{ fontSize: '13px', color: THEME.black }}>
                    {/* 修改處：增加 info.bazi.dayGan + info.bazi.dayZhi + "日" */}
                    {info.ganZhiYear}年 {info.lunarStr} {info.bazi.dayGan}{info.bazi.dayZhi}日
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => toggleBookmark(date)} style={{ border: 'none', background: 'none', padding: '8px', cursor: 'pointer' }}>
                 <Bookmark size={24} fill={isBookmarked ? THEME.red : 'none'} color={isBookmarked ? THEME.red : '#ccc'} />
              </button>
              {/* --- 修改：右上角關閉按鈕樣式 (無背景圓形) --- */}
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor:'pointer' }}>
                  <X size={26} color="#666"/>
              </button>
            </div>
        </div>

        {/* Modal Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* 宜忌速覽 (動態讀取) */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ color: '#389e0d', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>宜</div>
                    <div style={{ fontSize: '13px', lineHeight: '1.4' }}>{info.yi}</div>
                </div>
                <div style={{ flex: 1, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ color: '#cf1322', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>忌</div>
                    <div style={{ fontSize: '13px', lineHeight: '1.4' }}>{info.ji}</div>
                </div>
            </div>

            {/* 擇日神煞 */}
            <AccordionSection title="擇日神煞" defaultOpen={true} color="#722ed1">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', alignItems: 'stretch' }}>                    
                    {/* 天赦日 */}
                    {info.isTianShe && (
                        <div style={{ 
                            background: '#f6ffed', padding: '12px', borderRadius: '12px', 
                            border: '1px solid #b7eb8f', display: 'flex', alignItems: 'center', gap: '12px'
                        }}>
                            <div style={{ 
                                background: '#389e0d', color: '#fff', padding: '2px 4px', 
                                borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' 
                            }}>
                                天赦日
                            </div>
                            <div style={{ fontSize: '12px', color: '#389e0d' }}>
                                四季皇恩大赦，百事大吉，能解諸凶
                            </div>
                        </div>
                    )}

                    {/* 謝灶日 */}
                    {info.xieZao && (
                        <div style={{ 
                            background: '#fff7e6', padding: '12px', borderRadius: '12px', 
                            border: '1px solid #ffe58f', display: 'flex', alignItems: 'center', gap: '12px'
                        }}>
                            <div style={{ 
                                background: '#fa8c16', color: '#fff', padding: '2px 4px', 
                                borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' 
                            }}>
                                {info.xieZao}
                            </div>
                            <div style={{ fontSize: '12px', color: '#d46b08' }}>
                                吉，宜祭祀灶神、大掃除、作灶
                            </div>
                        </div>
                    )}

                    {/* 三娘煞 */}
                    {info.isSanNiang && (
                        <div style={{ 
                            background: '#fff1f0', padding: '12px', borderRadius: '12px', 
                            border: '1px solid #ffa39e', display: 'flex', alignItems: 'center', gap: '12px'
                        }}>
                            <div style={{ 
                                background: '#cf1322', color: '#fff', padding: '2px 4px', 
                                borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', flexShrink: 0
                            }}>
                                三娘煞
                            </div>
                            <div style={{ fontSize: '12px', color: '#cf1322' }}>
                                凶，忌嫁娶、出行、求財、上官赴任
                            </div>
                        </div>
                    )}

                    {/* 凶煞 */}
                    {info.badStars && info.badStars.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                            {info.badStars.map((star, idx) => {
                                // 凶煞簡述對照表
                                const BAD_STAR_DESC = {
                                    '歲破': '大凶，為太歲相沖之日，諸事不宜',
                                    '月破': '大凶，與流月相沖，忌祈福、嫁娶、開市',
                                    '四廢': '凶，為五行無氣之日，百事皆忌',
                                    '四離': '凶，四季交替前夕，忌出行、動土、結婚',
                                    '無祿': '凶，吉氣受阻，不利求財、開市、上官赴任',
                                    '復喪': '凶，忌安葬、入殮、探病，防重喪',
                                    '三喪': '凶，忌安葬、探病等事',
                                    '債𣎴': '凶，忌借貸、出資、簽約交易'
                                };

                                return (
                                    <div key={idx} style={{ 
                                        background: '#fff1f0', padding: '12px', borderRadius: '12px', 
                                        border: '1px solid #ffa39e', display: 'flex', alignItems: 'center', gap: '12px'
                                    }}>
                                        <div style={{ 
                                            background: '#cf1322', color: '#fff', padding: '4px 8px', 
                                            borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                                            flexShrink: 0 
                                        }}>
                                            {star}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#cf1322', lineHeight: '1.4' }}>
                                            {BAD_STAR_DESC[star] || '凶，諸事宜避'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 建除十二神 */}
                    {(() => {
                        // 直接從 Constants 獲取對應物件
                        const data = JIAN_CHU_INFO[info.jian] || {};
                        return (
                            <InfoItem 
                                label="建除十二神" 
                                value={`${info.jian}日`}
                                yi={data.yi}      // 傳入 宜
                                ji={data.ji}      // 傳入 忌
                                source={data.source} // 傳入 典故 (點擊顯示)
                            />
                        );
                    })()}

                    {/* 二十八宿 */}
                    {(() => {
                        // 直接從 Constants 獲取對應物件
                        const data = XIU_INFO[info.xiu] || {};
                        return (
                            <InfoItem 
                                label="二十八宿" 
                                value={info.xiuFull} 
                                yi={data.yi}      // 傳入 宜
                                ji={data.ji}      // 傳入 忌
                                source={data.source} // 傳入 典故 (點擊顯示)
                            />
                        );
                    })()}
                    
                </div>
            </AccordionSection>

            {/* 董公 */}
            <AccordionSection 
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        董公擇日便覽
                        <div 
                            onClick={(e) => {
                                e.stopPropagation(); // 防止觸發摺疊
                                alert(DONG_GONG_INTRO); // 顯示總論
                            }}
                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '4px' }}
                        >
                            <Info size={18} color="#fa8c16" />
                        </div>
                    </div>
                } 
                defaultOpen={true} 
                color="#fa8c16"
            >
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: info.dongGongRating.includes('吉') ? THEME.blue : (info.dongGongRating === '平' ? THEME.gray : THEME.red) }}>
                    {info.dongGongRating}
                  </span>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#444', whiteSpace: 'pre-line' }}>
                    {info.dongGongText}
                </div>
            </AccordionSection>

            {/* 貴人登天門時 */}
            {guiRenData && (
                <AccordionSection title="貴人登天門時" defaultOpen={true} color="#eb2f96">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                            月將：<span style={{ fontWeight: 'bold', color: '#333' }}>{guiRenData.general}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ background: '#fff0f6', padding: '10px', borderRadius: '8px', border: '1px solid #ffadd2' }}>
                                <div style={{ fontSize: '12px', color: '#eb2f96', fontWeight: 'bold', marginBottom: '4px' }}>陽貴 (晝)</div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{guiRenData.yang}時</div>
                            </div>
                            <div style={{ background: '#f9f0ff', padding: '10px', borderRadius: '8px', border: '1px solid #d3adf7' }}>
                                <div style={{ fontSize: '12px', color: '#722ed1', fontWeight: 'bold', marginBottom: '4px' }}>陰貴 (夜)</div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{guiRenData.yin}時</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            * 貴登天門時乃時之最吉者，能解諸凶
                        </div>
                    </div>
                </AccordionSection>
            )}
            {/* 烏兔太陽太陰日 */}
            {wuTuData && (
                <AccordionSection 
                    title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>烏兔太陽太陰日</span>
                            <span style={{ 
                                fontSize: '14px', 
                                fontWeight: 'bold', 
                                color: wuTuData.color,
                                backgroundColor: `${wuTuData.color}15`,
                                padding: '2px 8px',
                                borderRadius: '4px'
                            }}>
                                {wuTuData.name}
                            </span>
                        </div>
                    } 
                    defaultOpen={true} 
                    color={wuTuData.color}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        {/* 1. 簡述與吉凶 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>
                                 {wuTuData.name}
                             </div>
                             <div style={{ 
                                 fontSize: '13px', 
                                 color: wuTuData.吉 ? '#52c41a' : '#ff4d4f', 
                                 fontWeight: 'bold',
                                 backgroundColor: wuTuData.吉 ? '#f6ffed' : '#fff1f0',
                                 padding: '4px 10px',
                                 borderRadius: '20px',
                                 border: `1px solid ${wuTuData.吉 ? '#b7eb8f' : '#ffa39e'}`
                             }}>
                                 {wuTuData.desc}
                             </div>
                        </div>

                        {/* 2. 太陽太陰金木吉時與方位 */}
                        {wuTuDetail && (
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: '8px', 
                                backgroundColor: '#f9f9f9', 
                                padding: '10px', 
                                borderRadius: '8px',
                                border: '1px solid #eee'
                            }}>
                                {/* 太陽 */}
                                <div>
                                    <div style={{ fontSize: '12px', color: THEME.orange, fontWeight: 'bold', marginBottom: '4px' }}>☀ 太陽時方</div>
                                    <div style={{ fontSize: '13px', color: '#333' }}>
                                        <span style={{ fontWeight: 'bold' }}>時：</span>{wuTuDetail.sun}時
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#333' }}>
                                        <span style={{ fontWeight: 'bold' }}>方：</span>{wuTuDetail.sunPos}
                                    </div>
                                </div>
                                {/* 太陰 */}
                                <div>
                                    <div style={{ fontSize: '12px', color: THEME.purple, fontWeight: 'bold', marginBottom: '4px' }}>🌙 太陰時方</div>
                                    <div style={{ fontSize: '13px', color: '#333' }}>
                                        <span style={{ fontWeight: 'bold' }}>時：</span>{wuTuDetail.moon}時
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#333' }}>
                                        <span style={{ fontWeight: 'bold' }}>方：</span>{wuTuDetail.moonPos}
                                    </div>
                                </div>
                                {/* 金星 */}
                                <div>
                                    <div style={{ fontSize: '12px', color: COLORS.geng, fontWeight: 'bold', marginBottom: '2px' }}>🌟 金星到方</div>
                                    <div style={{ fontSize: '13px', color: '#333' }}>
                                        <span style={{ fontWeight: 'bold' }}>方：</span>{wuTuDetail.venusPos}
                                    </div>
                                </div>

                                {/* 木星 */}
                                <div>
                                    <div style={{ fontSize: '12px', color: THEME.green, fontWeight: 'bold', marginBottom: '2px' }}>🪵 木星到方</div>
                                    <div style={{ fontSize: '13px', color: '#333' }}>
                                        <span style={{ fontWeight: 'bold' }}>方：</span>{wuTuDetail.jupiterPos}
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: THEME.gray, marginTop: '2px' }}>
                                    * 太陽到向、烏兔太陰到山最吉。太陽到山、太陰到向次吉
                                </div>
                            </div>
                        )}

                        <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }}></div>

                        {/* 3. 歌訣內容 */}
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#999', marginBottom: '6px' }}>
                                值日星曜歌訣
                            </div>
                            {(() => {
                                const poems = WUTU_POEMS[wuTuData.name] || [];
                                return poems.length > 0 ? (
                                    poems.map((poem, idx) => (
                                        <div key={idx} style={{ 
                                            fontSize: '14px', 
                                            color: '#555', 
                                            lineHeight: '1.6', 
                                            marginBottom: '6px',
                                            textAlign: 'justify' 
                                        }}>
                                            {poem}
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ fontSize: '13px', color: '#ccc' }}>暫無歌訣</div>
                                );
                            })()}
                        </div>

                        {/* 底部註解 */}
                        <div style={{ fontSize: '11px', color: THEME.gray, marginTop: '4px' }}>
                            * 用鳥兔太陽方除五黃會力士，乃五黃會劫煞外，其餘一切神煞均不忌，若用太陽太陰日時（或其他吉星）可以助吉
                        </div>
                    </div>
                </AccordionSection>
            )}
            {/* 斗首擇日法 */}
            <AccordionSection title="斗首擇日法" defaultOpen={true} color="#1890ff">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* --- 垂直滾輪選擇器 --- */}
                    <div style={{ 
                        position: 'relative', 
                        height: '90px', // 容器總高度 (約顯示 5 行)
                        background: '#f8f8f8', 
                        borderRadius: '12px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        
                        {/* 中間選取線 (Highlight Bar) */}
                        <div style={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '0', 
                            right: '0', 
                            height: '30px', // ITEM_HEIGHT
                            marginTop: '-15px', 
                            borderTop: `1px solid ${THEME.blue}40`,
                            borderBottom: `1px solid ${THEME.blue}40`,
                            background: '#fff',
                            pointerEvents: 'none',
                            zIndex: 1
                        }}></div>

                        {/* 上下遮罩 (3D 效果) */}
                        <div style={{ 
                            position: 'absolute', top: 0, left: 0, right: 0, height: '30px', 
                            background: 'linear-gradient(to bottom, rgba(248,248,248,1), rgba(248,248,248,0))', 
                            pointerEvents: 'none', zIndex: 2 
                        }}></div>
                        <div style={{ 
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px', 
                            background: 'linear-gradient(to top, rgba(248,248,248,1), rgba(248,248,248,0))', 
                            pointerEvents: 'none', zIndex: 2 
                        }}></div>

                        {/* 滾動容器 (綁定 setScrollRef) */}
                        <div 
                            ref={setScrollRef}
                            onScroll={handleWheelScroll}
                            style={{ 
                                width: '100%',
                                height: '100%',
                                overflowY: 'auto',
                                overflowX: 'hidden', // 強制隱藏水平溢出
                                scrollSnapType: 'y mandatory',
                                zIndex: 3,
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch' // 增加 iOS 滾動流暢度
                            }}
                        >
                            {/* Chrome/Safari 隱藏捲軸 */}
                            <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                            
                            {/* 上方填充 (Padding Top) */}
                            <div style={{ height: '30px', flexShrink: 0 }}></div>

                            {/* 選項列表 */}
                            {MOUNTAIN_LIST.map((m, idx) => {
                                const isSelected = selectedMtn === m;
                                return (
                                    <div 
                                        key={m}
                                        onClick={() => handleItemClick(idx)}
                                        style={{ 
                                            height: '30px', // 必須與 ITEM_HEIGHT 一致
                                            width: '100%',   // 確保寬度撐滿，防止左右飄移
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            scrollSnapAlign: 'center',
                                            fontSize: '16px',
                                            fontWeight: isSelected ? '800' : '400', // 使用粗細變化代替縮放
                                            color: isSelected ? '#1890ff' : '#aaa',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'color 0.2s' // 移除 scale 變換，避免手機端渲染抖動
                                        }}
                                    >
                                        {m}山
                                    </div>
                                );
                            })}

                            {/* 下方填充 (Padding Bottom) */}
                            <div style={{ height: '30px', flexShrink: 0 }}></div>
                        </div>
                    </div>

                    {/* 分析結果 (保持不變) */}
                    <div style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 1fr 1.2fr', padding: '10px', background: '#fafafa', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                            <div>四柱</div>
                            <div>斗首星</div>
                            <div>番化</div>
                            <div>性質</div>
                        </div>
                        {douShouAnalysis.pillars.map((p, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 1fr 1.2fr', padding: '12px 10px', borderBottom: '1px solid #f0f0f0', alignItems: 'center', fontSize: '13px' }}>
                                <div style={{ fontWeight: 'bold' }}>{p.gan}{p.zhi}</div>
                                <div style={{ color: p.luck === '吉' ? '#389e0d' : '#cf1322', fontWeight: 'bold' }}>{p.star}</div>
                                <div style={{ color: p.luck === '吉' ? '#389e0d' : '#cf1322' }}>
                                    {p.fan} <span style={{ fontSize: '11px' }}>({p.luck})</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#999' }}>{p.desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* 元辰廉子警告 (保持不變) */}
                    {douShouAnalysis.lianZiCount > 1 && douShouAnalysis.yunQiCount > 0 && (
                        <div style={{ padding: '8px 12px', background: '#fff7e6', border: '1px solid #ffe58f', borderRadius: '8px', fontSize: '12px', color: '#d46b08', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Info size={14} /> 元辰強旺，宜用一位廉子，多則不吉。元辰哀弱不宜用廉子。
                        </div>
                    )}
                </div>
            </AccordionSection>
          </div>
      </div>
    </div>
  );
};

// B-5: TimePickerModal
const TimePickerModal = ({ visible, onClose, onSelect, currentRule, currentIndex, dayGan }) => {
  if (!visible) return null;
  const mapping = GET_SHI_CHEN_MAPPING(currentRule);
  const upperRow = mapping.slice(0, 6);
  const lowerRow = mapping.slice(6);
  const formatTimeRange = (timeStr) => {
      const parts = timeStr.split('-');
      const start = parseInt(parts[0].split(':')[0], 10);
      let end = parseInt(parts[1].split(':')[0], 10);
      if (end === 24) end = 0;
      return `${start}-${end}`;
  };
  const renderButton = (item, idx, rowOffset) => {
      const realIdx = idx + rowOffset;
      const isSelected = realIdx === currentIndex;
      const stem = getShiGan(dayGan, item.name);
      const displayName = item.name.replace('早','').replace('夜','');
      return (
        <button key={item.name} onClick={() => onSelect(realIdx)} style={{ flex: 1, padding: '10px 0', margin: 0, borderRadius: '8px', border: isSelected ? `1px solid ${THEME.blue}` : `1px solid ${THEME.border}`, backgroundColor: isSelected ? THEME.bgBlue : THEME.white, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', minWidth: 0 }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: isSelected ? THEME.blue : THEME.black, marginBottom: '2px' }}>{stem}{displayName}</div>
          <div style={{ fontSize: '11px', color: THEME.lightGray, fontWeight: '500' }}>{formatTimeRange(item.time)}</div>
        </button>
      );
  };
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1300 }} onClick={onClose}>
      <div style={{ backgroundColor: THEME.white, borderRadius: '16px', width: '96%', maxWidth: '390px', padding: '20px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div><h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: THEME.black }}>選擇時辰</h3><div style={{ fontSize: '12px', color: THEME.gray, marginTop: '2px' }}>日干: <span style={{ color: THEME.orange, fontWeight: 'bold' }}>{dayGan}</span></div></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px' }}><X size={24} color={THEME.gray} /></button>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>{upperRow.map((item, idx) => renderButton(item, idx, 0))}</div>
        <div style={{ display: 'flex', gap: '6px' }}>{lowerRow.map((item, idx) => renderButton(item, idx, 6))}</div>
      </div>
    </div>
  );
};

// =========================================================================
// PART C: 主要視圖組件
// =========================================================================

// C-1: SettingsView
const SettingsView = ({ ziHourRule, setZiHourRule, bookmarks, onRestore }) => {
  const APP_INFO = {
    appName: APP_NAME,
    version: APP_VERSION,
    about: "本應用程式旨在提供精確的流年流月進退氣萬年曆查詢，結合民間神煞，輔助使用者進行擇日修方用事分析。",
  };

  const ToggleSelector = ({ options, currentValue, onChange }) => (
    <div style={{ display: 'flex', backgroundColor: THEME.bgGray, borderRadius: '20px', padding: '2px' }}>
      {options.map((opt) => (
        <button key={opt.val} onClick={() => onChange(opt.val)} style={{ padding: '6px 14px', border: 'none', borderRadius: '18px', backgroundColor: currentValue === opt.val ? THEME.blue : 'transparent', color: currentValue === opt.val ? 'white' : THEME.gray, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{opt.label}</button>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '16px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
        <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>設定</h2>
      </div>

      <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>偏好設定</h3>
      <div style={{ backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>子時設定</div>
              <ToggleSelector options={[{val: 'ziZheng', label: '子正換日'}, {val: 'ziShi', label: '子時換日'}]} currentValue={ziHourRule} onChange={setZiHourRule} />
          </div>
      </div>

      <WebBackupManager data={bookmarks} onRestore={onRestore} prefix="CALENDAR_BACKUP" />
      <AppInfoCard info={APP_INFO} />
      <BuyMeCoffee />

      <div style={{ marginTop: '24px' }}>
          <button onClick={() => { if(window.confirm('還原預設?')) { setZiHourRule('ziShi'); } }} style={{ width: '100%', padding: '12px', backgroundColor: THEME.bgGray, color: THEME.red, border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> 還原預設值
          </button>
      </div>
    </div>
  );
};

// C-2: CalendarToolbar
const CalendarToolbar = ({ 
    currentDate, onToday, solarTerms, headerGanZhi, 
    onTitleClick, 
    showJinQi, setShowJinQi, 
    showTuiQi, setShowTuiQi 
}) => {
    
    const getBtnStyle = (isActive, color, bgActive) => ({
      fontSize: '12px',
      padding: '4px 10px',
      borderRadius: '16px',
      border: `1px solid ${isActive ? color : '#ddd'}`,
      background: isActive ? bgActive : 'white',
      color: isActive ? color : THEME.black,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.2s'
    });

    const toggleJinQi = () => {
        if (showJinQi) {
            setShowJinQi(false);
        } else {
            setShowJinQi(true);
            setShowTuiQi(false); // 關閉流月
        }
    };

    const toggleTuiQi = () => {
        if (showTuiQi) {
            setShowTuiQi(false);
        } else {
            setShowTuiQi(true);
            setShowJinQi(false); // 關閉流年
        }
    };

    return (
      <div style={{ padding: '10px 16px', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                    onClick={toggleJinQi} 
                    style={getBtnStyle(showJinQi, '#722ed1', '#f9f0ff')}
                >
                    {showJinQi ? <Eye size={14}/> : <EyeOff size={14}/>} 流年進退氣
                </button>
                <button 
                    onClick={toggleTuiQi} 
                    style={getBtnStyle(showTuiQi, '#fa8c16', '#fff7e6')}
                >
                    {showTuiQi ? <Eye size={14}/> : <EyeOff size={14}/>} 流月進退氣
                </button>
            </div>

            <button 
                onClick={onToday} 
                style={{ 
                    color: THEME.white, backgroundColor: THEME.black, 
                    padding: '6px 12px', borderRadius: '16px',
                    fontSize: '12px', fontWeight: 'bold', 
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}
            >
                <RotateCcw size={12} /> 今天
            </button>
          </div>

          {/* 下排標題區 (修改處) */}
          {/* 1. 加入 justifyContent: 'space-between' 讓左右區塊分開 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* 左側：跳轉日期標題 (維持在最左) */}
            <div onClick={onTitleClick} style={{ position: 'relative', display: 'flex', alignItems: 'baseline', cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: THEME.black }}>{currentDate.getFullYear()}年</span>
                <span style={{ fontSize: '28px', fontWeight: '800', color: THEME.black, marginLeft: '6px' }}>{currentDate.getMonth()+1}月</span>
                <ChevronRight size={20} color={THEME.lightGray} style={{ marginLeft: '4px', transform: 'translateY(2px)' }} />
            </div>

            {/* 右側：農曆與節氣 */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px', alignItems: 'flex-end' }}>
                {headerGanZhi && (<span style={{ fontSize: '13px', color: THEME.gray, fontWeight: '500', lineHeight: '1.2' }}>{headerGanZhi.year} {headerGanZhi.month}</span>)}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', lineHeight: '1.2', maxWidth: '200px', justifyContent: 'flex-end' }}>
                    {solarTerms.map((term, idx) => (
                        <span key={idx} style={{ color: THEME.purple, fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1' }}>
                           <span>{term.name}{term.day}日</span>
                           {/* 新增：顯示時間 */}
                           <span style={{ fontSize: '10px', opacity: 0.8 }}>{term.time}</span>
                        </span>
                    ))}
                </div>
            </div>
          </div>
      </div>
    );
};

// C-3: DayCell
const DayCell = ({ date, isCurrentMonth, isToday, isSelected, onClick, canRender, bookmarks, qiMode, showTuiQi }) => {
  if (!canRender || !date || isNaN(date.getTime())) return <div style={{ height: '75px', background: '#fff' }}></div>;
  
  // 1. 在這裡初始化變數 (加入 isTianShe 和 xieZao)
  let data = { 
      lunarDisplay: date.getDate(), 
      ganZhi: '', 
      jian: '', 
      xiu: '', 
      isSanNiang: false, 
      colorJian: THEME.black, 
      colorXiu: THEME.black, 
      isJieQi: false, 
      dongGongRating: '', 
      isNewYear: false, 
      wutu: null,
      wutuStr: '',
      isTianShe: false,
      xieZao: null
  };
  
  let activeColors = [null, null, null, null];

  try {
      const solar = window.Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
      const lunar = solar.getLunar();
      const baziObj = lunar.getEightChar();

      // 確保只要當天有交節氣，該格子就會顯示新的進氣顏色
      const solarEndOfDay = window.Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), 23, 59, 59);
      const baziEnd = solarEndOfDay.getLunar().getEightChar();

      const d = lunar.getDay();
      const m = lunar.getMonthInChinese();
      const term = lunar.getJieQi();
      
      if (term) { 
          const fixTerm = JIE_QI_FIX_MAP[term] || term;
          data.lunarDisplay = fixTerm;
          data.isJieQi = true;
      } else {
        if (lunar.getMonth() === 1 && d <= 3) {
            data.lunarDisplay = `年初${['一','二','三'][d-1]}`;
            data.isNewYear = true; 
        } else if (d === 1) {
            let monthDisplay = m === '冬' ? '十一' : (m === '腊' || m === '臘' ? '十二' : m);
            data.lunarDisplay = `${monthDisplay}月`;
        } else {
            data.lunarDisplay = lunar.getDayInChinese();
        }
      }

      data.ganZhi = lunar.getDayInGanZhi();
      const rawJian = lunar.getZhiXing();
      const fixJian = JIAN_FIX_MAP[rawJian] || rawJian;
      data.jian = fixJian; data.colorJian = JIAN_CHU_COLOR_MAP[rawJian] || JIAN_CHU_COLOR_MAP[fixJian] || THEME.teal;
      
      const rawXiu = lunar.getXiu();
      const fixXiu = XIU_FIX_MAP[rawXiu] || rawXiu;
      data.xiu = fixXiu; data.colorXiu = XIU_COLOR_MAP[rawXiu] || XIU_COLOR_MAP[fixXiu] || THEME.red;
      
      if (SAN_NIANG_DAYS.includes(d)) data.isSanNiang = true;
      
      // --- 2. 修正賦值方式 (寫入 data 物件) ---
      data.isTianShe = getTianShe(baziEnd.getMonthZhi(), lunar.getDayInGanZhi()); 
      data.xieZao = getXieZao(lunar.getMonth(), lunar.getDay());
      // -------------------------------------

      const monthNum = Math.abs(lunar.getMonth());
      const dayZhi = lunar.getDayZhi(); const dayGanZhi = lunar.getDayInGanZhi();
      const dgRule = DONG_GONG_RULES[monthNum]?.[dayZhi];
      if (dgRule) data.dongGongRating = (dgRule.s && dgRule.s[dayGanZhi]) ? dgRule.s[dayGanZhi] : dgRule.r;
      const star = getWuTuSolarStar(lunar);
      if (star) {
          data.wutu = star;
          data.wutuStr = WUTU_ABBR[star.name] || star.name[0];
      }

      // 進退氣邏輯
      if (qiMode) {
          let baseStemIdx = -1, baseBranchIdx = -1;
          let currStemIdx = -1, currBranchIdx = -1;
          
          if (qiMode === 'nian') {
              baseStemIdx = TIANGAN.indexOf(baziEnd.getYearGan());
              baseBranchIdx = DIZHI.indexOf(baziEnd.getYearZhi());
              currStemIdx = TIANGAN.indexOf(baziEnd.getMonthGan());
              currBranchIdx = DIZHI.indexOf(baziEnd.getMonthZhi());
              
              const getRelIdx = (bIdx) => (bIdx - 2 + 12) % 12;
              const currRelIdx = getRelIdx(currBranchIdx); 
              [-1, 0, 1].forEach(offset => {
                  const targetStemIdx = (baseStemIdx + offset + 10) % 10;
                  const targetBranchIdx = (baseBranchIdx + offset + 12) % 12;
                  const sRules = QI_RULES.stems[targetStemIdx];
                  const bRules = QI_RULES.branches[targetBranchIdx];
                  const myPos = currRelIdx - (offset * 12);
                  if (sRules) {
                      sRules.forEach(range => {
                          if (myPos >= range[0] && myPos <= range[1]) {
                              const color = STEM_COLORS[targetStemIdx];
                              if (targetStemIdx % 2 === 0) activeColors[0] = color;
                              else activeColors[1] = color;
                          }
                      });
                  }
                  if (bRules) {
                      bRules.forEach(range => {
                          if (myPos >= range[0] && myPos <= range[1]) {
                              const color = BRANCH_COLORS[targetBranchIdx];
                              if (targetBranchIdx % 2 === 0) activeColors[2] = color;
                              else activeColors[3] = color;
                          }
                      });
                  }
              });
          } else if (showTuiQi || qiMode === 'yue') {
              const stemStatus = getMonthlyStemQiStatus(date, lunar);
              if (stemStatus && stemStatus.isActive) {
                  if (stemStatus.stemIdx % 2 === 0) {
                      activeColors[0] = stemStatus.color; 
                  } else {
                      activeColors[1] = stemStatus.color; 
                  }
              }

              const branchStatus = getMonthlyBranchQiStatus(date, lunar);
              if (branchStatus && branchStatus.isActive) {
                  if (branchStatus.branchIdx % 2 === 0) {
                      activeColors[2] = branchStatus.color; 
                  } else {
                      activeColors[3] = branchStatus.color; 
                  }
              }
          }
      }

  } catch (e) { console.error(e); }

  const dateKey = getLocalDateString(date);
  const isBookmarked = bookmarks.some(b => 
      (typeof b === 'string' ? b : (b.targetDate || b.name || b.id)) === dateKey
  );
    const dayOfWeek = date.getDay();
  const numColor = (dayOfWeek === 0) ? THEME.red : THEME.black;
  let bg = THEME.white;
  let textOpacity = 1;
  if (!isCurrentMonth) { bg = '#e0e0e0'; textOpacity = 0.45; }

  return (
    <div onClick={() => onClick(date)} style={{ height: '75px', backgroundColor: bg, borderRight: `1px solid ${THEME.border}`, borderBottom: `1px solid ${THEME.border}`, position: 'relative', cursor: 'pointer', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {activeColors[0] && <div style={{ position: 'absolute', left: '2px', right: '2px', top: '1%', height: '23%', borderRadius: '12px', backgroundColor: activeColors[0], opacity: 0.4, zIndex: 1 }} />}
      {activeColors[1] && <div style={{ position: 'absolute', left: '2px', right: '2px', top: '26%', height: '23%', borderRadius: '12px', backgroundColor: activeColors[1], opacity: 0.4, zIndex: 1 }} />}
      {activeColors[2] && <div style={{ position: 'absolute', left: '2px', right: '2px', top: '51%', height: '23%', borderRadius: '12px', backgroundColor: activeColors[2], opacity: 0.4, zIndex: 1 }} />}
      {activeColors[3] && <div style={{ position: 'absolute', left: '2px', right: '2px', top: '76%', height: '23%', borderRadius: '12px', backgroundColor: activeColors[3], opacity: 0.4, zIndex: 1 }} />}
      
      <div style={{ opacity: textOpacity, position: 'relative', height: '100%', zIndex: 2, fontWeight: qiMode ? 'bold' : 'normal' }}>
          <div style={{ position: 'absolute', top: '4px', left: '4px', fontSize: '20px', fontWeight: '800', color: numColor, lineHeight: 1 }}>{date.getDate()}</div>
          <div style={{ position: 'absolute', top: '3px', right: '2px', fontSize: '14px', fontWeight: 'bold', color: THEME.orange, writingMode: 'vertical-rl', lineHeight: '1', letterSpacing: '1px' }}>{data.ganZhi}</div>
          {data.isSanNiang && (<div style={{ position: 'absolute', top: '38px', left: '4px', fontSize: '8px', color: THEME.red, border: `1px solid ${THEME.red}`, borderRadius: '4px', padding: '1px 0px', fontWeight: 'bold' }}>三娘煞</div>)}
          <div style={{ position: 'absolute', top: '22px', left: '4px', fontSize: '12px', fontWeight: 'bold', color: data.isNewYear ? THEME.red : (data.isJieQi ? THEME.purple : THEME.black), whiteSpace: 'nowrap' }}>{data.lunarDisplay}</div>
            
            {/* 天赦日 */}
            {data.isTianShe && (
              <div style={{ 
                  position: 'absolute', 
                  top: '3px',              // 對齊天干
                  right: '16px',           // 位於天干左側 (天干約佔 14px 寬 + 2px right)
                  fontSize: '9px', 
                  color: '#fff', 
                  background: '#389e0d',
                  borderRadius: '50%',     // 圓形
                  width: '12px',           // 固定寬高
                  height: '12px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 'bold', 
                  zIndex: 5 
              }}>
                  赦
              </div>
          )}
          
          {/* 謝灶日 */}
          {data.xieZao && (
              <div style={{ 
                  position: 'absolute', 
                  top: data.isTianShe ? '20px' : '3px',
                  right: '16px',            // 對齊干支欄
                  fontSize: '9px', 
                  color: '#fff', 
                  background: '#fa8c16',
                  borderRadius: '50%',     // 圓形
                  width: '12px',
                  height: '12px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 'bold', 
                  zIndex: 5 
              }}>
                  灶
              </div>
          )}

          <div style={{ position: 'absolute', bottom: '16px', right: '2px', fontSize: '12px', fontWeight: 'bold', color: data.colorXiu, textAlign: 'right' }}>{data.xiu}</div>
            <div style={{ 
                position: 'absolute', 
                bottom: '2px', 
                left: '0', 
                right: '0', 
                height: '16px', 
                pointerEvents: 'none' 
            }}>
                <div style={{ 
                    position: 'absolute',
                    left: '2px',
                    bottom: '0',
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    color: data.colorJian,
                    lineHeight: '1'
                }}>
                    {data.jian}
                </div>

                {data.wutu && (
                    <div style={{ 
                        position: 'absolute',
                        left: '21px',
                        bottom: '0',
                        transform: 'translateX(-50%)', 
                        fontSize: '12px', 
                        fontWeight: 'bold', 
                        color: data.wutu.color,
                        lineHeight: '1',
                        zIndex: 5,
                        maxWidth: '30%', 
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textAlign: 'center'
                    }}>
                        {WUTU_ABBR[data.wutu.name] || data.wutu.name[0]}
                    </div>
                )}

                {data.dongGongRating && (
                    <div style={{ 
                        position: 'absolute',
                        right: '2px',
                        bottom: '0',
                        fontSize: '12px', 
                        fontWeight: 'bold', 
                        color: data.dongGongRating.includes('吉') ? THEME.blue : (data.dongGongRating.includes('平') ? THEME.gray : THEME.red),
                        lineHeight: '1',
                        textAlign: 'right'
                    }}>
                        {data.dongGongRating}
                    </div>
                )}
            </div>
      </div>
      {isBookmarked && <div style={{ position: 'absolute', top: '4px', right: '28px', width: '6px', height: '6px', backgroundColor: THEME.red, borderRadius: '50%', zIndex: 3 }}></div>}
      {isSelected && <div style={{ position: 'absolute', inset: 0, border: `2px solid ${THEME.blue}`, pointerEvents: 'none', zIndex: 10 }}></div>}
    </div>
  );
};

// C-4: YearMonthPicker
const YearMonthPicker = ({ visible, onClose, onConfirm, initialDate }) => {
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth() + 1);
  useEffect(() => { if (visible) { setSelectedYear(initialDate.getFullYear()); setSelectedMonth(initialDate.getMonth() + 1); } }, [visible, initialDate]);
  if (!visible) return null;
  const years = []; for (let y = 1900; y <= 2100; y++) years.push(y);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }} onClick={onClose}>
      <div style={{ backgroundColor: THEME.white, borderRadius: '16px', width: '85%', maxWidth: '320px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: THEME.black }}>跳轉日期</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer' }}><X size={24} color={THEME.gray} /></button>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: THEME.gray, marginBottom: '6px' }}>年份</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px', backgroundColor: THEME.white }}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', color: THEME.gray, marginBottom: '6px' }}>月份</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px', backgroundColor: THEME.white }}>{months.map(m => <option key={m} value={m}>{m}</option>)}</select>
          </div>
        </div>
        <button onClick={() => { onConfirm(selectedYear, selectedMonth); onClose(); }} style={{ width: '100%', padding: '12px', backgroundColor: THEME.blue, color: 'white', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>確認跳轉</button>
      </div>
    </div>
  );
};


// =========================================================================
// PART D: 主程式 (App)
// =========================================================================

export default function CalendarApp() {
  // 全局啟用保護機制
  const isAuthorized = useProtection([]);
  if (!isAuthorized) return null;

  const libStatus = useLunarScript();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // 控制 Modal 開關
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const [bookmarks, setBookmarks] = useState([]);
  const [view, setView] = useState('calendar');
  const [ziHourRule, setZiHourRule] = useState('ziShi'); 
  const [timeIndex, setTimeIndex] = useState(6);
  
  const [showJinQi, setShowJinQi] = useState(false);
  const [showTuiQi, setShowTuiQi] = useState(false);
  const [qiMode, setQiMode] = useState(null); 

  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const scrollRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

  // 捲動到指定日期的輔助函式
  const scrollToActiveDate = (targetDate) => {
      // 確保 DOM 與日期有效
      if (!scrollRef.current || isNaN(targetDate.getTime())) return;
      
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const startDayOfWeek = firstDayOfMonth.getDay(); 
      const day = targetDate.getDate();
      
      // 計算格子索引 (0-based)
      const gridIndex = startDayOfWeek + (day - 1);
      // 計算行數
      const row = Math.floor(gridIndex / 7);
      const ROW_HEIGHT = 75; // DayCell 的固定高度
      
      setTimeout(() => {
          if (scrollRef.current) {
              scrollRef.current.scrollTo({
                  top: row * ROW_HEIGHT,
                  behavior: 'smooth'
              });
          }
      }, 100); // 延遲執行以確保畫面渲染完成
  };

  useEffect(() => {
    const lockOrientation = async () => { try { if (window.screen?.orientation?.lock) await window.screen.orientation.lock("portrait"); } catch (e) {} };
    lockOrientation();
    const savedRule = localStorage.getItem('zi_hour_rule');
    if (savedRule) setZiHourRule(savedRule);
    
    // 讀取儲存日期或預設為今天
    const savedDateStr = localStorage.getItem('selected_date');
    let initialDate = new Date();
    if (savedDateStr) { 
        const d = new Date(savedDateStr); 
        if (!isNaN(d.getTime())) { 
            initialDate = d;
        } 
    }
    
    // 設定狀態
    setSelectedDate(initialDate); 
    setCurrentDate(initialDate);

    // --- 新增：初始化時自動捲動到當天位置 ---
    if (view === 'calendar') {
        scrollToActiveDate(initialDate);
    }
    
    const savedBk = localStorage.getItem('calendar_bookmarks');
    if (savedBk) { try { setBookmarks(JSON.parse(savedBk)); } catch(e) {} }
    const currentHour = new Date().getHours();
    setTimeIndex(getDefaultTimeIndex(currentHour, savedRule || 'ziZheng'));
  }, []);

  useEffect(() => { localStorage.setItem('zi_hour_rule', ziHourRule); }, [ziHourRule]);
  useEffect(() => { if (!isNaN(selectedDate.getTime())) localStorage.setItem('selected_date', getLocalDateString(selectedDate)); }, [selectedDate]);
  
  useEffect(() => {
    if (showJinQi) {
        setQiMode('nian');
    } else if (showTuiQi) {
        setQiMode('yue'); // 當開啟流月時，明確設定為 'yue'
    } else {
        setQiMode(null);
    }
  }, [showJinQi, showTuiQi]);

  const toggleBookmark = (date) => {
    const targetDateStr = getLocalDateString(date);
    
    // 檢查該日期是否已經被收藏 (相容舊版的字串格式)
    const existingIdx = bookmarks.findIndex(b => 
        (typeof b === 'string' ? b : (b.targetDate || b.name || b.id)) === targetDateStr
    );

    let newBookmarks = [...bookmarks];
    if (existingIdx >= 0) {
        // 如果存在，就移除
        newBookmarks.splice(existingIdx, 1);
    } else {
        // 如果不存在，新增一筆 (id 放時間戳供 DataComponents 讀取，targetDate 放日曆日期)
        const newItem = {
            id: new Date().toISOString(), // 這裡給 getSavedDate 使用
            targetDate: targetDateStr     // 紀錄這是哪一天的書籤
        };
        newBookmarks = [newItem, ...newBookmarks];
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('calendar_bookmarks', JSON.stringify(newBookmarks));
  };

  const restoreBookmarks = (importedData) => {
     const newIds = importedData.map(item => typeof item === 'string' ? item : item.id);
     const merged = [...new Set([...bookmarks, ...newIds])];
     setBookmarks(merged);
     localStorage.setItem('calendar_bookmarks', JSON.stringify(merged));
     alert('書籤匯入成功！');
  };

  const changeMonth = (offset) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setCurrentDate(newDate);
  };
  
  const jumpToDate = (year, month) => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const handleBackToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); 
    const day = now.getDate();
    const gridIndex = startDayOfWeek + (day - 1);
    const row = Math.floor(gridIndex / 7);
    const ROW_HEIGHT = 75; 
    setTimeout(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: row * ROW_HEIGHT,
                behavior: 'smooth'
            });
        }
    }, 50);
  };

  const onTouchStart = (e) => { 
      touchEndRef.current = null; 
      touchStartRef.current = e.targetTouches[0].clientX; 
  };
  
  const onTouchMove = (e) => { 
      touchEndRef.current = e.targetTouches[0].clientX; 
  };
  
  const onTouchEnd = () => {
      if (!touchStartRef.current || !touchEndRef.current) return;
      const distance = touchStartRef.current - touchEndRef.current;
      
      // 只有滑動距離夠長才切換月份
      if (distance > 50) changeMonth(1);
      else if (distance < -50) changeMonth(-1);
      
      // 重置
      touchStartRef.current = null;
      touchEndRef.current = null;
  };

  const solarTerms = useMemo(() => {
    if (libStatus !== 'ready') return [];
    try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const days = [];
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const s = window.Solar.fromYmd(year, month, d);
            const l = s.getLunar();
            const term = l.getJieQi(); // 獲取節氣名稱 (如: 立春)
            
            if (term) {
                let timeStr = '';
                // [核心修改]
                // getJieQiTable() 回傳的是 Object，不是 Map，所以不能用 .get()
                const table = l.getJieQiTable();
                const jqSolar = table[term]; 
                
                if (jqSolar) {
                    const h = String(jqSolar.getHour()).padStart(2, '0');
                    const m = String(jqSolar.getMinute()).padStart(2, '0');
                    timeStr = `${h}:${m}`;
                }
                const fixName = JIE_QI_FIX_MAP[term] || term;
                days.push({ name: fixName, day: d, time: timeStr });
            }
        }
        return days;
    } catch(e) { 
        console.error("Solar Terms Error:", e); // 建議印出錯誤以便除錯
        return []; 
    }
  }, [currentDate, libStatus]);

  const headerGanZhi = useMemo(() => {
      if (libStatus !== 'ready' || !currentDate) return null;
      try {
          const solar = window.Solar.fromYmd(currentDate.getFullYear(), currentDate.getMonth() + 1, 15);
          const lunar = solar.getLunar();
          // [修改] 使用 getEightChar() 獲取立春換年的干支
          const baziObj = lunar.getEightChar();
          return { 
              year: baziObj.getYearGan() + baziObj.getYearZhi() + '年', 
              month: baziObj.getMonthGan() + baziObj.getMonthZhi() + '月' 
          };
      } catch(e) { return null; }
  }, [currentDate, libStatus]);

  // ==========================================
  // 計算當前選中日期的詳細資訊 (含動態宜忌)
  // ==========================================
const selectedInfo = useMemo(() => {
    if (libStatus !== 'ready' || !selectedDate) return null;
    try {
        const solar = window.Solar.fromYmd(selectedDate.getFullYear(), selectedDate.getMonth()+1, selectedDate.getDate());
        const lunar = solar.getLunar();
        
        const mapping = GET_SHI_CHEN_MAPPING(ziHourRule);
        const safeTimeIndex = (timeIndex >= 0 && timeIndex < mapping.length) ? timeIndex : 0;
        const targetHour = mapping[safeTimeIndex].hour;
        let lunarForTime;
        
        if (ziHourRule === 'ziZheng' && targetHour === 23) {
             lunarForTime = window.Solar.fromYmdHms(selectedDate.getFullYear(), selectedDate.getMonth()+1, selectedDate.getDate(), 23, 30, 0).getLunar();
        } else {
             lunarForTime = window.Solar.fromYmdHms(selectedDate.getFullYear(), selectedDate.getMonth()+1, selectedDate.getDate(), targetHour, 0, 0).getLunar();
        }

        const timeBazi = lunarForTime.getEightChar();
        const isSanNiang = SAN_NIANG_DAYS.includes(lunar.getDay()); 
        
        // 安全呼叫 getTianShe
        let isTianShe = false;
        try { isTianShe = getTianShe(timeBazi.getMonthZhi(), lunarForTime.getDayInGanZhi()); } catch(e) {}

        // 安全呼叫 getXieZao
        let xieZaoStr = null;
        try { xieZaoStr = getXieZao(lunar.getMonth(), lunar.getDay()); } catch(e) {}
        
        const monthNum = Math.abs(lunar.getMonth());
        const dayZhi = lunar.getDayZhi();
        const dayGanZhi = lunar.getDayInGanZhi();
        const dgRule = DONG_GONG_RULES[monthNum]?.[dayZhi];
        let dgRating = '平'; let dgShort = '平'; let dgText = '暫無資料';
        if (dgRule) {
            dgText = dgRule.t;
            if (dgRule.s && dgRule.s[dayGanZhi]) { 
                const specialVal = dgRule.s[dayGanZhi];
                dgRating = `本日${dayGanZhi}為${specialVal}`; 
                dgShort = specialVal;
            } 
            else { 
                dgRating = dgRule.r; 
                dgShort = dgRule.r;
            }
        }
        const dgSummary = dgText.split('：')[1]?.split('。')[0] || dgRating;

        const rawJian = lunar.getZhiXing();
        const fixJian = JIAN_FIX_MAP[rawJian] || rawJian;
        const rawXiu = lunar.getXiu(); const fixXiu = XIU_FIX_MAP[rawXiu] || rawXiu;

        let lunarMonthName = lunar.getMonthInChinese();
        if (lunarMonthName === '冬') lunarMonthName = '十一';
        if (lunarMonthName === '腊' || lunarMonthName === '臘') lunarMonthName = '十二';

        const yiList = lunar.getDayYi().map(toTraditionalYiJi); 
        const jiList = lunar.getDayJi().map(toTraditionalYiJi); 

        // --- 修正重點：烏兔部分 ---
        const star = getWuTuSolarStar(lunar);
        // 安全取得縮寫
        const abbrMap = (typeof WUTU_ABBR !== 'undefined') ? WUTU_ABBR : {};
        const wutuStr = star ? (abbrMap[star.name] || star.name) : '';
                
        // 取得本日所有凶煞
        const allXiongSha = lunar.getDayXiongSha();
        const targetBadStars = ['復喪', '三喪', '債𣎴', '月破', '歲破', '四廢', '四離', '無祿'];
        // 過濾出本日有的特定凶煞
        const badStars = allXiongSha.filter(star => targetBadStars.includes(star));

        // 然後在 return 物件裡加上這兩個：
        return {
            fullDate: selectedDate, // 給加入日曆用
            badStars: badStars,     // 給 Modal 顯示用
            dateStr: `${selectedDate.getMonth()+1}月${selectedDate.getDate()}日`,
            weekDay: WEEKDAYS[selectedDate.getDay()],
            ganZhiYear: timeBazi.getYearGan() + timeBazi.getYearZhi(), 
            lunarStr: `${lunarMonthName}月${lunar.getDayInChinese()}`,
            
            bazi: {
                yearGan: timeBazi.getYearGan(), yearZhi: timeBazi.getYearZhi(),
                monthGan: timeBazi.getMonthGan(), monthZhi: timeBazi.getMonthZhi(),
                dayGan: timeBazi.getDayGan(), dayZhi: timeBazi.getDayZhi(),
                timeGan: timeBazi.getTimeGan(), timeZhi: timeBazi.getTimeZhi()
            },
            jian: fixJian, 
            xiu: fixXiu, 
            xiuFull: XIU_FULL_NAME_MAP[fixXiu] || (fixXiu + '宿'),
            
            dongGongRating: dgRating, 
            dongGongShort: dgShort, // 確保回傳簡短版
            dongGongText: dgText, 
            dongGongSummary: dgSummary,
            
            wutu: star, 
            wutuStr: wutuStr, // 回傳縮寫
            
            isSanNiang: isSanNiang,
            isTianShe: isTianShe,
            xieZao: xieZaoStr,
            yi: yiList.join(', '),
            ji: jiList.join(', ')
        };
    } catch(e) { 
        console.error("SelectedInfo Crash:", e);
        return null; 
    }
  }, [selectedDate, libStatus, timeIndex, ziHourRule]);

  const calendarDays = useMemo(() => {
    if (isNaN(currentDate.getTime())) return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) days.push({ date: new Date(year, month, -firstDay.getDay() + 1 + i), isCurrentMonth: false });
    for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    for (let i = 1; i <= 42 - days.length; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    return days;
  }, [currentDate]);

  const formattedBookmarks = useMemo(() => {
    return bookmarks.map(item => {
        // 取得當初存入的時間戳 ID (傳給 DataComponents 右側顯示)
        const recordId = typeof item === 'string' ? item : item.id;
        // 取得該書籤實際對應的萬年曆日期
        const targetDateStr = typeof item === 'string' ? item : (item.targetDate || item.name || item.id.slice(0, 10));

        try {
            if(window.Solar) {
                const d = new Date(targetDateStr);
                if (!isNaN(d.getTime())) {
                    const solar = window.Solar.fromYmd(d.getFullYear(), d.getMonth()+1, d.getDate());
                    const lunar = solar.getLunar();
                    const dayGanZhi = lunar.getDayInGanZhi();
                    const rawJian = lunar.getZhiXing();
                    const monthNum = Math.abs(lunar.getMonth());
                    const dgRule = DONG_GONG_RULES[monthNum]?.[lunar.getDayZhi()];
                    const dg = dgRule ? (dgRule.s?.[dayGanZhi] || dgRule.r) : '';

                    return {
                        id: recordId,              // 交給 DataComponents 解析「保存於」
                        targetDate: targetDateStr, // 供點擊跳轉回萬年曆用
                        
                        // 【左側顯示設定】
                        // 標題 (Title)：西曆 + 干支日
                        name: `${targetDateStr}`, 
                        // 副標題 (農曆)：加上年干支，DataComponents 會自動加上「農曆」前綴
                        lunarDateStr: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${dayGanZhi}日`,
                        
                        jianChu: JIAN_FIX_MAP[rawJian] || rawJian,
                        dongGong: dg
                    };
                }
            }
        } catch(e) {}
        
        return { id: recordId, targetDate: targetDateStr, name: targetDateStr };
    });
  }, [bookmarks, libStatus]);

  if (libStatus === 'loading') return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>載入中...</div>;
  if (libStatus === 'error') return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>載入失敗</div>;

  const TABS = [
      { id: 'calendar', label: '萬年曆', icon: Calendar },
      { id: 'bookmarks', label: '書籤', icon: Bookmark },
      { id: 'booking', label: '預約', icon: CalendarCheck },
      { id: 'settings', label: '設定', icon: Settings },
  ];

  return (
      <div style={COMMON_STYLES.fullScreen}>
        <AppHeader title={APP_NAME} logoChar={{ main: '進', sub: '氣' }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        
        {view === 'calendar' && (
          <>
            <CalendarToolbar 
              currentDate={currentDate} 
              onToday={handleBackToToday} 
              solarTerms={solarTerms} 
              headerGanZhi={headerGanZhi} 
              onTitleClick={() => setShowDatePicker(true)}
              showJinQi={showJinQi} setShowJinQi={setShowJinQi}
              showTuiQi={showTuiQi} setShowTuiQi={setShowTuiQi}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${THEME.border}`, backgroundColor: '#fafafa', flexShrink: 0, width: '100%' }}>
              {WEEKDAYS.map((d, i) => (<div key={i} style={{ textAlign: 'center', padding: '6px 0', fontSize: '12px', color: THEME.gray }}>{d}</div>))}
            </div>
            
            <div 
              ref={scrollRef}
              onTouchStart={onTouchStart} 
              onTouchMove={onTouchMove} 
              onTouchEnd={onTouchEnd} 
              style={{ flex: 1, overflowY: 'auto', backgroundColor: THEME.white, minHeight: 0, width: '100%' }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${THEME.border}`, width: '100%' }}>
                  {calendarDays.map((item, idx) => (
                    <DayCell 
                        key={idx} {...item} 
                        isToday={getLocalDateString(item.date) === getLocalDateString(new Date())} 
                        isSelected={getLocalDateString(item.date) === getLocalDateString(selectedDate)} 
                        onClick={(d) => {
                             if (!isNaN(d.getTime())) {
                                 setSelectedDate(d);
                             }
                        }} 
                        canRender={libStatus === 'ready'} 
                        bookmarks={bookmarks} 
                        showTuiQi={showTuiQi}
                        qiMode={qiMode} 
                    />
                  ))}
                </div>
                {/* 在月曆網格下方加入廣告 */}
                  <div style={{ marginTop: '20px' }}><AdsterraNarrow /></div>
            </div>

            <BottomSummaryPanel 
                    info={selectedInfo} 
                    onDetailClick={() => setIsDetailModalOpen(true)}
                    onTimeClick={() => setShowTimeModal(true)}
                    isBookmarked={selectedDate ? bookmarks.some(b => 
                        (typeof b === 'string' ? b : (b.targetDate || b.name || b.id)) === getLocalDateString(selectedDate)
                    ) : false}
                    onToggleBookmark={() => selectedDate && toggleBookmark(selectedDate)}
            />
          </>
        )}

        {view === 'bookmarks' && (
          <div style={COMMON_STYLES.contentArea}>
             <div style={{ padding: '16px', backgroundColor: THEME.bg }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                  <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>我的書籤紀錄</h2>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <BookmarkList 
                        bookmarks={formattedBookmarks} 
                        onSelect={(b) => {
                            // 點擊書籤時，依照 targetDate 跳轉回正確的日曆格子
                            const d = new Date(b.targetDate);
                            if(!isNaN(d.getTime())) {
                                setCurrentDate(d); setSelectedDate(d); setView('calendar');
                            }
                        }}
                        onDelete={(id) => { 
                            // 這裡傳回來的 id 是時間戳，直接過濾掉即可
                            if(window.confirm('確定刪除此書籤？')) { 
                                const newBookmarks = bookmarks.filter(b => (typeof b === 'string' ? b : b.id) !== id);
                                setBookmarks(newBookmarks);
                                localStorage.setItem('calendar_bookmarks', JSON.stringify(newBookmarks));
                            }
                        }}
                    />
                    <div style={{ marginTop: '20px' }}>
                        <Adsterra />
                    </div>
                </div>
             </div>
          </div>
        )}

        {view === 'settings' && (
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', backgroundColor: THEME.bg }}>
                <SettingsView 
                    ziHourRule={ziHourRule} 
                    setZiHourRule={setZiHourRule} 
                    bookmarks={bookmarks}
                    onRestore={restoreBookmarks}
                />
            </div>
        )}
        
        {view === 'booking' && (
            <BookingSystem apiUrl={API_URL} onNavigate={() => setView('calendar')} />
        )}
      </div>
      
      <DayDetailModal 
         isOpen={isDetailModalOpen}
         onClose={() => setIsDetailModalOpen(false)}
         date={selectedDate}
         info={selectedInfo}
         toggleBookmark={toggleBookmark}
         isBookmarked={selectedDate ? bookmarks.some(b => 
              (typeof b === 'string' ? b : (b.targetDate || b.name || b.id)) === getLocalDateString(selectedDate)
         ) : false}
      />

      <TimePickerModal 
        visible={showTimeModal} 
        onClose={() => setShowTimeModal(false)} 
        currentRule={ziHourRule} 
        currentIndex={timeIndex} 
        dayGan={selectedInfo?.bazi?.dayGan} 
        onSelect={(idx) => { setTimeIndex(idx); setShowTimeModal(false); }} 
      />

      <YearMonthPicker 
        visible={showDatePicker} 
        initialDate={currentDate}
        onClose={() => setShowDatePicker(false)}
        onConfirm={jumpToDate}
      />
      
      <InstallGuide />
      <BottomTabBar tabs={TABS} currentTab={view} onTabChange={setView} />
      
    </div>
  );
}