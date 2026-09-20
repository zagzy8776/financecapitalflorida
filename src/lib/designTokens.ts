export interface DesignTokens {
  colors: {
    brand: string; brandSoft: string; positive: string; negative: string; warning: string; info: string;
    surface: string; surfaceRaised: string; surfaceOverlay: string; contentPrimary: string; contentSecondary: string;
    contentMuted: string; lineSubtle: string; lineStrong: string;
  };
  space: Record<'1'|'2'|'3'|'4'|'6'|'8'|'12', string>;
  type: Record<'display'|'title'|'heading'|'body'|'label'|'caption'|'micro',{size:string;lineHeight:string;letterSpacing?:string;weight?:number}>;
  duration: Record<'fast'|'base'|'slow', number>;
  easing: Record<'standard'|'emphasized', string>;
  radius: Record<'control'|'card'|'panel', string>;
  zIndex: Record<'header'|'overlay'|'modal'|'toast', number>;
}

export const tokens: DesignTokens = {
  colors: {
    brand: '#b68a45', brandSoft: '#d3b06f', positive: '#16805a', negative: '#c44545', warning: '#a36d16', info: '#276c9e',
    surface: '#f7f8fa', surfaceRaised: '#ffffff', surfaceOverlay: '#eef1f5',
    contentPrimary: '#10243f', contentSecondary: '#526174', contentMuted: '#7b8796',
    lineSubtle: '#e3e8ee', lineStrong: '#cbd3dd',
  },
  space: {1:'4px',2:'8px',3:'12px',4:'16px',6:'24px',8:'32px',12:'48px'},
  type: {
    display:{size:'2.5rem',lineHeight:'1.1',letterSpacing:'-0.02em',weight:700},
    title:{size:'1.5rem',lineHeight:'1.25',letterSpacing:'-0.01em',weight:600},
    heading:{size:'1.125rem',lineHeight:'1.4',weight:600},
    body:{size:'0.9375rem',lineHeight:'1.6'}, label:{size:'0.8125rem',lineHeight:'1.4',weight:500},
    caption:{size:'0.75rem',lineHeight:'1.4'}, micro:{size:'0.6875rem',lineHeight:'1.4'},
  },
  duration:{fast:150,base:200,slow:300},
  easing:{standard:'cubic-bezier(0.4,0,0.2,1)',emphasized:'cubic-bezier(0.2,0,0,1)'},
  radius:{control:'0.75rem',card:'1rem',panel:'1.25rem'},
  zIndex:{header:40,overlay:50,modal:60,toast:70},
};

export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

export function cx(...parts: Array<string | false | null | undefined | string[]>): string {
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (Array.isArray(part)) { const nested = cx(...part); if (nested) out.push(nested); }
    else out.push(part);
  }
  return out.join(' ');
}
