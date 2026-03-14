import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  CheckSquare,
  History,
  Users,
  FileText,
  CalendarPlus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Palmtree,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { useRoles } from '@/hooks/useRoles';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const { isManager, isAdmin } = useRoles();

  const mainNav: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
    { to: '/requests', label: 'My Requests', icon: <Clock className="h-[18px] w-[18px]" /> },
    { to: '/calendar', label: 'Team Calendar', icon: <CalendarDays className="h-[18px] w-[18px]" /> },
    { to: '/balances', label: 'Balance History', icon: <History className="h-[18px] w-[18px]" /> },
  ];

  const managerNav: NavItem[] = isManager
    ? [{ to: '/approvals', label: 'Approvals', icon: <CheckSquare className="h-[18px] w-[18px]" /> }]
    : [];

  const adminNav: NavItem[] = isAdmin
    ? [
        { to: '/admin/users', label: 'Users', icon: <Users className="h-[18px] w-[18px]" /> },
        { to: '/admin/policies', label: 'Policies', icon: <FileText className="h-[18px] w-[18px]" /> },
        { to: '/admin/holidays', label: 'Holidays', icon: <CalendarPlus className="h-[18px] w-[18px]" /> },
        { to: '/admin/pto-types', label: 'PTO Types', icon: <Settings className="h-[18px] w-[18px]" /> },
      ]
    : [];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-slate-850 border-r border-slate-700/50',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Palmtree className="h-4 w-4 text-amber-400" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-sm tracking-wider text-amber-400 whitespace-nowrap">
            PTO TRACKER
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <NavSection items={mainNav} collapsed={collapsed} />

        {managerNav.length > 0 && (
          <>
            <SectionDivider label="Manager" collapsed={collapsed} />
            <NavSection items={managerNav} collapsed={collapsed} />
          </>
        )}

        {adminNav.length > 0 && (
          <>
            <SectionDivider label="Admin" collapsed={collapsed} />
            <NavSection items={adminNav} collapsed={collapsed} />
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-12 border-t border-slate-700/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}

function NavSection({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 h-10 text-sm font-medium transition-all duration-150',
              collapsed && 'justify-center px-0',
              isActive
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
            )
          }
          title={collapsed ? item.label : undefined}
        >
          {item.icon}
          {!collapsed && <span className="truncate">{item.label}</span>}
        </NavLink>
      ))}
    </div>
  );
}

function SectionDivider({ label, collapsed }: { label: string; collapsed: boolean }) {
  return (
    <div className="pt-4 pb-1 px-3">
      {!collapsed ? (
        <span className="text-[10px] font-display font-semibold tracking-[0.15em] uppercase text-slate-600">
          {label}
        </span>
      ) : (
        <div className="h-px bg-slate-700/50" />
      )}
    </div>
  );
}
