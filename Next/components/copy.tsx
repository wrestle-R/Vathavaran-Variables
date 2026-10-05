'use client';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
export function CopyButton({ value, label = 'Copy command' }: { value: string; label?: string }) {
  const [message, setMessage] = useState('');
  async function copy() {
    try { await navigator.clipboard.writeText(value); setMessage('Copied'); setTimeout(() => setMessage(''), 2000); }
    catch { setMessage('Clipboard unavailable'); }
  }
  return <button className="copy-button" onClick={copy} aria-label={label}>{message === 'Copied' ? <Check size={16}/> : <Copy size={16}/>}<span role="status">{message}</span></button>;
}
