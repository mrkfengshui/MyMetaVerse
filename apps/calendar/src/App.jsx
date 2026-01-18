import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import 'react-calendar/dist/Calendar.css';

// 1. 引入共用 UI 和 工具
import { 
  AdBanner, AppHeader, AppInfoCard, 
  BookingSystem, BottomTabBar, BookmarkList, BuyMeCoffee, 
  InstallGuide, WebBackupManager, 
  COLORS, THEME, COMMON_STYLES
} from '@my-meta/ui';

// 2. 引入 Icon
import { 
  Bookmark, Calendar, CalendarCheck, 
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
  Eye, EyeOff, Info, 
  RefreshCw, RotateCcw, Settings, X
} from 'lucide-react';

// =========================================================================
// PART A: 核心數據與邏輯 (完整保留)
// =========================================================================
const APP_NAME = "進氣萬年曆";
const APP_VERSION = "v1.0";
const API_URL = "https://script.google.com/macros/s/AKfycbzZRwy-JRkfpvrUegR_hpETc3Z_u5Ke9hpzSkraNSCEUCLa7qBk636WOCpYV0sG9d1h/exec";

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const SAN_NIANG_DAYS = [3, 7, 13, 18, 22, 27];

const STEM_COLORS = [COLORS.jia, COLORS.yi, COLORS.bing, COLORS.ding, COLORS.wu, COLORS.ji, COLORS.geng, COLORS.xin, COLORS.ren, COLORS.gui];
const BRANCH_COLORS = [COLORS.ren, COLORS.ji, COLORS.jia, COLORS.yi, COLORS.wu, COLORS.ding, COLORS.bing, COLORS.ji, COLORS.geng, COLORS.xin, COLORS.wu, COLORS.gui];

const QI_RULES = {
  stems: [[[-2, 4], [8, 14]], [[-3, 3], [7, 13]], [[-4, 2], [6, 12]], [[5, 11]], [[4, 10]], [[3, 9]], [[2, 8]], [[1, 7]], [[0, 6]], [[-1, 5], [9, 15]]],
  branches: [[[-2, 5], [10, 17]], [[-1, 5], [11, 17]], [[0, 6]], [[1, 7]], [[2, 8]], [[3, 9]], [[4, 10]], [[5, 11]], [[-6, 3], [6, 15]], [[-5, 4], [7, 16]], [[-4, 2], [8, 14]], [[-3, 5], [9, 17]]]
};

