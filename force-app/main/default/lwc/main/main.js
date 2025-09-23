import { LightningElement, track, wire } from 'lwc';
import { subscribe, MessageContext } from 'lightning/messageService';
import MY_CHANNEL from "@salesforce/messageChannel/MyChannel__c";
import { getCookies } from 'c/utils';


export default class Main extends LightningElement {
    @track currentPage = 'forgetPassword';
    subscription;
    @wire(MessageContext)
    MessageContext;

    connectedCallback(){
        if(!this.subscription){
            this.subscription = subscribe(this.MessageContext, MY_CHANNEL, (message) => {
                this.handleMessage(message)
            }); 
        }

        let activePage = getCookies('activeParent');
        if(activePage != null){
            this.currentPage = activePage;
        }
    }

    handleMessage(message){
        if(message.type == "PAGE"){
            this.currentPage = message.page;
        }
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

    get isVerifyMail(){
        return this.currentPage === 'forgetPassword';
    }

}