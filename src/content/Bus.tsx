'use client';

import { useState, useEffect } from 'react';
import { AlertDialog } from '@/components/Dialog/Dialog';
import { useAuth } from '@/context/AuthContext';
import { useWindows } from '@/context/WindowsContext';
import styles from './Bus.module.css';

interface Seat {
    id: string;
    label: string;
    isOccupied: boolean;
    occupiedBy?: string;
    canRemove?: boolean;
    row: number;
    col: number;
}

interface BusLayout {
    id: string;
    name: string;
    rows: number;
    cols: number;
    aisleCol: number;
    totalSeats: number;
}

const LAYOUTS: BusLayout[] = [
    { id: 'standard', name: 'Convencional (44 Lugares)', rows: 11, cols: 5, aisleCol: 2, totalSeats: 44 },
    { id: 'executive', name: 'Executivo (36 Lugares)', rows: 9, cols: 5, aisleCol: 2, totalSeats: 36 },
    { id: 'minibus', name: 'Micro-ônibus (20 Lugares)', rows: 7, cols: 4, aisleCol: 1, totalSeats: 20 },
];

interface Trip {
    id: string;
    destination: string;
    date: string;
    price: string;
    layoutId: string;
}

const TRIPS: Trip[] = [
    { id: 't1', destination: 'Natal - RN | Dataprev + Cloud++ VISITA TÉCNICA', date: '15/07/2026 - 06:00', price: 'R$ 40,00', layoutId: 'executive' },
    { id: 't2', destination: 'Fortaleza - CE | Serpro | VISITA TÉCNICA', date: '22/08/2026 - 05:30', price: 'R$ 50,00', layoutId: 'standard' },
];

import { useBusService } from './bus/useBusService';

const getInitialLayoutSeats = (layout: BusLayout): Seat[] => {
    const seats: Seat[] = [];
    let seatNum = 1;
    for (let r = 0; r < layout.rows; r++) {
        for (let c = 0; c < layout.cols; c++) {
            if (c === layout.aisleCol) continue;
            seats.push({
                id: `${r}-${c}`,
                label: String(seatNum++).padStart(2, '0'),
                isOccupied: false,
                row: r,
                col: c
            });
        }
    }
    return seats;
};

