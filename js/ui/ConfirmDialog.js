import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/+esm';

class ConfirmDialog {
    constructor() {
        this._modal = document.createElement('div');
        this._modal.className = 'import-modal'; // reuse modal styling
        this._modal.style.display = 'none';
        this._modal.style.zIndex = '600'; // Make sure it sits above other modals

        this._modal.innerHTML = `
            <div class="import-modal-backdrop"></div>
            <div class="import-modal-content" style="max-width: 400px; padding: var(--spacing-lg);">
                <div class="import-modal-header" style="margin-bottom: var(--spacing-md);">
                    <h2 id="confirm-title" style="color: var(--text-primary);">Confirm</h2>
                    <button class="import-modal-close" id="confirm-close-btn">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div style="margin-bottom: var(--spacing-lg); color: var(--text-secondary); line-height: 1.5; font-size: calc(14px * var(--base-font-size));" id="confirm-message">
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="btn-secondary" id="confirm-cancel-btn">
                        Cancel
                    </button>
                    <button class="btn-primary" id="confirm-ok-btn" style="padding: 8px 24px;">
                        OK
                    </button>
                </div>
            </div>
        `;

        if (document.body) {
            document.body.appendChild(this._modal);
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(this._modal);
            });
        }
        
        this._resolver = null;

        this._modal.querySelector('.import-modal-backdrop').addEventListener('click', () => this._resolve(false));
        this._modal.querySelector('#confirm-close-btn').addEventListener('click', () => this._resolve(false));
        this._modal.querySelector('#confirm-cancel-btn').addEventListener('click', () => this._resolve(false));
        this._modal.querySelector('#confirm-ok-btn').addEventListener('click', () => this._resolve(true));
    }

    show(message, title = 'Confirm') {
        return new Promise((resolve) => {
            this._resolver = resolve;
            this._modal.querySelector('#confirm-title').textContent = title;
            this._modal.querySelector('#confirm-message').textContent = message;
            this._modal.style.display = 'flex';
            
            if (window.lucide) window.lucide.createIcons();

            gsap.fromTo(this._modal.querySelector('.import-modal-content'),
                { opacity: 0, scale: 0.9 },
                { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
            );
        });
    }

    _resolve(value) {
        if (this._resolver) {
            this._resolver(value);
            this._resolver = null;
        }
        this.close();
    }

    close() {
        gsap.to(this._modal.querySelector('.import-modal-content'), {
            opacity: 0, scale: 0.95, duration: 0.15,
            onComplete: () => { this._modal.style.display = 'none'; }
        });
    }
}

const confirmDialog = new ConfirmDialog();
export default confirmDialog;
