import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.status === 'Pendente' || user.status === 'Inativo') {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-bg)',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '2rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    maxWidth: '500px'
                }}>
                    <h1 style={{ color: '#f1c40f', marginBottom: '1rem' }}>Acesso em Análise</h1>
                    <p style={{ marginBottom: '1.5rem', color: '#666', fontSize: '1.1rem' }}>
                        Aguardando aprovação para acesso ao sistema.
                    </p>
                    <button
                        onClick={() => window.location.href = '/login'} // Force reload/logout flow via simple redirect usually handled by auth clear
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Voltar para Login
                    </button>
                    {/* Optional: Add explicit logout button if needed */}
                </div>
            </div>
        );
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Or redirect to unauthorized page
        return <Navigate to="/" replace />;
    }

    return children;
}
