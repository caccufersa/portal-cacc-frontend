import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { BusSeat, MyReservation, ReserveResponse, Trip } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';

export function useBusService() {
    const { apiCall } = useAuth();

    // 1. List all available Trips
    const getTrips = useCallback(async (): Promise<Trip[]> => {
        return apiCall<Trip[]>(`${BASE_URL}/bus`);
    }, [apiCall]);

    // 2. List Seats for a specific trip
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

    // 5. Get user contact (phone + matricula)
    const getContact = useCallback(async (): Promise<{ phone: string; matricula: string }> => {
        const res = await apiCall<{ phone: string; matricula: string }>(`${BASE_URL}/bus/contact`);
        return { phone: res.phone ?? '', matricula: res.matricula ?? '' };
    }, [apiCall]);

    // 6. Save user contact (phone + matricula — backend strips non-digits from phone)
    const saveContact = useCallback(async (phone: string, matricula: string): Promise<void> => {
        await apiCall(`${BASE_URL}/bus/contact`, {
            method: 'PUT',
            body: JSON.stringify({ phone, matricula }),
        });
    }, [apiCall]);

    return {
        getTrips,
        getSeats,
        reserveSeat,
        getMyReservations,
        cancelReservation,
        getContact,
        saveContact,
    };
}
