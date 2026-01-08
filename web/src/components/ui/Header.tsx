'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppIcon from '../AppIcon';
import Button from './Button';
import { useNavigation } from '@/context/NavigationContext';
import { useWallet } from '@/lib/use-wallet';

const NAV_ITEMS = {
  agent: [
    { label: 'Dashboard', path: '/agent-dashboard', icon: 'LayoutDashboard' },
    { label: 'Loans', path: '/loan-details', icon: 'FileText' },
    { label: 'Payments', path: '/payment-processing', icon: 'CreditCard' },
    { label: 'Create Loan', path: '/create-loan', icon: 'Plus' },
  ],
  borrower: [
    { label: 'Dashboard', path: '/borrower-dashboard', icon: 'LayoutDashboard' },
    { label: 'Loans', path: '/loan-details', icon: 'FileText' },
    { label: 'Payments', path: '/payment-processing', icon: 'CreditCard' },
    { label: 'Credit', path: '/credit-profile', icon: 'TrendingUp' },
  ],
};

const QUICK_ACTIONS = {
  agent: [
    { label: 'Create New Loan', path: '/create-loan', icon: 'Plus' },
    { label: 'View Portfolio', path: '/agent-dashboard', icon: 'Briefcase' },
  ],
  borrower: [
    { label: 'Make Payment', path: '/payment-processing', icon: 'CreditCard' },
    { label: 'View Credit', path: '/credit-profile', icon: 'TrendingUp' },
  ],
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole, toggleRole, mobileMenuOpen, setMobileMenuOpen, transactionInProgress, transactionStatus } = useNavigation();
  const { address, isConnected, connect, disconnect } = useWallet();

  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const quickActionRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navItems = NAV_ITEMS[userRole];
  const quickActions = QUICK_ACTIONS[userRole];
  const truncateAddress = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickActionRef.current && !quickActionRef.current.contains(e.target as Node)) setQuickActionOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isConnected) setConnecting(false);
  }, [isConnected]);

  useEffect(() => {
    if (!connecting) return;
    const resetIfNotConnected = () => {
      setTimeout(() => { if (!isConnected) setConnecting(false); }, 1500);
    };
    window.addEventListener('focus', resetIfNotConnected);
    document.addEventListener('visibilitychange', resetIfNotConnected);
    return () => {
      window.removeEventListener('focus', resetIfNotConnected);
      document.removeEventListener('visibilitychange', resetIfNotConnected);
    };
  }, [connecting, isConnected]);

  const handleConnectWallet = useCallback(async () => {
    if (connecting || isConnected) return;
    setConnecting(true);
    const timeout = setTimeout(() => setConnecting(false), 15000);
    
    try {
      await connect('crossmark');
    } catch (e) {
      const msg = String(e).toLowerCase();
      if (!['rejected', 'cancelled', 'canceled', 'user'].some(k => msg.includes(k))) {
        console.error('Connection failed:', e);
      }
    } finally {
      clearTimeout(timeout);
      setConnecting(false);
    }
  }, [connecting, isConnected, connect]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[1000] bg-card border-b border-border shadow-glow-md">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-6">
            <Link href={userRole === 'agent' ? '/agent-dashboard' : '/borrower-dashboard'} className="header-logo">
              <AppIcon name="Landmark" size={24} className="header-logo-icon" />
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
                    pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <AppIcon name={item.icon} size={18} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {transactionInProgress && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-lg border border-border">
                <div className="animate-spin"><AppIcon name="Loader2" size={16} className="text-primary" /></div>
                <span className="text-sm text-muted-foreground">
                  {transactionStatus?.type === 'payment' ? 'Processing Payment...' : 'Processing...'}
                </span>
              </div>
            )}

            <div className="relative" ref={quickActionRef}>
              <Button variant="ghost" size="icon" onClick={() => setQuickActionOpen(!quickActionOpen)} className="hidden md:flex">
                <AppIcon name="Zap" size={20} />
              </Button>
              {quickActionOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-glow-lg animate-slide-down overflow-hidden">
                  {quickActions.map((action) => (
                    <button
                      key={action.path}
                      onClick={() => { router.push(action.path); setQuickActionOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-popover-foreground hover:bg-muted/50 transition-smooth"
                    >
                      <AppIcon name={action.icon} size={18} />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={userMenuRef}>
              <Button variant="outline" onClick={() => setUserMenuOpen(!userMenuOpen)} className="hidden md:flex items-center gap-2">
                <AppIcon name="User" size={18} />
                <span className="text-sm font-medium capitalize">{userRole}</span>
                <AppIcon name="ChevronDown" size={16} />
              </Button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-glow-lg animate-slide-down overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Role</span>
                      <span className="text-sm font-medium capitalize text-popover-foreground">{userRole}</span>
                    </div>
                    {isConnected && address && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs font-mono text-muted-foreground">{truncateAddress(address)}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { toggleRole(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-popover-foreground hover:bg-muted/50 transition-smooth"
                  >
                    <AppIcon name="RefreshCw" size={18} />
                    <span>Switch to {userRole === 'agent' ? 'Borrower' : 'Agent'}</span>
                  </button>

                  {isConnected ? (
                    <button
                      onClick={() => { disconnect(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/10 transition-smooth"
                    >
                      <AppIcon name="LogOut" size={18} />
                      <span>Disconnect Wallet</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { handleConnectWallet(); setUserMenuOpen(false); }}
                      disabled={connecting}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-success hover:bg-success/10 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <AppIcon name={connecting ? 'Loader2' : 'Wallet'} size={18} className={connecting ? 'animate-spin' : ''} />
                      <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden">
              <AppIcon name={mobileMenuOpen ? 'X' : 'Menu'} size={24} />
            </Button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[999] lg:hidden">
          <div className="absolute inset-0 bg-background" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-16 left-0 right-0 bottom-0 bg-card border-t border-border shadow-glow-xl animate-slide-down overflow-y-auto">
            <nav className="p-6 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth ${
                    pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <AppIcon name={item.icon} size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-6 border-t border-border space-y-3">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <span className="text-sm text-muted-foreground">Current Role</span>
                <span className="text-sm font-medium capitalize">{userRole}</span>
              </div>

              {isConnected && address && (
                <div className="flex items-center gap-2 p-4 bg-success/10 rounded-lg border border-success/20">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-mono text-success">{truncateAddress(address)}</span>
                </div>
              )}

              <Button variant="outline" fullWidth iconName="RefreshCw" iconPosition="left" onClick={toggleRole}>
                Switch to {userRole === 'agent' ? 'Borrower' : 'Agent'}
              </Button>

              {isConnected ? (
                <Button variant="destructive" fullWidth iconName="LogOut" iconPosition="left" onClick={disconnect}>
                  Disconnect Wallet
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  fullWidth 
                  iconName={connecting ? 'Loader2' : 'Wallet'} 
                  iconPosition="left" 
                  onClick={handleConnectWallet}
                  disabled={connecting}
                  loading={connecting}
                >
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
