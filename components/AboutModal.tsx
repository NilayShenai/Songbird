import React from 'react';
import { MODAL } from '../data/constants';
import { useModalDismiss } from '../hooks/useModalDismiss';

interface AboutModalProps { isOpen: boolean; onClose: () => void; }

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
    const { handleOverlayPointerDown, handleOverlayClick, handlePanelPointerDown, handlePanelClick } =
        useModalDismiss({ isOpen, onClose, overlayCloseCooldownMs: 180 });

    if (!isOpen) return null;
    
    const LinkRow = ({ label, href, text }: { label: string, href: string, text: string }) => (
        <div className="flex justify-between items-center group">
            <span className="_t-modal-footnote-white">{label}</span>
            <a href={href} target="_blank" rel="noreferrer" className="_t-link">{text}</a>
        </div>
    );

    return (
        <div className={MODAL.LAYOUT.OVERLAY} onPointerDown={handleOverlayPointerDown} onClick={handleOverlayClick}>
             <div className={`${MODAL.LAYOUT.PANEL} w-full max-w-md`} onPointerDown={handlePanelPointerDown} onClick={handlePanelClick}>
                 <div className={MODAL.LAYOUT.HEADER}>
                     <span className={MODAL.TYPO.TITLE}>ABOUT PROJECT</span>
                     <button onClick={onClose} className="_c-btn-close">CLOSE</button>
                 </div>
                 <div className={MODAL.LAYOUT.BODY}>
                    <div className={`${MODAL.TYPO.BODY} space-y-4 text-left`}>
                        <p>SONGBIRD is an advanced hybrid polyphonic synthesizer designed for creating rich industrial noise, cinematic drone textures, and immersive lo-fi soundscapes. Combining dual-oscillator subtractive synthesis with deep cross-modulation routing, an assignable coordinate matrix, and a customizable effects chain, it bridges analog character with digital flexibility.</p>
                        <p>Refined for high-density sound design and tactile performance control, the platform serves as an open-source testbed for modern web audio architectures. Contributions, feedback, and collaborative refinements are highly welcomed.</p>
                        <p>SONGBIRD is open source under the MIT License.</p>
                    </div>
                 </div>
                 <div className={MODAL.LAYOUT.FOOTER}>
                     <div className="flex-1 space-y-3">
                         <LinkRow label="SOURCE" href="https://github.com/NilayShenai/Songbird" text="GITHUB" />
                         <LinkRow label="INSTAGRAM" href="https://www.instagram.com/nilay_shenai/" text="@nilay_shenai" />
                     </div>
                 </div>
             </div>
        </div>
    );
};

export default AboutModal;
