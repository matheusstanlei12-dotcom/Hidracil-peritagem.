import { useNavigate } from 'react-router-dom';
import { initializeMock } from '../utils/mockSupabase';
import { seedDatabase } from '../utils/seedDatabase';
import { useState } from 'react';

export default function SimulationSetup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const runSimulation = async (planType) => {
        setLoading(true);
        setStatus('Inicializando Modo Offline...');

        try {
            // 1. Enable Mock
            initializeMock();
            await new Promise(r => setTimeout(r, 500));

            // 2. Clear existing (optional?)
            // localStorage.removeItem('mock_peritagens_v2'); 

            // 3. Seed Data
            setStatus('Gerando 120 peritagens simuladas...');
            await seedDatabase();

            setStatus('Concluído!');
            await new Promise(r => setTimeout(r, 1000));

            // Set flag to persist mock on reload
            localStorage.setItem('hidracil_offline_mode', 'true');

            // Set plan type (basic or plus)
            if (planType) {
                localStorage.setItem('hidracil_simulation_plan', planType);
            } else {
                localStorage.removeItem('hidracil_simulation_plan'); // Default
            }

            alert('Simulação configurada com sucesso! Você será redirecionado.');
            navigate('/timeline'); // This might need to change if timeline is hidden for basic plan, but sidebar handles visibility
            window.location.reload(); // Force reload to apply mock globally via main.jsx

        } catch (error) {
            console.error(error);
            setStatus('Erro: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            padding: '2rem'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '3rem',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '500px'
            }}>
                <h1 style={{ color: '#2563EB', marginBottom: '1rem' }}>Configuração de Ambiente</h1>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                    Escolha qual nível de experiência você deseja simular agora:
                </p>

                {status && (
                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                    }}>
                        {status}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    <button
                        onClick={() => runSimulation('basic')}
                        disabled={loading}
                        style={{
                            backgroundColor: '#6B7280', // Neutral Gray for Basic
                            color: 'white',
                            border: 'none',
                            padding: '1.2rem 2rem',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            borderRadius: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            width: '100%',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Acessar Ambiente Básico
                    </button>

                    <button
                        onClick={() => runSimulation('plus')}
                        disabled={loading}
                        style={{
                            backgroundColor: '#2563EB', // Brand Blue for Plus
                            color: 'white',
                            border: 'none',
                            padding: '1.2rem 2rem',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            borderRadius: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            width: '100%',
                            boxShadow: '0 8px 15px rgba(37, 99, 235, 0.25)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? 'Preparando Ambiente...' : 'Acessar Ambiente Plus'}
                    </button>


                </div>
            </div>
        </div>
    );
}