export default function BusContent() {
    const { user } = useAuth();
    const { openWindow } = useWindows();
    const { getSeats, reserveSeat, getMyReservations, cancelReservation, getContact, saveContact } = useBusService();

    const [view, setView] = useState<'hub' | 'seatmap'>('hub');
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{ open: boolean; seat?: Seat }>({ open: false });
    const [removeModal, setRemoveModal] = useState<{ open: boolean; seat?: Seat }>({ open: false });
    const [successModal, setSuccessModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
    const [phoneModal, setPhoneModal] = useState<{ open: boolean; seat?: Seat }>({ open: false });
    const [phoneInput, setPhoneInput] = useState('');
    const [alreadyReservedModal, setAlreadyReservedModal] = useState(false);
    const [myReservations, setMyReservations] = useState<import('./bus/types').MyReservation[]>([]);

    const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

    // Load saved contact on mount
    useEffect(() => {
        if (user) {
            getContact().then(p => { if (p) setPhoneInput(p); }).catch(() => { });
        }
    }, [user, getContact]);

    const refreshSeats = async (tripId: string, layout: BusLayout) => {
        setLoading(true);
        try {
            // 1. Get Geometric Layout
            const initialSeats = getInitialLayoutSeats(layout);

            // 2. Fetch API Data
            const [apiSeats, myReservations] = await Promise.all([
                getSeats(tripId),
                user ? getMyReservations() : Promise.resolve([])
            ]);

            // 3. Merge Data
            const mergedSeats = initialSeats.map(s => {
                const apiSeat = apiSeats.find(as => as.seat_number === parseInt(s.label));
                const isMine = myReservations.some(mr => mr.trip_id === tripId && mr.seat_number === parseInt(s.label));

                return {
                    ...s,
                    isOccupied: apiSeat ? apiSeat.is_reserved : false,
                    occupiedBy: isMine ? user?.username : (apiSeat?.is_reserved && apiSeat?.user_id ? `User #${apiSeat.user_id}` : undefined),
                    canRemove: isMine
                };
            });
            setSeats(mergedSeats);
            setMyReservations(myReservations);

        } catch (error) {
            console.error(error);
            setSeats(getInitialLayoutSeats(layout));
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTrip = (trip: Trip) => {
        const layout = LAYOUTS.find(l => l.id === trip.layoutId);
        if (layout) {
            setSelectedTrip(trip);
            setView('seatmap');
            setSelectedSeat(null);
            refreshSeats(trip.id, layout);
        }
    };

    const handleSeatClick = async (seat: Seat) => {
        if (seat.isOccupied) {
            const canRemove = seat.canRemove || (user && seat.occupiedBy === user.username);
            if (canRemove) {
                setRemoveModal({ open: true, seat });
            }
            return;
        }

        // Fast local check first — if no cached reservation, proceed immediately
        const cachedHasReservation = selectedTrip
            ? myReservations.some(mr => mr.trip_id === selectedTrip.id)
            : false;

        if (cachedHasReservation) {
            // Live-check backend: user might have cancelled and wants to rebook
            try {
                setLoading(true);
                const freshReservations = await getMyReservations();
                setMyReservations(freshReservations);

                const stillHasReservation = selectedTrip
                    ? freshReservations.some(mr => mr.trip_id === selectedTrip.id)
                    : false;

                if (stillHasReservation) {
                    // Confirmed: user still has an active reservation on this trip
                    setAlreadyReservedModal(true);
                    return;
                }
                // Otherwise: reservation was cancelled — fall through to allow rebook
            } catch {
                // If request fails, fall back to cached data to avoid bad UX
                setAlreadyReservedModal(true);
                return;
            } finally {
                setLoading(false);
            }
        }

        // Toggle selection
        if (selectedSeat === seat.id) {
            setSelectedSeat(null);
        } else {
            setSelectedSeat(seat.id);
        }
    };

    const handleConfirmReservation = () => {
        const seat = seats.find(s => s.id === selectedSeat);
        if (seat) {
            // First ask for phone contact, then confirm reservation
            setPhoneModal({ open: true, seat });
        }
    };

    const handlePhoneSubmit = async () => {
        if (!phoneModal.seat) return;
        const digits = phoneInput.replace(/\D/g, '');
        if (digits.length < 8) return; // minimum validation
        try {
            await saveContact(phoneInput);
        } catch { /* best effort, non-fatal */ }
        setPhoneModal({ open: false });
        setConfirmModal({ open: true, seat: phoneModal.seat });
    };

    const finalizeReservation = async () => {
        if (!confirmModal.seat || !user || !selectedTrip) return;

        setLoading(true);
        try {
            const seatNum = parseInt(confirmModal.seat.label, 10);
            await reserveSeat(selectedTrip.id, seatNum);

            // Refresh logic
            const layout = LAYOUTS.find(l => l.id === selectedTrip.layoutId);
            if (layout) await refreshSeats(selectedTrip.id, layout);

            setSuccessModal({ open: true, message: `Reserva do assento ${confirmModal.seat.label} realizada com sucesso!` });
        } catch (e: unknown) {
            const err = e instanceof Error ? e.message : 'Erro ao reservar';
            if (err.includes('Conflict')) {
                setSuccessModal({ open: true, message: 'Este assento acabou de ser reservado por outro usuário.' });
            } else {
                setSuccessModal({ open: true, message: 'Falha na reserva: ' + err });
            }
            // Refresh anyway
            const layout = LAYOUTS.find(l => l.id === selectedTrip.layoutId);
            if (layout) await refreshSeats(selectedTrip.id, layout);
        } finally {
            setLoading(false);
            setConfirmModal({ open: false });
            setSelectedSeat(null);
        }
    };

    const finalizeRemoval = async () => {
        if (!removeModal.seat || !selectedTrip) return;

        setLoading(true);
        try {
            const seatNum = parseInt(removeModal.seat.label, 10);
            await cancelReservation(selectedTrip.id, seatNum);

            // Refresh logic
            const layout = LAYOUTS.find(l => l.id === selectedTrip.layoutId);
            if (layout) await refreshSeats(selectedTrip.id, layout);

            setSuccessModal({ open: true, message: 'Reserva cancelada com sucesso.' });
        } catch (e: unknown) {
            console.error(e);
            setSuccessModal({ open: true, message: 'Erro ao cancelar reserva.' });
        } finally {
            setLoading(false);
            setRemoveModal({ open: false });
        }
    };

    const renderGrid = () => {
        if (!selectedTrip) return null;
        const layout = LAYOUTS.find(l => l.id === selectedTrip.layoutId) || LAYOUTS[0];

        const grid = [];
        for (let r = 0; r < layout.rows; r++) {
            const rowContent = [];
            for (let c = 0; c < layout.cols; c++) {
                if (c === layout.aisleCol) {
                    rowContent.push(<div key={`aisle-${r}`} className={styles.aisle} />);
                    continue;
                }
                const seat = seats.find(s => s.row === r && s.col === c);
                if (seat) {
                    const isSelected = selectedSeat === seat.id;
                    const canHover = seat.isOccupied && seat.occupiedBy;

                    rowContent.push(
                        <div
                            key={seat.id}
                            className={`
                                    ${styles.seat} 
                                    ${seat.isOccupied ? (seat.occupiedBy === user?.username ? styles.seatUserReserved : styles.seatOccupied) : ''} 
                                    ${isSelected ? styles.seatSelected : ''}
                                `}
                            onClick={() => handleSeatClick(seat)}
                            onMouseEnter={() => setHoveredSeat(seat.id)}
                            onMouseLeave={() => setHoveredSeat(null)}
                            style={{ cursor: seat.isOccupied ? (seat.canRemove ? 'pointer' : 'not-allowed') : 'pointer' }}
                        >
                            <span className={styles.seatNumber}>{seat.label}</span>
                            {canHover && hoveredSeat === seat.id && (
                                <div className={styles.tooltip}>
                                    {seat.occupiedBy}
                                    {seat.canRemove && <span style={{ display: 'block', fontSize: 9, color: '#666' }}>(Clique para cancelar)</span>}
                                </div>
                            )}
                        </div>
                    );
                } else {
                    rowContent.push(<div key={`empty-${r}-${c}`} style={{ width: 44, height: 48 }} />);
                }
            }
            grid.push(<div key={`row-${r}`} style={{ display: 'flex', gap: 12 }}>{rowContent}</div>);
        }
        return grid;
    };

    if (!user) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <img src="/icons-95/key_padlock.ico" alt="" className={styles.emptyIco} />
                    </div>
                    <span className={styles.emptyTitle}>Faça login para acessar o Turismo CACC</span>
                    <span className={styles.emptySubtitle}>Clique no ícone de perfil na barra de tarefas para entrar.</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {phoneModal.open && phoneModal.seat && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        background: '#d4d0c8', border: '2px outset #fff', padding: 0,
                        minWidth: 320, maxWidth: 380, fontFamily: 'var(--font-main)', fontSize: 13,
                        boxShadow: '4px 4px 8px rgba(0,0,0,0.5)'
                    }}>
                        {/* Title Bar */}
                        <div style={{
                            background: 'linear-gradient(90deg,#000080,#1084d0)',
                            color: '#fff', padding: '4px 8px', fontWeight: 'bold', fontSize: 12,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <span>📞 Contato de Viagem – Assento {phoneModal.seat.label}</span>
                            <button onClick={() => setPhoneModal({ open: false })} style={{ background: 'none', border: '1px outset #999', color: '#fff', cursor: 'pointer', fontSize: 11, padding: '1px 6px' }}>✕</button>
                        </div>

                        {/* Passenger identity card */}
                        <div style={{
                            margin: '12px 16px 0',
                            background: '#fff',
                            border: '1px inset #808080',
                            padding: '8px 12px',
                            display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                border: '2px solid #000080',
                                overflow: 'hidden', flexShrink: 0,
                                background: '#000080',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 22, color: '#fff', fontWeight: 'bold',
                            }}>
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    user?.username?.[0]?.toUpperCase() ?? '?'
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: 13, color: '#000080' }}>
                                    {user?.display_name || user?.username}
                                </div>
                                <div style={{ fontSize: 11, color: '#666' }}>@{user?.username}</div>
                                <div style={{ fontSize: 11, marginTop: 2, color: '#444' }}>
                                    🚌 {selectedTrip?.destination?.split('|')[0]?.trim()} · Assento <strong>{phoneModal.seat.label}</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '12px 16px 10px' }}>
                            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#444' }}>
                                Informe seu número de contato (WhatsApp) para facilitar a organização da viagem.
                            </p>
                            <input
                                id="bus-phone-input"
                                type="tel"
                                value={phoneInput}
                                onChange={e => setPhoneInput(e.target.value.replace(/[^\d\s()+-]/g, ''))}
                                placeholder="(84) 99999-9999"
                                maxLength={20}
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') handlePhoneSubmit(); }}
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    padding: '4px 8px', fontSize: 14, fontFamily: 'monospace',
                                    border: 'none', boxShadow: 'inset 1px 1px 0 #808080, inset -1px -1px 0 #fff',
                                    background: '#fff', outline: 'none',
                                }}
                            />
                            {phoneInput.replace(/\D/g, '').length > 0 && phoneInput.replace(/\D/g, '').length < 8 && (
                                <div style={{ fontSize: 11, color: '#c00', marginTop: 4 }}>Mínimo 8 dígitos</div>
                            )}
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                                <button
                                    onClick={handlePhoneSubmit}
                                    disabled={phoneInput.replace(/\D/g, '').length < 8}
                                    style={{
                                        background: '#d4d0c8', border: '2px outset #fff', padding: '4px 16px',
                                        fontFamily: 'var(--font-main)', fontSize: 12, cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Confirmar
                                </button>
                                <button
                                    onClick={() => setPhoneModal({ open: false })}
                                    style={{
                                        background: '#d4d0c8', border: '2px outset #fff', padding: '4px 16px',
                                        fontFamily: 'var(--font-main)', fontSize: 12, cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {confirmModal.open && (
                <AlertDialog
                    title="Confirmar Reserva"
                    message={`Deseja reservar o assento ${confirmModal.seat?.label} para o destino ${selectedTrip?.destination}?`}
                    type="question"
                    onOk={finalizeReservation}
                    onCancel={() => setConfirmModal({ open: false })}
                />
            )}

            {removeModal.open && (
                <AlertDialog
                    title="Cancelar Reserva"
                    message={`Deseja cancelar a reserva do assento ${removeModal.seat?.label}?`}
                    type="warning"
                    onOk={finalizeRemoval}
                    onCancel={() => setRemoveModal({ open: false })}
                />
            )}

            {successModal.open && (
                <AlertDialog
                    title="Sucesso"
                    message={successModal.message}
                    type="info"
                    onOk={() => setSuccessModal({ open: false, message: '' })}
                />
            )}

            {alreadyReservedModal && (
                <AlertDialog
                    title="Reserva Duplicada"
                    message="Você já possui um assento reservado nesta viagem. Cada usuário pode reservar apenas 1 assento por viagem."
                    type="warning"
                    onOk={() => setAlreadyReservedModal(false)}
                />
            )}

            <div className={styles.toolbar}>
                <img src="/icons-95/calendar.ico" alt="" width={16} height={16} />
                <span className={styles.toolbarTitle}>TURISMO CACC</span>
                <div style={{ flex: 1 }} />
                {view === 'seatmap' && (
                    <button onClick={() => setView('hub')} style={{ fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
                        Voltar para Destinos
                    </button>
                )}
            </div>

            <div className={styles.mainContent}>
                {view === 'hub' ? (
                    <div className={styles.hubContainer}>
                        <h2 style={{ color: '#444', marginBottom: 20 }}>Próximas Viagens Disponíveis (2026)</h2>
                        {TRIPS.map(trip => (
                            <div key={trip.id} className={styles.tripCard} onClick={() => handleSelectTrip(trip)}>
                                <div className={styles.tripInfo}>
                                    <h3>{trip.destination}</h3>
                                    <div className={styles.tripDetails}>
                                        <span>📅 {trip.date}</span>
                                        <span>🚌 {LAYOUTS.find(l => l.id === trip.layoutId)?.name}</span>
                                    </div>
                                </div>
                                <div className={styles.tripPrice}>{trip.price}</div>
                            </div>
                        ))}

                        <button className={styles.suggestionTrigger} onClick={() => openWindow('sugest')}>
                            <img src="/icons-95/help_question_mark.ico" alt="Sugestão" className={styles.suggestionIcon} />
                            <div className={styles.suggestionBubble}>
                                Tem alguma sugestão de viagem? Envie ela através da ouvidoria!
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className={styles.busContainer}>
                        <div className={styles.seatsGrid}>
                            {renderGrid()}
                        </div>
                        <div className={styles.legend}>
                            <div className={styles.legendItem}>
                                <div className={styles.legendBox} style={{ background: '#f0f0f0' }}></div>
                                <span>Livre</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={styles.legendBox} style={{ background: '#c0c0c0' }}></div>
                                <span>Ocupado</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={styles.legendBox} style={{ background: '#2050a0' }}></div>
                                <span>Selecionado</span>
                            </div>
                            <button
                                className={styles.confirmBtn}
                                onClick={handleConfirmReservation}
                                disabled={!selectedSeat || loading}
                            >
                                {loading ? 'Carregando...' : `Confirmar ${selectedSeat ? `(${seats.find(s => s.id === selectedSeat)?.label})` : ''}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
