import type { UserRole } from '@/api/types';

export type NavigationTabId = 'browse' | 'applications' | 'listings' | 'tasks' | 'post' | 'messages' | 'profile' | 'dashboard' | 'reports' | 'audit' | 'categories';

export type RoleNavigationItem = {
  id: NavigationTabId;
  label: string;
  icon: string;
  route: string;
  requiresAuth?: boolean;
};

/** Single source of truth for the tabs each authenticated role may access. */
export const roleNavigationConfig: Record<UserRole, readonly RoleNavigationItem[]> = {
  user: [
    { id: 'browse', label: 'Browse', icon: 'explore', route: '/' },
    { id: 'applications', label: 'My Apps', icon: 'assignment', route: '/applications', requiresAuth: true },
    { id: 'listings', label: 'Listings', icon: 'inventory_2', route: '/opportunities/mine', requiresAuth: true },
    { id: 'tasks', label: 'My Tasks', icon: 'assignment', route: '/assignments', requiresAuth: true },
    { id: 'post', label: 'Post', icon: 'add', route: '/opportunities/create', requiresAuth: true },
    { id: 'messages', label: 'Chat', icon: 'chat', route: '/messages', requiresAuth: true },
    { id: 'profile', label: 'Profile', icon: 'person', route: '/profile', requiresAuth: true },
  ],
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: 'shield', route: '/admin/index', requiresAuth: true },
    { id: 'reports', label: 'Reports', icon: 'error', route: '/admin/moderation', requiresAuth: true },
    { id: 'audit', label: 'Audit', icon: 'history', route: '/admin/audit', requiresAuth: true },
    { id: 'categories', label: 'Categories', icon: 'category', route: '/admin/categories', requiresAuth: true },
  ],
};

export const roleDefaultRoute: Record<UserRole, string> = {
  user: '/',
  admin: '/admin/index',
};

export function getRoleTab(role: UserRole, id: NavigationTabId) {
  return roleNavigationConfig[role].find((tab) => tab.id === id);
}
