import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BusSeat, MyReservation, ReserveResponse } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://backend-go-portal-u9o8.onrender.com';

export function useBusService() {
    const { apiCall } = useAuth();

    // 1. List Seats for a specific trip
    const getSeats = useCallback(async (tripId: string): Promise<BusSeat[]> => {
        // This endpoint might be public or protected. Documentation says "Auth: Bearer Token Obrigatório" for reserve/cancel/me.
        // LIST SEATS doesn't specify Auth, but usually it's public.
        // However apiCall handles auth automatically if token exists.
        // Let's assume it's public or auth-optional, so we use fetch if apiCall fails? No, use apiCall for consistency.
        // If it's public, apiCall works fine (without token if not logged in? apiCall throws if !token).
        // Wait, standard `apiCall` throws "Not authenticated".
        // The endpoint `GET /:trip_id/seats` implies checking availability.
        // If it's public, we should check `AuthContext`. 
        // Documentation doesn't say "Auth: Bearer Token" for endpoint 1.
        // But likely users are logged in to see this page.
        // Let's use apiCall, assuming user must be logged in to view the internal system.
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
            body: JSON.stringify({ trip_id: tripId, seat_number: seatNumber }), // Endpoint uses POST for cancel as per doc
        });
    }, [apiCall]);

    return {
        getSeats,
        reserveSeat,
        getMyReservations,
        cancelReservation
    };
}
