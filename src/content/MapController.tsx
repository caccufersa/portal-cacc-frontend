'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapCustom.css'; // Add our custom Win95 styles here

function ViewAdjuster() {
    const map = useMap();

    useEffect(() => {
        const ufersaPolygon: [number, number][] = [
            [-5.1988, -37.3292], [-5.1979, -37.3275], [-5.1970, -37.3258],
            [-5.1971, -37.3245], [-5.1975, -37.3235], [-5.1982, -37.3225],
            [-5.1990, -37.3215], [-5.2000, -37.3208], [-5.2010, -37.3198],
            [-5.2025, -37.3190], [-5.2040, -37.3185], [-5.2060, -37.3182],
            [-5.2075, -37.3185], [-5.2090, -37.3195], [-5.2100, -37.3210],
            [-5.2105, -37.3225], [-5.2102, -37.3240], [-5.2090, -37.3262],
            [-5.2080, -37.3275], [-5.2065, -37.3290], [-5.2050, -37.3305],
            [-5.2035, -37.3320], [-5.2020, -37.3315], [-5.2005, -37.3305]
        ];

        const bounds = L.polygon(ufersaPolygon).getBounds();
        map.setMaxBounds(bounds);
        map.setView([-5.206924, -37.324077], 17);

        const handleFocus = () => {
            map.flyTo([-5.206924, -37.324077], 19, {
                animate: true,
                duration: 1.5 // segundos
            });
        };

        window.addEventListener('map:focus-lcc', handleFocus as EventListener);

        return () => {
            window.removeEventListener('map:focus-lcc', handleFocus as EventListener);
        };
    }, [map]);

    return null;
}

export default function MapController() {
    const ufersaPolygon: [number, number][] = [
        [-5.1988, -37.3292], [-5.1979, -37.3275], [-5.1970, -37.3258],
        [-5.1971, -37.3245], [-5.1975, -37.3235], [-5.1982, -37.3225],
        [-5.1990, -37.3215], [-5.2000, -37.3208], [-5.2010, -37.3198],
        [-5.2025, -37.3190], [-5.2040, -37.3185], [-5.2060, -37.3182],
        [-5.2075, -37.3185], [-5.2090, -37.3195], [-5.2100, -37.3210],
        [-5.2105, -37.3225], [-5.2102, -37.3240], [-5.2090, -37.3262],
        [-5.2080, -37.3275], [-5.2065, -37.3290], [-5.2050, -37.3305],
        [-5.2035, -37.3320], [-5.2020, -37.3315], [-5.2005, -37.3305]
    ];

    const outerBounds: [number, number][] = [
        [-90, -180],
        [90, -180],
        [90, 180],
        [-90, 180]
    ];

    const lccIcon = new L.DivIcon({
        className: 'custom-lcc-marker',
        html: '<img src="/icons-95/computer.ico" alt="LCC" class="lcc-icon-img" />',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
    });

    return (
        <MapContainer
            center={[-5.206924, -37.324077]}
            zoom={17}
            minZoom={16}
            maxZoom={19}
            style={{ width: '100%', height: '100%', background: '#d4d0c8' }}
            attributionControl={false}
        >
            <TileLayer
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                className="retro-map"
                maxZoom={19}
            />

            <Polygon
                positions={[outerBounds, ufersaPolygon]}
                pathOptions={{
                    color: '#008080',
                    weight: 2,
                    fillColor: '#c0c0c0',
                    fillOpacity: 0.95
                }}
            />

            <Marker position={[-5.206924, -37.324077]} icon={lccIcon}>
                <Popup>
                    <b>LCC (Laboratório de Ciência da Computação)</b><br />Sede do CACC
                </Popup>
            </Marker>
            <Marker position={[-5.204357, -37.323545]} icon={lccIcon}>
                <Popup>
                    <b>RU (Restaurante Universitário)</b><br />COMIDA
                </Popup>
            </Marker>
            <Marker position={[-5.204870, -37.323457]} icon={lccIcon}>
                <Popup>
                    <b>CC Central (Centro de Convivência)</b><br /> Comida, impressão, etc.
                </Popup>
            </Marker>
            <Marker position={[-5.207416, -37.322090]} icon={lccIcon}>
                <Popup>
                    <b>CC Engenharias (Centro de Convivência)</b><br />
                </Popup>
            </Marker>
            <Marker position={[-5.204083, -37.324003]} icon={lccIcon}>
                <Popup>
                    <b>Biblioteca Central</b><br />
                </Popup>
            </Marker>


            <ViewAdjuster />
            <div
                className="legend-box map-legend"
                title="Ir para o LCC"
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('map:focus-lcc'));
                }}
            >
                <img src="/icons-95/computer.ico" alt="LCC" className="legend-icon" />
                <strong>LCC / Sede CACC</strong>
            </div>

        </MapContainer>
    );
}
