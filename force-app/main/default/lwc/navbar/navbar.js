import { LightningElement, track, wire } from 'lwc';
import MY_CHANNEL from "@salesforce/messageChannel/MyChannel__c";
import { publish, MessageContext } from 'lightning/messageService';
import { removeCookies } from 'c/utils';

export default class Navbar extends LightningElement {
    showPunchModal = false;
    workingMode;
    punchedIn = true;
    punchedOut = false;

    @track options = [
        { label: 'Work from Home', value: 'WFH' },
        { label: 'Work from Office', value: 'WFO' }
    ]

    // Create Context
    @wire(MessageContext)
    messageContext


    openPunchForm(){
        this.showPunchModal = true;
    }

    handleOptionChange(event){
        this.workingMode = event.target.value;
    }

    closeModal(){
        this.showPunchModal = false;
    }

    punchInUser(){
        this.punchedIn = false;
        this.punchedOut = true;
        this.showPunchModal = false;
    }

    punchOutUser(){
        this.punchedOut = false;
    }

    async logOutUser(){
        // const event = new CustomEvent('navigate', { detail: 'login'});
        // this.dispatchEvent(event);
        // Instead of prop drilling we use message context
        publish(this.messageContext, MY_CHANNEL, {page: 'login'});
        await removeCookies('email');
    }

    gotoHome(){
        const event = new CustomEvent('navigate', { detail: 'taskbar'});
        this.dispatchEvent(event);
    }

    gotoProfile(){
        const event = new CustomEvent('navigate', { detail: 'profile'});
        this.dispatchEvent(event);
    }

    gotoReport(){
        const event = new CustomEvent('navigate', { detail: 'report'});
        this.dispatchEvent(event);
    }
}