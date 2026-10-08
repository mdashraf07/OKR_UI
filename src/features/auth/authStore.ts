import { create } from 'zustand';
import { User, Role } from '../../types';
import { SEED_USERS } from '../../api/seedData';

interface AuthState {
  currentUser: User | null;
  user: User | null;
  selectedCycleId: number;
  idleTimerLastActive: number;
  sessionTimeoutWarning: boolean;
  login: (userIdOrEmail: number | string) => boolean;
  logout: () => void;
  setSelectedCycleId: (cycleId: number) => void;
  touchActivity: () => void;
  dismissTimeoutWarning: () => void;
}

const SESSION_KEY = 'okr_auth_session_user_id';
const CYCLE_KEY = 'okr_auth_selected_cycle_id';

// Clean up any persistent localStorage session from prior runs
try {
  localStorage.removeItem(SESSION_KEY);
} catch (e) {
  // ignore
}

function getInitialUser(): User | null {
  try {
    localStorage.removeItem(SESSION_KEY);
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      const id = parseInt(saved, 10);
      const user = SEED_USERS.find((u) => u.id === id);
      if (user && user.active) return user;
    }
  } catch (e) {
    console.warn('Session parse error:', e);
  }
  // Require explicit sign-in if no active tab session exists
  return null;
}

function getInitialCycleId(): number {
  try {
    const saved = localStorage.getItem(CYCLE_KEY);
    if (saved) {
      return parseInt(saved, 10);
    }
  } catch (e) {
    // fallback
  }
  return 2; // Active Q4 2026 cycle
}

const initialUser = getInitialUser();

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: initialUser,
  user: initialUser,
  selectedCycleId: getInitialCycleId(),
  idleTimerLastActive: Date.now(),
  sessionTimeoutWarning: false,

  login: (userIdOrEmail: number | string) => {
    let found: User | undefined;
    if (typeof userIdOrEmail === 'number') {
      found = SEED_USERS.find((u) => u.id === userIdOrEmail);
    } else {
      const term = userIdOrEmail.toLowerCase().trim();
      found = SEED_USERS.find(
        (u) =>
          u.email.toLowerCase() === term ||
          u.employeeCode?.toLowerCase() === term ||
          u.name.toLowerCase() === term ||
          (u.id === 1 && (term === 'ashraf@company.com' || term === 'mohammedashraf@brandcrock.com' || term === 'ashraf')) ||
          (u.id === 2 && (term === 'ravi.menon@company.com' || term === 'ravi.menon@brandcrock.com' || term === 'ravi')) ||
          (u.id === 3 && (term === 'priya.nair@company.com' || term === 'priya.nair@brandcrock.com' || term === 'priya'))
      );
    }

    if (!found || !found.active) {
      return false;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, found.id.toString());
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      // ignore
    }
    set({
      currentUser: found,
      user: found,
      idleTimerLastActive: Date.now(),
      sessionTimeoutWarning: false,
    });
    return true;
  },

  logout: () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      // ignore
    }
    set({ currentUser: null, user: null, sessionTimeoutWarning: false });
  },

  setSelectedCycleId: (cycleId: number) => {
    localStorage.setItem(CYCLE_KEY, cycleId.toString());
    set({ selectedCycleId: cycleId });
  },

  touchActivity: () => {
    set({ idleTimerLastActive: Date.now() });
  },

  dismissTimeoutWarning: () => {
    set({ sessionTimeoutWarning: false, idleTimerLastActive: Date.now() });
  },
}));

export function isAllowed(user: User | null, requiredRole: Role): boolean {
  if (!user) return false;
  if (user.role === 'HR_ADMIN') return true; // HR_ADMIN has access to all roles
  if (user.role === 'MANAGER' && requiredRole !== 'HR_ADMIN') return true;
  return user.role === requiredRole;
}
