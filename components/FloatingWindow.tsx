import React, { useState, useRef, useEffect } from 'react';

interface FloatingWindowProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    defaultX?: number;
    defaultY?: number;
    defaultWidth?: number;
    defaultHeight?: number;
    minWidth?: number;
    minHeight?: number;
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({
    title, isOpen, onClose, children,
    defaultX = 100, defaultY = 100,
    defaultWidth = 580, defaultHeight = 450,
    minWidth = 350, minHeight = 250
}) => {
    const [pos, setPos] = useState({ x: defaultX, y: defaultY });
    const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
    const windowRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
    const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Keep window within bounds when it opens
    useEffect(() => {
        if (!isOpen) return;
        const x = Math.max(10, Math.min(window.innerWidth - size.width - 10, pos.x));
        const y = Math.max(10, Math.min(window.innerHeight - size.height - 10, pos.y));
        if (x !== pos.x || y !== pos.y) {
            setPos({ x, y });
        }
    }, [isOpen]);

    // Handle window-level pointer movements for smooth drag & resize
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handlePointerMove = (e: PointerEvent) => {
            if (isDragging && dragStartRef.current) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                const nextX = Math.max(0, Math.min(window.innerWidth - size.width, dragStartRef.current.posX + dx));
                const nextY = Math.max(0, Math.min(window.innerHeight - size.height, dragStartRef.current.posY + dy));
                setPos({ x: nextX, y: nextY });
            }

            if (isResizing && resizeStartRef.current) {
                const dx = e.clientX - resizeStartRef.current.x;
                const dy = e.clientY - resizeStartRef.current.y;
                const nextW = Math.max(minWidth, Math.min(window.innerWidth - pos.x, resizeStartRef.current.w + dx));
                const nextH = Math.max(minHeight, Math.min(window.innerHeight - pos.y, resizeStartRef.current.h + dy));
                setSize({ width: nextW, height: nextH });
            }
        };

        const handlePointerUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            dragStartRef.current = null;
            resizeStartRef.current = null;
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging, isResizing, pos.x, pos.y, size.width, size.height, minWidth, minHeight]);

    if (!isOpen) return null;

    const handleHeaderPointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.preventDefault();
        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            posX: pos.x,
            posY: pos.y
        };
        setIsDragging(true);
    };

    const handleResizePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            w: size.width,
            h: size.height
        };
        setIsResizing(true);
    };

    return (
        <div 
            ref={windowRef}
            style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${size.width}px`,
                height: `${size.height}px`,
            }}
            className="absolute bg-black border-2 border-zinc-500 flex flex-col z-50 shadow-2xl select-none"
        >
            {/* Header / Drag Bar */}
            <div 
                onPointerDown={handleHeaderPointerDown}
                className="flex justify-between items-center bg-zinc-900 border-b border-zinc-700 px-4 py-2 cursor-move hover:bg-zinc-800/80 transition-colors"
            >
                <span className="font-bold text-[10px] tracking-widest text-zinc-300 uppercase">{title}</span>
                <button 
                    onClick={onClose}
                    className="text-zinc-400 hover:text-white hover:bg-red-950/40 border border-transparent hover:border-red-800 px-2 py-0.5 text-[9px] font-bold uppercase transition-colors"
                >
                    CLOSE
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 _scroll-thin">
                {children}
            </div>

            {/* Resize Corner Handle */}
            <div 
                onPointerDown={handleResizePointerDown}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-50"
            >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-600 opacity-60">
                    <line x1="6" y1="0" x2="0" y2="6" />
                    <line x1="8" y1="2" x2="2" y2="8" />
                </svg>
            </div>
        </div>
    );
};
