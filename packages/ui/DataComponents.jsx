// packages/ui/DataComponents.jsx
import React, { useMemo, useEffect } from 'react'; // 引入 useMemo
import { THEME } from './theme';
import { Trash2, Edit3, User, Calendar, MapPin, Sparkles, Compass, BookOpen, Image as ImageIcon, Unlock } from 'lucide-react';

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

    // 🌟 1. 動態合併紀錄：安全隔離八字與紫微的付費狀態
    const mergedBookmarks = useMemo(() => {
        const map = {};
        
        bookmarks.forEach(rec => {
            const name = rec.name || rec.title || '未命名紀錄';
            const gender = rec.genderText && rec.genderText.includes('女') ? '女' : '男';
            const solarDate = rec.solarDate || rec.solarDateStr || rec.rawDate || '未知日期';
            const key = `${name}_${gender}_${solarDate}`;
            
            if (!map[key]) {
                map[key] = { ...rec, genderText: gender, titleText: name, solarDate: solarDate };
            }
            
            // 安全寫入八字專屬資料
            if (rec.appType === 'bazi' || rec.dayMaster) {
                map[key].bazi = rec.bazi || map[key].bazi;
                map[key].dayMaster = rec.dayMaster || map[key].dayMaster;
                map[key].monthBranch = rec.monthBranch || map[key].monthBranch;
                map[key].baziDesc = `${map[key].dayMaster}日元生於${map[key].monthBranch}月`;
                // 優先讀取獨立付費 key，若無則相容舊版資料
                map[key].baziIsPaid = rec.baziIsPaid || (rec.appType === 'bazi' ? rec.isPaid : false) || map[key].baziIsPaid;
                map[key].baziPaidAt = Math.max(rec.baziPaidAt || 0, rec.appType === 'bazi' ? (rec.paidAt || 0) : 0, map[key].baziPaidAt || 0);
            }
            
            // 安全寫入紫微專屬資料
            if (rec.appType === 'zwds' || rec.mingGongStars) {
                map[key].mingGongStars = rec.mingGongStars || map[key].mingGongStars;
                map[key].zwdsDesc = map[key].mingGongStars;
                // 優先讀取獨立付費 key，若無則相容舊版資料
                map[key].zwdsIsPaid = rec.zwdsIsPaid || (rec.appType === 'zwds' ? rec.isPaid : false) || map[key].zwdsIsPaid;
                map[key].zwdsPaidAt = Math.max(rec.zwdsPaidAt || 0, rec.appType === 'zwds' ? (rec.paidAt || 0) : 0, map[key].zwdsPaidAt || 0);
            }
            
            if (rec.id > map[key].id) map[key].id = rec.id;
        });
        return Object.values(map);
    }, [bookmarks]);

    // 🌟 2. 排序邏輯：針對合併後的陣列進行排序 (英文(A-Z) -> 中文(筆劃少-多) -> 符號/其他(最後))
    const sortedBookmarks = useMemo(() => {
        return [...mergedBookmarks].sort((a, b) => {
            const nameA = a.titleText.toString();
            const nameB = b.titleText.toString();

            const getType = (str) => {
                const firstChar = str.charAt(0);
                if (!firstChar) return 2; 
                if (/[a-zA-Z0-9]/.test(firstChar)) return 0; 
                if (/[\u4e00-\u9fa5]/.test(firstChar)) return 1; 
                return 2; 
            };

            const typeA = getType(nameA);
            const typeB = getType(nameB);

            if (typeA !== typeB) return typeA - typeB;

            if (typeA === 0) return nameA.localeCompare(nameB, 'en', { sensitivity: 'base' });
            else if (typeA === 1) return nameA.localeCompare(nameB, 'zh-Hant-TW');
            else return nameA.localeCompare(nameB);
        });
    }, [mergedBookmarks]);

    const getSavedDate = (timestamp) => {
        if (!timestamp) return new Date().toISOString().split('T')[0];
        const d = new Date(timestamp);
        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : timestamp;
    };

    const getDaysLeft = (paidAt) => {
        if (!paidAt) return 0;
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysPassed = Math.floor((Date.now() - paidAt) / msPerDay);
        const daysLeft = 365 - daysPassed;
        return daysLeft > 0 ? daysLeft : 0;
    };
    
    const rowStyle = { fontSize: '13px', color: THEME.gray, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' };

    return (
        <div style={{ paddingBottom: '20px' }}>
            <div style={{ padding: '8px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: THEME.gray, fontSize: '12px' }}>
                <span>已儲存 {sortedBookmarks.length} 筆紀錄 (已合併重複對象)</span>
            </div>
            
            {sortedBookmarks.map((b, i) => {
                const TitleIcon = (b.facing || b.mountain) ? MapPin : User; 
                const subText = b.genderText ? `(${b.genderText})` : '';
                const daysLeft = getDaysLeft(b.paidAt);
                
                const rawLunar = b.lunarDateStr || b.lunarDate || b.lunarString || '';
                const safeLunarStr = rawLunar.replace(/闰/g, '閏').replace(/冬/g, '十一').replace(/腊/g, '十二');

                return (
                    <div key={b.id || i} onClick={() => onSelect(b)} style={{ 
                        marginBottom: '10px', padding: '16px', backgroundColor: THEME.white, 
                        borderRadius: '12px', border: `1px solid ${THEME.border}`, 
                        cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                    <div style={{ flex: 1, paddingRight: '10px' }}>
                        
                        {/* 標題與解鎖標籤 */}
                        <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: THEME.black }}>
                            <TitleIcon size={16} color={THEME.blue} />
                            {b.titleText} 
                            <span style={{ fontSize: '12px', color: THEME.gray, fontWeight: 'normal' }}>{subText}</span>
                            {/* 🌟 2. 獨立顯示【八字】解鎖標籤 (綠色系) */}
                            {b.baziIsPaid && (
                                <span style={{ 
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    backgroundColor: getDaysLeft(b.baziPaidAt) > 30 ? '#f0fdf4' : '#fef2f2',
                                    color: getDaysLeft(b.baziPaidAt) > 30 ? '#16a34a' : '#dc2626',
                                    padding: '2px 6px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold',
                                    border: `1px solid ${getDaysLeft(b.baziPaidAt) > 30 ? '#bbf7d0' : '#fecaca'}`
                                }}>
                                    <Unlock size={10} /> 八字解鎖 ({getDaysLeft(b.baziPaidAt)}天)
                                </span>
                            )}

                            {/* 🌟 3. 獨立顯示【紫微】解鎖標籤 (紫色系) */}
                            {b.zwdsIsPaid && (
                                <span style={{ 
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    backgroundColor: getDaysLeft(b.zwdsPaidAt) > 30 ? '#fdf4ff' : '#fef2f2',
                                    color: getDaysLeft(b.zwdsPaidAt) > 30 ? '#c026d3' : '#dc2626',
                                    padding: '2px 6px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold',
                                    border: `1px solid ${getDaysLeft(b.zwdsPaidAt) > 30 ? '#f5d0fe' : '#fecaca'}`
                                }}>
                                    <Unlock size={10} /> 紫微解鎖 ({getDaysLeft(b.zwdsPaidAt)}天)
                                </span>
                            )}
                        </div>
                        
                        {/* 🌟 4. 動態渲染雙系統摘要 */}
                        {b.facing || b.jianChu ? (
                            <RecordContent data={b} />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                <div style={{ ...rowStyle, marginTop: 0 }}><span>西曆 {b.solarDate}</span></div>
                                {safeLunarStr && <div style={{ ...rowStyle, marginTop: 0 }}><span>農曆 {safeLunarStr}</span></div>}
                                {b.baziDesc && <div style={{ ...rowStyle, marginTop: '2px', paddingLeft: '2px' }}><span style={{ color: THEME.blue, fontWeight: '500' }}>{b.baziDesc}</span></div>}
                                {b.zwdsDesc && <div style={{ ...rowStyle, marginTop: '2px', paddingLeft: '2px' }}><span style={{ color: THEME.purple, fontWeight: '500' }}>{b.zwdsDesc}</span></div>}
                            </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#bbb', marginTop: '6px', textAlign: 'right', width: '100%' }}>
                            保存於: {getSavedDate(b.id)}
                        </div>
                    </div>
                    
                    {/* 操作按鈕 */}
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

export const useBackupReminder = () => {
    useEffect(() => {
        const checkBackupStatus = () => {
            try {
                const savedBookmarks = JSON.parse(localStorage.getItem('mrk_fate_bookmarks') || '[]');
                if (savedBookmarks.length === 0) return;

                const lastBackupTime = parseInt(localStorage.getItem('mrk_last_backup_time') || '0');
                let timeSinceLastBackup;
                const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000; 
                const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; 

                if (lastBackupTime === 0) {
                    const oldestRecord = savedBookmarks.reduce((oldest, current) => {
                        const currentT = current.savedAt || current.id || Date.now();
                        const oldestT = oldest.savedAt || oldest.id || Date.now();
                        return currentT < oldestT ? current : oldest;
                    }, savedBookmarks[0]);
                    const oldestTimestamp = oldestRecord.savedAt || oldestRecord.id;
                    timeSinceLastBackup = Date.now() - oldestTimestamp;
                } else {
                    timeSinceLastBackup = Date.now() - lastBackupTime;
                }

                const lastReminderTime = parseInt(localStorage.getItem('mrk_backup_reminder_time') || '0');
                const timeSinceLastReminder = Date.now() - lastReminderTime;

                if (timeSinceLastBackup > NINETY_DAYS_MS && timeSinceLastReminder > SEVEN_DAYS_MS) {
                    const days = Math.floor(timeSinceLastBackup / (1000 * 60 * 60 * 24));
                    const isConfirmed = window.confirm(`⚠️ 溫馨提醒：\n\n系統偵測到您已經有 ${days} 天沒有備份資料了！(目前累積 ${savedBookmarks.length} 筆紀錄)\n\n為了防止手機/瀏覽器快取意外清除導致心血遺失，強烈建議您定期【匯出】備份。\n\n現在要前往設定進行備份嗎？`);
                    
                    localStorage.setItem('mrk_backup_reminder_time', Date.now().toString());
                    
                    if (isConfirmed) {
                        // 觸發切換到設定頁的事件 (稍後我們在各 App 接收)
                        window.dispatchEvent(new CustomEvent('jump-to-settings'));
                    }
                }
            } catch (e) {
                console.error("備份檢查失敗", e);
            }
        };
        const timer = setTimeout(checkBackupStatus, 3000);
        return () => clearTimeout(timer);
    }, []);
};