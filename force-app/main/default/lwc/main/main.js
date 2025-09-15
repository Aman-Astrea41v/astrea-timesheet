import { LightningElement, track, wire } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import MY_CHANNEL from "@salesforce/messageChannel/MyChannel__c";


export default class Main extends LightningElement {
    @track currentPage = 'login';

    @wire(MessageContext)
    MessageContext;

    connectedCallback(){
        subscribe(this.MessageContext, MY_CHANNEL, (message) => {
            this.currentPage = message.page;
        });
    }

    navigatePage(event){
        this.currentPage = event.detail;
    }

    get isLogin(){
        return this.currentPage === 'login';
    }

    get isSignup(){
        return this.currentPage === 'signup';
    }

    get isHome(){
        return this.currentPage === 'home';
    }

}