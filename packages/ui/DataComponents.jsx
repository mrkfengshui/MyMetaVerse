// packages/ui/DataComponents.jsx
import React from 'react';
import { THEME } from './theme';
import { Trash2, Edit3, CloudUpload, Download, User, Calendar } from 'lucide-react';

// --- 書籤列表 ---
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