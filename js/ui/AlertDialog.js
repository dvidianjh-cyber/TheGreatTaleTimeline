import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/+esm';

class AlertDialog {
    constructor() {
        this._modal = document.createElement('div');
        this._modal.className = 'import-modal'; // reuse modal styling
        this._modal.style.display = 'none';
        this._modal.style.zIndex = '600'; // Make sure it sits above other modals

        this._modal.innerHTML = `
            <div class="import-modal-backdrop"></div>
            <div class="import-modal-content" style="max-width: 400px; padding: var(--spacing-lg);">
                <div class="import-modal-header" style="margin-bottom: var(--spacing-md);">
                    <h2 id="alert-title" style="color: var(--accent-crimson);">Error</h2>
                    <button class="import-modal-close" id="alert-close-btn">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div style="margin-bottom: var(--spacing-lg); color: var(--text-secondary); line-height: 1.5; font-size: calc(14px * var(--base-font-size));" id="alert-message">
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <button class="toolbar-btn toolbar-btn--active" id="alert-ok-btn" style="padding: 8px 24px;">
                        OK
                    </button>
                </div>
            </div>
        `;

        // Wait until document is ready to append
        if (document.body) {
            document.body.appendChild(this._modal);
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(this._modal);
            });
        }

        this._modal.querySelector('.import-modal-backdrop').addEventListener('click', () => this.close());
        this._modal.querySelector('#alert-close-btn').addEventListener('click', () => this.close());
        this._modal.querySelector('#alert-ok-btn').addEventListener('click', () => this.close());
    }

    show(message, title = 'Notice') {
        this._modal.querySelector('#alert-title').textContent = title;
        this._modal.querySelector('#alert-message').textContent = message;
        this._modal.style.display = 'flex';
        
        if (window.lucide) window.lucide.createIcons();

        gsap.fromTo(this._modal.querySelector('.import-modal-content'),
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
        );
    }

    close() {
        gsap.to(this._modal.querySelector('.import-modal-content'), {
            opacity: 0, scale: 0.95, duration: 0.15,
            onComplete: () => { this._modal.style.display = 'none'; }
        });
    }
}

const alertDialog = new AlertDialog();
export default alertDialog;
