import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { BusSeat, MyReservation, ReserveResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';

export function useBusService() {
    const { apiCall } = useAuth();

    // 1. List Seats for a specific trip
    const getSeats = useCallback(async (tripId: string): Promise<BusSeat[]> => {
        return apiCall<BusSeat[]>(`${BASE_URL}/bus/${tripId}/seats`);
    }, [apiCall]);

    // 2. Reserve Seat
    const reserveSeat = useCallback(async (tripId: string, seatNumber: number): Promise<ReserveResponse> => {
        return apiCall<ReserveResponse>(`${BASE_URL}/bus/reserve`, {
            method: 'POST',
            body: JSON.stringify({ trip_id: tripId, seat_number: seatNumber }),
        });
    }, [apiCall]);

    // 3. My Reservations
    const getMyReservations = useCallback(async (): Promise<MyReservation[]> => {
        return apiCall<MyReservation[]>(`${BASE_URL}/bus/me`);
    }, [apiCall]);

    // 4. Cancel Reservation
    const cancelReservation = useCallback(async (tripId: string, seatNumber: number): Promise<void> => {
        await apiCall(`${BASE_URL}/bus/cancel`, {
            method: 'POST',
            body: JSON.stringify({ trip_id: tripId, seat_number: seatNumber }),
        });
    }, [apiCall]);

    // 5. Get user contact phone
    const getContact = useCallback(async (): Promise<string> => {
        const res = await apiCall<{ phone: string }>(`${BASE_URL}/bus/contact`);
        return res.phone ?? '';
    }, [apiCall]);

    // 6. Save user contact phone (backend strips non-digits)
    const saveContact = useCallback(async (phone: string): Promise<void> => {
        await apiCall(`${BASE_URL}/bus/contact`, {
            method: 'PUT',
            body: JSON.stringify({ phone }),
        });
    }, [apiCall]);

    return {
        getSeats,
        reserveSeat,
        getMyReservations,
        cancelReservation,
        getContact,
        saveContact,
    };
}
