
import React, { useMemo, useRef, useState } from 'react';
import { AssignTargets, LfoTarget, AssignPadState } from '../types';
import { TEXTS, TARGET_GROUPS } from '../data/constants';
import { Label, Select, Fader, Row, Value, SubSectionTitle } from './library/Controls';

interface MatrixPadProps {
    label: string;
    xLabel: string;
    yLabel: string;
    xValue: number;
    yValue: number;
    xTarget: LfoTarget;
    yTarget: LfoTarget;
    sensitivity: number;
    allowedTargets: readonly LfoTarget[];
    allAssignTargets: AssignTargets;
    onChange: (x: number, y: number, isInstant?: boolean) => void;
    onSensitivityChange: (val: number) => void;
    onAssignX: (target: LfoTarget) => void;
    onAssignY: (target: LfoTarget) => void;
    onGateTrigger: (isOpen: boolean, isInstant?: boolean) => void;
}

const MatrixPad: React.FC<MatrixPadProps> = React.memo(({
    label, xLabel, yLabel, xValue, yValue, xTarget, yTarget, sensitivity, allowedTargets, allAssignTargets,
    onChange, onSensitivityChange, onAssignX, onAssignY, onGateTrigger
}) => {
    const padRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        setIsDragging(true);
        if (padRef.current) {
            const rect = padRef.current.getBoundingClientRect();
            updateValues(e.clientX, e.clientY, rect, true);
        }
        try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch (err) {}
        if (onGateTrigger) onGateTrigger(true, true);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        if (padRef.current) {
            const rect = padRef.current.getBoundingClientRect();
            updateValues(e.clientX, e.clientY, rect, false);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
        if (isDragging) {
            setIsDragging(false);
            if (onGateTrigger) onGateTrigger(false, false);
        }
    };

    const updateValues = (clientX: number, clientY: number, rect: DOMRect, isInstant: boolean) => {
        let pctX = (clientX - rect.left) / rect.width;
        let pctY = 1 - ((clientY - rect.top) / rect.height);
        pctX = Math.max(0, Math.min(1, pctX));
        pctY = Math.max(0, Math.min(1, pctY));
        onChange(Math.round(pctX * 1024), Math.round(pctY * 1024), isInstant);
    };

    const xPos = (xValue / 1024) * 100;
    const yPos = 100 - ((yValue / 1024) * 100);

    const renderOptions = useMemo(() => {
        return (currentValue: string) => {
            return (
                <>
                    <option value="none" className="text-zinc-500 bg-black">NONE</option>
                    {TARGET_GROUPS.map(g => {
                        const opts = allowedTargets.filter(t => g.check(t));
                        if (opts.length === 0) return null;
                        return (
                            <optgroup key={g.label} label={g.label} className="font-bold text-zinc-500 bg-zinc-900">
                                {opts.map(t => (
                                    <option key={t} value={t} className="text-zinc-300 bg-black font-normal">
                                        {TEXTS.options.lfoTargets[t as LfoTarget]}
                                    </option>
                                ))}
                            </optgroup>
                        );
                    })}
                </>
            );
        };
    }, [allAssignTargets, allowedTargets]);

    return (
        <div className="border border-zinc-400 p-3 flex flex-col gap-2 _b-panel h-full">
            <SubSectionTitle className="!mb-1 border-b border-zinc-800 pb-1">{label}</SubSectionTitle>
            
            <div className="flex gap-4 items-center">
                {/* Compact XY Pad Area */}
                <div className="flex flex-col gap-1 items-center">
                    <div 
                        ref={padRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        className="relative w-[100px] h-[100px] border border-zinc-800 cursor-crosshair touch-none bg-[#09090b]"
                        style={{
                            backgroundImage: 'radial-gradient(var(--color-border-dim) 1px, transparent 1px)',
                            backgroundSize: '10px 10px'
                        }}
                    >
                        {/* Axis Lines */}
                        <div className="absolute top-0 bottom-0 border-l border-zinc-700/80 pointer-events-none" style={{ left: `${xPos}%` }} />
                        <div className="absolute left-0 right-0 border-t border-zinc-700/80 pointer-events-none" style={{ top: `${yPos}%` }} />
                        
                        {/* Cursor square dot */}
                        <div className="absolute w-3 h-3 bg-zinc-300 border border-black transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: `${xPos}%`, top: `${yPos}%` }} />
                    </div>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">{xValue} / {yValue}</span>
                </div>

                {/* Controls Area (Right) */}
                <div className="flex-grow flex flex-col gap-2 min-w-0">
                    <div>
                        <Label className="block text-[9px] mb-0.5">{TEXTS.pads.assignX}</Label>
                        <Select value={xTarget} onChange={v => onAssignX(v as LfoTarget)} className="h-[22px] text-[8px] font-bold">
                            {renderOptions(xTarget)}
                        </Select>
                    </div>
                    <div>
                        <Label className="block text-[9px] mb-0.5">{TEXTS.pads.assignY}</Label>
                        <Select value={yTarget} onChange={v => onAssignY(v as LfoTarget)} className="h-[22px] text-[8px] font-bold">
                            {renderOptions(yTarget)}
                        </Select>
                    </div>
                    <div>
                        <Row className="mb-0.5"><Label className="text-[9px]">SENS</Label><Value className="text-[9px]">{Math.round(sensitivity / 10.24)}%</Value></Row>
                        <Fader value={sensitivity} onChange={onSensitivityChange} className="h-[14px]" />
                    </div>
                </div>
            </div>
        </div>
    );
});

export default MatrixPad;
