"use client";

import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import styles from './success-popup.module.css';

export function SuccessPopup({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return <div className={styles.popup} role="status" aria-live="polite">
    <CheckCircle2 size={22} aria-hidden="true" />
    <span>{message}</span>
    <button type="button" aria-label="Cerrar aviso" onClick={onClose}><X size={18} /></button>
  </div>;
}
