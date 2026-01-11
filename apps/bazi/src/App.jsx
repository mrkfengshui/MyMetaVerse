import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bookmark, Settings, 
  CalendarCheck, Sparkles, Grid, 
  Eye, EyeOff, RefreshCw, X,
  Trash2, Edit3, CloudUpload, Download, User,
  Calendar, MapPin, Compass, BookOpen
} from 'lucide-react';

import { Preferences } from '@capacitor/preferences';

import { 
  AdBanner, AppHeader, AppInfoCard, 
  BookingSystem, BookmarkList, BottomTabBar, BuyMeCoffee, 
  InstallGuide, WebBackupManager, 
  COLORS, THEME, COMMON_STYLES
} from '@my-meta/ui';

// =========================================================================
// PART A: 核心數據與邏輯
// =========================================================================
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";
const CURRENT_APP_NAME = "甯博八字";
const APP_VERSION = "甯博八字 v1.0";

// --- 核心數據定義 ---
const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 地支藏干
const ZHI_HIDDEN = {
  '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'], '卯': ['乙'], 
  '辰': ['戊', '乙', '癸'], '巳': ['丙', '戊', '庚'], '午': ['丁', '己'], 
  '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'], '酉': ['辛'], 
  '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
};

const STEM_COLORS = {
  '甲': COLORS.jia, '乙': COLORS.yi, '丙': COLORS.bing, '丁': COLORS.ding, '戊': COLORS.wu,
  '己': COLORS.ji, '庚': COLORS.geng, '辛': COLORS.xin, '壬': COLORS.ren, '癸': COLORS.gui
};

const BRANCH_COLORS = {
  '子': COLORS.ren, '亥': COLORS.ren, '寅': COLORS.jia, '卯': COLORS.yi, 
  '巳': COLORS.bing, '午': COLORS.ding, '申': COLORS.geng, '酉': COLORS.xin, 
  '辰': COLORS.wu, '戌': COLORS.wu, '丑': COLORS.ji, '未': COLORS.ji 
};

const CN_NUMS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

const getLunarMonthText = (m) => {
    if (m === 1) return '正月';
    if (m <= 10) return CN_NUMS[m] + '月';
    if (m === 11) return '十一月';
    if (m === 12) return '十二月';
    return m + '月';
};

const getLunarDayText = (d) => {
    if (d <= 10) return '初' + CN_NUMS[d];
    if (d < 20) return '十' + CN_NUMS[d % 10];
    if (d === 20) return '二十';
    if (d < 30) return '廿' + (d % 10 === 0 ? '十' : CN_NUMS[d % 10]);
    if (d === 30) return '三十';
    return String(d);
};

// 五行對照表
const WUXING_MAP = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火',
  '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
  '子': '水', '丑': '土'
};

const CN_MAP = {
  '惊': '驚', '蛰': '蟄', '种': '種', '长': '長', '涧': '澗', '蜡': '蠟', '杨': '楊', '雳': '靂', 
  '灯': '燈', '驿': '驛', '钗': '釵', '炉': '爐', '剑': '劍', '钟': '鐘', '岚': '嵐', '构': '構', 
  '莹': '瑩', '灵': '靈', '叶': '葉', '烂': '爛', '头': '頭'
};

