'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import styles from './Content.module.css';

// We need a helper component to set up custom Leaflet settings that need access to the `map` instance
const MapController = dynamic(
    () => import('./MapController'),
    { ssr: false }
);

export default function MapContent() {
    return (
        <div className={styles.content} style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, backgroundColor: '#d4d0c8', position: 'relative' }}>
                <MapController />
            </div>
        </div>
    );
}
