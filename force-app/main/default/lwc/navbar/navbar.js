import { LightningElement, wire } from 'lwc';
import MY_CHANNEL from "@salesforce/messageChannel/MyChannel__c";
import { publish, MessageContext } from 'lightning/messageService';
import { removeCookies } from 'c/utils';

export default class Navbar extends LightningElement {
    showPunchModal = false;
    workingMode;
    punchedIn = true;
    punchedOut = false;
    userDropdown = false;

    // Create Context
    @wire(MessageContext)
    messageContext


    openPunchForm(){
        this.showPunchModal = true;
        this.userDropdown = false;
    }

    toggleUserDropdown(){
        this.userDropdown = !this.userDropdown;
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
        publish(this.messageContext, MY_CHANNEL, {type: 'PUNCHIN' ,disableTask: this.punchedIn, time: new Date().toLocaleString()});
    }

    punchOutUser(){
        this.punchedOut = false;
        publish(this.messageContext, MY_CHANNEL, {type: 'PUNCHOUT' ,disableTask: true, time: new Date().toLocaleString()});
    }

    async logOutUser(){
        // const event = new CustomEvent('navigate', { detail: 'login'});
        // this.dispatchEvent(event);
        // Instead of prop drilling we use message context
        publish(this.messageContext, MY_CHANNEL, {type: 'PAGE' ,page: 'login'});
        await removeCookies('email');
    }

    gotoHome(){
        const event = new CustomEvent('navigate', { detail: 'taskbar'});
        this.dispatchEvent(event);
        this.userDropdown = false;
    }

    gotoProfile(){
        const event = new CustomEvent('navigate', { detail: 'profile'});
        this.dispatchEvent(event);
        this.userDropdown = false;
    }

    gotoReport(){
        const event = new CustomEvent('navigate', { detail: 'report'});
        this.dispatchEvent(event);
        this.userDropdown = false;
    }
}