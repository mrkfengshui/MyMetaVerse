// packages/ui/ScorePanel.jsx
import React, { useState } from 'react';
import { THEME } from './theme'; 
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// --- 1. 內部核心邏輯 (格局判斷) ---
// (保留原本的 getSanFangSiZheng, getJiaGong, calculateScoreAndFormations 邏輯，不需變動)
const getSanFangSiZheng = (centerIdx) => [
    centerIdx, (centerIdx + 4) % 12, (centerIdx + 8) % 12, (centerIdx + 6) % 12
];

const getJiaGong = (centerIdx) => [
    (centerIdx + 11) % 12, (centerIdx + 1) % 12
];

const calculateScoreAndFormations = (grid, centerIdx) => {
    // ... (請保留原本完整的 calculateScoreAndFormations 程式碼) ...
    if (centerIdx === -1 || centerIdx === undefined) return { score: 60, formations: [] };

    let score = 60; 
    let formations = [];
    const indices = getSanFangSiZheng(centerIdx);
    const jiaIndices = getJiaGong(centerIdx);
    const currentPalace = grid[centerIdx];
    const currentZhi = currentPalace.zhi; 

    let allStars = []; 
    let starMap = {};  
    let huaMap = { '祿': 0, '權': 0, '科': 0, '忌': 0 }; 

    indices.forEach((idx, relPos) => {
        const palace = grid[idx];
        const isSelf = relPos === 0; 
        const isOpposite = relPos === 3; 

        [...palace.stars, ...palace.minorStars].forEach(s => {
            allStars.push(s.name);
            starMap[s.name] = relPos; 

            if (s.brightness === '廟') score += 2;
            else if (s.brightness === '旺') score += 1;
            else if (s.brightness === '陷') score -= 1.5;

            if (s.hua) {
                huaMap[s.hua] = (huaMap[s.hua] || 0) + 1;
                if (s.hua === '祿') score += isSelf ? 5 : 3;
                if (s.hua === '權') score += 3;
                if (s.hua === '科') score += 3;
                if (s.hua === '忌') { 
                    score -= 5; 
                    if(isSelf) formations.push("化忌坐命");
                    else if(isOpposite) formations.push("化忌衝命");
                }
            }

            if (['左輔','右弼','天魁','天鉞'].includes(s.name)) score += 2;
            if (['文昌','文曲'].includes(s.name)) score += 1.5;
            if (s.name === '祿存') score += 4;
            if (['擎羊','陀羅','火星','鈴星','地劫','天空'].includes(s.name)) score -= 3;
        });
    });

    const has = (star) => allStars.includes(star);
    const inSelf = (star) => starMap[star] === 0;
    const inOpposite = (star) => starMap[star] === 3;

    // --- 格局判斷庫 (簡略版，請保留您原本完整的判斷邏輯) ---
    if (inSelf('紫微') && inSelf('天府')) { score += 8; formations.push("紫府同宮"); }
    if (has('紫微') && has('天府') && !inSelf('紫微')) { score += 6; formations.push("紫府朝垣"); }
    if (inSelf('紫微')) {
        let count = 0;
        ['左輔','右弼','文昌','文曲','天魁','天鉞','天府','天相'].forEach(s => { if(has(s)) count++; });
        if (count >= 4) { score += 10; formations.push("君臣慶會"); }
    }
    if (has('天機') && has('太陰') && has('天同') && has('天梁')) { score += 6; formations.push("機月同梁"); }
    // ... (請務必保留所有格局判斷代碼) ...
    // 日月並明
    const sunPos = grid.find(p => p.stars.some(s => s.name === '太陽'))?.zhi;
    const moonPos = grid.find(p => p.stars.some(s => s.name === '太陰'))?.zhi;
    if (has('太陽') && has('太陰')) {
        if (['辰','巳','午'].includes(sunPos) && ['戌','酉','亥'].includes(moonPos)) { score += 8; formations.push("日月並明"); }
        else if (inSelf('太陽') && inSelf('太陰')) { formations.push("日月同宮"); }
        else if (has('太陽') && has('太陰')) { formations.push("日月會照"); }
    }
    if (inSelf('太陽') && currentZhi === '午') { score += 10; formations.push("金燦光輝"); }
    if (inSelf('太陽') && currentZhi === '卯') { score += 8; formations.push("日照雷門"); }
    if (inSelf('太陰') && currentZhi === '亥') { score += 10; formations.push("月朗天門"); }
    if (currentZhi === '未' && !grid[centerIdx].stars.length) { if (has('太陽') && has('太陰')) { score += 10; formations.push("明珠出海"); } }
    if (has('巨門') && has('太陽') && (inSelf('巨門') || inOpposite('巨門'))) {
        if (currentZhi === '寅') { score += 8; formations.push("巨日同宮(寅)"); }
        else if (currentZhi === '申') { score += 4; formations.push("巨日同宮(申)"); }
    }
    if (has('太陽') && has('天梁') && has('文昌') && (has('祿存') || huaMap['祿']>0)) { score += 12; formations.push("陽梁昌祿"); }
    if (inSelf('天梁') && currentZhi === '午') { score += 6; formations.push("壽星入廟"); }
    if (inSelf('破軍') && (currentZhi === '子' || currentZhi === '午')) { score += 6; formations.push("英星入廟"); }
    if (inSelf('巨門') && (currentZhi === '子' || currentZhi === '午')) {
        if (huaMap['祿']>0 || huaMap['權']>0 || huaMap['科']>0) { score += 8; formations.push("石中隱玉"); }
        else { formations.push("石中隱玉(未成)"); }
    }
    if (inSelf('七殺')) {
        if (['寅','申'].includes(currentZhi)) { score += 6; formations.push("七殺朝斗"); }
        if (['子','午'].includes(currentZhi)) { score += 6; formations.push("七殺仰斗"); }
    }
    if (has('天府') && has('天相')) { score += 6; formations.push("府相朝垣"); }
    if (inSelf('天同') && inSelf('太陰') && currentZhi === '子') { score += 8; formations.push("月生滄海"); }
    if (huaMap['祿'] > 0 && huaMap['權'] > 0 && huaMap['科'] > 0) { score += 15; formations.push("三奇加會"); }
    if (has('祿存') && huaMap['祿'] > 0) { score += 10; formations.push("雙祿交流"); }
    if (has('左輔') && has('右弼')) { 
        if (inSelf('左輔') && inSelf('右弼')) { score += 8; formations.push("左右同宮"); }
        else { score += 5; formations.push("左右守照"); }
    }
    if (has('文昌') && has('文曲')) {
        if (inSelf('文昌') && inSelf('文曲')) { score += 6; formations.push("昌曲同宮"); }
        else { score += 4; formations.push("昌曲守照"); }
    }
    if (has('天魁') && has('天鉞')) { 
        if (inSelf('天魁') && inOpposite('天鉞') || inSelf('天鉞') && inOpposite('天魁')) { score += 8; formations.push("坐貴向貴"); } 
        else { score += 5; formations.push("魁鉞朝垣"); }
    }
    if (has('貪狼')) {
        if (has('火星')) { score += 10; formations.push("火貪格(橫發)"); }
        if (has('鈴星')) { score += 10; formations.push("鈴貪格(橫發)"); }
    }
    if (has('鈴星') && has('文昌') && has('陀羅') && has('武曲')) { score -= 20; formations.push("鈴昌陀武(大凶)"); }
    if (has('巨門') && has('火星') && has('擎羊')) { score -= 10; formations.push("巨火羊"); }
    if (inSelf('地劫') || inSelf('天空')) { score -= 5; formations.push("命裡逢空"); }
    if (currentZhi === '午' && inSelf('擎羊')) { 
        if (inSelf('天同') || inSelf('太陰') || inSelf('貪狼')) { score += 5; formations.push("馬頭帶劍(威鎮)"); } 
        else { formations.push("馬頭帶劍"); }
    }
    if (has('廉貞') && has('天相') && has('擎羊') && currentZhi === '午') { score -= 10; formations.push("刑囚夾印"); }
    if (inSelf('貪狼') && currentZhi === '子') { formations.push("泛水桃花"); }
    if (inSelf('貪狼') && inSelf('擎羊')) { score -= 5; formations.push("風流彩杖"); }
    if (inSelf('廉貞') && inSelf('七殺') && (has('擎羊') || has('陀羅') || has('化忌'))) { score -= 10; formations.push("路上埋屍"); }

    let jiaStars = [];
    jiaIndices.forEach(idx => {
        grid[idx].stars.forEach(s => jiaStars.push(s.name));
        grid[idx].minorStars.forEach(s => jiaStars.push(s.name));
        grid[idx].stars.forEach(s => { if(s.hua === '忌') jiaStars.push('忌'); });
        grid[idx].minorStars.forEach(s => { if(s.hua === '忌') jiaStars.push('忌'); });
    });
    const isJia = (s1, s2) => jiaStars.includes(s1) && jiaStars.includes(s2);

    if (isJia('左輔', '右弼')) { score += 6; formations.push("輔弼夾命"); }
    if (isJia('文昌', '文曲')) { score += 6; formations.push("昌曲夾命"); }
    if (isJia('天魁', '天鉞')) { score += 6; formations.push("魁鉞夾命"); }
    if (isJia('紫微', '天府')) { score += 8; formations.push("紫府夾命"); }
    if (isJia('太陽', '太陰')) { score += 6; formations.push("日月夾命"); }
    if (isJia('地劫', '天空')) { score -= 10; formations.push("空劫夾命"); }
    if (isJia('火星', '鈴星')) { score -= 10; formations.push("火鈴夾命"); }
    if (isJia('擎羊', '陀羅')) { 
        if (huaMap['忌'] > 0 || jiaStars.includes('忌')) { score -= 20; formations.push("羊陀夾忌(敗局)"); } 
        else { score -= 5; formations.push("羊陀夾命"); }
    }

    if (score > 100) score = 100;
    if (score < 0) score = 0;

    score = Math.round(score);
    return { score, formations: [...new Set(formations)] };
};

