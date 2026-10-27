// Display preferences kept in the browser and applied to <html> before first paint, so the page
// never flashes the wrong theme or sidebar width. Shared by the layout (a server component) and
// the toggles, so it must not be a client module.

export const THEME_KEY = 'biblelogos-theme';
export const THEME_EVENT = 'biblelogos-theme';
export const SIDEBAR_KEY = 'biblelogos-sidebar';
export const SIDEBAR_EVENT = 'biblelogos-sidebar';

export const preferencesScript =
  `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;` +
  `if(localStorage.getItem('${SIDEBAR_KEY}')==='collapsed')document.documentElement.dataset.sidebar='collapsed'}catch(e){}`;
