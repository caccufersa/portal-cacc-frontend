'use client';

import { useState, useEffect } from 'react';
import styles from './Content.module.css';
import { useAuth } from '@/context/AuthContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';

// Alinhado com o schema do backend Go (pkg/models/galeria.go)
interface GaleriaItem {
    id: number;
    public_id: string;
    url: string;
    caption: string;
    uploaded_by: number;
    uploaded_by_username: string;
    created_at: string;
    width: number;
    height: number;
}

const SkeletonItem = ({ height }: { height: number }) => (
    <div
        style={{
            border: '2px solid #000',
            padding: '3px',
            background: '#c0c0c0',
            height: `${height + 6}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
        }}
    >
        <style>{`
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            @keyframes pulse {
                0% { opacity: 0.85; }
                50% { opacity: 1; }
                100% { opacity: 0.85; }
            }
            .skeleton-loading {
                background: linear-gradient(90deg, #e4e4e4 20%, #f3f3f3 45%, #e4e4e4 70%);
                background-size: 1000px 100%;
                animation: shimmer 1.8s infinite, pulse 1.6s infinite;
                width: 100%;
                height: ${height}px;
            }
        `}</style>
        <div className="skeleton-loading" />
    </div>
);

export default function GaleriaContent() {
    const { user, accessToken } = useAuth();
    const [images, setImages] = useState<GaleriaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<GaleriaItem | null>(null);
    const [caption, setCaption] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async (showSkeleton = false) => {
        if (showSkeleton) setRefreshing(true);
        try {
            const response = await fetch(`${BACKEND_URL}/galeria/list`, {
                cache: 'no-store',
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            // Log de diagnóstico — remova após confirmar os campos do backend
            const rawList = Array.isArray(data) ? data : (data.images ?? data.data ?? []);
            if (rawList.length > 0) {
                console.log('[Galeria] Campos do backend (item[0]):', JSON.stringify(rawList[0], null, 2));
            }

            // Normaliza campos — cobre variações de nome que o backend Go pode retornar
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const list: GaleriaItem[] = rawList.map((item: any) => ({
                id: item.id ?? item.ID ?? 0,
                public_id: item.public_id ?? item.publicId ?? item.cloudinary_id ?? '',
                // URL: tenta vários nomes possíveis
                url: item.url ?? item.image_url ?? item.secure_url ?? item.photo_url ?? '',
                caption: item.caption ?? item.description ?? item.legenda ?? '',
                uploaded_by: item.uploaded_by ?? item.user_id ?? item.uploader_id ?? 0,
                // Username: tenta vários nomes possíveis
                uploaded_by_username: item.uploaded_by_username ?? item.username ?? item.uploader ?? item.user ?? '',
                created_at: item.created_at ?? item.createdAt ?? item.created ?? new Date().toISOString(),
                width: item.width ?? 0,
                height: item.height ?? 0,
            }));

            setImages(list);
        } catch (error) {
            console.error('[Galeria] Erro ao carregar imagens:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!accessToken) {
            alert('Você precisa estar logado para enviar fotos.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('caption', caption);

        try {
            const response = await fetch(`${BACKEND_URL}/galeria/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (response.ok) {
                await fetchImages();
                e.target.value = '';
                setCaption('');
            } else {
                const err = await response.json().catch(() => ({}));
                alert(err.error || 'Erro ao fazer upload da imagem');
            }
        } catch (error) {
            console.error('[Galeria] Erro ao fazer upload:', error);
            alert('Erro ao fazer upload da imagem');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (imageId: number) => {
        if (!accessToken) return;
        try {
            const response = await fetch(`${BACKEND_URL}/galeria/${imageId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (response.ok || response.status === 204) {
                setImages(prev => prev.filter(img => img.id !== imageId));
                setSelectedImage(null);
                setDeleteConfirm(null);
            } else {
                alert('Erro ao remover a imagem.');
            }
        } catch {
            alert('Erro ao remover a imagem.');
        }
    };

    if (loading) {
        return (
            <div className={styles.content}>
                <div style={{ marginBottom: '20px' }}>
                    <h1>
                        <img src="icons-95/camera.ico" alt="" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                        {' '}Galeria de Fotos
                    </h1>
                    <p>Fotos dos eventos e atividades do CACC</p>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '12px',
                    padding: '10px'
                }}>
                    {[150, 170, 160, 180, 150, 165, 175, 155].map((h, i) => (
                        <SkeletonItem key={i} height={h} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.content}>
            <div style={{ marginBottom: '20px' }}>
                <h1>
                    <img src="icons-95/camera.ico" alt="" style={{ width: '24px', height: '24px', verticalAlign: 'middle' }} />
                    {' '}Galeria de Fotos
                </h1>
                <p>Fotos dos eventos e atividades do CACC</p>
            </div>

            {user && accessToken ? (
                <div style={{ marginBottom: '20px', padding: '10px', background: '#c0c0c0', border: '2px solid #000', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '180px' }}>
                        <label style={{ fontWeight: 'bold' }}>Legenda (opcional):</label>
                        <input
                            type="text"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Ex: Final do campeonato..."
                            style={{ padding: '2px 4px', border: '2px inset #fff' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label htmlFor="fileUpload" style={{ fontWeight: 'bold' }}>
                            Adicionar nova foto:
                        </label>
                        <input
                            id="fileUpload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        {uploading && <p style={{ marginTop: '4px', color: '#000080' }}>Enviando...</p>}
                    </div>

                    <button
                        onClick={() => fetchImages(true)}
                        disabled={uploading || refreshing}
                        style={{
                            padding: '4px 12px',
                            background: '#c0c0c0',
                            borderTop: refreshing ? '2px solid #808080' : '2px solid #ffffff',
                            borderLeft: refreshing ? '2px solid #808080' : '2px solid #ffffff',
                            borderBottom: refreshing ? '2px solid #ffffff' : '2px solid #808080',
                            borderRight: refreshing ? '2px solid #ffffff' : '2px solid #808080',
                            fontWeight: 'bold',
                            cursor: uploading || refreshing ? 'not-allowed' : 'pointer',
                            fontFamily: 'MS Sans Serif, Arial, sans-serif',
                            fontSize: '11px',
                            opacity: uploading || refreshing ? 0.7 : 1,
                        }}
                    >
                        {refreshing ? 'Carregando...' : 'Atualizar'}
                    </button>
                </div>
            ) : (
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <p style={{ margin: 0, color: '#606060', fontSize: '12px' }}>
                        💡 Faça login para enviar fotos para a galeria.
                    </p>
                    <button
                        onClick={() => fetchImages(true)}
                        disabled={refreshing}
                        style={{
                            padding: '4px 12px',
                            background: '#c0c0c0',
                            borderTop: '2px solid #ffffff',
                            borderLeft: '2px solid #ffffff',
                            borderBottom: '2px solid #808080',
                            borderRight: '2px solid #808080',
                            fontWeight: 'bold',
                            cursor: refreshing ? 'not-allowed' : 'pointer',
                            fontFamily: 'MS Sans Serif, Arial, sans-serif',
                            fontSize: '11px',
                            opacity: refreshing ? 0.7 : 1,
                        }}
                    >
                        {refreshing ? 'Carregando...' : 'Atualizar Galeria'}
                    </button>
                </div>
            )}

            {images.length === 0 && !refreshing ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '300px',
                    textAlign: 'center'
                }}>
                    <img
                        src="/images/cat.jpg"
                        alt="Sem fotos"
                        style={{ maxWidth: '200px', marginBottom: '20px', imageRendering: 'pixelated' }}
                    />
                    <p>Nenhuma foto na galeria ainda. Seja o primeiro a adicionar!</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '12px',
                    padding: '4px'
                }}>
                    {refreshing
                        ? [150, 170, 160, 180, 165, 175].map((h, i) => (
                            <SkeletonItem key={`refresh-${i}`} height={h} />
                        ))
                        : images.map((image) => (
                            <div
                                key={image.id}
                                onClick={() => setSelectedImage(image)}
                                style={{
                                    cursor: 'pointer',
                                    padding: '8px 8px 18px',
                                    background: '#fdfdfd',
                                    borderTop: '2px solid #eeeeee',
                                    borderLeft: '2px solid #dbdbdb',
                                    borderBottom: '2px solid #808080',
                                    borderRight: '2px solid #808080',
                                    boxShadow: '3px 3px 0 rgba(0,0,0,0.35)',
                                    transition: 'transform 0.1s',
                                }}
                            >
                                <div style={{ border: '2px solid #000', background: '#fff', padding: '2px' }}>
                                    <img
                                        src={image.url}
                                        alt={image.caption || 'Foto da galeria'}
                                        style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }}
                                    />
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '11px', color: '#404040' }}>
                                    <div style={{ marginBottom: '4px' }}>
                                        {image.caption ? image.caption : <i>Sem legenda</i>}
                                    </div>
                                    <div style={{ color: '#000080' }}>
                                        por <b>@{image.uploaded_by_username || 'anônimo'}</b>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}

            {selectedImage && (
                <div
                    onClick={() => { setSelectedImage(null); setDeleteConfirm(null); }}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        cursor: 'pointer'
                    }}
                >
                    <img
                        src={selectedImage.url}
                        alt={selectedImage.caption || 'Foto ampliada'}
                        style={{
                            maxWidth: '90%',
                            maxHeight: '75%',
                            border: '4px solid #fff',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                            marginBottom: '10px'
                        }}
                    />
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: '#fff', textAlign: 'center', background: 'rgba(0,0,0,0.65)', padding: '10px 16px', borderRadius: '4px', minWidth: '250px' }}
                    >
                        {selectedImage.caption && (
                            <p style={{ margin: '0 0 4px', fontSize: '13px' }}>{selectedImage.caption}</p>
                        )}
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ddd' }}>
                            Enviado por <b>@{selectedImage.uploaded_by_username || 'anônimo'}</b>
                            {' '}em {new Date(selectedImage.created_at).toLocaleDateString('pt-BR')}
                        </p>

                        {/* Pode excluir: upload próprio OU upload sem dono identificado (anônimo) */
                        }
                        {user && (user.id === selectedImage.uploaded_by || !selectedImage.uploaded_by_username) && (
                            <div style={{ marginTop: '10px' }}>
                                {deleteConfirm === selectedImage.id ? (
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <button
                                            onClick={() => handleDelete(selectedImage.id)}
                                            style={{ padding: '3px 10px', background: '#cc0000', color: '#fff', border: '2px outset #ff4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                                        >
                                            Confirmar exclusão
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(null)}
                                            style={{ padding: '3px 10px', background: '#c0c0c0', border: '2px outset #dfdfdf', cursor: 'pointer', fontSize: '11px' }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setDeleteConfirm(selectedImage.id)}
                                        style={{ padding: '3px 10px', background: '#c0c0c0', border: '2px outset #dfdfdf', cursor: 'pointer', fontSize: '11px' }}
                                    >
                                        🗑 Excluir foto
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
