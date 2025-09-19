import { LightningElement, wire } from 'lwc';
import MY_CHANNEL from "@salesforce/messageChannel/MyChannel__c";
import { publish, MessageContext } from 'lightning/messageService';
import { removeCookies, getCookies, showAlert, checkForPunchOutIs9Hour } from 'c/utils';
import punchInUserApex from '@salesforce/apex/Reports.punchInUserApex';
import punchOutUserApex from '@salesforce/apex/Reports.punchOutUserApex';
import getUserPunchStatus from '@salesforce/apex/Reports.getUserPunchStatus';

export default class Navbar extends LightningElement {
    showPunchModal = false;
    workingMode;
    punchedIn;
    punchedOut;
    userDropdown = false;
    punchInTime;

    // Create Context
    @wire(MessageContext)
    messageContext


    async connectedCallback(){
        try{
            // Managing Status Panel and Punch In Status
            const uid = await getCookies('uid');
            const specificDate = new Date().toISOString().split('T')[0];

            const reportData = await getUserPunchStatus({userId:uid,specificDate:specificDate});
            this.punchInTime = reportData.punchInTime;
            if(reportData.punchedIn == 'true' && reportData.punchedOut == 'false'){
                this.punchedIn = false;
                this.punchedOut = true;
            }

            else if(reportData.punchedIn == 'false' && reportData.punchedOut == 'false'){
                this.punchedIn = true;
                this.punchedOut = false;
            }
            else if(reportData.punchedIn == 'true' && reportData.punchedOut == 'true'){
                this.punchedIn = false;
                this.punchedOut = false;
            }
        }   
        catch(err){
            console.log('Parsed Error from Navbar: ',JSON.stringify(err));
            console.log('Error Message from Navbar: ',err?.message);
        }
    }   

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

    async punchInUser(){
        try{
            this.punchedIn = false;
            this.punchedOut = true;
            this.showPunchModal = false;
            const uid = await getCookies('uid');
            publish(this.messageContext, MY_CHANNEL, {type: 'PUNCHIN' ,disableTask: this.punchedIn, time: new Date().toLocaleString(), workMode: this.workingMode});

            // Storing in Apex
            const response = await punchInUserApex({
                punchInTime: (new Date().toLocaleTimeString('en-GB', { 
                timeZone: 'Asia/Kolkata', 
                hour12: false 
                })),
                userId: uid,
                specificDate: (new Date().toISOString().split('T')[0]),
                workMode: this.workingMode
            });

            if(response){
                await showAlert('Success', 'Punched In Successfully', 'success');
            }
            else{
                await showAlert('Error!', 'Punched In Failed', 'error');
            }
        }
        catch(err){
            console.log('Error from Navbar: ',JSON.stringify(err));
        }
    }

    async punchOutUser(){
        this.punchedOut = false;
        const uid = await getCookies('uid');
        publish(this.messageContext, MY_CHANNEL, {type: 'PUNCHOUT' ,disableTask: true, time: new Date().toLocaleString(), workMode: this.workingMode});
        
        let punchOutTime = (new Date().toLocaleTimeString('en-GB', { 
            timeZone: 'Asia/Kolkata', 
            hour12: false 
        }))

        let status = checkForPunchOutIs9Hour(this.punchInTime,punchOutTime) ? 'On Time' : 'Late';
        
        // Updating punchOut Time
        const response = await punchOutUserApex({
            punchOutTime: (new Date().toLocaleTimeString('en-GB', { 
                timeZone: 'Asia/Kolkata', 
                hour12: false 
                })),
            userId: uid,
            specificDate: (new Date().toISOString().split('T')[0]),
            status: status
        })
        if(response){
                await showAlert('Success', 'Punched Out Successfully', 'success');
            }
            else{
                await showAlert('Error!', 'Punched Out Failed', 'error');
            }
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