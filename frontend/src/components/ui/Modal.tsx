import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  closeOnBackdropClick = true,
  hideCloseButton = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnBackdropClick) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnBackdropClick]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop overlay click to close */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (closeOnBackdropClick) onClose();
        }}
      />
      <div
        className={cn(
          'relative w-full max-w-lg rounded-3xl bg-white/95 border border-slate-200/90 p-6 sm:p-7 shadow-2xl shadow-slate-900/15 text-slate-900 animate-in zoom-in-95 duration-200 glass-card z-10',
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-5">
          <h3 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2 font-serif-classic">
            {title}
          </h3>
          {!hideCloseButton && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};



