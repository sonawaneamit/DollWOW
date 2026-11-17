'use client';

import { useState } from 'react';

export default function PromoCode({ code }: { code: string }) {
  const [status, setStatus] = useState('');
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="rounded-md border border-current px-3 py-2 text-sm font-semibold">{code}</span>
      <button type="button" className="rounded-md border border-current min-h-11 px-3 py-2 text-sm" onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setStatus('Copied');
        } catch {
          setStatus('Select the code to copy it.');
        }
      }}>Copy code</button>
      <span aria-live="polite" className="text-xs">{status}</span>
    </div>
  );
}
