// packages/ui/DataComponents.jsx
import React from 'react';
import { THEME } from './theme';
import { Trash2, Edit3, CloudUpload, Download, User, Calendar } from 'lucide-react';

// --- 1. 網頁版備份管理器 ---
export const WebBackupManager = ({ data, onRestore, prefix = "BACKUP" }) => {
    
    // 匯出功能
    const handleDownload = () => {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${prefix}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) { console.error(e); alert('匯出失敗'); }
    };

    // 匯入功能
    const handleUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    if (window.confirm(`讀取到 ${importedData.length} 筆資料。\n確定要還原嗎？(會覆蓋現有紀錄)`)) {
                        onRestore(importedData);
                        alert('還原成功！');
                    }
                } else { alert('檔案格式錯誤'); }
            } catch (err) { alert('解析失敗'); }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{ marginTop: '20px' }}>
            {/* 外部小標題 */}
            <h3 style={{ fontSize: '14px', color: THEME.gray, marginBottom: '8px', marginLeft: '4px' }}>
                資料備份與還原
            </h3>

            {/* 白底圓角卡片 (移除了原本內部的灰色標題列) */}
            <div style={{ backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden' }}>
                
                {/* 隱藏的檔案輸入框 */}
                <input type="file" id="restore-input" accept=".json" style={{ display: 'none' }} onChange={handleUpload}/>
                
                {/* 下載按鈕 */}
                <button onClick={handleDownload} style={dataBtnStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CloudUpload size={20} color={THEME.purple} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '15px', fontWeight: '500', color: THEME.black }}>匯出備份 (Download)</span>
                            <span style={{ fontSize: '11px', color: THEME.gray }}>儲存目前的命盤紀錄為 JSON 檔</span>
                        </div>
                    </div>
                </button>

                {/* 上傳按鈕 */}
                <button onClick={() => document.getElementById('restore-input').click()} style={{ ...dataBtnStyle, borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Download size={20} color={THEME.green} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '15px', fontWeight: '500', color: THEME.black }}>還原備份 (Restore)</span>
                            <span style={{ fontSize: '11px', color: THEME.gray }}>從 JSON 檔案讀取紀錄</span>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
};

// --- 2. 書籤列表 ---
export const BookmarkList = ({ bookmarks, onSelect, onEdit, onDelete }) => {
    if (bookmarks.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: THEME.gray, fontSize: '14px' }}>暫無紀錄</div>;
    }

    return (
        <div style={{ paddingBottom: '20px' }}>
            <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: THEME.gray, fontSize: '12px' }}>
                <span>已儲存 {bookmarks.length} 筆紀錄</span>
            </div>
            
            {bookmarks.map((b, i) => (
                <div key={b.id || i} onClick={() => onSelect(b)} style={{ 
                    margin: '0 16px 10px 16px', padding: '16px', backgroundColor: THEME.white, 
                    borderRadius: '12px', border: `1px solid ${THEME.border}`, 
                    cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                   <div>
                       <div style={{ fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <User size={16} color={THEME.blue} />
                           {b.name || '未命名'} 
                           <span style={{ fontSize: '12px', color: THEME.gray, fontWeight: 'normal' }}>({b.genderText || b.gender})</span>
                       </div>
                       <div style={{ fontSize: '13px', color: THEME.gray, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           <Calendar size={14} />
                           {b.solarDate || '未知日期'}
                       </div>
                   </div>
                   
                   <div style={{ display: 'flex', gap: '8px' }}>
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
            ))}
        </div>
    );
};

// 按鈕樣式
const dataBtnStyle = { 
    width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
    border: 'none', background: 'none', borderBottom: `1px solid ${THEME.bg}`, 
    cursor: 'pointer'
};