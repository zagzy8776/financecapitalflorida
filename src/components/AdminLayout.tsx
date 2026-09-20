import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { cx } from '../lib/designTokens';
import { Activity, ClipboardList, Coins, LayoutDashboard, LogOut, Shield, ScrollText, Users, Wallet, ArrowLeftRight, Menu, X } from 'lucide-react';

type AdminTab = 'overview'|'users'|'accounts'|'deposits'|'withdrawals'|'crypto'|'transactions'|'audit'|'activity';
const NAV_ITEMS:{id:AdminTab;label:string;icon:any}[]=[
 {id:'overview',label:'Overview',icon:LayoutDashboard},{id:'users',label:'Customers',icon:Users},
 {id:'accounts',label:'Accounts',icon:Wallet},{id:'deposits',label:'Deposits',icon:ClipboardList},
 {id:'withdrawals',label:'Withdrawals',icon:ClipboardList},{id:'crypto',label:'Digital assets',icon:Coins},
 {id:'transactions',label:'Transactions',icon:ArrowLeftRight},{id:'audit',label:'Audit trail',icon:ScrollText},
 {id:'activity',label:'Activity',icon:Activity},
];
interface AdminLayoutProps{activeTab:AdminTab;onTabChange:(tab:AdminTab)=>void;children:React.ReactNode;}
export default function AdminLayout({activeTab,onTabChange,children}:AdminLayoutProps){
 const {admin,logout}=useAdminAuth(); const navigate=useNavigate(); const [open,setOpen]=useState(false);
 const signOut=()=>{logout();navigate('/admin/login');};
 const nav=<nav className="flex-1 p-4 space-y-1 overflow-y-auto">{NAV_ITEMS.map(({id,label,icon:Icon})=><button key={id} type="button" onClick={()=>{onTabChange(id);setOpen(false);}} className={cx('w-full flex items-center gap-3 px-3 py-3 text-sm font-medium transition-all',activeTab===id?'bg-white/10 text-white':'text-slate-300 hover:bg-white/6 hover:text-white')}><Icon className="w-4.5 h-4.5 shrink-0"/><span>{label}</span>{activeTab===id&&<span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d8b16d]"/>}</button>)}</nav>;
 return <div className="finance-admin min-h-screen flex">
  {open&&<div className="fixed inset-0 bg-slate-950/50 z-40 lg:hidden" onClick={()=>setOpen(false)}/>}
  <aside className={cx('fixed inset-y-0 left-0 z-50 w-72 flex flex-col transform transition-transform duration-200 lg:static lg:translate-x-0',open?'translate-x-0':'-translate-x-full')}>
   <div className="px-5 py-5 border-b border-white/10">
    <div className="flex items-center gap-3">
     <span className="admin-brand w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg">F</span>
     <div><p className="font-semibold text-white">Finance Capital</p><p className="text-xs text-slate-400">Florida · Administration</p></div>
    </div>
   </div>
   <div className="px-5 pt-5 text-[10px] uppercase tracking-[.18em] text-slate-500">Workspace</div>{nav}
   <div className="p-4 border-t border-white/10">
    <div className="rounded-2xl bg-white/6 p-3 mb-3"><p className="text-[10px] uppercase tracking-widest text-slate-500">Signed in as</p><p className="mt-1 text-sm font-medium text-white truncate">{admin?.full_name||'Owner'}</p><p className="text-xs text-slate-400 truncate">{admin?.email}</p></div>
    <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/6 rounded-xl"><LogOut className="w-4 h-4"/>Sign out</button>
   </div>
  </aside>
  <div className="flex-1 min-w-0 flex flex-col">
   <header className="admin-topbar h-20 flex items-center justify-between px-5 lg:px-8 border-b shrink-0">
    <div className="flex items-center gap-3"><button className="lg:hidden p-2 rounded-xl hover:bg-slate-100" onClick={()=>setOpen(true)}><Menu className="w-5 h-5"/></button>
     <div><p className="text-xs uppercase tracking-[.16em] text-slate-400">Finance Capital Florida</p><h1 className="text-xl font-semibold text-[#10243f]">{NAV_ITEMS.find(n=>n.id===activeTab)?.label||'Administration'}</h1></div>
    </div>
    <div className="flex items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-[#10243f] px-3 py-1.5 text-xs font-semibold text-white"><Shield className="w-3.5 h-3.5 text-[#d8b16d]"/>Owner</span></div>
   </header>
   <main className="admin-content flex-1 overflow-y-auto p-5 lg:p-8">{children}</main>
  </div>
 </div>;
}
export type {AdminTab};
