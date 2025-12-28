import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Perito'
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        try {
            setError('');
            const emailNormalized = formData.email.toLowerCase().trim();

            console.log('Tentando registrar:', emailNormalized);

            await register(
                emailNormalized,
                formData.password,
                formData.role,
                formData.name
            );
            navigate('/');
        } catch (err) {
            console.error('Registration error detailed:', err);
            const message = err.message || (typeof err === 'string' ? err : 'Falha ao criar conta.');

            // Check for various ways Supabase might say the user exists
            if (message.includes('User already registered') || message.includes('already exists') || err.status === 422) {
                setError('Este e-mail já está em uso no sistema. Tente outro ou procure o gestor.');
            } else {
                setError(`Erro: ${message}`);
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
                maxWidth: '450px',
                textAlign: 'center'
            }}>
                <img src="/logo.png" alt="HIDRACIL Logo" style={{ maxWidth: '200px', marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>SOLICITAR ACESSO</h2>

                {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', backgroundColor: '#fee', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nome Completo</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} style={{ width: '100%' }} />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>E-mail</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} style={{ width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Senha</label>
                            <input type="password" name="password" required value={formData.password} onChange={handleChange} style={{ width: '100%' }} />
                        </div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Repetir Senha</label>
                            <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} style={{ width: '100%' }} />
                        </div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nível de Acesso</label>
                        <select name="role" value={formData.role} onChange={handleChange} style={{ width: '100%' }}>
                            <option value="Perito">Perito</option>
                            <option value="Comprador">Comprador</option>
                            <option value="Orçamentista">Orçamentista</option>
                            <option value="Gestor">Gestor</option>
                        </select>
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
                        Criar Conta
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem' }}>
                    <Link to="/login" style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>Já tem uma conta? Fazer login</Link>
                </div>
            </div>
        </div>
    );
}
