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
import { useState } from 'react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false); // Mobile toggle

    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Gestor', 'Perito', 'Comprador', 'Orçamentista'] },
        { label: 'Todas as Peritagens', path: '/peritagens', icon: FileText, roles: ['Gestor', 'Perito', 'Comprador', 'Orçamentista'] },
        { label: 'Linha do Tempo / Status', path: '/timeline', icon: Clock, roles: ['Gestor', 'Comprador', 'Orçamentista'] },
        { label: 'Nova Peritagem', path: '/nova-peritagem', icon: PlusCircle, roles: ['Gestor', 'Perito'] },
        { label: 'Pendente análise do comprador', path: '/pendentes-compras', icon: ShoppingCart, color: 'orange', roles: ['Gestor', 'Comprador'] },
        { label: 'Pendentes Orçamento', path: '/pendentes-orcamento', icon: DollarSign, color: 'green', roles: ['Gestor', 'Orçamentista'] },
        { label: 'Relatórios PDF', path: '/relatorios', icon: FileText, roles: ['Gestor', 'Comprador', 'Orçamentista'] },
        { label: 'Gestão de Usuários', path: '/usuarios', icon: Users, roles: ['Gestor'] },
    ];

    const filteredItems = menuItems.filter(item => !item.roles || item.roles.includes(user?.role));

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
                            {item.label}
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
