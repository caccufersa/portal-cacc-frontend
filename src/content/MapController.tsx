'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapCustom.css'; // Add our custom Win95 styles here

const rawPolygon: [number, number][] = [
    [-5.1988, -37.3292], [-5.1979, -37.3275], [-5.1970, -37.3258],
    [-5.1971, -37.3245], [-5.1975, -37.3235], [-5.1982, -37.3225],
    [-5.1990, -37.3215], [-5.2000, -37.3208], [-5.2010, -37.3198],
    [-5.2025, -37.3190], [-5.2040, -37.3185], [-5.2060, -37.3182],
    [-5.2075, -37.3185], [-5.2090, -37.3195], [-5.2100, -37.3210],
    [-5.2105, -37.3225], [-5.2102, -37.3240], [-5.2090, -37.3262],
    [-5.2080, -37.3275], [-5.2065, -37.3290], [-5.2050, -37.3305],
    [-5.2035, -37.3320], [-5.2020, -37.3315], [-5.2005, -37.3305]
];

// Algoritmo simples de subdivisão geométrica (Chaikin) para suavizar o polígono, criando contornos naturais.
const smoothPolygon = (points: [number, number][], iterations = 2): [number, number][] => {
    let result = points;
    for (let i = 0; i < iterations; i++) {
        const smoothed: [number, number][] = [];
        for (let j = 0; j < result.length; j++) {
            const p1 = result[j];
            const p2 = result[(j + 1) % result.length];
            smoothed.push([0.75 * p1[0] + 0.25 * p2[0], 0.75 * p1[1] + 0.25 * p2[1]]);
            smoothed.push([0.25 * p1[0] + 0.75 * p2[0], 0.25 * p1[1] + 0.75 * p2[1]]);
        }
        result = smoothed;
    }
    return result;
};

const ufersaPolygon = smoothPolygon(rawPolygon, 2);

function ViewAdjuster() {
    const map = useMap();

    useEffect(() => {
        const bounds = L.polygon(ufersaPolygon).getBounds();
        map.setMaxBounds(bounds);
        map.setView([-5.206924, -37.324077], 17);

        const handleFocusLcc = () => map.flyTo([-5.206924, -37.324077], 19, { animate: true, duration: 1.5 });
        const handleFocusRu = () => map.flyTo([-5.204357, -37.323545], 19, { animate: true, duration: 1.5 });
        const handleFocusCcCentral = () => map.flyTo([-5.204870, -37.323457], 19, { animate: true, duration: 1.5 });
        const handleFocusCcEngenharias = () => map.flyTo([-5.207416, -37.322090], 19, { animate: true, duration: 1.5 });
        const handleFocusBiblioteca = () => map.flyTo([-5.204083, -37.324003], 19, { animate: true, duration: 1.5 });
        const handleFocusBloco5 = () => map.flyTo([-5.204083, -37.324003], 19, { animate: true, duration: 1.5 });

        window.addEventListener('map:focus-lcc', handleFocusLcc);
        window.addEventListener('map:focus-ru', handleFocusRu);
        window.addEventListener('map:focus-cc-central', handleFocusCcCentral);
        window.addEventListener('map:focus-cc-engenharias', handleFocusCcEngenharias);
        window.addEventListener('map:focus-biblioteca', handleFocusBiblioteca);
        window.addEventListener('map:focus-bloco5', handleFocusBloco5);

        return () => {
            window.removeEventListener('map:focus-lcc', handleFocusLcc);
            window.removeEventListener('map:focus-ru', handleFocusRu);
            window.removeEventListener('map:focus-cc-central', handleFocusCcCentral);
            window.removeEventListener('map:focus-cc-engenharias', handleFocusCcEngenharias);
            window.removeEventListener('map:focus-biblioteca', handleFocusBiblioteca);
            window.removeEventListener('map:focus-bloco5', handleFocusBloco5);
        };
    }, [map]);

    return null;
}

export default function MapController() {
    const outerBounds: [number, number][] = [
        [-90, -180],
        [90, -180],
        [90, 180],
        [-90, 180]
    ];

    const createIcon = (iconPath: string) => new L.DivIcon({
        className: 'custom-lcc-marker',
        html: `<img src="${iconPath}" alt="Marker" class="lcc-icon-img" />`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
    });

    const lccIcon = createIcon('/icons-95/computer.ico');
    const ruIcon = createIcon('/icons-95/battery.ico');
    const ccCentralIcon = createIcon('/icons-95/printer.ico');
    const ccEngenhariasIcon = createIcon('/icons-95/gears.ico');
    const bibliotecaIcon = createIcon('/icons-95/address_book.ico');

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
                <Marker position={[-5.206525, -37.322517]} icon={bibliotecaIcon}>
                    <Popup>
                        <b>BLOCO DE CÁLCULO (BLOCO 5)</b><br />
                    </Popup>
                </Marker>
                <Marker position={[-5.204357, -37.323545]} icon={ruIcon}>
                    <Popup>
                        <b>RU (Restaurante Universitário)</b><br />COMIDA
                    </Popup>
                </Marker>
                <Marker position={[-5.204870, -37.323457]} icon={ccCentralIcon}>
                    <Popup>
                        <b>CC Central (Centro de Convivência)</b><br /> Comida, impressão, etc.
                    </Popup>
                </Marker>
                <Marker position={[-5.207416, -37.322090]} icon={ccEngenhariasIcon}>
                    <Popup>
                        <b>CC Engenharias (Centro de Convivência)</b><br />
                    </Popup>
                </Marker>
                <Marker position={[-5.204083, -37.324003]} icon={bibliotecaIcon}>
                    <Popup>
                        <b>Biblioteca Central</b><br />
                    </Popup>
                </Marker>

                <ViewAdjuster />
            </MapContainer>

            <div className="legends-container">
                <div
                    className="legend-box map-legend"
                    title="Ir para o LCC"
                    onClick={() => window.dispatchEvent(new CustomEvent('map:focus-lcc'))}
                >
                    <img src="/icons-95/computer.ico" alt="LCC" className="legend-icon" />
                    <strong>LCC / Sede CACC</strong>
                </div>
                <div
                    className="legend-box map-legend"
                    title="Ir para o RU"
                    onClick={() => window.dispatchEvent(new CustomEvent('map:focus-ru'))}
                >
                    <img src="/icons-95/battery.ico" alt="RU" className="legend-icon" />
                    <strong>RU (Restaurante Univ.)</strong>
                </div>
                <div
                    className="legend-box map-legend"
                    title="Ir para o CC Central"
                    onClick={() => window.dispatchEvent(new CustomEvent('map:focus-cc-central'))}
                >
                    <img src="/icons-95/printer.ico" alt="CC Central" className="legend-icon" />
                    <strong>CC Central</strong>
                </div>
                <div
                    className="legend-box map-legend"
                    title="Ir para o CC Engenharias"
                    onClick={() => window.dispatchEvent(new CustomEvent('map:focus-cc-engenharias'))}
                >
                    <img src="/icons-95/gears.ico" alt="CC Engenharias" className="legend-icon" />
                    <strong>CC Engenharias</strong>
                </div>
                <div
                    className="legend-box map-legend"
                    title="Ir para a Biblioteca"
                    onClick={() => window.dispatchEvent(new CustomEvent('map:focus-biblioteca'))}
                >
                    <img src="/icons-95/address_book.ico" alt="Biblioteca" className="legend-icon" />
                    <strong>Biblioteca Central</strong>
                </div>
            </div>
        </div>
    );
}
