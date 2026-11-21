/* =====================================================================
   MorphPDF - PWA layer
   Additive only; no changes to core logic. Provides:
     1. Service worker registration (+ update notification)
     2. Install experience: real beforeinstallprompt handling, honest
        button visibility, alternative instructions for iOS Safari
     3. Simple offline status banner
   ===================================================================== */

(function () {
    'use strict';

    /* ------------------------------------------------------------ */
    /* 1. Service worker registration                                */
    /* ------------------------------------------------------------ */

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                // Relative path -> correct /MorphPDF/ scope on GitHub Pages
                const reg = await navigator.serviceWorker.register('sw.js');
                // Notify the user when a new version is waiting
                reg.addEventListener('updatefound', () => {
                    const sw = reg.installing;
                    if (!sw) return;
                    sw.addEventListener('statechange', () => {
                        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateToast();
                        }
                    });
                });
            } catch (err) {
                console.warn('[MorphPDF] Service worker registration failed:', err);
            }
        });
    }

    let updateToastShown = false;
    function showUpdateToast() {
        if (updateToastShown) return;
        updateToastShown = true;
        if (typeof window.showToast === 'function') {
            window.showToast('Versi baru MorphPDF tersedia. Muat ulang halaman untuk memperbarui.');
        }
    }

    /* ------------------------------------------------------------ */
    /* 2. Install experience                                         */
    /* ------------------------------------------------------------ */

    const BTN_IDS = ['install-app-btn', 'install-app-mobile'];
    let deferredPrompt = null;

    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }

    function isIos() {
        return /iphone|ipad|ipod/i.test(navigator.userAgent);
    }

    function showButtons(mode) {
        // mode: 'prompt' (native dialog available) | 'manual' (iOS instructions)
        BTN_IDS.forEach((id) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.classList.remove('hidden');
            btn.dataset.mode = mode;
        });
    }

    function hideButtons() {
        BTN_IDS.forEach((id) => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.add('hidden');
        });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        // Real install support (Chromium desktop/Android). Prevent the mini-infobar
        // so the app controls when the dialog appears.
        e.preventDefault();
        deferredPrompt = e;
        if (!isStandalone()) showButtons('prompt');
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        hideButtons();
        if (typeof window.showToast === 'function') {
            window.showToast('MorphPDF berhasil dipasang di perangkat Anda.');
        }
    });

    async function handleInstallClick() {
        const btns = BTN_IDS.map((id) => document.getElementById(id)).filter(Boolean);
        const mode = btns.find((b) => !b.classList.contains('hidden'))?.dataset.mode;

        if (mode === 'prompt' && deferredPrompt) {
            deferredPrompt.prompt();
            try {
                const choice = await deferredPrompt.userChoice;
                if (choice.outcome !== 'accepted') deferredPrompt = null;
            } catch (err) { /* dialog dismissed */ }
            return;
        }

        if (mode === 'manual') {
            showIosInstructions();
        }
    }

    function showIosInstructions() {
        const existing = document.getElementById('ios-install-modal');
        if (existing) { existing.remove(); return; }

        const modal = document.createElement('div');
        modal.id = 'ios-install-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;';
        modal.innerHTML = `
            <div style="position:absolute;inset:0;background:rgba(48,45,40,.45);backdrop-filter:blur(3px);" data-close></div>
            <div style="position:relative;width:100%;max-width:420px;background:rgba(255,255,255,.94);border:1px solid #E5DED2;border-radius:14px;padding:22px;box-shadow:0 12px 32px rgba(48,45,40,.18);">
                <h2 style="font:700 17px Inter,sans-serif;color:#302D28;margin-bottom:6px;">Pasang MorphPDF di iOS</h2>
                <p style="font:500 12.5px/1.6 Inter,sans-serif;color:#777168;margin-bottom:14px;">
                    Safari di iPhone/iPad tidak menampilkan dialog instalasi otomatis. Gunakan fitur Add to Home Screen:
                </p>
                <ol style="font:550 13px/1.9 Inter,sans-serif;color:#302D28;padding-left:20px;">
                    <li>Ketuk ikon <strong>Share</strong> (kotak dengan panah ke atas)</li>
                    <li>Pilih <strong>Add to Home Screen</strong></li>
                    <li>Ketuk <strong>Add</strong> di pojok kanan atas</li>
                </ol>
                <div style="display:flex;justify-content:flex-end;margin-top:16px;">
                    <button type="button" data-close style="padding:8px 16px;font:600 12.5px Inter,sans-serif;color:#302D28;background:#F2E2CC;border:0;border-radius:8px;cursor:pointer;">Mengerti</button>
                </div>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target.closest('[data-close]')) modal.remove();
        });
        document.body.appendChild(modal);
    }

    function initInstallButtons() {
        BTN_IDS.forEach((id) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleInstallClick();
            });
        });

        // iOS Safari never fires beforeinstallprompt - offer manual instructions
        if (isIos() && !isStandalone()) {
            window.addEventListener('load', () => showButtons('manual'));
        }

        // Already installed: keep buttons hidden
        if (isStandalone()) hideButtons();
    }

    /* ------------------------------------------------------------ */
    /* 3. Offline status banner                                      */
    /* ------------------------------------------------------------ */

    function injectOfflineBanner() {
        if (document.getElementById('mp-offline-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'mp-offline-banner';
        banner.setAttribute('role', 'status');
        banner.style.cssText = [
            'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:120',
            'padding:10px 16px', 'text-align:center',
            'font:600 12.5px Inter,system-ui,sans-serif',
            'color:#2F2213', 'background:#F2E2CC',
            'border-top:1px solid #EFD7AF'
        ].join(';');
        banner.innerHTML = '<i class="fa-solid fa-wifi" style="margin-right:8px;"></i>Anda sedang offline. Tools yang sudah dimuat tetap bisa digunakan.';
        document.body.appendChild(banner);
    }

    function removeOfflineBanner() {
        const banner = document.getElementById('mp-offline-banner');
        if (banner) banner.remove();
    }

    function initOfflineBanner() {
        window.addEventListener('offline', injectOfflineBanner);
        window.addEventListener('online', removeOfflineBanner);
        if (!navigator.onLine) injectOfflineBanner();
    }

    /* ------------------------------------------------------------ */

    function init() {
        initInstallButtons();
        initOfflineBanner();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
