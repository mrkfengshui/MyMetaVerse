// packages/ui/DataComponents.jsx
import React from 'react';
import { THEME } from './theme';
import { Trash2, Edit3, CloudUpload, Download } from 'lucide-react';

// --- 純網頁版備份管理器 ---
export const WebBackupManager = ({ data, onRestore, isPro, prefix = "BACKUP" }) => {

    // 1. 下載 JSON (匯出)
    const handleDownload = () => {
        if (!isPro) return alert('此為專業版功能'); // 如果你想保留限制
        try {
            const jsonString = JSON.stringify(data, null, 2);
            // 建立一個 Blob 物件
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            // 建立一個隱藏的 <a> 標籤來觸發下載
            const link = document.createElement('a');
            link.href = url;
            link.download = `${prefix}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('匯出失敗');
        }
    };

    // 2. 上傳 JSON (還原)
    const handleUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    if (window.confirm(`讀取到 ${importedData.length} 筆資料。\n確定要覆蓋現有紀錄嗎？`)) {
                        onRestore(importedData);
                        alert('還原成功！');
                    }
                } else {
                    alert('檔案格式錯誤');
                }
            } catch (err) {
                alert('解析失敗，請確認檔案是否正確');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div style={{ backgroundColor: THEME.white, borderRadius: '12px', border: `1px solid ${THEME.border}`, overflow: 'hidden', marginTop: '16px' }}>
            <div style={{ padding: '12px 16px', backgroundColor: THEME.bgGray, borderBottom: `1px solid ${THEME.border}`, fontSize: '14px', fontWeight: 'bold', color: THEME.black }}>
                資料備份 (網頁版)
            </div>
            <div style={{ padding: '8px' }}>
                <input type="file" id="restore-input" accept=".json" style={{ display: 'none' }} onChange={handleUpload}/>
                
                {/* 下載按鈕 */}
                <button onClick={handleDownload} disabled={!isPro} style={dataBtnStyle(isPro)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CloudUpload size={18} color={THEME.purple} />
                        <span style={{ fontSize: '14px' }}>下載備份檔 (Download JSON)</span>
                    </div>
                    {!isPro && <ProTag />}
                </button>

                {/* 上傳按鈕 */}
                <button onClick={() => isPro ? document.getElementById('restore-input').click() : alert('請先解鎖功能')} disabled={!isPro} style={{ ...dataBtnStyle(isPro), borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Download size={18} color={THEME.green} />
                        <span style={{ fontSize: '14px' }}>讀取備份檔 (Restore JSON)</span>
                    </div>
                    {!isPro && <ProTag />}
                </button>
            </div>
        </div>
    );
};

// ... (保留原本的 BookmarkList, ProTag, dataBtnStyle) ...
export const BookmarkList = ({ ...props }) => { /* ...沿用原本代碼... */ };
const ProTag = () => <span style={{ fontSize: '10px', color: THEME.orange, border: `1px solid ${THEME.orange}`, padding: '1px 4px', borderRadius: '4px' }}>Pro</span>;
const dataBtnStyle = (enabled) => ({ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', background: 'none', borderBottom: `1px solid ${THEME.bg}`, cursor: enabled ? 'pointer' : 'not-allowed', opacity: enabled ? 1 : 0.5 });