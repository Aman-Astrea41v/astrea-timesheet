import { LightningElement, track, wire } from 'lwc';
import { subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import MY_CHANNEL from '@salesforce/messageChannel/MyChannel__c';
import { getCookies, setCookies, removeCookies } from 'c/utils';

export default class Main extends LightningElement {
    @track width = window.innerWidth;
    @track isMobile = this.isMobileDevice();
    @track currentPage = this.isMobile ? 'noAccess' : 'login';

    subscription;
    boundUpdateWidth;

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                MY_CHANNEL,
                (message) => this.handleMessage(message)
            );
        }

        this.boundLogOutUser = this.logOutUser.bind(this);
        window.addEventListener('beforeunload', this.boundLogOutUser);


        this.boundUpdateWidth = this.updateWidth.bind(this);
        window.addEventListener('resize', this.boundUpdateWidth);

        this.updateWidth();
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.boundUpdateWidth);
        window.removeEventListener('beforeunload', this.boundLogOutUser);

        if (this.subscription) {
            unsubscribe(this.subscription);
            this.subscription = null;
        }

    }

    logOutUser(){
        setCookies('activeParent','login');
        removeCookies('uid');
        removeCookies('activeChild');
        removeCookies('email');
        this.currentPage = 'login';
    }

    isMobileDevice() {
        return (
            /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
            ) ||
            (navigator.maxTouchPoints && navigator.maxTouchPoints > 1) ||
            screen.width < 850
        );
    }

    updateWidth() {
        this.width = window.innerWidth;

        this.isMobile = this.isMobileDevice();

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
