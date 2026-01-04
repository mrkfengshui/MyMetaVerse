// src/components/theme.js

export const THEME = {
  red: '#ff4d4f', blue: '#1890ff', teal: '#13c2c2', orange: '#fa8c16',
  purple: '#722ed1', black: '#262626', gray: '#8c8c8c', lightGray: '#d1d5db',
  bg: '#f0f2f5', white: '#ffffff', bgGray: '#f9fafb', border: '#e8e8e8',
  bgRed: '#fff1f0', bgBlue: '#e6f7ff', bgOrange: '#fff7e6', vermillion: '#ce0000',
  green: '#52c41a',

  fonts: {
    heading: "'MyMetaFont', sans-serif",
  }
};

export const COMMON_STYLES = {
  fullScreen: { height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: THEME.white, width: '100vw', overflow: 'hidden' },
  contentArea: { flex: 1, overflowY: 'auto', backgroundColor: THEME.bg, width: '100%' },
};