const YI_JI_MAP = {
  '开': '開', '满': '滿', '执': '執', '闭': '閉', '壮': '壯', '冲': '沖',
  '节': '節', '纳': '納', '采': '採', '动': '動', '竖': '豎', '画': '畫',
  '斋': '齋', '盖': '蓋', '齐': '齊', '发': '發', '财': '財', '钻': '鑽',
  '缝': '縫', '针': '針', '经': '經', '络': '絡', '酝': '醞', '酿': '釀',
  '扫': '掃', '饰': '飾', '墙': '牆', '帐': '帳', '马': '馬', '医': '醫',
  '灵': '靈', '堕': '墮', '订': '訂', '归': '歸', '宁': '寧', '阳': '陽',
  '阴': '陰', '戏': '戲', '击': '擊', '乐': '樂', '词': '詞', '讼': '訟',
  '猎': '獵', '网': '網', '罗': '羅', '种': '種', '鱼': '魚', '补': '補',
  '寿': '壽', '会': '會', '亲': '親', '进': '進', '头': '頭', '粮': '糧',
  '仓': '倉', '库': '庫', '窑': '窯', '养': '養', '门': '門', '厨': '廚',
  '涂': '塗', '厕': '廁', '临': '臨', '启': '啟', '殡': '殯', '殓': '殮', 
  '谢': '謝', '设': '設', '驾': '駕', '筑': '築', '坟': '墳', '绘': '繪', 
  '产': '產', '馀': '餘'
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

const DONG_GONG_RULES = {
  1: { '寅': { r: '凶', t: '建寅日：往亡日。不利起造、結婚姻。' }, '卯': { r: '凶', t: '除卯日：不宜起造、婚姻。' }, '辰': { r: '凶', t: '滿辰日：天富、天賊。' }, '巳': { r: '凶', t: '平巳日：小紅沙日，百事大凶。' }, '午': { r: '吉', t: '定午日：黃沙日，諸吉星蓋照，大吉。' }, '未': { r: '凶', t: '執未日：天賊、朱雀。' }, '申': { r: '凶', t: '破申日：朱雀、勾絞。' }, '酉': { r: '凶', t: '危酉日：辛酉正四廢。', s: {'丁酉': '次吉'} }, '戌': { r: '凶', t: '成戌日：天喜、地網。' }, '亥': { r: '凶', t: '收亥日：勾絞星臨。' }, '子': { r: '次吉', t: '開子日：甲子自死。', s: {'戊子': '吉', '丙子': '吉', '庚子': '吉'} }, '丑': { r: '凶', t: '閉丑日：不利婚姻。' } },
  2: { '卯': { r: '凶', t: '建卯日：天地轉煞。' }, '辰': { r: '凶', t: '除辰日：不利移居。' }, '巳': { r: '吉', t: '滿巳日：天空、往亡。' }, '午': { r: '平', t: '平午日：只宜作生基。' }, '未': { r: '凶', t: '定未日：不利婚姻。', s: {'癸未': '吉'} }, '申': { r: '吉', t: '執申日：天月二德。', s: {'庚申': '凶'} }, '酉': { r: '凶', t: '破酉日：小紅沙。' }, '戌': { r: '次吉', t: '危戌日：宜合板。', s: {'丙戌': '凶', '壬戌': '凶'} }, '亥': { r: '吉', t: '成亥日：天喜。' }, '子': { r: '凶', t: '收子日：忌婚姻。' }, '丑': { r: '凶', t: '開丑日：不利造作。' }, '寅': { r: '平', t: '閉寅日：黃沙日。' } },
  3: { '辰': { r: '凶', t: '建辰日：地網。' }, '巳': { r: '吉', t: '除巳日：丁巳吉。', s: {'丁巳': '吉', '己巳': '吉'} }, '午': { r: '平', t: '滿午日：甲午土鬼。', s: {'壬午': '次吉'} }, '未': { r: '凶', t: '平未日：不宜用事。' }, '申': { r: '吉', t: '定申日：甲申大吉。', s: {'戊申': '凶', '庚申': '凶'} }, '酉': { r: '吉', t: '執酉日：乙酉吉。', s: {'辛酉': '凶'} }, '戌': { r: '凶', t: '破戌日：月建沖破。' }, '亥': { r: '次吉', t: '危亥日：己亥次吉。' }, '子': { r: '凶', t: '成子日：黃沙。' }, '丑': { r: '凶', t: '收丑日：小紅沙。' }, '寅': { r: '吉', t: '開寅日：戊寅天赦。' }, '卯': { r: '凶', t: '閉卯日：百事不宜。' } },
  4: { '巳': { r: '凶', t: '建巳日：小紅沙。' }, '午': { r: '吉', t: '除午日：黃沙。', s: {'丙午': '凶', '戊午': '凶'} }, '未': { r: '次吉', t: '滿未日：辛未次吉。' }, '申': { r: '凶', t: '平申日：朱雀。' }, '酉': { r: '凶', t: '定酉日：九土鬼。' }, '戌': { r: '凶', t: '執戌日：丙戌大凶。', s: {'甲戌': '次吉'} }, '亥': { r: '凶', t: '破亥日：往亡日。' }, '子': { r: '吉', t: '危子日：庚子大吉。', s: {'甲子': '凶', '壬子': '凶'} }, '丑': { r: '凶', t: '成丑日：天喜。' }, '寅': { r: '凶', t: '收寅日：天喜。' }, '卯': { r: '吉', t: '開卯日：辛卯大吉。' }, '辰': { r: '凶', t: '閉辰日：戊辰大凶。' } },
  5: { '午': { r: '凶', t: '建午日：天地轉煞。', s: {'甲午': '次吉'} }, '未': { r: '次吉', t: '除未日：乙未不利。', s: {'乙未': '凶'} }, '申': { r: '吉', t: '滿申日：甲申吉。', s: {'壬申': '凶', '庚申': '平'} }, '酉': { r: '凶', t: '平酉日：小紅沙。' }, '戌': { r: '吉', t: '定戌日：甲戌大吉。', s: {'丙戌': '凶', '壬戌': '凶'} }, '亥': { r: '次吉', t: '執亥日：乙亥次吉。', s: {'癸亥': '凶'} }, '子': { r: '凶', t: '破子日：天賊。' }, '丑': { r: '凶', t: '危丑日：丁丑大凶。' }, '寅': { r: '吉', t: '成寅日：黃沙。' }, '卯': { r: '凶', t: '收卯日：往亡。' }, '辰': { r: '吉', t: '開辰日：丙辰大吉。', s: {'戊辰': '凶', '甲辰': '凶'} }, '巳': { r: '吉', t: '閉巳日：乙巳大吉。' } },
  6: { '未': { r: '凶', t: '建未日：乙未大凶。' }, '申': { r: '吉', t: '除申日：甲申大吉。', s: {'丙申': '凶'} }, '酉': { r: '次吉', t: '滿酉日：乙酉次吉。', s: {'丁酉': '凶', '己酉': '凶'} }, '戌': { r: '凶', t: '平成日：諸事招官非。', s: {'甲戌': '次吉'} }, '亥': { r: '吉', t: '定亥日：丁亥大吉。', s: {'辛亥': '凶', '癸亥': '凶'} }, '子': { r: '次吉', t: '執子日：黃沙。', s: {'丙子': '吉', '庚子': '吉', '甲子': '凶', '壬子': '凶'} }, '丑': { r: '凶', t: '破丑日：小紅沙。' }, '寅': { r: '吉', t: '危寅日：甲寅大吉。' }, '卯': { r: '吉', t: '成卯日：天喜。' }, '辰': { r: '次吉', t: '收辰日：甲辰天德。' }, '巳': { r: '次吉', t: '開巳日：乙巳次吉。' }, '午': { r: '平', t: '閉午日：往亡。', s: {'戊午': '凶'} } },
  7: { '申': { r: '凶', t: '建申日：庚申煞。' }, '酉': { r: '次吉', t: '除酉日：往亡。', s: {'辛酉': '凶'} }, '戌': { r: '凶', t: '滿戌日：天富。' }, '亥': { r: '凶', t: '平亥日：螣蛇纏繞。' }, '子': { r: '吉', t: '定子日：丙子大吉。', s: {'甲子': '凶', '壬子': '凶'} }, '丑': { r: '凶', t: '執丑日：丁丑不可用。' }, '寅': { r: '凶', t: '破寅日：甲寅正四廢。' }, '卯': { r: '吉', t: '危卯日：癸卯大吉。', s: {'乙卯': '凶'} }, '辰': { r: '次吉', t: '成辰日：天喜。', s: {'戊辰': '凶', '甲辰': '凶'} }, '巳': { r: '凶', t: '收巳日：小紅沙。' }, '午': { r: '吉', t: '開午日：黃沙。', s: {'庚午': '凶'} }, '未': { r: '次吉', t: '閉未日：天成。', s: {'乙未': '凶'} } },
  8: { '酉': { r: '凶', t: '建酉日：小紅沙。' }, '戌': { r: '次吉', t: '除戌日：庚戌次吉。', s: {'丙戌': '凶', '壬戌': '凶'} }, '亥': { r: '吉', t: '滿亥日：天富。', s: {'癸亥': '凶'} }, '子': { r: '吉', t: '平子日：往亡。', s: {'甲子': '凶', '壬子': '凶'} }, '丑': { r: '次吉', t: '定丑日：辛丑次吉。', s: {'己丑': '凶'} }, '寅': { r: '吉', t: '執寅日：黃沙。', s: {'甲寅': '凶'} }, '卯': { r: '次吉', t: '破卯日：天賊。', s: {'乙卯': '凶'} }, '辰': { r: '吉', t: '危辰日：壬辰大吉。', s: {'甲辰': '凶'} }, '巳': { r: '吉', t: '成巳日：天喜。' }, '午': { r: '次吉', t: '收午日：福星。', s: {'戊午': '凶', '庚午': '凶'} }, '未': { r: '次吉', t: '開未日：丁未次吉。', s: {'乙未': '凶'} }, '申': { r: '吉', t: '閉申日：戊申天赦。' } },
  9: { '戌': { r: '凶', t: '建戌日：餘戌大凶。', s: {'丙戌': '吉'} }, '亥': { r: '吉', t: '除亥日：天成。', s: {'癸亥': '凶'} }, '子': { r: '吉', t: '滿子日：黃沙。', s: {'壬子': '凶'} }, '丑': { r: '凶', t: '平丑日：小紅沙。' }, '寅': { r: '吉', t: '定寅日：丙寅大吉。', s: {'甲寅': '凶'} }, '卯': { r: '吉', t: '執卯日：辛卯大吉。', s: {'乙卯': '凶'} }, '辰': { r: '次吉', t: '破辰日：往亡。', s: {'戊辰': '凶', '甲辰': '凶'} }, '巳': { r: '吉', t: '危巳日：乙巳大吉。' }, '午': { r: '吉', t: '成午日：天喜。' }, '未': { r: '次吉', t: '收未日：己未次吉。', s: {'乙未': '凶'} }, '申': { r: '次吉', t: '開申日：天賊。', s: {'庚申': '凶'} }, '酉': { r: '凶', t: '閉酉日：暴敗。' } },
  10: { '亥': { r: '凶', t: '建亥日：不利起造。' }, '子': { r: '凶', t: '除子日：轉煞。', s: {'甲子': '次吉'} }, '丑': { r: '凶', t: '滿丑日：天富。' }, '寅': { r: '次吉', t: '平寅日：甲寅上吉。', s: {'甲寅': '吉'} }, '卯': { r: '吉', t: '定卯日：乙卯大吉。' }, '辰': { r: '凶', t: '執辰日：甲辰只可偷修。' }, '巳': { r: '凶', t: '破巳日：小紅沙。', s: {'乙巳': '次吉'} }, '午': { r: '吉', t: '危午日：黃沙。', s: {'丙午': '凶'} }, '未': { r: '凶', t: '成未日：乙未煞。', s: {'癸未': '吉'} }, '申': { r: '吉', t: '收申日：甲申大吉。', s: {'庚申': '凶'} }, '酉': { r: '吉', t: '開酉日：乙酉上吉。' }, '戌': { r: '次吉', t: '閉戌日：甲戌月德。', s: {'丙戌': '凶', '戊戌': '凶'} } },
  11: { '子': { r: '凶', t: '建子日：火星。' }, '丑': { r: '吉', t: '除丑日：天乙。' }, '寅': { r: '吉', t: '滿寅日：黃沙。' }, '卯': { r: '凶', t: '平卯日：天賊。', s: {'乙卯': '次吉'} }, '辰': { r: '凶', t: '定辰日：天羅地網。', s: {'壬辰': '次吉'} }, '巳': { r: '吉', t: '執巳日：乙巳大吉。', s: {'丁巳': '凶'} }, '午': { r: '凶', t: '破午日：天賊。' }, '未': { r: '吉', t: '危未日：丁未大吉。', s: {'乙未': '凶'} }, '申': { r: '吉', t: '成申日：天喜。', s: {'庚申': '凶', '丙申': '凶'} }, '酉': { r: '凶', t: '收酉日：小紅沙。' }, '戌': { r: '次吉', t: '開戌日：往亡。', s: {'甲戌': '吉', '丙戌': '凶', '壬戌': '凶'} }, '亥': { r: '吉', t: '閉亥日：乙亥大吉。', s: {'癸亥': '凶', '辛亥': '凶'} } },
  12: { '丑': { r: '次吉', t: '建丑日：小紅沙。' }, '寅': { r: '吉', t: '除寅日：庚寅大吉。' }, '卯': { r: '次吉', t: '滿卯日：天富。' }, '辰': { r: '凶', t: '平辰日：到州星。', s: {'壬辰': '次吉', '庚辰': '次吉'} }, '巳': { r: '凶', t: '定巳日：天成。', s: {'癸巳': '次吉'} }, '午': { r: '吉', t: '執午日：庚午吉。', s: {'丙午': '凶'} }, '未': { r: '吉', t: '破未日：丁未大吉。', s: {'己未': '凶', '辛未': '凶', '乙未': '凶'} }, '申': { r: '次吉', t: '危申日：庚申次吉。' }, '酉': { r: '吉', t: '成酉日：天喜。' }, '戌': { r: '次吉', t: '收戌日：庚戌先凶後吉。', s: {'丙戌': '凶', '壬戌': '凶', '戊戌': '凶'} }, '亥': { r: '吉', t: '開亥日：天賊。', s: {'癸亥': '凶', '辛亥': '凶'} }, '子': { r: '凶', t: '閉子日：黃沙。' } }
};

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

// ==========================================
// NEW: 流月進退氣核心邏輯
// ==========================================

// 天干五行屬性 (0:甲, 1:乙...) -> 木木火火土土金金水水
const STEM_ELEMENTS = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'];

// 檢查 A 是否剋 B (例如: 丁火(3) 剋 辛金(7))
const doesStemControl = (stemIdxA, stemIdxB) => {
    const elA = STEM_ELEMENTS[stemIdxA];
    const elB = STEM_ELEMENTS[stemIdxB];
    if (elA === 'wood' && elB === 'earth') return true;
    if (elA === 'fire' && elB === 'metal') return true;
    if (elA === 'earth' && elB === 'water') return true;
    if (elA === 'metal' && elB === 'wood') return true;
    if (elA === 'water' && elB === 'fire') return true;
    return false;
};

// 計算某一日是否處於流月天干進氣狀態
const getMonthlyStemQiStatus = (date, lunar) => {
    try {
        // 1. 取得當前經歷的 "節" (Jie) 與 "氣" (Qi)
        // 使用 prevJie 確保即使在節氣當天之前，我們也能抓到這個月的節氣資訊
        const jieQiTable = lunar.getJieQiTable();
        const keys = Object.keys(jieQiTable);
        
        // 找出離這一天最近的 "節" (不論是過去還是未來)
        // 為了簡單起見，我們取 lunar 所在月份的 "節"
        // 注意：lunar-javascript 的 getJieQiTable 返回的是整個農曆年的節氣，需要篩選
        
        // 策略：直接利用 Solar 對象反查最近的節氣
        const solar = window.Solar.fromYmd(date.getFullYear(), date.getMonth()+1, date.getDate());
        
        // 獲取當月(或鄰近)的節令資訊
        // 這裡需要稍微複雜的運算：找到本月所屬的 "節" (Start) 和 "中氣" (End)
        // 簡易做法：往回找最近的一個 "節"
        let currentJie = null;
        let currentJieDate = null;
        let midQiDate = null;

        // 搜尋範圍：前後 35 天，確保涵蓋節氣交界
        for (let i = 15; i >= -20; i--) {
            const tempDate = new Date(date);
            tempDate.setDate(date.getDate() - i);
            const tempSolar = window.Solar.fromYmd(tempDate.getFullYear(), tempDate.getMonth()+1, tempDate.getDate());
            const tempLunar = tempSolar.getLunar();
            const jq = tempLunar.getJieQi();
            
            // 如果是 "節" (非中氣)
            if (jq && tempLunar.getJie() === jq) { 
                // 找到了節，這就是流月的起點
                currentJie = jq;
                currentJieDate = tempDate;
                
                // 順便找中氣 (通常在節後 ~15 天)
                // 從這個節往後找中氣
                for (let k = 1; k < 20; k++) {
                    const qDate = new Date(tempDate);
                    qDate.setDate(tempDate.getDate() + k);
                    const qSolar = window.Solar.fromYmd(qDate.getFullYear(), qDate.getMonth()+1, qDate.getDate());
                    const qLunar = qSolar.getLunar();
                    const qName = qLunar.getJieQi();
                    if (qName && qLunar.getQi() === qName) {
                        midQiDate = qDate;
                        break;
                    }
                }
                break;
            }
        }

        if (!currentJieDate || !midQiDate) return false;

        // [Rule]: 到達中氣(冬至等)後，天干不再進氣 (PDF Source: 92)
        // 如果當前日期 >= 中氣日期，直接回傳 false (或交由地支邏輯，此處僅處理天干)
        if (date >= midQiDate) return false;

        // 2. 確定流月天干
        // 使用節氣當天的八字來定月柱
        const jieSolar = window.Solar.fromYmdHms(currentJieDate.getFullYear(), currentJieDate.getMonth()+1, currentJieDate.getDate(), 23, 59, 59);
        const monthGan = jieSolar.getLunar().getEightChar().getMonthGan(); 
        const monthGanIdx = TIANGAN.indexOf(monthGan);

        // 3. 計算 "實際進氣日" (Start Date)
        let actualStartDate = new Date(currentJieDate);
        const jieDayGan = jieSolar.getLunar().getEightChar().getDayGan();
        const jieDayGanIdx = TIANGAN.indexOf(jieDayGan);

        // [Rule]: 節氣日子干支不是剋流月干支 (PDF Source: 5)
        const isJieDayClash = doesStemControl(jieDayGanIdx, monthGanIdx);

        if (!isJieDayClash) {
            // [Rule]: 提早的日子在半數之內 (5.5天) (PDF Source: 5)
            // 往回查 5 天，看有沒有 "同干" (Same Stem) 的日子
            for (let d = 5; d >= 1; d--) {
                const lookBackDate = new Date(currentJieDate);
                lookBackDate.setDate(currentJieDate.getDate() - d);
                const lbSolar = window.Solar.fromYmd(lookBackDate.getFullYear(), lookBackDate.getMonth()+1, lookBackDate.getDate());
                const lbGan = lbSolar.getLunar().getEightChar().getDayGan();
                
                if (lbGan === monthGan) {
                    actualStartDate = lookBackDate; // 提早進氣
                    break;
                }
            }
        }

        // 如果當前日期還沒到實際進氣日，回傳 false
        if (date < actualStartDate) return false;

        // 4. 模擬進退氣狀態 (從 實際進氣日 到 當前日期)
        // 我們需要逐日檢查是否有 "剋" (退氣) 或 "同" (重進氣)
        let isActive = true; // 起始日一定是進氣的
        
        // 迴圈從 actualStartDate + 1 天 開始檢查，直到 current date
        const loopStart = new Date(actualStartDate);
        loopStart.setDate(loopStart.getDate() + 1);
        
        // 計算天數差
        const diffDays = Math.floor((date - actualStartDate) / (1000 * 60 * 60 * 24));
        
        for (let i = 1; i <= diffDays; i++) {
            const checkDate = new Date(actualStartDate);
            checkDate.setDate(actualStartDate.getDate() + i);
            
            const cSolar = window.Solar.fromYmd(checkDate.getFullYear(), checkDate.getMonth()+1, checkDate.getDate());
            const cGan = cSolar.getLunar().getEightChar().getDayGan();
            const cGanIdx = TIANGAN.indexOf(cGan);

            if (isActive) {
                // [Rule]: 遇到剋流月干支的日子 -> 退氣 (PDF Source: 19)
                if (doesStemControl(cGanIdx, monthGanIdx)) {
                    isActive = false;
                }
            } else {
                // [Rule]: 退氣後，遇到同流月干支的日子 -> 再次進氣 (PDF Source: 90)
                if (cGan === monthGan) {
                    isActive = true;
                }
            }
        }

        return { isActive, color: STEM_COLORS[monthGanIdx] };

    } catch (e) {
        console.error("Qi Calc Error", e);
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
const InfoItem = ({ label, value, desc }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    alert(`【${label} - ${value}】\n\n${desc}`);
  };

  return (
    <div 
      onClick={handleClick}
      style={{ 
        background: '#f9f9f9', padding: '10px 12px', borderRadius: '12px', 
        cursor: 'pointer', display: 'flex', flexDirection: 'column',
        border: '1px solid transparent', transition: 'all 0.2s',
        marginBottom: '8px'
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#ccc'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
    >
      <span style={{ fontSize: '12px', color: '#888', marginBottom: '4px', display:'flex', alignItems:'center', gap:'4px' }}>
        {label} <Info size={12}/>
      </span>
      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#333' }}>{value}</span>
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
const BottomSummaryPanel = ({ info, onDetailClick, onTimeClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 當日期改變時，自動收合 (可選)
  useEffect(() => {
    setIsExpanded(false);
  }, [info?.dateStr]);

  if (!info) return null;

  const dgColor = info.dongGongRating.includes('吉') ? THEME.blue : (info.dongGongRating.includes('凶') ? THEME.red : THEME.gray);

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
            <span style={{ fontSize: '14px', color: THEME.primary, fontWeight: '500' }}>{info.lunarStr}</span>
         </div>
         <div style={{ color: THEME.blue }}>
            <ChevronUp size={16} />
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
            <span style={{ fontSize: '14px', color: THEME.primary, fontWeight: '500' }}>{info.lunarStr}</span>
         </div>
         
         {/* 這裡改為收合按鈕，阻止冒泡以免觸發 onDetailClick */}
         <div 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: THEME.blue, fontSize: '12px', padding: '4px' }}
         >
            <ChevronDown size={16} />
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
              <div style={{ fontSize: '13px', color: THEME.grey, marginTop: '2px' }}>
                 董公：<span style={{ fontWeight: 'bold', color: dgColor }}>{info.dongGongRating}</span>
                 <span style={{ color: '#999', marginLeft: '6px', fontSize: '12px' }}>{info.dongGongSummary}</span>
              </div>
          </div>

          <div style={{ display: 'flex', gap: '4px', textAlign: 'center' }}>
              <div 

                onClick={(e) => { e.stopPropagation(); onTimeClick(); }} 
                style={{ background: '#e6f7ff', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', border: `1px solid ${THEME.blue}` }}
              >
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>時</div>
                  <div style={{ fontWeight: 'bold', color: THEME.grey}}>{info.bazi.timeGan}</div>
                  <div style={{ fontWeight: 'bold', color: THEME.grey }}>{info.bazi.timeZhi}</div>
              </div>
              <div style={{ background: '#f9f9f9', borderRadius: '6px', padding: '4px 6px' }}>
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>日</div>
                  <div style={{ fontWeight: 'bold', color: THEME.grey }}>{info.bazi.dayGan}</div>
                  <div style={{ fontWeight: 'bold', color: THEME.grey }}>{info.bazi.dayZhi}</div>
              </div>
              <div style={{ background: '#f9f9f9', borderRadius: '6px', padding: '4px 6px' }}>
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>月</div>
                  <div style={{ fontWeight: 'bold', color: THEME.grey }}>{info.bazi.monthGan}</div>
                  <div style={{ fontWeight: 'bold', color: THEME.grey }}>{info.bazi.monthZhi}</div>
              </div>
              <div style={{ background: '#f9f9f9', borderRadius: '6px', padding: '4px 6px' }}>
                  <div style={{ fontSize: '10px', color: '#999', marginBottom: '2px' }}>年</div>
                  <div style={{ fontWeight: 'bold', color: THEME.grey }}>{info.bazi.yearGan}</div>
                  <div style={{ fontWeight: 'bold', color: THEME.grey }}>{info.bazi.yearZhi}</div>
              </div>
          </div>
      </div>
    </div>
  );
};

// B-4: 詳細資訊彈出視窗 (Modal)
const DayDetailModal = ({ isOpen, onClose, date, info, toggleBookmark, isBookmarked }) => {
  if (!isOpen || !date || !info) return null;

  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', zIndex: 1200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div style={{
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
                <div style={{ fontSize: '13px', color: THEME.grey }}>
                    {info.ganZhiYear}年 {info.lunarStr}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <InfoItem label="建除十二神" value={info.jian} desc="傳統擇日學的重要依據，每日輪值不同神煞。" />
                    <InfoItem label="二十八宿" value={info.xiuFull} desc="中國古代天文學的恆星區分系統。" />
                </div>
            </AccordionSection>

            {/* 董公 */}
            <AccordionSection title="董公擇日便覽" defaultOpen={true} color="#fa8c16">
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: info.dongGongRating.includes('吉') ? THEME.blue : THEME.red }}>
                    {info.dongGongRating}
                  </span>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#444', whiteSpace: 'pre-line' }}>
                    {info.dongGongText}
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
    about: "本應用程式旨在提供精確的流年流月進退氣萬年曆查詢，結合民間簡易神煞，輔助使用者進行擇日用事分析。",
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
      color: isActive ? color : THEME.grey,
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
const DayCell = ({ date, isCurrentMonth, isToday, isSelected, onClick, canRender, bookmarks, qiMode }) => {
  if (!canRender || !date || isNaN(date.getTime())) return <div style={{ height: '75px', background: '#fff' }}></div>;
  
  let data = { lunarDisplay: date.getDate(), ganZhi: '', jian: '', xiu: '', isSanNiang: false, colorJian: THEME.black, colorXiu: THEME.black, isJieQi: false, dongGongRating: '', isNewYear: false };
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
          data.lunarDisplay = term;
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
      const monthNum = Math.abs(lunar.getMonth());
      const dayZhi = lunar.getDayZhi(); const dayGanZhi = lunar.getDayInGanZhi();
      const dgRule = DONG_GONG_RULES[monthNum]?.[dayZhi];
      if (dgRule) data.dongGongRating = (dgRule.s && dgRule.s[dayGanZhi]) ? dgRule.s[dayGanZhi] : dgRule.r;
      
      // 進退氣邏輯
      if (qiMode) {
          let baseStemIdx = -1, baseBranchIdx = -1;
          let currStemIdx = -1, currBranchIdx = -1;
          
          if (qiMode === 'nian') {
              // [FIX] 使用 baziEnd (23:59) 來獲取年與月，確保節氣當天變色
              baseStemIdx = TIANGAN.indexOf(baziEnd.getYearGan());
              baseBranchIdx = DIZHI.indexOf(baziEnd.getYearZhi());
              currStemIdx = TIANGAN.indexOf(baziEnd.getMonthGan());
              currBranchIdx = DIZHI.indexOf(baziEnd.getMonthZhi());
          } else if (qiMode === 'yue') {
              // [FIX] 月柱使用 baziEnd (23:59) 以捕捉節氣
              // 但日柱建議維持使用 baziObj (00:00) 或 lunar，以避免夜子時(23:00後)導致日柱顯示為隔天的問題
              // 這樣做到了：月令換氣看當天最後，日辰對應看當天顯示
              baseStemIdx = TIANGAN.indexOf(baziEnd.getMonthGan());
              baseBranchIdx = DIZHI.indexOf(baziEnd.getMonthZhi());
              currStemIdx = TIANGAN.indexOf(baziObj.getDayGan());
              currBranchIdx = DIZHI.indexOf(baziObj.getDayZhi());
          }

          if (baseStemIdx !== -1 && currStemIdx !== -1) { // 簡單防呆
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
          }
      }
  } catch (e) { console.error(e); }

  const isBookmarked = bookmarks.includes(getLocalDateString(date));
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
          <div style={{ position: 'absolute', top: '3px', right: '3px', fontSize: '14px', fontWeight: 'bold', color: THEME.teal, writingMode: 'vertical-rl', lineHeight: '1', letterSpacing: '1px' }}>{data.ganZhi}</div>
          {data.isSanNiang && (<div style={{ position: 'absolute', top: '38px', left: '4px', fontSize: '8px', color: THEME.red, border: `1px solid ${THEME.red}`, borderRadius: '4px', padding: '1px 0px' }}>三娘煞</div>)}
          <div style={{ position: 'absolute', top: '22px', left: '4px', fontSize: '12px', fontWeight: 'bold', color: data.isNewYear ? THEME.red : (data.isJieQi ? THEME.purple : THEME.black), whiteSpace: 'nowrap' }}>{data.lunarDisplay}</div>
          <div style={{ position: 'absolute', bottom: '16px', right: '4px', fontSize: '12px', fontWeight: 'bold', color: data.colorXiu, textAlign: 'right' }}>{data.xiu}</div>
          <div style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '14px', fontWeight: 'bold', color: data.colorJian }}>{data.jian}</div>
          {data.dongGongRating && (
            <div style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '11px', fontWeight: 'bold', color: data.dongGongRating.includes('吉') ? THEME.blue : (data.dongGongRating.includes('凶') ? THEME.red : THEME.gray) }}>{data.dongGongRating}</div>
          )}
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
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    const lockOrientation = async () => { try { if (window.screen?.orientation?.lock) await window.screen.orientation.lock("portrait"); } catch (e) {} };
    lockOrientation();
    const savedRule = localStorage.getItem('zi_hour_rule');
    if (savedRule) setZiHourRule(savedRule);
    const savedDateStr = localStorage.getItem('selected_date');
    if (savedDateStr) { const d = new Date(savedDateStr); if (!isNaN(d.getTime())) { setSelectedDate(d); setCurrentDate(d); } }
    const savedBk = localStorage.getItem('calendar_bookmarks');
    if (savedBk) { try { setBookmarks(JSON.parse(savedBk)); } catch(e) {} }
    const currentHour = new Date().getHours();
    setTimeIndex(getDefaultTimeIndex(currentHour, savedRule || 'ziZheng'));
  }, []);

  useEffect(() => { localStorage.setItem('zi_hour_rule', ziHourRule); }, [ziHourRule]);
  useEffect(() => { if (!isNaN(selectedDate.getTime())) localStorage.setItem('selected_date', getLocalDateString(selectedDate)); }, [selectedDate]);
  
  useEffect(() => {
    if (showJinQi || showTuiQi) {
        if (!qiMode) setQiMode('nian');
    } else {
        setQiMode(null);
    }
  }, [showJinQi, showTuiQi]);

  const toggleBookmark = (date) => {
    const s = getLocalDateString(date);
    let newBookmarks;
    if (bookmarks.includes(s)) newBookmarks = bookmarks.filter(b => b !== s);
    else newBookmarks = [s, ...bookmarks];
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

  const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      if (distance > 50) changeMonth(1);
      else if (distance < -50) changeMonth(-1);
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
                days.push({ name: term, day: d, time: timeStr });
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
        
        // --- 1. 計算選定時辰的時間對象 (lunarForTime) ---
        const mapping = GET_SHI_CHEN_MAPPING(ziHourRule);
        const safeTimeIndex = (timeIndex >= 0 && timeIndex < mapping.length) ? timeIndex : 0;
        const targetHour = mapping[safeTimeIndex].hour;
        let lunarForTime;
        
        // 根據早子/夜子/一般時辰規則建立對象
        if (ziHourRule === 'ziZheng' && targetHour === 23) {
             lunarForTime = window.Solar.fromYmdHms(selectedDate.getFullYear(), selectedDate.getMonth()+1, selectedDate.getDate(), 23, 30, 0).getLunar();
        } else {
             // 這裡使用時辰的起始點 (例如巳時用 09:00:00) 進行判斷
             // 如果節氣在 09:40，用戶選巳時(09:00起)，則依然算上個月；若選午時(11:00起)，則算下個月。這是合理的區間判斷。
             lunarForTime = window.Solar.fromYmdHms(selectedDate.getFullYear(), selectedDate.getMonth()+1, selectedDate.getDate(), targetHour, 0, 0).getLunar();
        }

        // --- 2. [核心修改] 使用含時辰的對象獲取八字 ---
        // timeBazi 包含了精確時間點的八字資訊 (自動處理節氣換月、立春換年)
        const timeBazi = lunarForTime.getEightChar();

        const isSanNiang = SAN_NIANG_DAYS.includes(lunar.getDay()); 
        const monthNum = Math.abs(lunar.getMonth());
        const dayZhi = lunar.getDayZhi();
        const dayGanZhi = lunar.getDayInGanZhi();
        const dgRule = DONG_GONG_RULES[monthNum]?.[dayZhi];
        let dgRating = '平'; let dgText = '暫無資料';
        if (dgRule) {
            dgText = dgRule.t;
            if (dgRule.s && dgRule.s[dayGanZhi]) { dgRating = dgRule.s[dayGanZhi]; dgText += ` (本日${dayGanZhi}為${dgRating})`; } 
            else { dgRating = dgRule.r; }
        }
        const dgSummary = dgText.split('：')[1]?.split('。')[0] || dgRating;

        const rawJian = lunar.getZhiXing();
        const fixJian = JIAN_FIX_MAP[rawJian] || rawJian;
        const rawXiu = lunar.getXiu(); const fixXiu = XIU_FIX_MAP[rawXiu] || rawXiu;

        let lunarMonthName = lunar.getMonthInChinese();
        if (lunarMonthName === '冬') lunarMonthName = '十一';
        if (lunarMonthName === '腊' || lunarMonthName === '臘') lunarMonthName = '十二';

        // --- 新增：動態獲取真實宜忌 ---
        const yiList = lunar.getDayYi().map(toTraditionalYiJi); // 加入轉換函數
        const jiList = lunar.getDayJi().map(toTraditionalYiJi); // 加入轉換函數

        return {
            dateStr: `${selectedDate.getMonth()+1}月${selectedDate.getDate()}日`,
            weekDay: WEEKDAYS[selectedDate.getDay()],
            // 這裡也建議改用 timeBazi，以防立春當天換年
            ganZhiYear: timeBazi.getYearGan() + timeBazi.getYearZhi(), 
            lunarStr: `${lunarMonthName}月${lunar.getDayInChinese()}`,
            
            // [核心修改] 八字全部改用 timeBazi
            bazi: {
                yearGan: timeBazi.getYearGan(), yearZhi: timeBazi.getYearZhi(),
                monthGan: timeBazi.getMonthGan(), monthZhi: timeBazi.getMonthZhi(),
                dayGan: timeBazi.getDayGan(), dayZhi: timeBazi.getDayZhi(),
                timeGan: timeBazi.getTimeGan(), timeZhi: timeBazi.getTimeZhi()
            },
            jian: fixJian, xiu: fixXiu, xiuFull: XIU_FULL_NAME_MAP[fixXiu] || (fixXiu + '宿'),
            dongGongRating: dgRating, dongGongText: dgText, dongGongSummary: dgSummary,
            isSanNiang: isSanNiang,
            yi: yiList.join(', '),
            ji: jiList.join(', ')
        };
    } catch(e) { return null; }
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
    return bookmarks
      .map(dateStr => {
        try {
            if(window.Solar) {
                const d = new Date(dateStr);
                const solar = window.Solar.fromYmd(d.getFullYear(), d.getMonth()+1, d.getDate());
                const lunar = solar.getLunar();
                const rawJian = lunar.getZhiXing();
                let monthNum = Math.abs(lunar.getMonth());
                const dayZhi = lunar.getDayZhi();
                const dgRule = DONG_GONG_RULES[monthNum]?.[dayZhi];
                let dg = dgRule ? (dgRule.s?.[lunar.getDayInGanZhi()] || dgRule.r) : '';

                return {
                    id: dateStr, name: dateStr, 
                    lunarDateStr: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
                    jianChu: JIAN_FIX_MAP[rawJian] || rawJian, dongGong: dg, solarDate: dateStr
                };
            }
        } catch(e) {}
        return { id: dateStr, name: dateStr, solarDate: dateStr };
      })
      .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
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
                        qiMode={qiMode} 
                    />
                  ))}
                </div>
                {/* 在月曆網格下方加入廣告 */}
                <div style={{ padding: '20px 0' }}>
                    <AdBanner />
                </div>
            </div>

            <BottomSummaryPanel 
                info={selectedInfo} 
                // 當面板展開並被點擊時，開啟詳情 Modal
                onDetailClick={() => setIsDetailModalOpen(true)}
                // 當點擊時柱時，開啟時辰選擇器
                onTimeClick={() => setShowTimeModal(true)}
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
                            const d = new Date(b.id);
                            if(!isNaN(d.getTime())) {
                                setCurrentDate(d); setSelectedDate(d); setView('calendar');
                            }
                        }}
                        onDelete={(id) => { if(window.confirm('確定刪除此書籤？')) toggleBookmark(new Date(id)); }}
                    />
                    <div style={{ marginTop: '20px' }}>
                        <AdBanner />
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
         isBookmarked={selectedDate ? bookmarks.includes(getLocalDateString(selectedDate)) : false}
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