const toTraditional = (str) => {
  if (!str) return '';
  return str.split('').map(char => CN_MAP[char] || char).join('');
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

const getShiShen = (dayGan, targetGan) => {
  if (!dayGan || !targetGan) return '';
  const dayIdx = TIANGAN.indexOf(dayGan);
  const targetIdx = TIANGAN.indexOf(targetGan);
  const dayEl = Math.floor(dayIdx / 2);
  const targetEl = Math.floor(targetIdx / 2);
  const samePol = (dayIdx % 2) === (targetIdx % 2);
  
  if (dayEl === targetEl) return samePol ? '比' : '劫'; 
  if ((dayEl + 1) % 5 === targetEl) return samePol ? '食' : '傷'; 
  if ((targetEl + 1) % 5 === dayEl) return samePol ? '卩' : '印'; 
  if ((dayEl + 2) % 5 === targetEl) return samePol ? '才' : '財'; 
  if ((targetEl + 2) % 5 === dayEl) return samePol ? '殺' : '官'; 
  return '';
};

// 核心計算函數
const calculateBaziResult = (formData, ziHourRule) => {
    if (formData.isManual && formData.manualInput) {
        const mp = formData.manualInput;
        const baziObj = {
            yearGan: mp.year.gan, yearZhi: mp.year.zhi,
            monthGan: mp.month.gan, monthZhi: mp.month.zhi,
            dayGan: mp.day.gan, dayZhi: mp.day.zhi,
            timeGan: mp.time.gan, timeZhi: mp.time.zhi,
        };

        const yearGanIdx = TIANGAN.indexOf(mp.year.gan);
        const monthGanIdx = TIANGAN.indexOf(mp.month.gan);
        const monthZhiIdx = DIZHI.indexOf(mp.month.zhi);
        const isYangYear = yearGanIdx % 2 === 0;
        const isMale = formData.gender === '1';
        let direction = (isMale && isYangYear) || (!isMale && !isYangYear) ? 1 : -1;

        const manualDaYuns = [];
        for (let i = 1; i <= 10; i++) {
            const nextGanIdx = (monthGanIdx + (direction * i) + 100) % 10;
            const nextZhiIdx = (monthZhiIdx + (direction * i) + 120) % 12;
            const nextGan = TIANGAN[nextGanIdx];
            const nextZhi = DIZHI[nextZhiIdx];

            manualDaYuns.push({ 
                seq: i, gan: nextGan, zhi: nextZhi,
                ganGod: getShiShen(mp.day.gan, nextGan),
                zhiHidden: ZHI_HIDDEN[nextZhi] || [],
                startAge: i, startYear: '', liuNians: [] 
            });
        }
        return {
            id: Date.now(), name: formData.name || '未命名', gender: formData.gender,
            genderText: formData.gender === '1' ? '元男' : '元女',
            rawDate: formData, isManual: true, solarDate: null, lunarDate: null,
            bazi: baziObj, naYin: { year: '', month: '', day: '', time: '' }, 
            yunInfo: null, daYuns: manualDaYuns
        };
    }

    const rawYear = parseInt(formData.year);
    const rawMonth = parseInt(formData.month);
    const rawDay = parseInt(formData.day);
    const rawHour = parseInt(formData.hour);
    const rawMinute = parseInt(formData.minute);

    let calcYear = rawYear, calcMonth = rawMonth, calcDay = rawDay, calcHour = rawHour;

    if (ziHourRule === 'ziShi' && rawHour >= 23) {
        const tempDate = new Date(rawYear, rawMonth - 1, rawDay);
        tempDate.setDate(tempDate.getDate() + 1); 
        calcYear = tempDate.getFullYear();
        calcMonth = tempDate.getMonth() + 1;
        calcDay = tempDate.getDate();
        calcHour = 0; 
    }

    const solar = window.Solar.fromYmdHms(calcYear, calcMonth, calcDay, calcHour, rawMinute, 0);    
    const lunar = solar.getLunar();
    const bazi = lunar.getEightChar();
    const genderNum = parseInt(formData.gender); 
    const yun = bazi.getYun(genderNum, 1);
    
    const startAge = yun.getStartYear();    
    const startMonth = yun.getStartMonth(); 
    const startSolar = yun.getStartSolar(); 
    
    const baziObj = {
        yearGan: bazi.getYearGan(), yearZhi: bazi.getYearZhi(),
        monthGan: bazi.getMonthGan(), monthZhi: bazi.getMonthZhi(),
        dayGan: bazi.getDayGan(), dayZhi: bazi.getDayZhi(),
        timeGan: bazi.getTimeGan(), timeZhi: bazi.getTimeZhi(),
    };

    const stdMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const stdDays = [
        '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
    ];
    const mVal = Math.abs(lunar.getMonth()); 
    const dVal = Math.abs(lunar.getDay());
    const rawString = lunar.toString(); 
    const isLeap = rawString.includes('闰') || rawString.includes('閏');
    const monthText = stdMonths[mVal - 1] || `${mVal}月`; 
    const dayText = stdDays[dVal - 1] || `${dVal}日`;
    const leapText = isLeap ? '閏' : ''; 

    const lunarString = `${bazi.getYearGan()}${bazi.getYearZhi()}年 ${leapText}${monthText}${dayText} ${bazi.getTimeZhi()}時`;
    
    const calculateDaYun = (bz, gender, startYunYear, startYunAge) => {
        const yearGanIdx = TIANGAN.indexOf(bz.yearGan);
        const isYangYear = yearGanIdx % 2 === 0;
        const isMale = gender === '1';
        let direction = isMale ? (isYangYear ? 1 : -1) : (isYangYear ? -1 : 1);
        const monthGanIdx = TIANGAN.indexOf(bz.monthGan);
        const monthZhiIdx = DIZHI.indexOf(bz.monthZhi);
        const daYuns = [];

        for (let i = 1; i <= 10; i++) {
            const nextGanIdx = (monthGanIdx + (direction * i) + 100) % 10;
            const nextZhiIdx = (monthZhiIdx + (direction * i) + 120) % 12;
            const nextGan = TIANGAN[nextGanIdx];
            const currentYunYear = startYunYear + (i - 1) * 10;
            const currentYunAge = startYunAge + (i - 1) * 10;
            const liuNians = [];
            for (let j = 0; j < 10; j++) {
                const lnYear = currentYunYear + j;
                const lnAge = currentYunAge + j;
                const lnSolar = window.Solar.fromYmd(lnYear, 6, 15);
                const lnLunar = lnSolar.getLunar();
                const lnGanZhi = lnLunar.getYearInGanZhi(); 
                const lnGan = lnGanZhi.charAt(0);
                const lnZhi = lnGanZhi.charAt(1);
                liuNians.push({
                    year: lnYear, age: lnAge, ganZhi: lnGanZhi, gan: lnGan, zhi: lnZhi,
                    ganGod: getShiShen(bz.dayGan, lnGan), zhiHidden: ZHI_HIDDEN[lnZhi] || []
                });
            }
            daYuns.push({ 
                seq: i, gan: nextGan, zhi: DIZHI[nextZhiIdx],
                ganGod: getShiShen(bz.dayGan, nextGan),
                zhiHidden: ZHI_HIDDEN[DIZHI[nextZhiIdx]] || [],
                startYear: currentYunYear, startAge: currentYunAge, liuNians: liuNians
            });
        }
        return daYuns;
    };

    const daYuns = calculateDaYun(baziObj, formData.gender, startSolar.getYear(), startAge);
    const pad = (n) => String(n).padStart(2, '0');

    return {
        id: formData.id || Date.now(),
        name: formData.name || '未命名',
        gender: formData.gender,
        genderText: formData.gender === '1' ? '元男' : '元女',
        isManual: false, 
        rawDate: formData, 
        solarDate: `${rawYear}-${pad(rawMonth)}-${pad(rawDay)} ${pad(rawHour)}:${pad(rawMinute)}`,
        lunarDate: lunarString,
        bazi: baziObj,
        naYin: {
            year: toTraditional(bazi.getYearNaYin()), month: toTraditional(bazi.getMonthNaYin()),
            day: toTraditional(bazi.getDayNaYin()), time: toTraditional(bazi.getTimeNaYin())
        },
        yunInfo: {
            startAge: startAge, startMonth: startMonth, startDate: startSolar.toYmd(),
            detail: `出生後 ${startAge} 年 ${startMonth} 個月起運`
        },
        daYuns: daYuns
    };
};

// --- SettingsView ---
const SettingsView = ({ 
    ziHourRule, setZiHourRule,   // App 專屬設定
    colorTheme, setColorTheme,   // App 專屬設定
    bookmarks, setBookmarks      // 共用資料
}) => {
  // 定義這個 App 獨有的資訊
  const APP_INFO = {
    appName: CURRENT_APP_NAME,
    version: APP_VERSION,
    about: "本程式旨在提供專業八字排盤服務，結合子平命理與現代演算法，輔助使用者進行命理分析。",
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

      {/* 1. App 專屬設定區塊 */}
      <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>偏好設定</h3>
      <div style={{ backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>子時設定</div>
              <ToggleSelector options={[{val: 'ziZheng', label: '子正換日'}, {val: 'ziShi', label: '子時換日'}]} currentValue={ziHourRule} onChange={setZiHourRule} />
          </div>
          <span style={{ display: 'block', height: '1px', backgroundColor: THEME.bg, margin: '0 16px' }} />
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: THEME.black }}>顯示配色</div>
              <ToggleSelector options={[{val: 'elemental', label: '五行五色'}, {val: 'dark', label: '純深色'}]} currentValue={colorTheme} onChange={setColorTheme} />
          </div>
      </div>

      {/* 2. 共用功能區塊 (直接使用 UI Library) */}
      <WebBackupManager data={bookmarks} onRestore={setBookmarks} prefix="BAZI_BACKUP" />
      <AppInfoCard info={APP_INFO} />
      <BuyMeCoffee />

      <div style={{ marginTop: '24px' }}>
          <button onClick={() => { if(window.confirm('還原預設?')) { setZiHourRule('ziShi'); setColorTheme('elemental'); } }} style={{ width: '100%', padding: '12px', backgroundColor: THEME.bgGray, color: THEME.red, border: `1px solid ${THEME.border}`, borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} /> 還原預設值
          </button>
      </div>
    </div>
  );
};

// --- 陰陽屬性判斷與彈窗選擇器 ---
const isYang = (index) => index % 2 === 0;

const GanZhiModalPicker = ({ title, isOpen, onClose, initialGan, initialZhi, onConfirm, colorTheme }) => {
  const [tempGan, setTempGan] = useState(initialGan);
  const [tempZhi, setTempZhi] = useState(initialZhi);
  useEffect(() => { if (isOpen) { setTempGan(initialGan); setTempZhi(initialZhi); } }, [isOpen, initialGan, initialZhi]);
  if (!isOpen) return null;
  const isZhiDisabled = (zhi) => {
    if (!tempGan) return false;
    const ganIdx = TIANGAN.indexOf(tempGan);
    const zhiIdx = DIZHI.indexOf(zhi);
    return isYang(ganIdx) !== isYang(zhiIdx);
  };
  const handleGanClick = (gan) => {
    setTempGan(gan);
    if (tempZhi) {
        const ganIdx = TIANGAN.indexOf(gan);
        const zhiIdx = DIZHI.indexOf(tempZhi);
        if (isYang(ganIdx) !== isYang(zhiIdx)) { setTempZhi(''); }
    }
  };
  const handleConfirm = () => {
    if (tempGan && tempZhi) { onConfirm(tempGan, tempZhi); onClose(); } else { alert("請完整選擇天干與地支"); }
  };
  const safeTheme = colorTheme || 'elemental';
  const getItemStyle = (item, isSelected, type, disabled) => {
    if (disabled) return { backgroundColor: '#f5f5f5', color: '#d9d9d9', border: '1px solid #eee', cursor: 'not-allowed', opacity: 0.6 };
    let itemColor = THEME.black;
    if (safeTheme === 'elemental') itemColor = type === 'gan' ? (STEM_COLORS[item] || THEME.black) : (BRANCH_COLORS[item] || THEME.black);
    if (isSelected) return { backgroundColor: THEME.blue, color: 'white', border: `1px solid ${THEME.blue}`, fontWeight: 'bold', boxShadow: '0 2px 6px rgba(24, 144, 255, 0.4)' };
    return { backgroundColor: THEME.white, color: itemColor, border: `1px solid ${THEME.border}`, fontWeight: 'normal' };
  };
  const btnBase = { flex: 1, padding: '12px 0', borderRadius: '8px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', minWidth: '40px', outline: 'none', userSelect: 'none' };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div style={{ width: '90%', maxWidth: '400px', backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'popIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{title} - 選擇干支</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', padding: '4px' }}><X size={24} color={THEME.gray}/></button>
        </div>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: THEME.gray, fontWeight: 'bold' }}>天干 (選陽鎖陰)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {TIANGAN.map(gan => ( <button key={gan} onClick={() => handleGanClick(gan)} style={{ ...btnBase, ...getItemStyle(gan, tempGan === gan, 'gan', false) }}>{gan}</button> ))}
        </div>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: THEME.gray, fontWeight: 'bold' }}>地支</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {DIZHI.map(zhi => { const disabled = isZhiDisabled(zhi); return ( <button key={zhi} onClick={() => !disabled && setTempZhi(zhi)} disabled={disabled} style={{ ...btnBase, ...getItemStyle(zhi, tempZhi === zhi, 'zhi', disabled) }}>{zhi}</button> ); })}
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', color: THEME.gray }}>預覽：</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.blue, marginLeft: '8px' }}>{tempGan || '?'}{tempZhi || '?'}</span>
        </div>
        <button onClick={handleConfirm} style={{ width: '100%', padding: '14px', backgroundColor: THEME.black, color: 'white', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', border: 'none' }}>確認選擇</button>
      </div>
      <style>{`@keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
};

// --- BaziInput (八字輸入表單) ---
const BaziInput = ({ onCalculate, initialData, colorTheme }) => {
  const now = new Date();
  const [inputType, setInputType] = useState('solar');
  const [formData, setFormData] = useState(initialData || { name: '', gender: '1', year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate(), hour: now.getHours(), minute: now.getMinutes() });
  const [lunarData, setLunarData] = useState(() => {
    // 嘗試從 window.Solar 獲取當前農曆 (如果 library 已載入)
    if (typeof window !== 'undefined' && window.Solar) {
       try {
           const solar = window.Solar.fromDate(now);
           const lunar = solar.getLunar();
           return {
               year: lunar.getYear(),
               month: Math.abs(lunar.getMonth()),
               day: lunar.getDay(),
               hour: now.getHours(),
               minute: now.getMinutes(),
               isLeap: lunar.getMonth() < 0
           };
       } catch (e) { console.error("Lunar init failed", e); }
    }
    // 如果 library 還沒好，就用西曆年做備案，或維持原有的 1月1日
    return { year: now.getFullYear(), month: 1, day: 1, hour: 0, minute: 0, isLeap: false };
  });

  const [manualPillars, setManualPillars] = useState({ year: { gan: '甲', zhi: '子' }, month: { gan: '丙', zhi: '寅' }, day: { gan: '戊', zhi: '辰' }, time: { gan: '庚', zhi: '申' } });
  const [modalConfig, setModalConfig] = useState({ isOpen: false, pillar: null }); 

  const years = useMemo(() => { const arr = []; for (let i = 1900; i <= 2100; i++) arr.push(i); return arr; }, []);
  const hours = useMemo(() => Array.from({length: 24}, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({length: 60}, (_, i) => i), []);

  const handleSolarChange = (field, value) => {
        const newData = { ...formData, [field]: value };
        if (field === 'year' || field === 'month') {
            const newYear = parseInt(field === 'year' ? value : formData.year);
            const newMonth = parseInt(field === 'month' ? value : formData.month);
            const maxDays = new Date(newYear, newMonth, 0).getDate();
            if (parseInt(newData.day) > maxDays) newData.day = maxDays;
        }
        setFormData(newData);
    };

    const solarDays = useMemo(() => {
        if (inputType !== 'solar') return [];
        const y = parseInt(formData.year); const m = parseInt(formData.month);
        return Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => i + 1);
    }, [formData.year, formData.month, inputType]);

  const getLunarMaxDays = (y, m, isLeap) => {
      if (!window.LunarYear) return 30; 
      try {
          const lunarYear = window.LunarYear.fromYear(parseInt(y));
          const months = lunarYear.getMonths();
          const target = months.find(lm => lm.getMonth() === parseInt(m) && lm.isLeap() === isLeap);
          return target ? target.getDayCount() : 30;
      } catch (e) { return 30; }
  };

  const handleLunarChange = (field, value) => {
      let newData = { ...lunarData, [field]: value };
      if (field === 'year' || field === 'month' || field === 'isLeap') {
          const maxDays = getLunarMaxDays(newData.year, newData.month, newData.isLeap);
          if (parseInt(newData.day) > maxDays) newData.day = maxDays;
      }
      setLunarData(newData);
  };

  const lunarDays = useMemo(() => {
      if (inputType !== 'lunar') return [];
      const max = getLunarMaxDays(lunarData.year, lunarData.month, lunarData.isLeap);
      return Array.from({ length: max }, (_, i) => i + 1);
  }, [lunarData.year, lunarData.month, lunarData.isLeap, inputType]);

  const openPicker = (pillarKey) => { setModalConfig({ isOpen: true, pillar: pillarKey }); };
  const handlePickerConfirm = (newGan, newZhi) => {
      setManualPillars(prev => ({ ...prev, [modalConfig.pillar]: { gan: newGan, zhi: newZhi } }));
      setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleStartCalculate = () => {    
    if (inputType === 'ganzhi') {
        const fakeDate = { ...formData, manualInput: manualPillars, isManual: true };
        onCalculate(fakeDate);
    } else {
        let finalSolarData = formData;
        if (inputType === 'lunar') {
             try {
                const y = parseInt(lunarData.year); const m = parseInt(lunarData.month); const d = parseInt(lunarData.day); const h = parseInt(lunarData.hour); 
                const monthVal = lunarData.isLeap ? -Math.abs(m) : Math.abs(m);
                const lunar = window.Lunar.fromYmdHms(y, monthVal, d, h, 0, 0);
                const solar = lunar.getSolar();
                finalSolarData = { ...formData, year: solar.getYear(), month: solar.getMonth(), day: solar.getDay(), hour: solar.getHour(), minute: solar.getMinute() };
            } catch(e) { alert("日期轉換失敗"); return; }
        }
        onCalculate(finalSolarData);
    }
  };

  const getTabBtnStyle = (isActive) => ({ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${isActive ? THEME.blue : THEME.border}`, backgroundColor: isActive ? THEME.bgBlue : THEME.white, color: isActive ? THEME.blue : THEME.black, fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' });

  const renderPillarInput = (label, pillarKey) => {
      const pData = manualPillars[pillarKey];
      const ganColor = STEM_COLORS[pData.gan] || THEME.black;
      const zhiColor = BRANCH_COLORS[pData.zhi] || THEME.black;
      return (
          <div onClick={() => openPicker(pillarKey)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', border: `1px solid ${THEME.border}`, borderRadius: '12px', padding: '10px 4px', backgroundColor: THEME.white, boxShadow: '0 2px 5px rgba(0,0,0,0.03)', transition: 'transform 0.1s', userSelect: 'none' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '12px', color: THEME.gray, marginBottom: '8px' }}>{label}</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: ganColor, lineHeight: 1.2 }}>{pData.gan}</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: zhiColor, lineHeight: 1.2 }}>{pData.zhi}</div>
          </div>
      );
  };

  return (
    <div style={{ padding: '20px', flex: 1, overflowY: 'auto', backgroundColor: THEME.bg }}>
       <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: `1px solid ${THEME.border}` }}>
          <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', color: THEME.black, fontSize: '18px', fontWeight: 'bold' }}>{initialData ? '修改出生資料' : '請輸入出生資料'}</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>姓名</label>
            <input type="text" value={formData.name} onChange={e => handleSolarChange('name', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.border}`, fontSize: '16px' }} placeholder="輸入姓名" />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>性別</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => handleSolarChange('gender', '1')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${formData.gender === '1' ? THEME.blue : THEME.border}`, backgroundColor: formData.gender === '1' ? THEME.bgBlue : THEME.white, color: formData.gender === '1' ? THEME.blue : THEME.black, fontWeight: 'bold' }}>男 (乾造)</button>
                 <button onClick={() => handleSolarChange('gender', '0')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${formData.gender === '0' ? THEME.red : THEME.border}`, backgroundColor: formData.gender === '0' ? THEME.bgRed : THEME.white, color: formData.gender === '0' ? THEME.red : THEME.black, fontWeight: 'bold' }}>女 (坤造)</button>
              </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
             <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>輸入方式</label>
             <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setInputType('solar')} style={getTabBtnStyle(inputType === 'solar')}>西曆</button>
                <button onClick={() => setInputType('lunar')} style={getTabBtnStyle(inputType === 'lunar')}>農曆</button>
                <button onClick={() => setInputType('ganzhi')} style={getTabBtnStyle(inputType === 'ganzhi')}>干支四柱</button>
             </div>
          </div>

        {inputType === 'solar' && (
              <>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>西元年</label> <select value={formData.year} onChange={e => handleSolarChange('year', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select> </div>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>月</label> <select value={formData.month} onChange={e => handleSolarChange('month', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}</option>)}</select> </div>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>日</label> <select value={formData.day} onChange={e => handleSolarChange('day', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}> {solarDays.map(d => <option key={d} value={d}>{d}</option>)} </select> </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>出生時間</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}> <select value={formData.hour} onChange={e => handleSolarChange('hour', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select> </div>
                    <span>:</span>
                    <div style={{ flex: 1 }}> <select value={formData.minute} onChange={e => handleSolarChange('minute', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select> </div>
                    </div>
                </div>
              </>
          )}

        {inputType === 'lunar' && (
              <>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>農曆年</label> <select value={lunarData.year} onChange={e => handleLunarChange('year', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select> </div>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>月</label> <select value={lunarData.month} onChange={e => handleLunarChange('month', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}> {Array.from({length:12},(_,i)=>i+1).map(m => ( <option key={m} value={m}>{getLunarMonthText(m)}</option> ))} </select> </div>
                    <div style={{ flex: 1 }}> <label style={{ fontSize: '12px', color: THEME.gray }}>日</label> <select value={lunarData.day} onChange={e => handleLunarChange('day', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}> {lunarDays.map(d => ( <option key={d} value={d}>{getLunarDayText(d)}</option> ))} </select> </div>
                </div>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                      <input type="checkbox" id="leapMonth" checked={lunarData.isLeap} onChange={e => handleLunarChange('isLeap', e.target.checked)} style={{ marginRight: '8px', width: '18px', height: '18px' }} />
                      <label htmlFor="leapMonth" style={{ fontSize: '13px', color: THEME.black }}>是閏月 (例如閏四月)</label>
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: THEME.gray, marginBottom: '6px' }}>出生時間</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1 }}> <select value={lunarData.hour} onChange={e => handleLunarChange('hour', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select> </div>
                    <span>:</span>
                    <div style={{ flex: 1 }}> <select value={lunarData.minute} onChange={e => handleLunarChange('minute', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${THEME.border}`, background: 'white' }}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select> </div>
                    </div>
                </div>
              </>
          )}

          {inputType === 'ganzhi' && (
              <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', color: THEME.gray, marginBottom: '10px' }}>點選下方修改四柱</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                      {renderPillarInput('時柱', 'time')} {renderPillarInput('日柱', 'day')} {renderPillarInput('月柱', 'month')} {renderPillarInput('年柱', 'year')}
                  </div>
              </div>
          )}

          <button onClick={handleStartCalculate} style={{ width: '100%', padding: '14px', backgroundColor: THEME.blue, color: 'white', borderRadius: '30px', fontSize: '16px', fontWeight: 'bold', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            <Sparkles size={20} />
            {initialData ? '重新排盤' : '開始排盤'}
          </button>
        </div>
        <GanZhiModalPicker 
            title={modalConfig.pillar ? { year: '年柱', month: '月柱', day: '日柱', time: '時柱' }[modalConfig.pillar] : ''}
            isOpen={modalConfig.isOpen} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            initialGan={modalConfig.pillar ? manualPillars[modalConfig.pillar].gan : ''} initialZhi={modalConfig.pillar ? manualPillars[modalConfig.pillar].zhi : ''}
            onConfirm={handlePickerConfirm} colorTheme={colorTheme}
        />
      </div>
    );
};

