import { LightningElement, wire } from 'lwc';
import { subscribe,MessageContext,unsubscribe } from 'lightning/messageService';
import TOAST_MESSAGE_CHANNEL from '@salesforce/messageChannel/ToastMessage__c';

export default class Toast extends LightningElement {
    toasts = [];
    toastIdCounter = 0;
    subscription;

    @wire(MessageContext)
    messageContext;

    connectedCallback(){
        if(!this.subscription){
            this.subscription = subscribe(
                this.messageContext,
                TOAST_MESSAGE_CHANNEL,
                (message) => this.showToast(message.title,message.message,message.variant)
            );
        }
    }

    disconnectedCallback() {
        if (this.subscription) {
            unsubscribe(this.subscription);
            this.subscription = null;
        }
    }


    showToast(title, message, variant = 'info',duration = 3000) {
        const toastId = this.toastIdCounter++;
        const toast = {
            id: toastId,
            title,
            message,
            variant,
            icon: this.getIcon(variant),
            show: false,
            duration: duration
        };

        this.toasts = [...this.toasts, toast];

        // Trigger animation after DOM update
        setTimeout(() => {
            const toastElement = this.template.querySelector(`[data-id="${toastId}"]`);
            if (toastElement) {
                toastElement.classList.add('show');
                
                // Start progress bar animation
                const progressBar = toastElement.querySelector('.progress-bar');
                if (progressBar && duration > 0) {
                    progressBar.style.animation = `progress ${duration}ms linear forwards`;
                }
            }
        }, 10);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismissToast(toastId);
            }, duration);
        }
    }

    getIcon(variant) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[variant] || icons.info;
    }

    dismissToast(toastId) {
        const toastElement = this.template.querySelector(`[data-id="${toastId}"]`);
        if (toastElement) {
            toastElement.classList.remove('show');
            toastElement.classList.add('hide');

            setTimeout(() => {
                this.toasts = this.toasts.filter(t => t.id !== toastId);
            }, 300);
        }
    }

    handleClose(event) {
        const toastId = parseInt(event.currentTarget.dataset.id, 10);
        this.dismissToast(toastId);
    }

    get hasToasts() {
        return this.toasts.length > 0;
    }
}