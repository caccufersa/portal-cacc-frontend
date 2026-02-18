'use client';

import { useState, useEffect } from 'react';
import styles from './Content.module.css';

interface Image {
    id: string;
    url: string;
    createdAt: string;
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
                0% {
                    background-position: -1000px 0;
                }
                100% {
                    background-position: 1000px 0;
                }
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
    const [images, setImages] = useState<Image[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedImage, setSelectedImage] = useState<Image | null>(null);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async (showSkeleton = false) => {
        if (showSkeleton) {
            setRefreshing(true);
        }
        try {
            const response = await fetch('/api/galeria/list');
            const data = await response.json();
            setImages(data.images || []);
        } catch (error) {
            console.error('Erro ao carregar imagens:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/galeria/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                await fetchImages();
                e.target.value = '';
            } else {
                alert('Erro ao fazer upload da imagem');
            }
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            alert('Erro ao fazer upload da imagem');
        } finally {
            setUploading(false);
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

            <div style={{ marginBottom: '20px', padding: '10px', background: '#c0c0c0', border: '2px solid #000', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                    <label htmlFor="fileUpload" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                        Adicionar nova foto:
                    </label>
                    <input
                        id="fileUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                    {uploading && <p style={{ marginTop: '8px', color: '#000080' }}>Enviando...</p>}
                </div>
                <button
                    onClick={() => fetchImages(true)}
                    disabled={uploading || refreshing}
                    style={{
                        padding: '4px 12px',
                        background: '#c0c0c0',
                        border: refreshing ? '2px inset #dfdfdf' : '2px outset #dfdfdf',
                        borderTop: refreshing ? '2px solid #808080' : '2px solid #ffffff',
                        borderLeft: refreshing ? '2px solid #808080' : '2px solid #ffffff',
                        borderBottom: refreshing ? '2px solid #ffffff' : '2px solid #808080',
                        borderRight: refreshing ? '2px solid #ffffff' : '2px solid #808080',
                        fontWeight: 'bold',
                        cursor: uploading || refreshing ? 'not-allowed' : 'pointer',
                        fontFamily: 'MS Sans Serif, Arial, sans-serif',
                        fontSize: '11px',
                        opacity: uploading || refreshing ? 0.7 : 1
                    }}
                >
                    {refreshing ? 'Carregando...' : 'Atualizar'}
                </button>
            </div>

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
                        style={{ 
                            maxWidth: '200px',
                            marginBottom: '20px',
                            imageRendering: 'pixelated'
                        }} 
                    />
                    <p>Nenhuma foto na galeria ainda. Seja o primeiro a adicionar!</p>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                    gap: '12px',
                    padding: '10px'
                }}>
                    {refreshing
                        ? [150, 170, 160, 180, 150, 165, 175, 155].map((h, i) => (
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
                                    border: '2px outset #dfdfdf',
                                    borderTop: '2px solid #eeeeee',
                                    borderLeft: '2px solid #dbdbdb',
                                    borderBottom: '2px solid #808080',
                                    borderRight: '2px solid #808080',
                                    boxShadow: '3px 3px 0 rgba(0,0,0,0.35)',
                                    transition: 'transform 0.1s',
                                }}>
                                <div
                                    style={{
                                        border: '2px solid #000',
                                        background: '#fff',
                                        padding: '2px'
                                    }}
                                >
                                    <img
                                        src={image.url}
                                        alt="Foto da galeria"
                                        style={{
                                            width: '100%',
                                            height: '150px',
                                            objectFit: 'cover',
                                            display: 'block'
                                        }}
                                    />
                                </div>
                                <div
                                    style={{
                                        marginTop: '8px',
                                        height: '12px',
                                        background: '#fdfdfd'
                                    }}
                                />
                            </div>
                        ))}
                </div>
            )}

            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        cursor: 'pointer'
                    }}
                >
                    <img
                        src={selectedImage.url}
                        alt="Foto ampliada"
                        style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            border: '4px solid #fff',
                            boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                        }}
                    />
                </div>
            )}
        </div>
    );
}
