'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
  { id: 'projects', title: 'Projetos', icon: 'icons-95/directory_program_group.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 150, y: 60 }, size: { width: 550, height: 420 } },
  { id: 'contact', title: 'Contato', icon: 'icons-95/phone_desk.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 200, y: 100 }, size: { width: 450, height: 400 } },
  { id: 'documents', title: 'Documentos', icon: 'icons-95/notepad_file.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 80, y: 90 }, size: { width: 520, height: 420 } },
  { id: 'help', title: 'FAQ - Perguntas Frequentes', icon: 'icons-95/help_question_mark.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 120, y: 70 }, size: { width: 500, height: 450 } },
  { id: 'calouroGuide', title: 'Guia do Calouro', icon: 'icons-95/user_world.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 600, y: 250 }, size: { width: 700, height: 500 } },
  { id: 'sugest', title: 'Sugestões', icon: 'icons-95/message_envelope_open.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 300, y: 150 }, size: { width: 600, height: 400 } },
  { id: 'balance', title: 'Balancetes', icon: 'icons-95/calculator.ico', isOpen: false, isMinimized: false, isMaximized: false, zIndex: 0, position: { x: 400, y: 120 }, size: { width: 600, height: 450 } },
];

const initialIconPositions: IconPosition[] = [
  { id: 'about', position: { x: 20, y: 20 } },
  { id: 'courses', position: { x: 20, y: 110 } },
  { id: 'projects', position: { x: 20, y: 200 } },
  { id: 'contact', position: { x: 20, y: 290 } },
  { id: 'documents', position: { x: 20, y: 380 } },
  { id: 'help', position: { x: 20, y: 470 } },
  { id: 'sugest', position: { x: 20, y: 800 } },
  { id: 'balance', position: { x: 20, y: 560 } },
  { id: 'calouroGuide', position: { x: 800, y: 250 } },
];

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowState[]>(initialWindows);
  const [iconPositions, setIconPositions] = useState<IconPosition[]>(initialIconPositions);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [highestZIndex, setHighestZIndex] = useState(1);
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  const openWindow = useCallback((id: string) => {
    setHighestZIndex(prev => prev + 1);
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isOpen: true, isMinimized: false, zIndex: highestZIndex + 1 } : w
    ));
    setActiveWindowId(id);
    setStartMenuOpen(false);
  }, [highestZIndex]);

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
    setHighestZIndex(prev => prev + 1);
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMinimized: false, isMaximized: false, zIndex: highestZIndex + 1 } : w
    ));
    setActiveWindowId(id);
  }, [highestZIndex]);

  const focusWindow = useCallback((id: string) => {
    setHighestZIndex(prev => prev + 1);
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, zIndex: highestZIndex + 1 } : w
    ));
    setActiveWindowId(id);
    setStartMenuOpen(false);
  }, [highestZIndex]);

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
