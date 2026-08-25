'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SOCIETY_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  Menu,
  LogOut,
  Building2,
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  AlertTriangle,
  Users,
  BarChart3,
  FileText,
  Settings,
  Bell,
  ChevronDown,
  Shield,
  User,
  Crown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/maintenance', label: 'Maintenance', icon: <CreditCard className="w-4 h-4" /> },
  { href: '/complaints', label: 'My Complaints', icon: <MessageSquare className="w-4 h-4" /> },
  { href: '/emergency', label: 'Emergency', icon: <AlertTriangle className="w-4 h-4" /> },
];

const adminItems: NavItem[] = [
  { href: '/admin/users', label: 'Manage Users', icon: <Users className="w-4 h-4" />, roles: ['manager', 'admin'] },
  { href: '/admin/payments', label: 'All Payments', icon: <BarChart3 className="w-4 h-4" />, roles: ['manager', 'admin'] },
  { href: '/admin/complaints', label: 'All Complaints', icon: <FileText className="w-4 h-4" />, roles: ['manager', 'admin'] },
  { href: '/admin/assets', label: 'Assets', icon: <Settings className="w-4 h-4" />, roles: ['manager', 'admin'] },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user && ['manager', 'admin'].includes(user.role);

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get role display info
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'manager':
        return { label: 'Manager', icon: Crown, color: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'admin':
        return { label: 'Admin', icon: Shield, color: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'watchman':
        return { label: 'Watchman', icon: Shield, color: 'bg-green-100 text-green-700 border-green-200' };
      default:
        return { label: 'Resident', icon: User, color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
      <div className="px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-slate-900 tracking-tight">{SOCIETY_NAME}</span>
              <span className="text-xs text-slate-500 block">Society Management</span>
            </div>
          </Link>

          {/* Desktop: User Info & Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Role Badge */}
            {user && (
              <Badge variant="outline" className={cn("px-3 py-1 font-medium", getRoleInfo(user.role).color)}>
                {(() => {
                  const RoleIcon = getRoleInfo(user.role).icon;
                  return <RoleIcon className="w-3.5 h-3.5 mr-1.5" />;
                })()}
                {getRoleInfo(user.role).label}
              </Badge>
            )}

            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
              <Bell className="w-5 h-5" />
            </Button>

            {/* User Dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-3 py-2 h-auto">
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-400 to-blue-600">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-medium">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden xl:block">
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">Flat {user.flat_no}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-slate-500 font-normal">Flat {user.flat_no} • {getRoleInfo(user.role).label}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile: Hamburger Menu */}
          <div className="lg:hidden flex items-center gap-2">
            {user && (
              <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-400 to-blue-600">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            )}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-700">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0">
                <SheetHeader className="p-6 pb-4 border-b border-slate-100">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-lg font-bold">{SOCIETY_NAME}</span>
                  </SheetTitle>
                </SheetHeader>
                
                {/* User Info in Mobile Menu */}
                {user && (
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-sm text-slate-500">Flat {user.flat_no}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("mt-3 w-full justify-center py-1.5 font-medium", getRoleInfo(user.role).color)}>
                      {(() => {
                        const RoleIcon = getRoleInfo(user.role).icon;
                        return <RoleIcon className="w-3.5 h-3.5 mr-1.5" />;
                      })()}
                      {getRoleInfo(user.role).label}
                    </Badge>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 mb-2">Menu</p>
                  <nav className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                          pathname === item.href
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Admin Section */}
                {isAdmin && (
                  <div className="px-4 py-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 mb-2">Admin</p>
                    <nav className="space-y-1">
                      {adminItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleNavClick}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                            pathname === item.href
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </nav>
                  </div>
                )}

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 bg-white">
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    onClick={() => {
                      handleNavClick();
                      handleLogout();
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
