import { LightningElement, track, wire } from 'lwc';
import { subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import MY_CHANNEL from '@salesforce/messageChannel/MyChannel__c';
import { getCookies } from 'c/utils';

export default class Main extends LightningElement {
    @track width = window.innerWidth;
    @track isMobile = this.isMobileDevice() || window.innerWidth < 850;
    @track currentPage = this.isMobile ? 'noAccess' : 'login';

    subscription;
    boundUpdateWidth;

    @wire(MessageContext)
    MessageContext;

    connectedCallback() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.MessageContext,
                MY_CHANNEL,
                (message) => this.handleMessage(message)
            );
        }

        this.boundUpdateWidth = this.updateWidth.bind(this);
        window.addEventListener('resize', this.boundUpdateWidth);

        this.updateWidth();
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.boundUpdateWidth);

        if (this.subscription) {
            unsubscribe(this.subscription);
            this.subscription = null;
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    }

    updateWidth() {
        this.width = window.innerWidth;

        this.isMobile = this.isMobileDevice() || this.width < 850;

        if (this.isMobile) {
            this.currentPage = 'noAccess';
            return;
        }

        if (this.currentPage === 'newPassword') {
            return;
        }

        const activePage = getCookies('activeParent');
        this.currentPage = activePage || 'login';
    }

    handleMessage(message) {
        if (message.type === 'PAGE' && !this.isMobile) {
            this.currentPage = message.page;
        }
    }

    navigatePage(event) {
        this.currentPage = event.detail;
    }

    // Template getters
    get isLogin() {
        return !this.isMobile && this.currentPage === 'login';
    }
    get isHome() {
        return !this.isMobile && this.currentPage === 'home';
    }
    get isVerifyMail() {
        return !this.isMobile && this.currentPage === 'forgetPassword';
    }
    get isNewPassword() {
        return !this.isMobile && this.currentPage === 'newPassword';
    }
}