// --- PillarCard (四柱卡片) ---
const PillarCard = ({ title, gan, zhi, naYin, dayMaster, showHiddenStems, colorTheme }) => {
   const safeTheme = colorTheme || 'elemental';
   const ganColor = safeTheme === 'elemental' ? (STEM_COLORS[gan] || '#555555') : '#555555';
   const zhiColor = safeTheme === 'elemental' ? (BRANCH_COLORS[zhi] || '#555555') : '#555555';
   const ganGod = (title === '日柱') ? null : getShiShen(dayMaster, gan);
   const hiddenStems = ZHI_HIDDEN[zhi] || [];
   const hiddenGods = hiddenStems.map(h => getShiShen(dayMaster, h));
   const displayTopRight = showHiddenStems ? null : ganGod;
   const displayBottomRight = showHiddenStems ? hiddenStems : hiddenGods;

return (
     <div style={{ flex: 1, backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, padding: '12px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', minHeight: '175px', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '12px', color: THEME.gray, marginBottom: '8px' }}>{title}</div>
        <div style={{ position: 'relative', width: '40px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: ganColor, lineHeight: 1.2 }}>{gan}</span>
            {displayTopRight && <div style={{ position: 'absolute', top: -4, right: -14, fontSize: '14px', color: '#888', padding: '0 1px', borderRadius: '2px' }}>{displayTopRight}</div>}
        </div>
        <div style={{ position: 'relative', width: '40px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: zhiColor, lineHeight: 1.2 }}>{zhi}</span>
            <div style={{ position: 'absolute', top: 6, right: -14, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>{displayBottomRight.map((item, idx) => (<span key={idx} style={{ fontSize: '14px', lineHeight: '1', transform: 'scale(1)', color: '#888' }}>{item}</span>))}</div>
        </div>
        <div style={{ fontSize: '10px', color: THEME.gray, marginTop: '8px', backgroundColor: THEME.bgGray, padding: '2px 6px', borderRadius: '4px' }}>{naYin}</div>
     </div>
   );
};

// --- BaziResult (八字結果) ---
const BaziResult = ({ data, onBack, onSave, colorTheme }) => {
   const [selectedDaYunIndex, setSelectedDaYunIndex] = useState(0);
   const [selectedLiuNianYear, setSelectedLiuNianYear] = useState(null); 
   const [showHiddenStems, setShowHiddenStems] = useState(false);
   const safeTheme = colorTheme || 'elemental';
   useEffect(() => { setSelectedLiuNianYear(null); }, [selectedDaYunIndex]);
   if (!data) return null;

   const getColor = (char, type) => {
       if (safeTheme !== 'elemental') return '#555555'; 
       return type === 'stem' ? (STEM_COLORS[char] || '#555555') : (BRANCH_COLORS[char] || '#555555');
   };

   const getLiuYueData = (yearGan, yearZhi, year) => {
       const yearGanIdx = TIANGAN.indexOf(yearGan);
       if (yearGanIdx === -1) return [];
       const startGanIdx = (yearGanIdx % 5) * 2 + 2; 
       const months = [];
       const JIE_QI_NAMES = ["立春", "驚蟄", "清明", "立夏", "芒種", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "小寒"];
       for(let i=0; i<12; i++) {
           const ganIdx = (startGanIdx + i) % 10;
           const zhiIdx = (2 + i) % 12; 
           let searchYear = parseInt(year), searchMonth = i + 2; 
           if (searchMonth > 12) { searchMonth -= 12; searchYear += 1; }
           
           let jieQiDateStr = `${searchMonth}月`; // 預設值
           try {
               if (window.Solar) {
                   const solarCheck = window.Solar.fromYmd(searchYear, searchMonth, 15);
                   const lunar = solarCheck.getLunar();
                   const jieQi = lunar.getPrevJieQi(true); 
                   if (jieQi && toTraditional(jieQi.getName()) === JIE_QI_NAMES[i]) {
                       const solarJie = jieQi.getSolar(); 
                       jieQiDateStr = `${solarJie.getMonth()}/${solarJie.getDay()}`;
                   }
               }
           } catch (e) { 
               console.warn("節氣計算錯誤", e); 
           }
           
           months.push({ 
               seq: i + 1, 
               name: JIE_QI_NAMES[i], 
               dateStr: jieQiDateStr, 
               gan: TIANGAN[ganIdx] || '', 
               zhi: DIZHI[zhiIdx] || '', 
               ganGod: getShiShen(data.bazi.dayGan, TIANGAN[ganIdx]), 
               zhiHidden: ZHI_HIDDEN[DIZHI[zhiIdx]] || [] 
           });
       }
       return months;
   };

  const renderDaYunRow = (list) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: '8px' }}>
                {list.map((dy) => {
                    const isSelected = selectedDaYunIndex === (dy.seq - 1);
                    const displayTopRight = showHiddenStems ? null : dy.ganGod;
                    const displayBottomRight = showHiddenStems ? dy.zhiHidden : dy.zhiHidden.map(h => getShiShen(data.bazi.dayGan, h));
                    const gColor = getColor(dy.gan, 'stem'); const zColor = getColor(dy.zhi, 'branch');
                return (
                       <div key={dy.seq} onClick={() => setSelectedDaYunIndex(dy.seq - 1)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18%', minHeight: '110px', padding: '8px 4px', backgroundColor: isSelected ? THEME.bgBlue : THEME.bgGray, borderRadius: '8px', border: isSelected ? `2px solid ${THEME.blue}` : `1px solid ${THEME.border}`, cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}>
                            <div style={{ position: 'relative', width: '30px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: gColor }}>{dy.gan}</span>
                                {displayTopRight && <div style={{ position: 'absolute', top: -5, right: -12, fontSize: '14px', color: '#888' }}>{displayTopRight}</div>}
                            </div>
                            <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', color: zColor }}>{dy.zhi}</span>
                                <div style={{ position: 'absolute', top: 5, right: -12, display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>{displayBottomRight.map((item, idx) => (<span key={idx} style={{ fontSize: '14px', lineHeight: '1.1', color: '#888' }}>{item}</span>))}</div>
                            </div>
                            {!data.isManual && ( <> <div style={{ marginTop: '6px', fontSize: '11px', color: THEME.black, fontWeight: 'bold' }}>{dy.startAge}歲</div> <div style={{ fontSize: '11px', color: THEME.gray }}>{dy.startYear}</div> </> )}                            
                        </div>
                    );
                })}
                {Array.from({ length: 5 - list.length }).map((_, i) => <div key={`empty-${i}`} style={{ width: '18%' }}></div>)}
            </div>
        );
    };
    
const renderLiuNianGrid = () => {
        if (data.isManual) return null;
        const targetDaYun = data.daYuns[selectedDaYunIndex];
        if (!targetDaYun || !targetDaYun.liuNians || targetDaYun.liuNians.length === 0) return null;
        return (
            <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: '0', borderLeft: `4px solid ${THEME.purple}`, paddingLeft: '8px', fontSize: '15px' }}>{targetDaYun.gan}{targetDaYun.zhi}大運 - 流年</h4>
                    <span style={{ fontSize: '12px', color: THEME.gray, marginLeft: '8px' }}>({targetDaYun.startAge}-{targetDaYun.startAge + 9}歲)</span>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', direction: 'rtl' }}>
                     {targetDaYun.liuNians.map((ln) => {
                         const isSelected = selectedLiuNianYear === ln.year;
                         const displayTopRight = showHiddenStems ? null : ln.ganGod;
                         const displayBottomRight = showHiddenStems ? ln.zhiHidden : ln.zhiHidden.map(h => getShiShen(data.bazi.dayGan, h));
                         const gColor = getColor(ln.gan, 'stem'); const zColor = getColor(ln.zhi, 'branch');
                         return (
                             <div key={ln.year} onClick={() => setSelectedLiuNianYear(ln.year)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', backgroundColor: isSelected ? THEME.bgRed : THEME.bgGray, borderRadius: '8px', border: isSelected ? `2px solid ${THEME.red}` : `1px solid ${THEME.border}`, position: 'relative', minHeight: '120px', direction: 'ltr', cursor: 'pointer' }}>
                                  <div style={{ position: 'relative', width: '30px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: gColor }}>{ln.gan}</span>
                                      {displayTopRight && <div style={{ position: 'absolute', top: -4, right: -12, fontSize: '14px', color: '#888', padding: '0 1px', borderRadius: '2px' }}>{displayTopRight}</div>}
                                  </div>
                                  <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '2px' }}>
                                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: zColor }}>{ln.zhi}</span>
                                      <div style={{ position: 'absolute', top: 8, right: -12, display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>{displayBottomRight.map((item, idx) => (<span key={idx} style={{ fontSize: '14px', lineHeight: '1.1', color: '#888' }}>{item}</span>))}</div>
                                  </div>
                                  <div style={{ marginTop: 'auto', paddingTop: '6px', textAlign: 'center' }}>
                                      <div style={{ fontSize: '11px', color: THEME.black, fontWeight: 'bold' }}>{ln.age}歲</div>
                                      <div style={{ fontSize: '10px', color: THEME.gray }}>{ln.year}</div>
                                  </div>
                             </div>
                         );
                     })}
                 </div>
            </div>
        );
   };

   const renderLiuYueGrid = () => {
       if (!selectedLiuNianYear) return null;
       const targetDaYun = data.daYuns[selectedDaYunIndex];
       const lnData = targetDaYun.liuNians.find(l => l.year === selectedLiuNianYear);
       if(!lnData) return null;
       const liuYues = getLiuYueData(lnData.gan, lnData.zhi, lnData.year);
       return (
           <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                   <h4 style={{ margin: '0', borderLeft: `4px solid ${THEME.orange}`, paddingLeft: '8px', fontSize: '15px' }}>{lnData.gan}{lnData.zhi}流年 ({lnData.year}年) - 流月</h4>
                   <button onClick={() => setSelectedLiuNianYear(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: THEME.gray, fontSize: '12px' }}><X size={16} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', direction: 'rtl' }}>
                    {liuYues.map((ly) => {
                        const displayTopRight = showHiddenStems ? null : ly.ganGod;
                        const displayBottomRight = showHiddenStems ? ly.zhiHidden : ly.zhiHidden.map(h => getShiShen(data.bazi.dayGan, h));
                        const gColor = getColor(ly.gan, 'stem'); const zColor = getColor(ly.zhi, 'branch');
                        return (
                            <div key={ly.seq} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', backgroundColor: THEME.bgOrange, borderRadius: '8px', border: `1px solid ${THEME.border}`, position: 'relative', minHeight: '110px', direction: 'ltr' }}>
                                <div style={{ position: 'relative', width: '30px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: gColor }}>{ly.gan}</span>
                                    {displayTopRight && <div style={{ position: 'absolute', top: -4, right: -9, fontSize: '12px', color: '#888', padding: '0 1px', borderRadius: '2px' }}>{displayTopRight}</div>}
                                </div>
                                <div style={{ position: 'relative', width: '30px', height: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: '2px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: zColor }}>{ly.zhi}</span>
                                    <div style={{ position: 'absolute', top: 8, right: -9, display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>{displayBottomRight.map((item, idx) => (<span key={idx} style={{ fontSize: '12px', lineHeight: '1.1', color: '#888' }}>{item}</span>))}</div>
                                </div>
                                <div style={{ marginTop: 'auto', paddingTop: '6px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: THEME.black, fontWeight: 'bold' }}>{ly.dateStr}</div>
                                    <div style={{ fontSize: '10px', color: THEME.gray }}>{ly.name}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
           </div>
       );
   };

   const calculateWuXingStrength = () => {
       const counts = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
       const chars = [ data.bazi.yearGan, data.bazi.yearZhi, data.bazi.monthGan, data.bazi.monthZhi, data.bazi.dayGan, data.bazi.dayZhi, data.bazi.timeGan, data.bazi.timeZhi ];
       chars.forEach(char => { const wx = WUXING_MAP[char]; if (wx && counts[wx] !== undefined) counts[wx]++; });
       return counts;
   };   

   const firstRow = data.daYuns ? data.daYuns.slice(0, 5) : [];
   const secondRow = data.daYuns ? data.daYuns.slice(5, 10) : [];
   const btnStyle = { padding: '8px 12px', backgroundColor: THEME.bgGray, borderRadius: '20px', border: 'none', color: THEME.gray, fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' };

return (
     <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: THEME.bg }}>
       <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${THEME.border}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ flex: 1, marginRight: '8px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                 <div style={{ fontSize: '20px', fontWeight: 'bold', color: THEME.black }}>{data.name} <span style={{ fontSize: '14px', color: THEME.gray, fontWeight: 'normal' }}>({data.genderText})</span></div>
                 <button onClick={() => setShowHiddenStems(!showHiddenStems)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', border: `1px solid ${THEME.border}`, backgroundColor: showHiddenStems ? THEME.black : THEME.white, color: showHiddenStems ? THEME.white : THEME.black, fontSize: '12px', cursor: 'pointer' }}>
                     {showHiddenStems ? <Eye size={14}/> : <EyeOff size={14}/>} {showHiddenStems ? '藏干' : '十神'}
                 </button>
             </div>
             {data.isManual ? ( <div style={{ fontSize: '13px', color: THEME.gray, marginTop: '6px' }}></div> ) : ( <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}> <div style={{ fontSize: '13px', color: THEME.gray }}>西曆 {data.solarDate}</div> <div style={{ fontSize: '13px', color: THEME.purple, fontWeight: '500' }}>農曆 {data.lunarDate}</div> </div> )}
             {data.yunInfo ? ( <> <div style={{ fontSize: '13px', color: THEME.blue, marginTop: '4px', fontWeight: 'bold' }}>{data.yunInfo.detail}</div> <div style={{ fontSize: '13px', color: THEME.blue, marginTop: '4px', fontWeight: 'bold' }}>(西元 {data.yunInfo.startDate} 起運)</div> </> ) : null}
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flexShrink: 0 }}>
              <button onClick={() => onSave(data)} style={btnStyle}> <Bookmark size={14} /> 保存 </button>
              <button onClick={onBack} style={btnStyle}> <RefreshCw size={14} /> 重排 </button>
          </div>
       </div>
       <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <PillarCard title="時柱" gan={data.bazi.timeGan} zhi={data.bazi.timeZhi} naYin={data.naYin.time} dayMaster={data.bazi.dayGan} showHiddenStems={showHiddenStems} colorTheme={safeTheme} />
          <PillarCard title="日柱" gan={data.bazi.dayGan} zhi={data.bazi.dayZhi} naYin={data.naYin.day} dayMaster={data.bazi.dayGan} showHiddenStems={showHiddenStems} colorTheme={safeTheme} />
          <PillarCard title="月柱" gan={data.bazi.monthGan} zhi={data.bazi.monthZhi} naYin={data.naYin.month} dayMaster={data.bazi.dayGan} showHiddenStems={showHiddenStems} colorTheme={safeTheme} />
          <PillarCard title="年柱" gan={data.bazi.yearGan} zhi={data.bazi.yearZhi} naYin={data.naYin.year} dayMaster={data.bazi.dayGan} showHiddenStems={showHiddenStems} colorTheme={safeTheme} />
       </div>
       <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
           <h4 style={{ margin: '0 0 12px 0', borderLeft: `4px solid ${THEME.blue}`, paddingLeft: '8px', fontSize: '15px' }}>大運</h4>
           <div>{renderDaYunRow(firstRow)}{renderDaYunRow(secondRow)}</div>
       </div>
       {renderLiuNianGrid()}
       {renderLiuYueGrid()}
        {/* 五行強弱 */}
        <div style={{ backgroundColor: THEME.white, borderRadius: '12px', padding: '16px', border: `1px solid ${THEME.border}`, marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 12px 0', borderLeft: `4px solid ${THEME.orange}`, paddingLeft: '8px', fontSize: '15px' }}>五行強弱</h4>
            {(() => { 
                const wxCounts = calculateWuXingStrength(); 
                const order = ['木', '火', '土', '金', '水']; 
                return ( 
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '4px'
                    }}> 
                        {order.map(elm => ( 
                            <div key={elm} style={{ 
                                padding: '8px 2px',
                                backgroundColor: THEME.bgGray, 
                                borderRadius: '8px', 
                                fontSize: '13px', 
                                display: 'flex', 
                                flexDirection: 'row',
                                alignItems: 'center', 
                                justifyContent: 'center',
                                whiteSpace: 'nowrap'
                            }}> 
                                <span style={{ color: THEME.gray, fontSize: '12px', marginBottom: '2px' }}>{elm}: </span>
                                <span style={{ fontWeight: 'bold', fontSize: '15px', color: wxCounts[elm] > 2 ? THEME.red : THEME.black }}>
                                    {wxCounts[elm]}
                                </span> 
                            </div> 
                        ))} 
                    </div> 
                ); 
            })()}
        </div>
     </div>
   );
};

// =========================================================================
// PART B: 主程式結構 (使用共用 UI 殼)
// =========================================================================
export default function BaziApp() {
  // 1. 安全保護 & 載入檢查
  // useProtection(['mrkfengshui.com', 'mrkbazi.vercel.app', 'localhost']);
  const libStatus = useLunarScript();
  
  // 2. 狀態管理
  const [view, setView] = useState('input');
  const [baziData, setBaziData] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [editingData, setEditingData] = useState(null);

  // App 專屬狀態
  const [ziHourRule, setZiHourRule] = useState('ziShi');
  const [colorTheme, setColorTheme] = useState('elemental');

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
        const { value: savedBk } = await Preferences.get({ key: 'bazi_bookmarks' });
        if (savedBk) setBookmarks(JSON.parse(savedBk));

        const { value: savedRule } = await Preferences.get({ key: 'bazi_zi_rule' });
        if (savedRule) setZiHourRule(savedRule);

        const { value: savedTheme } = await Preferences.get({ key: 'bazi_color_theme' });
        if (savedTheme) setColorTheme(savedTheme);
      } catch (e) { console.error("讀取儲存資料失敗:", e); }
    };
    loadData();
  }, []);

  useEffect(() => { const saveRule = async () => { await Preferences.set({ key: 'bazi_zi_rule', value: ziHourRule }); }; saveRule(); }, [ziHourRule]);
  useEffect(() => { const saveTheme = async () => { await Preferences.set({ key: 'bazi_color_theme', value: colorTheme }); }; saveTheme(); }, [colorTheme]);

  // 5. 動作處理
  const handleCalculate = (formData) => {
     if (libStatus !== 'ready') return;
     try {
        const result = calculateBaziResult(formData, ziHourRule);
        setBaziData(result); 
        setEditingData(null); 
        setView('result');
     } catch(e) { console.error(e); alert('日期格式錯誤或計算異常'); }
  };

  const saveBookmark = async (data) => {
      const baziSource = data.bazi || {};
      const dm = baziSource.dayGan || '';
      const dmElement = WUXING_MAP[dm] || '';

      const dataToSave = {
          id: data.id || Date.now(),
          name: data.name,
          genderText: data.genderText || (data.gender === '1' ? '男' : '女'),
          solarDate: data.solarDate || `${data.year}-${data.month}-${data.day}`,
          lunarDate: data.lunarDate || `${data.year}-${data.month}-${data.day}`,
          dayMaster: dm + dmElement,
          monthBranch: baziSource.monthZhi || '', 
          rawDate: data.rawDate || data 
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
      await Preferences.set({ key: 'bazi_bookmarks', value: JSON.stringify(newBk) });
  };
  
  const deleteBookmark = async (id) => {
      if (window.confirm('確定要刪除這條紀錄嗎？')) {
          const newBk = bookmarks.filter(b => b.id !== id);
          setBookmarks(newBk); 
          await Preferences.set({ key: 'bazi_bookmarks', value: JSON.stringify(newBk) });
      }
  };
  
  const openBookmark = (savedItem) => {
      if (!savedItem.rawDate) { alert('此書籤資料版本過舊，無法重新排盤'); return; }
      try {
          const freshResult = calculateBaziResult(savedItem.rawDate, ziHourRule);
          freshResult.id = savedItem.id; 
          setBaziData(freshResult); 
          setView('result');
      } catch (e) { console.error("Failed to recalulate bookmark:", e); alert('讀取失敗，資料可能已損壞'); }
  };

  if (libStatus === 'loading') return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>載入命理數據庫...</div>;
  if (libStatus === 'error') return <div style={{ padding: 20, textAlign: 'center' }}>載入失敗，請檢查網路連線後重新整理。</div>;

  return (
    // ✅ 1. 使用全螢幕容器
    <div style={COMMON_STYLES.fullScreen}>
      <style>{`
        @font-face { font-family: '青柳隷書SIMO2_T'; src: url('/fonts/AoyagiReishoSIMO2_T.ttf') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }
      `}</style>
      
      {/* ✅ 2. 共用 Header */}
      <AppHeader title={CURRENT_APP_NAME} logoChar={{ main: '八', sub: '字' }} />

      {/* ✅ 3. 內容滾動區 */}
      <div style={COMMON_STYLES.contentArea}>
          {view === 'input' && (
            <>
              <BaziInput onCalculate={handleCalculate} initialData={editingData} colorTheme={colorTheme} />
              <AdBanner />
            </>
          )}
          
          {view === 'result' && (
            <>
              <BaziResult data={baziData} onBack={() => { setEditingData(null); setView('input'); }} onSave={saveBookmark} colorTheme={colorTheme} />
              <AdBanner />
            </>
          )}
            
          {view === 'bookmarks' && (
              <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', padding: '8px', backgroundColor: THEME.white, borderRadius: '8px' }}>
                    <h2 style={{ fontWeight: 'bold', color: THEME.black, margin: 0 }}>我的命盤紀錄</h2>
                  </div>
                  
                  {/* ✅ 4. 使用共用 BookmarkList */}
                  <BookmarkList 
                    bookmarks={bookmarks}
                    onSelect={openBookmark}
                    onDelete={deleteBookmark}
                    onEdit={(b) => { setEditingData({...b.rawDate, id: b.id}); setView('input'); }}
                  />
                  
                  <div style={{ marginTop: '20px' }}><AdBanner /></div>
              </div>
          )}

          {/* ✅ 5. 共用預約系統 */}
          {view === 'booking' && <BookingSystem apiUrl={API_URL} onNavigate={() => setView('input')} />}
          
          {/* ✅ 6. 設定頁 (包含共用與專屬) */}
          {view === 'settings' && <SettingsView 
            ziHourRule={ziHourRule} setZiHourRule={setZiHourRule} 
            colorTheme={colorTheme} setColorTheme={setColorTheme}
            bookmarks={bookmarks} setBookmarks={setBookmarks}
          />}
      </div>

      {/* ✅ 7. 安裝引導提示 */}
      <InstallGuide />

      {/* ✅ 8. 共用底部導航 */}
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