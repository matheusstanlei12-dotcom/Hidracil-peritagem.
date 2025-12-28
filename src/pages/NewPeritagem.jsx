import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { savePeritagem } from '../services/peritagemService';
import { useAuth } from '../contexts/AuthContext';
import { X, Camera, Plus, Trash2 } from 'lucide-react';

const COMPONENT_OPTIONS = [
    "Olhal superior",
    "Rótula",
    "Anel retentor",
    "Pino graxeiro",
    "Haste",
    "Êmbolo",
    "Anel guia",
    "Olhal inferior",
    "Camisa",
    "Cabeçote da guia",
    "Vedações",
    "Outros"
];

export default function NewPeritagem() {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user && user.role !== 'Perito' && user.role !== 'Gestor') {
            alert('Apenas Peritos podem criar novas peritagens.');
            navigate('/');
        }
    }, [user, navigate]);

    // General Info Text Fields
    const [formData, setFormData] = useState({
        orcamento: '',
        cliente: '',
        equipamento: '',
        cidade: '',
        cx: '',
        tag: '',
        nf: '',
        responsavel_tecnico: ''
    });

    // Dynamic Technical Analysis Items
    const [items, setItems] = useState([
        { id: Date.now(), component: '', anomalies: '', solution: '', photos: [] }
    ]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Item Handlers
    const addItem = () => {
        setItems([...items, { id: Date.now(), component: '', anomalies: '', solution: '', photos: [] }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const compressImage = (base64Str, maxWidth = 1200, maxHeight = 1200) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // 0.7 quality is a great balance
            };
        });
    };

    const handlePhotoUpload = async (id, files) => {
        if (files && files.length > 0) {
            const filesArray = Array.from(files);
            for (const file of filesArray) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const compressed = await compressImage(reader.result);
                    setItems(prevItems => prevItems.map(item => {
                        if (item.id === id) {
                            return { ...item, photos: [...(item.photos || []), compressed] };
                        }
                        return item;
                    }));
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const removePhoto = (itemId, photoIndex) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id === itemId) {
                const newPhotos = [...item.photos];
                newPhotos.splice(photoIndex, 1);
                return { ...item, photos: newPhotos };
            }
            return item;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const cleanData = {
                ...formData,
                items,
                status: 'Aguardando Compras', // Automatically forwarded to Comprador
                stage_index: 2, // 2 = Aguardando Compras
            };
            await savePeritagem(cleanData);
            navigate('/peritagens');
        } catch (error) {
            console.error('Erro ao salvar peritagem:', error);
            alert(`Erro ao salvar peritagem: ${error.message || 'Erro desconhecido'}`);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem' }}>

            {/* Header / Card Container */}
            <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--border-radius-md)', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src="/logo.png" alt="HIDRACIL" style={{ height: '30px' }} />
                        <h2 style={{ fontSize: '1.1rem', color: '#333' }}>Nova Peritagem</h2>
                    </div>
                    <button onClick={() => navigate('/peritagens')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>

                    {/* Section: IDENTIFICAÇÃO */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem', fontWeight: '600', textAlign: 'center' }}>IDENTIFICAÇÃO</h3>

                        <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>Orçamento*</label>
                                <input type="text" name="orcamento" required value={formData.orcamento} onChange={handleInputChange} className="form-input" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>Cliente*</label>
                                <input type="text" name="cliente" required value={formData.cliente} onChange={handleInputChange} className="form-input" />
                            </div>
                        </div>

                        <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>Equipamento*</label>
                                <input type="text" name="equipamento" required value={formData.equipamento} onChange={handleInputChange} className="form-input" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>Cidade</label>
                                <input type="text" name="cidade" value={formData.cidade} onChange={handleInputChange} className="form-input" />
                            </div>
                        </div>

                        <div className="grid-3-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>CX</label>
                                <input type="text" name="cx" value={formData.cx} onChange={handleInputChange} className="form-input" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>TAG</label>
                                <input type="text" name="tag" value={formData.tag} onChange={handleInputChange} className="form-input" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>NF</label>
                                <input type="text" name="nf" value={formData.nf} onChange={handleInputChange} className="form-input" />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>Responsável Técnico*</label>
                            <input type="text" name="responsavel_tecnico" required value={formData.responsavel_tecnico} onChange={handleInputChange} className="form-input" style={{ width: '100%' }} />
                        </div>
                    </div>

                    {/* Section: SOLUÇÃO */}
                    <div>
                        <h3 style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem', fontWeight: '600', textAlign: 'center' }}>ANÁLISE TÉCNICA</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {items.map((item, index) => (
                                <div key={item.id} className="item-container" style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1.5rem', position: 'relative' }}>

                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e74c3c', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                            title="Remover item"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}

                                    <div className="grid-3-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>Componente</label>
                                            <select
                                                value={item.component}
                                                onChange={(e) => updateItem(item.id, 'component', e.target.value)}
                                                className="form-input"
                                                required
                                                style={{ height: '5rem' }} // Taller for multiline feel if needed, aligned with textareas
                                            >
                                                <option value="">Selecione...</option>
                                                {COMPONENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>Anomalias</label>
                                            <textarea
                                                value={item.anomalies}
                                                onChange={(e) => updateItem(item.id, 'anomalies', e.target.value)}
                                                className="form-input"
                                                style={{ height: '5rem', resize: 'none' }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>Solução</label>
                                            <textarea
                                                value={item.solution}
                                                onChange={(e) => updateItem(item.id, 'solution', e.target.value)}
                                                className="form-input"
                                                style={{ height: '5rem', resize: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons for Photos */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div className="photo-upload-container" style={{ display: 'flex', gap: '1rem' }}>
                                            {/* Camera Button */}
                                            <div style={{ flex: 1 }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    id={`camera-${item.id}`}
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handlePhotoUpload(item.id, e.target.files)}
                                                />
                                                <label
                                                    htmlFor={`camera-${item.id}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem',
                                                        backgroundColor: 'var(--color-primary)',
                                                        color: 'white',
                                                        padding: '0.75rem',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        fontSize: '0.8rem',
                                                        textTransform: 'uppercase',
                                                        cursor: 'pointer',
                                                        width: '100%',
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.target.style.opacity = 0.9}
                                                    onMouseOut={(e) => e.target.style.opacity = 1}
                                                >
                                                    <Camera size={18} />
                                                    Tirar Foto
                                                </label>
                                            </div>

                                            {/* Upload Button */}
                                            <div style={{ flex: 1 }}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    id={`upload-${item.id}`}
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handlePhotoUpload(item.id, e.target.files)}
                                                />
                                                <label
                                                    htmlFor={`upload-${item.id}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.5rem',
                                                        backgroundColor: 'var(--color-primary)',
                                                        color: 'white',
                                                        padding: '0.75rem',
                                                        borderRadius: '6px',
                                                        fontWeight: '600',
                                                        fontSize: '0.8rem',
                                                        textTransform: 'uppercase',
                                                        cursor: 'pointer',
                                                        width: '100%',
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseOver={(e) => e.target.style.opacity = 0.9}
                                                    onMouseOut={(e) => e.target.style.opacity = 1}
                                                >
                                                    <Plus size={18} />
                                                    Upload Fotos
                                                </label>
                                            </div>
                                        </div>

                                        {/* Photo Gallery */}
                                        {item.photos && item.photos.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                {item.photos.map((photo, pIndex) => (
                                                    <div key={pIndex} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                                        <img src={photo} alt={`Foto ${pIndex}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                                                        <button
                                                            type="button"
                                                            onClick={() => removePhoto(item.id, pIndex)}
                                                            style={{
                                                                position: 'absolute', top: '-5px', right: '-5px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                                            }}
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Component Link */}
                        <button
                            type="button"
                            onClick={addItem}
                            style={{
                                marginTop: '1.5rem',
                                background: 'white',
                                border: '1px dashed #ccc',
                                color: '#666',
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            Adicionar Solução
                        </button>
                    </div>

                    {/* Footer Actions */}
                    <div className="action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/peritagens')}
                            style={{
                                backgroundColor: '#1F2937', // Dark gray
                                color: 'white',
                                border: 'none',
                                padding: '0.6rem 2rem',
                                borderRadius: '4px',
                                fontWeight: '600',
                                fontSize: '0.9rem'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            style={{
                                backgroundColor: '#006945', // Brand Green
                                color: 'white',
                                border: 'none',
                                padding: '0.6rem 2rem',
                                borderRadius: '4px',
                                fontWeight: '600',
                                fontSize: '0.9rem'
                            }}
                        >
                            Finalizar Peritagem
                        </button>
                    </div>

                </form>
            </div>

            <style>{`
        .form-input {
          width: 100%;
          padding: 0.85rem;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          color: #333;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          border-color: #006945;
          box-shadow: 0 0 0 2px rgba(0, 105, 69, 0.1);
        }
        
        .section-title {
          font-size: 0.75rem;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 1.5rem;
          font-weight: 700;
          text-align: center;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 0.5rem;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
            .grid-2-cols, .grid-3-cols, .grid-header {
                display: flex !important;
                flex-direction: column !important;
                gap: 1.25rem !important;
            }
            .grid-2-cols > div, .grid-3-cols > div {
                width: 100% !important;
            }
            form {
                padding: 1.25rem !important;
            }
            h2 {
                font-size: 0.95rem !important;
            }
            label {
                text-align: left !important;
                font-size: 0.85rem !important;
                margin-left: 2px;
            }
            .action-buttons {
                flex-direction: column-reverse;
                width: 100%;
                gap: 0.75rem !important;
            }
            .action-buttons button {
                width: 100%;
                padding: 1.1rem !important;
                font-size: 1rem !important;
            }
            .item-container {
                padding: 1rem !important;
            }
            .photo-upload-container {
                flex-direction: column !important;
            }
        }
      `}</style>
        </div>
    );
}
