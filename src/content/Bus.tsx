'use client';

import React, { useState } from 'react';
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
import { BusSeat, MyReservation } from './bus/types';

// Keep LAYOUTS and TRIPS for now as they are not served by backend yet
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
    const { getSeats, reserveSeat, getMyReservations, cancelReservation } = useBusService();

    const [view, setView] = useState<'hub' | 'seatmap'>('hub');
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [seats, setSeats] = useState<Seat[]>([]);
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{ open: boolean; seat?: Seat }>({ open: false });
    const [removeModal, setRemoveModal] = useState<{ open: boolean; seat?: Seat }>({ open: false });
    const [successModal, setSuccessModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

    const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

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

        } catch (error) {
            console.error(error);
            // Fallback for demo if API fails
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

    const handleSeatClick = (seat: Seat) => {
        if (seat.isOccupied) {
            // Check if user can remove (e.g., it's their reservation)
            // Here we check `seat.canRemove` which is mocked, or match `seat.occupiedBy === user.username`
            // For demo, let's use the mocked `canRemove` flag OR simulate matching user
            const canRemove = seat.canRemove || (user && seat.occupiedBy === user.username);

            if (canRemove) {
                setRemoveModal({ open: true, seat });
            }
            return;
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
            setConfirmModal({ open: true, seat });
        }
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
