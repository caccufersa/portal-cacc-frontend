'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface IconPosition {
  id: string;
  position: { x: number; y: number };
}

interface WindowsContextType {
  windows: WindowState[];
  iconPositions: IconPosition[];
  activeWindowId: string | null;
  openWindow: (id: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  updateIconPosition: (id: string, position: { x: number; y: number }) => void;
  startMenuOpen: boolean;
  setStartMenuOpen: (open: boolean) => void;
}

const WindowsContext = createContext<WindowsContextType | null>(null);

const initialWindows: WindowState[] = [
  { id: 'about', title: 'Sobre o CACC', icon: 'icons-95/directory_closed.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 50, y: 50 }, size: { width: 500, height: 400 } },
  { id: 'courses', title: 'Grade Curricular', icon: 'icons-95/calendar.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 100, y: 80 }, size: { width: 600, height: 450 } },
  { id: 'galeria', title: 'Galeria', icon: 'icons-95/camera.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 150, y: 60 }, size: { width: 550, height: 420 } },
  { id: 'contact', title: 'Contato', icon: 'icons-95/phone_desk.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 200, y: 100 }, size: { width: 450, height: 400 } },
  { id: 'forum', title: 'Fórum CACC', icon: 'icons-95/connected_world.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 180, y: 80 }, size: { width: 620, height: 500 } },
  { id: 'news', title: 'Notícias', icon: 'icons-95/msg_information.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 140, y: 60 }, size: { width: 600, height: 480 } },
  { id: 'help', title: 'FAQ - Perguntas Frequentes', icon: 'icons-95/help_question_mark.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 120, y: 70 }, size: { width: 500, height: 450 } },
  { id: 'documents', title: 'Documentos', icon: 'icons-95/notepad_file.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 80, y: 90 }, size: { width: 520, height: 420 } },
  { id: 'balance', title: 'Transparência', icon: 'icons-95/calculator.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 400, y: 120 }, size: { width: 600, height: 450 } },
  { id: 'sugest', title: 'Sugestões', icon: 'icons-95/message_tack.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 300, y: 150 }, size: { width: 550, height: 500 } },
  { id: 'bus', title: 'Reserva de Passagens', icon: 'icons-95/world.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 350, y: 180 }, size: { width: 800, height: 600 } },
  { id: 'calouroGuide', title: 'Guia do Calouro', icon: 'icons-95/user_world.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 600, y: 250 }, size: { width: 700, height: 500 } },
];

const getInitialIconPositions = (): IconPosition[] => {
  if (typeof window === 'undefined') {
    return [
      { id: 'about', position: { x: 20, y: 20 } },
      { id: 'courses', position: { x: 20, y: 110 } },
      { id: 'galeria', position: { x: 20, y: 200 } },
      { id: 'contact', position: { x: 20, y: 290 } },
      { id: 'forum', position: { x: 20, y: 380 } },
      { id: 'news', position: { x: 20, y: 470 } },
      { id: 'help', position: { x: 20, y: 560 } },
      { id: 'documents', position: { x: 20, y: 650 } },
      { id: 'balance', position: { x: 20, y: 740 } },
      { id: 'sugest', position: { x: 20, y: 830 } },
      { id: 'bus', position: { x: 20, y: 920 } },
      { id: 'calouroGuide', position: { x: 400, y: 300 } },
    ];
  }

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const leftColumn = 20;
  const iconSpacing = 90;

  // Calcula posição centralizada para o Guia do Calouro
  const centerX = Math.max(20, (screenWidth / 2) - 50);
  const centerY = Math.max(20, (screenHeight / 2) - 150);

  if (screenWidth >= 1024 && screenHeight >= 768) {
    const rightColumn = screenWidth - 120;

    return [
      { id: 'about', position: { x: leftColumn, y: 20 } },
      { id: 'courses', position: { x: leftColumn, y: 20 + iconSpacing } },
      { id: 'galeria', position: { x: leftColumn, y: 20 + iconSpacing * 2 } },
      { id: 'contact', position: { x: leftColumn, y: 20 + iconSpacing * 3 } },
      { id: 'forum', position: { x: leftColumn, y: 20 + iconSpacing * 4 } },
      { id: 'news', position: { x: leftColumn, y: 20 + iconSpacing * 5 } },
      { id: 'help', position: { x: leftColumn, y: 20 + iconSpacing * 6 } },
      { id: 'documents', position: { x: rightColumn, y: 20 } },
      { id: 'balance', position: { x: rightColumn, y: 20 + iconSpacing } },
      { id: 'sugest', position: { x: rightColumn, y: 20 + iconSpacing * 2 } },
      { id: 'bus', position: { x: rightColumn, y: 20 + iconSpacing * 3 } },
      { id: 'calouroGuide', position: { x: centerX, y: centerY } },
    ];
  }

  // Para telas menores
  return [
    { id: 'about', position: { x: leftColumn, y: 20 } },
    { id: 'courses', position: { x: leftColumn, y: 20 + iconSpacing } },
    { id: 'galeria', position: { x: leftColumn, y: 20 + iconSpacing * 2 } },
    { id: 'contact', position: { x: leftColumn, y: 20 + iconSpacing * 3 } },
    { id: 'forum', position: { x: leftColumn, y: 20 + iconSpacing * 4 } },
    { id: 'news', position: { x: leftColumn, y: 20 + iconSpacing * 5 } },
    { id: 'help', position: { x: leftColumn, y: 20 + iconSpacing * 6 } },
    { id: 'documents', position: { x: leftColumn, y: 20 + iconSpacing * 7 } },
    { id: 'balance', position: { x: leftColumn, y: 20 + iconSpacing * 8 } },
    { id: 'sugest', position: { x: leftColumn, y: 20 + iconSpacing * 9 } },
    { id: 'bus', position: { x: leftColumn, y: 20 + iconSpacing * 10 } },
    { id: 'calouroGuide', position: { x: centerX, y: centerY } },
  ];
};

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>(initialWindows);
  const [iconPositions, setIconPositions] = useState<IconPosition[]>(getInitialIconPositions());
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [highestZIndex, setHighestZIndex] = useState(1);
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIconPositions(getInitialIconPositions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openWindow = useCallback((id: string) => {
    setHighestZIndex(prev => {
      const newZ = prev + 1;
      setWindows(currentWindows => currentWindows.map(w =>
        w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: newZ } : w
      ));
      return newZ;
    });
    setActiveWindowId(id);
    setStartMenuOpen(false);
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isOpen: false, isMinimized: false, isMaximized: false } : w
    ));
    setActiveWindowId(null);
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMinimized: true } : w
    ));
    setActiveWindowId(null);
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMaximized: true } : w
    ));
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setHighestZIndex(prev => {
      const newZ = prev + 1;
      setWindows(currentWindows => currentWindows.map(w =>
        w.id === id ? { ...w, isMinimized: false, isMaximized: false, zIndex: newZ } : w
      ));
      return newZ;
    });
    setActiveWindowId(id);
  }, []);

  const focusWindow = useCallback((id: string) => {
    setHighestZIndex(prev => {
      const newZ = prev + 1;
      setWindows(currentWindows => currentWindows.map(w =>
        w.id === id ? { ...w, zIndex: newZ } : w
      ));
      return newZ;
    });
    setActiveWindowId(id);
    setStartMenuOpen(false);
  }, []);

  const updateWindowPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, position } : w
    ));
  }, []);

  const updateWindowSize = useCallback((id: string, size: { width: number; height: number }) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, size } : w
    ));
  }, []);

  const updateIconPosition = useCallback((id: string, position: { x: number; y: number }) => {
    setIconPositions(prev => prev.map(icon =>
      icon.id === id ? { ...icon, position } : icon
    ));
  }, []);

  return (
    <WindowsContext.Provider value={{
      windows,
      iconPositions,
      activeWindowId,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      focusWindow,
      updateWindowPosition,
      updateWindowSize,
      updateIconPosition,
      startMenuOpen,
      setStartMenuOpen
    }}>
      {children}
    </WindowsContext.Provider>
  );
}

export function useWindows() {
  const context = useContext(WindowsContext);
  if (!context) {
    throw new Error('useWindows must be used within a WindowsProvider');
  }
  return context;
}
