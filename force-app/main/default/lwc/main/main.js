import { LightningElement, track, wire } from 'lwc';
import { subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import MY_CHANNEL from '@salesforce/messageChannel/MyChannel__c';

export default class Main extends LightningElement {
    @track width = window.innerWidth;
    @track isMobile = window.innerWidth < 850;
    @track currentPage = window.innerWidth < 850 ? 'noAccess' : 'login';

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

        // Fix: bind the method once and use it
        this.boundUpdateWidth = this.updateWidth.bind(this);
        window.addEventListener('resize', this.boundUpdateWidth);

        // Ensure correct state at mount
        this.updateWidth();
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.boundUpdateWidth);

        if (this.subscription) {
            unsubscribe(this.subscription);
            this.subscription = null;
        }
    }

    updateWidth() {
        this.width = window.innerWidth;
        const mobile = this.width < 850;

        this.isMobile = mobile;

        if (mobile) {
            this.currentPage = 'noAccess';
        } else if (!mobile && (!this.currentPage || this.currentPage === 'noAccess')) {
            this.currentPage = 'login';
        }
    }

    handleMessage(message) {
        if (message.type === 'PAGE' && !this.isMobile) {
            this.currentPage = message.page;
        }
    }

    navigatePage(event) {
        this.currentPage = event.detail;
    }

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
