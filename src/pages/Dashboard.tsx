import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, formatMoney } from '../lib/api';
import { CURRENCIES, currencyMeta } from '../lib/currencies';
import { maskAccountNumber, maskBalance, titleCase, formatRelativeDay } from '../lib/format';
import { useBalanceVisibility } from '../hooks/useBalanceVisibility';
import {
  Alert, Button, EmptyState, IconButton, Input, Modal, SectionHeading,
  Select, SkeletonList, SkipLink, StatusBadge,
} from '../components/ui';
import { BrandLogo } from '../components/BrandLogo';
import { cx } from '../lib/designTokens';
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Clock, CreditCard, Eye, EyeOff,
  Home, Menu, Plus, Send, Wallet, TrendingUp, Coins, type LucideIcon,
} from 'lucide-react';
import { NotificationBell } from '../components/NotificationBell';

// TEMP: minimal restore stub — full file will be restored next
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="finance-dashboard min-h-screen flex flex-col bg-[#f4f6f8]">
      <header className="fixed top-0 inset-x-0 z-header">
        <div className="w-full max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard"><BrandLogo size={32} withWordmark /></Link>
          <Link to="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-[#c9a05a] to-[#b68a45] flex items-center justify-center text-[#0c1b33] text-sm font-bold">
            {(user?.full_name || '?').slice(0, 1)}
          </Link>
        </div>
      </header>
      <main id="main-content" className="flex-1 p-6 pt-24">
        <p className="text-content-muted text-sm">Dashboard is being restored. Please pull the latest redesign from the artifacts folder or re-deploy the previous commit.</p>
        <button type="button" className="mt-4 text-[#b68a45] font-semibold" onClick={() => navigate('/profile')}>Go to profile</button>
      </main>
    </div>
  );
}
