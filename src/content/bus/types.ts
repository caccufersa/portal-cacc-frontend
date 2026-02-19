export interface BusSeat {
    seat_number: number;
    is_reserved: boolean;
    user_id?: number;
    reserved_at?: string;
}

export interface MyReservation {
    trip_id: string;
    seat_number: number;
    reserved_at: string;
}

export interface ReserveResponse {
    status: string;
    seat: number;
}

export interface Trip {
    id: string;
    destination: string;
    date: string;
    price: string;
    layoutId: string;
}
