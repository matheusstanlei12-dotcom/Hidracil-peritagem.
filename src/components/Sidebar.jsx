import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Clock,
    PlusCircle,
    ShoppingCart,
    DollarSign,
    Users,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Capacitor } from '@capacitor/core';

const APP_VERSION = "2.1.2 - Hidracil Build";


export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [comprasCount, setComprasCount] = useState(0);
    const [orcamentoCount, setOrcamentoCount] = useState(0);

    const isActive = (path) => location.pathname === path;

    // Fetch counts for notifications
    useEffect(() => {
        const fetchCounts = async () => {
            // 1. Pending Users (Only for Gestor)
            if (user?.role === 'Gestor') {
                try {
                    const { count } = await supabase
                        .from('profiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'Pendente');
                    setPendingCount(count || 0);
                } catch (err) {
                    console.error("Error fetching pending users:", err);
                }
            }

            // 2. Pending Purchaes (Gestor & Comprador)
            if (user?.role === 'Gestor' || user?.role === 'Comprador') {
                try {
                    const { count } = await supabase
                        .from('peritagens')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'Aguardando Compras');
                    setComprasCount(count || 0);
                } catch (err) {
                    console.error("Error fetching pending purchases:", err);
                }
            }

            // 3. Pending Budgets (Gestor & Orçamentista)
            if (user?.role === 'Gestor' || user?.role === 'Orçamentista') {
                try {
                    const { count } = await supabase
                        .from('peritagens')
                        .select('*', { count: 'exact', head: true })
                        .in('status', ['Aguardando Orçamento', 'Custos Inseridos']); // Include 'Custos Inseridos' if that implies ready for budget
                    setOrcamentoCount(count || 0);
                } catch (err) {
                    console.error("Error fetching pending budgets:", err);
                }
            }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 30000); // 30s polling
        return () => clearInterval(interval);
    }, [user]);

    const isAndroid = Capacitor.getPlatform() === 'android';

    const menuItems = [
        { label: isAndroid ? 'Minhas Peritagens' : 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Gestor', 'Perito', 'Comprador', 'Orçamentista', 'PCP'] },
        { label: 'Todas as Peritagens', path: '/peritagens', icon: FileText, roles: ['Gestor', 'Perito', 'Comprador', 'Orçamentista', 'PCP'], hideOnAndroid: true },
        { label: 'Linha do Tempo / Status', path: '/timeline', icon: Clock, roles: ['Gestor', 'Comprador', 'Orçamentista', 'PCP'], hideOnAndroid: true },
        { label: 'Nova Peritagem', path: '/nova-peritagem', icon: PlusCircle, roles: ['Gestor', 'Perito'] },
        { label: 'Aguardando Compras', path: '/pendentes-compras', icon: ShoppingCart, color: 'orange', roles: ['Gestor', 'Comprador', 'PCP'], hideOnAndroid: true },
        { label: 'Aguardando Orçamento', path: '/pendentes-orcamento', icon: DollarSign, color: 'green', roles: ['Gestor', 'Orçamentista', 'PCP'], hideOnAndroid: true },
        { label: 'Relatórios PDF', path: '/relatorios', icon: FileText, roles: ['Gestor', 'Comprador', 'Orçamentista', 'PCP'], hideOnAndroid: true },
        { label: 'Gestão de Usuários', path: '/usuarios', icon: Users, roles: ['Gestor'], hideOnAndroid: true },
    ];

    const filteredItems = menuItems.filter(item => {
        const roleAllowed = !item.roles || item.roles.includes(user?.role);
        if (isAndroid) {
            // Em Android, só permite o que não está escondido e remove o que não é Dashboard/Nova
            // Na verdade, o dashboard serve como "Minhas Peritagens" na home se configurarmos, 
            // ou redirecionamos para /peritagens. 
            // O usuário pediu: "gerar nova peritagem e ver minhas peritagens apenas"
            return roleAllowed && !item.hideOnAndroid;
        }
        return roleAllowed;
    });


    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            <button
                className="mobile-menu-btn"
                onClick={toggleSidebar}
                style={{
                    position: 'fixed',
                    top: '1rem',
                    left: '1rem',
                    zIndex: 1000,
                    display: 'none', // Hidden on desktop via CSS media query usually, but inline checks might be harder. using standard media query below
                    padding: '0.5rem',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px'
                }}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div style={{
                width: '260px',
                backgroundColor: 'var(--color-surface)',
                borderRight: '1px solid var(--color-border)',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 900,
                transition: 'transform 0.3s ease',
                transform: isOpen ? 'translateX(0)' : 'translateX(0)', // On Mobile this needs to change
            }} className="sidebar-container">

                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
                    <img src="/logo.png" alt="HIDRACIL Logo" style={{ maxWidth: '180px', height: 'auto' }} />
                </div>

                <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scroll">
                    {filteredItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.75rem 1.5rem',
                                color: isActive(item.path) ? 'var(--color-primary)' : 'var(--color-text-primary)',
                                backgroundColor: isActive(item.path) ? 'rgba(26, 127, 60, 0.1)' : 'transparent',
                                borderLeft: isActive(item.path) ? '4px solid var(--color-primary)' : '4px solid transparent',
                                textDecoration: 'none',
                                fontWeight: isActive(item.path) ? '600' : '400',
                                marginBottom: '0.25rem'
                            }}
                        >
                            <item.icon size={20} style={{ marginRight: '0.75rem', color: item.color || (isActive(item.path) ? 'var(--color-primary)' : 'var(--color-text-secondary)') }} />
                            <span style={{ flex: 1 }}>{item.label}</span>

                            {item.label === 'Gestão de Usuários' && pendingCount > 0 && (
                                <span style={{
                                    backgroundColor: '#d35400',
                                    color: 'white',
                                    borderRadius: '10px',
                                    padding: '0.1rem 0.5rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    marginLeft: '0.5rem'
                                }}>
                                    {pendingCount}
                                </span>
                            )}

                            {item.label === 'Aguardando Compras' && comprasCount > 0 && (
                                <span style={{
                                    backgroundColor: '#d35400',
                                    color: 'white',
                                    borderRadius: '10px',
                                    padding: '0.1rem 0.5rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    marginLeft: '0.5rem'
                                }}>
                                    {comprasCount}
                                </span>
                            )}

                            {item.label === 'Aguardando Orçamento' && orcamentoCount > 0 && (
                                <span style={{
                                    backgroundColor: '#d35400',
                                    color: 'white',
                                    borderRadius: '10px',
                                    padding: '0.1rem 0.5rem',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    marginLeft: '0.5rem'
                                }}>
                                    {orcamentoCount}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'white' }}>

                    {/* User Profile Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {/* Avatar */}
                        <div style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#2563EB', // Blue
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            flexShrink: 0
                        }}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>

                        {/* Info */}
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#111827' }}>
                                {user?.name || (user?.email ? user.email.split('@')[0] : 'Usuário')}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                                {user?.role || 'Aguardando...'}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={logout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #FECACA', // Light red border
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            color: '#DC2626', // Red text
                            fontWeight: '600',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            boxShadow: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                        <LogOut size={14} style={{ marginRight: '0.4rem' }} />
                        Sair
                    </button>

                    {/* Version & Diagnosis */}
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: '#999', fontWeight: 'bold' }}>
                            {APP_VERSION}
                        </div>
                        {user?.role === 'Gestor' && (
                            <div style={{ fontSize: '0.55rem', color: '#ccc', marginTop: '0.2rem', wordBreak: 'break-all' }}>
                                DB: {import.meta.env.VITE_SUPABASE_URL}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 850 }}
                />
            )}

            <style>{`
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 768px) {
          .sidebar-container {
            transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
        }
      `}</style>
        </>
    );
}
