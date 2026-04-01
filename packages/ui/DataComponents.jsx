// packages/ui/DataComponents.jsx
import React, { useMemo } from 'react'; // 引入 useMemo
import { THEME } from './theme';
import { Trash2, Edit3, User, Calendar, MapPin, Sparkles, Compass, BookOpen, Image as ImageIcon } from 'lucide-react';

// 數字轉中文大寫對照表
const PERIOD_MAP = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九' };

// --- 輔助：根據資料內容決定顯示組件 (保持不變) ---
const RecordContent = ({ data }) => {
    // 樣式
    const rowStyle = { fontSize: '13px', color: THEME.gray, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' };
    const highlightStyle = { color: THEME.blue, fontWeight: '500' };
    
    // 安全處理農曆字串 (避免 undefined 錯誤)
    const rawLunar = data.lunarDateStr || data.lunarDate || data.lunarString || '';
    const safeLunarStr = rawLunar
        .replace(/闰/g, '閏')
        .replace(/冬/g, '十一')
        .replace(/腊/g, '十二');

    // 1. 八字
    if (data.dayMaster) {
        return (
            <div style={rowStyle}>
                <span>西曆 {data.solarDate}</span>
                {safeLunarStr && <span>農曆 {safeLunarStr}</span>}
                <span style={{ margin: '0 2px', color: '#ddd' }}></span>
                <span style={highlightStyle}>{data.dayMaster}日元生於{data.monthBranch}月</span>
            </div>
        );
    }

    // 2. 紫微斗數
    if (data.mingGongStars) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                {/* 第一行：日期資訊 */}
                <div style={{ ...rowStyle, marginTop: 0 }}>
                    <Calendar size={14} />
                    <span>西曆 {data.solarDate}</span>
                    {safeLunarStr && (
                        <>
                            <span>農曆 {safeLunarStr}</span>
                        </>
                    )}
                </div>
                    <div style={{ ...rowStyle, marginTop: '2px', paddingLeft: '2px' }}>
                    <span style={{ ...highlightStyle, color: THEME.purple }}>{data.mingGongStars}</span>
                </div>
            </div>
        );
    }

    // 3. 風水
    if (data.facing || data.mountain) {
        const periodStr = PERIOD_MAP[data.period] || data.period;
        const hasFloorPlan = data.rawConfig && data.rawConfig.floorPlan;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                <div style={{ ...rowStyle, marginTop: 0 }}>
                    <Compass size={14} />
                    <span style={highlightStyle}>{periodStr}運{data.mountain}山{data.facing}向下卦</span>
                    {hasFloorPlan && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#e6f7ff', padding: '2px 6px', borderRadius: '4px', color: THEME.blue, fontSize: '11px', marginLeft: '6px' }}>
                            <ImageIcon size={12} /> 附圖
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // 4. 萬年曆
    if (data.jianChu || data.dongGong) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                <div style={{ ...rowStyle, marginTop: 0 }}>
                    <Calendar size={14} />
                    <span style={highlightStyle}>農曆 {safeLunarStr}</span>
                </div>
                <div style={{ ...rowStyle, fontSize: '12px' }}>
                    <BookOpen size={13} />
                    <span>建除: {data.jianChu}</span>
                    <span style={{ margin: '0 4px', color: '#ddd' }}>|</span>
                    <span>董公: {data.dongGong}</span>
                </div>
            </div>
        );
    }

    // 5. 預設
    return (
        <div style={rowStyle}>
            <Calendar size={14} />
            {data.solarDate || '未知日期'}
        </div>
    );
};

// --- 書籤列表 ---
export const BookmarkList = ({ bookmarks, onSelect, onEdit, onDelete }) => {
    if (bookmarks.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: THEME.gray, fontSize: '14px' }}>暫無紀錄</div>;
    }

    // 排序邏輯：英文(A-Z) -> 中文(筆劃少-多) -> 符號/其他(最後)
    const sortedBookmarks = useMemo(() => {
        return [...bookmarks].sort((a, b) => {
            // 取得標題，若無則預設空字串
            const nameA = (a.name || a.title || '').toString();
            const nameB = (b.name || b.title || '').toString();

            // 輔助函數：判斷字元類型 (0:英文/數字, 1:中文, 2:其他/符號)
            const getType = (str) => {
                const firstChar = str.charAt(0);
                if (!firstChar) return 2; // 空字串視為符號類
                if (/[a-zA-Z0-9]/.test(firstChar)) return 0; // 英文或數字優先
                if (/[\u4e00-\u9fa5]/.test(firstChar)) return 1; // 中文次之
                return 2; // 符號放最後
            };

            const typeA = getType(nameA);
            const typeB = getType(nameB);

            // 若類型不同，直接按優先順序排 (0 -> 1 -> 2)
            if (typeA !== typeB) {
                return typeA - typeB;
            }

            // 若類型相同，再細分排序規則
            if (typeA === 0) {
                // 英文/數字：A-Z 忽略大小寫
                return nameA.localeCompare(nameB, 'en', { sensitivity: 'base' });
            } else if (typeA === 1) {
                // 中文：依筆劃 (zh-Hant-TW 通常能支援筆劃排序，若不支援會回退到 unicode)
                return nameA.localeCompare(nameB, 'zh-Hant-TW');
            } else {
                // 符號：直接 unicode 比較
                return nameA.localeCompare(nameB);
            }
        });
    }, [bookmarks]);

    const getSavedDate = (timestamp) => {
        if (!timestamp) return new Date().toISOString().split('T')[0];
        const d = new Date(timestamp);
        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : timestamp;
    };

    return (
        <div style={{ paddingBottom: '20px' }}>
            <div style={{ padding: '8px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: THEME.gray, fontSize: '12px' }}>
                <span>已儲存 {sortedBookmarks.length} 筆紀錄</span>
            </div>
            
            {sortedBookmarks.map((b, i) => {
                const TitleIcon = (b.facing || b.mountain) ? MapPin : User; 
                const titleText = b.name || b.title || '未命名紀錄';
                const subText = b.genderText ? `(${b.genderText})` : '';

                return (
                    <div key={b.id || i} onClick={() => onSelect(b)} style={{ 
                        marginBottom: '10px', padding: '16px', backgroundColor: THEME.white, 
                        borderRadius: '12px', border: `1px solid ${THEME.border}`, 
                        cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                    <div style={{ flex: 1, paddingRight: '10px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: THEME.black }}>
                            <TitleIcon size={16} color={THEME.blue} />
                            {titleText} 
                            <span style={{ fontSize: '12px', color: THEME.gray, fontWeight: 'normal' }}>{subText}</span>
                        </div>
                        
                        <RecordContent data={b} />

                        <div style={{ fontSize: '11px', color: '#bbb', marginTop: '6px', textAlign: 'right', width: '100%' }}>
                            保存於: {getSavedDate(b.id)}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        {onEdit && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(b); }} style={{ padding: '8px', backgroundColor: THEME.bgBlue, border: 'none', borderRadius: '50%', color: THEME.blue, cursor: 'pointer' }}>
                                <Edit3 size={16} />
                            </button>
                        )}
                        {onDelete && (
                            <button onClick={(e) => { e.stopPropagation(); onDelete(b.id); }} style={{ padding: '8px', backgroundColor: THEME.bgRed, border: 'none', borderRadius: '50%', color: THEME.red, cursor: 'pointer' }}>
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                    </div>
                );
            })}
        </div>
    );
};