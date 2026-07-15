import { useEffect, useState } from 'react';

/** A calm, app-native alternative to the browser's blocking update confirm. */
export function PwaUpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;

    void import('~/utils/serviceWorker').then(({ serviceWorkerManager }) => {
      return serviceWorkerManager.register({
        onUpdate: () => {
          if (active) setUpdateReady(true);
        },
      });
    }).catch((error) => console.warn('Service worker registration failed:', error));

    return () => { active = false; };
  }, []);

  if (!updateReady || dismissed) return null;

  return (
    <aside
      className="fixed inset-x-3 bottom-20 z-[80] mx-auto max-w-md rounded-2xl border border-accent-gold/30 bg-secondary-950/95 p-4 text-white shadow-modal backdrop-blur-xl sm:bottom-6"
      role="status"
      aria-live="polite"
      aria-label="Actualizare disponibilă"
    >
      <p className="text-sm font-semibold">O versiune mai bună este pregătită</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-300">Actualizează când ești gata. Nu vei pierde pagina pe care o privești.</p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button type="button" onClick={() => setDismissed(true)} className="min-h-10 rounded-xl px-3 text-sm font-semibold text-gray-300 transition hover:bg-white/5 hover:text-white">
          Mai târziu
        </button>
        <button
          type="button"
          onClick={() => {
            void import('~/utils/serviceWorker').then(({ serviceWorkerManager }) => serviceWorkerManager.skipWaiting());
          }}
          className="min-h-10 rounded-xl bg-gold-gradient px-4 text-sm font-bold text-secondary-900 transition hover:brightness-110"
        >
          Actualizează
        </button>
      </div>
    </aside>
  );
}
