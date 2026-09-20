import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { cx } from '../../lib/designTokens';

export interface Crumb { label: string; to?: string; }
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (!items.length) return null;
  return <nav aria-label="Breadcrumb" className={cx('mb-3', className)}><ol className="flex items-center gap-2 text-xs text-slate-500">{items.map((crumb,i)=><li key={`${crumb.label}-${i}`} className="flex items-center gap-2 min-w-0">{crumb.to&&i<items.length-1?<Link to={crumb.to} className="hover:text-[#10243f]">{crumb.label}</Link>:<span className="text-slate-600 truncate">{crumb.label}</span>}{i<items.length-1&&<ChevronRight className="w-3 h-3"/>}</li>)}</ol></nav>;
}
export interface PageHeaderProps { title:string; subtitle?:ReactNode; backTo?:string; backLabel?:string; breadcrumbs?:Crumb[]; actions?:ReactNode; sticky?:boolean; elevated?:boolean; className?:string; }
export function PageHeader({title,subtitle,backTo,backLabel='Back',breadcrumbs,actions,sticky=true,elevated=true,className}:PageHeaderProps){
 return <header className={cx('finance-header',sticky&&'sticky top-0 z-header',elevated&&'border-b border-slate-200/80 bg-[#f7f8fa]/90 backdrop-blur-xl',className)}><div className="w-full max-w-5xl mx-auto px-5 sm:px-7 lg:px-9 py-5">{breadcrumbs&&<Breadcrumbs items={breadcrumbs}/>}<div className="flex items-center gap-4">{backTo&&<Link to={backTo} aria-label={backLabel} title={backLabel} className="finance-back"><ArrowLeft className="w-5 h-5"/></Link>}<div className="min-w-0 flex-1"><h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#10243f] truncate">{title}</h1>{subtitle&&<div className="text-sm text-slate-500 mt-1">{subtitle}</div>}</div>{actions&&<div className="flex items-center gap-2 shrink-0">{actions}</div>}</div></div></header>;
}
export function SkipLink({targetId='main-content'}:{targetId?:string}){return <a href={`#${targetId}`} className="skip-link">Skip to main content</a>;}
