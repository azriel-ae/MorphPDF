/* =====================================================================
   MorphPDF - Shell Enhancements
   Additive only: never overrides or rewrites core logic in script.js /
   pdf-tools.js / excel-tools.js. Provides:
     1. Tool search on the homepage directory
     2. "Recently used" tools (localStorage, wrapped around existing
        navigation functions so every entry point is tracked)
     3. PDF workspace breadcrumb sync
     4. Footer year
   ===================================================================== */

(function () {
    'use strict';

    /* ---------------------------------------------------------------- */
    /* 1. Tool search                                                    */
    /* ---------------------------------------------------------------- */

    function initToolSearch() {
        const input = document.getElementById('tool-search');
        const clearBtn = document.getElementById('tool-search-clear');
        const emptyNote = document.getElementById('tool-search-empty');
        if (!input) return;

        const cards = Array.from(document.querySelectorAll('.tool-card[data-search]'));
        const groups = Array.from(document.querySelectorAll('[data-tool-group]'));

        function applyFilter() {
            const q = input.value.trim().toLowerCase();
            if (clearBtn) clearBtn.classList.toggle('is-visible', q.length > 0);

            let anyVisible = false;
            cards.forEach(card => {
                const hay = ((card.dataset.search || '') + ' ' + card.textContent).toLowerCase();
                const show = !q || hay.indexOf(q) !== -1;
                card.classList.toggle('hidden', !show);
                if (show) anyVisible = true;
            });

            // Hide a group's header only when none of its cards are visible.
            groups.forEach(el => {
                if (el.classList.contains('tool-card')) return; // card containers handled above
                // Header rule elements precede their grid; find sibling grid
                const grid = el.nextElementSibling;
                if (!grid) return;
                const visibleCards = Array.from(grid.querySelectorAll('.tool-card:not(.hidden)'));
                el.classList.toggle('hidden', visibleCards.length === 0);
            });

            if (emptyNote) emptyNote.classList.toggle('hidden', anyVisible || !q);
        }

        input.addEventListener('input', applyFilter);
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                input.value = '';
                applyFilter();
                input.focus();
            });
        }
    }

    /* ---------------------------------------------------------------- */
    /* 2. Recently used tools                                            */
    /* ---------------------------------------------------------------- */

    const RECENT_KEY = 'morphpdf-recent-tools';
    const RECENT_MAX = 4;

    const TOOL_LABELS = {
        photo:            { name: 'Photo Editor',    icon: 'fa-image' },
        converter:        { name: 'Image Converter', icon: 'fa-file-arrow-down' },
        excel:            { name: 'File to Excel',   icon: 'fa-file-excel' },
        'image-to-pdf':   { name: 'Image to PDF',    icon: 'fa-images' },
        'pdf-to-image':   { name: 'PDF to Image',    icon: 'fa-file-image' },
        'merge-pdf':      { name: 'Merge PDF',       icon: 'fa-object-group' },
        'split-pdf':      { name: 'Split PDF',       icon: 'fa-scissors' },
        'compress-pdf':   { name: 'Compress PDF',    icon: 'fa-compress' }
    };

    function readRecent() {
        try {
            const raw = localStorage.getItem(RECENT_KEY);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr.filter(k => TOOL_LABELS[k]) : [];
        } catch (e) { return []; }
    }

    function writeRecent(list) {
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
    }

    function recordRecent(key) {
        if (!TOOL_LABELS[key]) return;
        const list = readRecent().filter(k => k !== key);
        list.unshift(key);
        writeRecent(list.slice(0, RECENT_MAX));
        renderRecent();
    }

    function renderRecent() {
        const section = document.getElementById('recent-tools');
        const listEl = document.getElementById('recent-tools-list');
        if (!section || !listEl) return;

        const items = readRecent();
        if (!items.length) { section.classList.add('hidden'); return; }

        listEl.innerHTML = '';
        items.forEach(key => {
            const meta = TOOL_LABELS[key];
            if (!meta) return;
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'mp-recent-chip';
            const isPdfTool = key.indexOf('-pdf') !== -1;
            chip.innerHTML = '<i class="fa-solid ' + meta.icon + '"></i> ' + meta.name;
            chip.addEventListener('click', function () {
                if (isPdfTool && typeof window.selectPdfTool === 'function') {
                    window.selectPdfTool(key);
                } else if (typeof window.switchMainView === 'function') {
                    window.switchMainView(key);
                }
            });
            listEl.appendChild(chip);
        });
        section.classList.remove('hidden');
    }

    /* Wrap navigation entry points AFTER core scripts have loaded,
       preserving their original behaviour. */
    function wrapNavigation() {
        if (typeof window.switchMainView === 'function') {
            const origView = window.switchMainView;
            window.switchMainView = function (view) {
                if (view !== 'home') recordRecent(view);
                return origView.apply(this, arguments);
            };
        }
        if (typeof window.selectPdfTool === 'function') {
            const origPdf = window.selectPdfTool;
            window.selectPdfTool = function (toolKey) {
                recordRecent(toolKey);
                const crumb = document.getElementById('pdf-crumb-tool');
                if (crumb && TOOL_LABELS[toolKey]) crumb.textContent = TOOL_LABELS[toolKey].name;
                return origPdf.apply(this, arguments);
            };
        }
    }

    /* ---------------------------------------------------------------- */
    /* 3. Footer year                                                    */
    /* ---------------------------------------------------------------- */

    function initFooterYear() {
        const el = document.getElementById('footer-year');
        if (el) el.textContent = String(new Date().getFullYear());
    }

    /* ---------------------------------------------------------------- */

    function init() {
        initToolSearch();
        renderRecent();
        initFooterYear();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    // Wrap after all core scripts are parsed (this file is loaded last).
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', wrapNavigation);
    } else {
        wrapNavigation();
    }
})();
