'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';

export default function UploadPanel({ onAddImage }: { onAddImage: (url: string) => void | Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const open = async (file?: File) => {
    if (!file || busy) return;
    setError('');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('Use PNG, JPEG or WebP in the editor. Send vector and production files with your quote request.'); return; }
    if (file.size > 3 * 1024 * 1024) { setError('Choose an image up to 3 MB so it can travel with your editable design.'); return; }
    setBusy(true);
    try {
      // Embed the asset, so reloads and downloaded design files never depend on an expired blob URL.
      const url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not read this image.')); reader.readAsDataURL(file); });
      await onAddImage(url);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not add this image.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <div className="space-y-4">
    <input ref={input} aria-label="Choose an image" type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { void open(e.target.files?.[0]); }} />
    <button disabled={busy} onClick={() => input.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void open(e.dataTransfer.files[0]); }} className="w-full min-h-36 p-5 rounded-xl border-2 border-dashed border-gray-500 text-white hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400">
      {busy ? 'Opening image…' : 'Choose or drop an image'}<span className="block mt-2 text-xs text-gray-300">PNG, JPEG or WebP · up to 3 MB</span>
    </button>
    {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
    <p className="text-xs text-gray-300 leading-relaxed">Use the highest-resolution original you have. Enlarging a small image can soften print detail. Images are embedded in your editable backup; save a backup before leaving this device.</p>
    <Link href="/artwork-templates" className="text-sm text-amber-300 underline">Preparing vector or production artwork?</Link>
  </div>;
}