// --- 2. 主組件 (UI) ---
// 👇 加入 xiaoXianIdx 參數
export const ScorePanel = ({ grid, mingIdx, daXianIdx, xiaoXianIdx, liuNianIdx, currentYear, onYearChange, yearOptions, onClose }) => {
    // View State: 0=本命, 1=大限, 2=小限, 3=歲限
    const [viewMode, setViewMode] = useState(0); 

    // 切換視圖 (0-3)
    const switchView = (delta) => {
        setViewMode(prev => {
            let next = prev + delta;
            if (next > 3) next = 0;
            if (next < 0) next = 3;
            return next;
        });
    };

    // 根據當前模式決定 計算中心 與 標題
    let centerIdx = -1;
    let title = "";
    let themeColor = THEME.black;

    if (viewMode === 0) {
        centerIdx = mingIdx;
        title = "本命盤";
        themeColor = THEME.black;
    } else if (viewMode === 1) {
        centerIdx = daXianIdx;
        title = "大限盤";
        themeColor = THEME.blue;
    } else if (viewMode === 2) {
        centerIdx = xiaoXianIdx;
        title = "歲限盤";
        themeColor = THEME.green;
    } else {
        centerIdx = liuNianIdx;
        title = "流年盤";
        themeColor = THEME.orange;
    }

    // 計算當前盤的三方 (命/官/財)
    const dataMing = calculateScoreAndFormations(grid, centerIdx);
    const dataGuan = calculateScoreAndFormations(grid, (centerIdx + 8) % 12);
    const dataCai  = calculateScoreAndFormations(grid, (centerIdx + 4) % 12);

    const getScoreColor = (s) => {
        if (s >= 85) return THEME.red;
        if (s >= 70) return THEME.blue;
        return THEME.gray;
    };

    // 小卡片組件 (並排顯示)
    const ScoreCard = ({ title, score }) => (
        <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '12px 4px', 
            backgroundColor: '#fff', 
            border: `1px solid ${THEME.border}`, 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: THEME.black, marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: getScoreColor(score), lineHeight: 1 }}>{score}</div>
        </div>
    );

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: THEME.white, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            {/* Header */}
            <div style={{ padding: '8px 10px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontWeight: 'bold', color: THEME.black }}>運勢評分</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} color={THEME.gray}/></button>
            </div>

            {/* Navigation Bar (切換盤種) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', backgroundColor: '#f9f9f9', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 }}>
                <button onClick={() => switchView(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><ChevronLeft size={20} color={THEME.blue} /></button>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: themeColor }}>{title}</div>
                </div>
                <button onClick={() => switchView(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><ChevronRight size={20} color={THEME.blue} /></button>
            </div>

            {/* Year Picker (只在歲限/流年盤顯示) */}
            {(viewMode === 2 || viewMode === 3) && (
                <div style={{ padding: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', backgroundColor: '#f0fdf4', borderBottom: `1px solid ${THEME.border}`, flexShrink: 0 }}>
                    <Calendar size={14} color="gray" />
                    <span style={{ fontSize: '13px', color: 'gray', fontWeight: 'bold' }}>
                        {viewMode === 2 ? '小限年份:' : '流年年份:'}
                    </span>
                    <select 
                        value={currentYear} 
                        onChange={(e) => onYearChange(parseInt(e.target.value))}
                        style={{ padding: '2px 4px', borderRadius: '4px', border: '1px solid green', fontSize: '13px', color: 'green', backgroundColor: 'white' }}
                    >
                        {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
                    </select>
                </div>
            )}

            {/* Body: Scores Display (橫向並排) */}
            <div style={{ flexShrink: 0, padding: '12px 12px', display: 'flex', gap: '8px', backgroundColor: THEME.bgGray }}>
                <ScoreCard title="總運勢" score={dataMing.score} />
                <ScoreCard title="事業運" score={dataGuan.score} />
                <ScoreCard title="財運" score={dataCai.score} />
            </div>

            {/* Footer: 格局列表 */}
            <div style={{ flex: 1, borderTop: `1px solid ${THEME.border}`, padding: '12px', overflowY: 'auto', backgroundColor: '#fffcf0' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: THEME.gray, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '3px', height: '12px', backgroundColor: THEME.vermillion, display: 'block' }}></span>
                    三方四正格局分析
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[...dataMing.formations, ...dataGuan.formations, ...dataCai.formations].length > 0 ? (
                        [
                            ...dataMing.formations.map(f => ({t: '命', f})),
                            ...dataGuan.formations.map(f => ({t: '官', f})),
                            ...dataCai.formations.map(f => ({t: '財', f}))
                        ].map((item, idx) => (
                            <span key={idx} style={{ 
                                fontSize: '12px', padding: '6px 10px', 
                                backgroundColor: THEME.white, 
                                border: `${item.f.includes('凶') || item.f.includes('忌') || item.f.includes('空') || item.f.includes('敗') || item.f.includes('死') ? '2px' : '2px'} solid ${item.f.includes('凶') || item.f.includes('忌') || item.f.includes('空') || item.f.includes('敗') || item.f.includes('死') ? '#ffccc7' : '#d9f7be'}`,
                                borderRadius: '6px', 
                                color: THEME.black,
                                display: 'flex', alignItems: 'center', gap: '6px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}>
                                <span style={{ fontSize: '10px', padding: '1px 4px', borderRadius: '3px', backgroundColor: THEME.bgGray, color: THEME.gray }}>{item.t}</span>
                                {item.f}
                            </span>
                        ))
                    ) : (
                        <div style={{ width: '100%', textAlign: 'center', padding: '40px', color: '#ccc', fontSize: '13px' }}>
                            此盤三方四正無顯著特殊格局
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
};