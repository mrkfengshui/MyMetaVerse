// packages/ui/DataComponents.jsx
import React from 'react';
import { THEME } from './theme';
import { Trash2, Edit3, User, Calendar, MapPin, Sparkles, Compass, BookOpen } from 'lucide-react';

// --- 輔助：根據資料內容決定顯示組件 ---
const RecordContent = ({ data }) => {
    // 樣式
    const rowStyle = { fontSize: '13px', color: THEME.gray, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' };
    const highlightStyle = { color: THEME.blue, fontWeight: '500' };
    const safeLunarStr = (data.lunarDateStr || data.lunarDate || '')
        .replace('闰', '閏')
        .replace('冬', '十一')
        .replace('腊', '十二');

    // 1. 八字
    if (data.dayMaster) {
        return (
            <div style={rowStyle}>
                <Sparkles size={14} />
                <span>西曆: {data.solarDate}</span>
                <span>農曆: {safeLunarStr}</span>
                <span style={{ margin: '0 4px', color: '#ddd' }}>|</span>
                <span style={highlightStyle}>日元{data.dayMaster}生於{data.monthBranch}月</span>
            </div>
        );
    }

    // 2. 紫微斗數
    if (data.mingGongStars) {
        return (
            <div style={rowStyle}>
                <Sparkles size={14} />
                <span>西曆: {data.solarDate}</span>
                <span>農曆: {safeLunarStr}</span>
                <span style={{ margin: '0 4px', color: '#ddd' }}>|</span>
                <span style={highlightStyle}>命宮{data.mingGongStars}</span>
            </div>
        );
    }

    // 3. 風水
    if (data.facing || data.mountain) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                <div style={{ ...rowStyle, marginTop: 0 }}>
                    <Compass size={14} />
                    <span style={highlightStyle}>{data.period}運 {data.mountain}山{data.facing}向 ({data.gwaType || '下卦'})</span>
                </div>
                {data.address && (
                    <div style={{ ...rowStyle, fontSize: '12px' }}>
                        <MapPin size={13} />
                        <span>{data.address}</span>
                    </div>
                )}
            </div>
        );
    }

    // 4. 萬年曆
    if (data.jianChu || data.dongGong) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                <div style={{ ...rowStyle, marginTop: 0 }}>
                    <Calendar size={14} />
                    <span style={highlightStyle}>農曆: {data.lunarDateStr}</span>
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

    // 5. 預設 (如果都不符合上述條件，顯示原本的簡單格式)
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

    // 取得當前日期的格式化字串 (YYYY-MM-DD)
    const getSavedDate = (timestamp) => {
        if (!timestamp) return new Date().toISOString().split('T')[0];
        // 如果是 timestamp 數字
        const d = new Date(timestamp);
        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : timestamp;
    };

    return (
        <div style={{ paddingBottom: '20px' }}>
            <div style={{ padding: '8px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: THEME.gray, fontSize: '12px' }}>
                <span>已儲存 {bookmarks.length} 筆紀錄</span>
            </div>
            
            {bookmarks.map((b, i) => {
                // 決定標題圖示 (風水用指南針，其他用人頭)
                const TitleIcon = (b.facing || b.mountain) ? Compass : User; 
                // 決定標題文字 (如果有 name 顯示 name，沒有則顯示標題或是類型)
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
                        {/* 第一行：標題 */}
                        <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: THEME.black }}>
                            <TitleIcon size={16} color={THEME.blue} />
                            {titleText} 
                            <span style={{ fontSize: '12px', color: THEME.gray, fontWeight: 'normal' }}>{subText}</span>
                        </div>
                        
                        {/* 第二行：動態內容 (核心修改部分) */}
                        <RecordContent data={b} />

                        {/* 第三行：保存日期 */}
                        <div style={{ fontSize: '11px', color: '#bbb', marginTop: '6px', textAlign: 'right', width: '100%' }}>
                            保存於: {getSavedDate(b.id)} {/* 假設 id 是 timestamp，或是你有另外存 savedAt */}
                        </div>
                    </div>
                    
                    {/* 右側按鈕區 */}
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

// 按鈕樣式
export const dataBtnStyle = { 
    width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
    border: 'none', background: 'none', borderBottom: `1px solid ${THEME.bg}`, 
    cursor: 'pointer'
};