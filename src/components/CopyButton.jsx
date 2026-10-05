import { useEffect, useState } from 'react';

export default function CopyButton({ text, disabled }) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'copied' | 'failed'

  // Reset the label after a couple of seconds.
  useEffect(() => {
    if (status === 'idle') return undefined;
    const timer = setTimeout(() => setStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }

  const label =
    status === 'copied'
      ? 'Copied. Go make dough.'
      : status === 'failed'
        ? "Couldn't copy. Select the text instead."
        : 'Copy recipe';

  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled}
      className="whitespace-nowrap rounded-2xl bg-accent px-4 py-3 text-sm font-black text-espresso shadow-lg shadow-black/40 active:scale-95 disabled:opacity-40"
    >
      {label}
    </button>
  );
}
