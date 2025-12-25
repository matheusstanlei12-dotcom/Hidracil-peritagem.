import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            await login(email, password);
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            const message = err.message || 'Falha ao entrar.';
            if (message.includes('Invalid login credentials')) {
                setError('E-mail ou senha incorretos.');
            } else {
                setError(message);
            }
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
            <div style={{
                backgroundColor: 'var(--color-surface)',
                padding: '2rem',
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-md)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <img src="/logo.png" alt="HIDRACIL Logo" style={{ maxWidth: '200px', marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>ACESSO AO SISTEMA</h2>

                {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', backgroundColor: '#fee', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>E-mail</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Senha</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <button
                        type="submit"
                        style={{
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            padding: '0.75rem',
                            border: 'none',
                            borderRadius: 'var(--border-radius-sm)',
                            fontWeight: '600',
                            marginTop: '0.5rem'
                        }}
                    >
                        Entrar
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Esqueci a senha</Link>
                    <Link to="/register" style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: '500' }}>Não tem uma conta? Criar conta</Link>
                </div>
            </div>
        </div>
    );
}
