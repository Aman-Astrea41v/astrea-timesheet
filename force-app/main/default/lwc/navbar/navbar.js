import { LightningElement, wire } from 'lwc';
import MY_CHANNEL from "@salesforce/messageChannel/MyChannel__c";
import { publish, MessageContext } from 'lightning/messageService';
import { removeCookies, getCookies, showAlert, checkForPunchOutIs9Hour } from 'c/utils';
import punchInUserApex from '@salesforce/apex/Reports.punchInUserApex';
import punchOutUserApex from '@salesforce/apex/Reports.punchOutUserApex';
import getUserPunchStatus from '@salesforce/apex/Reports.getUserPunchStatus';
import sendEarlyPunchOutNotification from '@salesforce/apex/TSNotification.sendEarlyPunchOutNotification';
import getUsers from '@salesforce/apex/Users.getUsers';

export default class Navbar extends LightningElement {
    showPunchModal = false;
    workingMode;
    punchedIn;
    punchedOut;
    userDropdown = false;
    punchInTime;
    showWarning = false;
    timeLeft;
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
            this.workingMode = reportData.workMode;
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

    closeWarningModal(){
        this.showWarning = false;
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


    async checkUserPunchHour(){
        try{
            let [h, m, s] = this.punchInTime.replace('Z','').split(':').map(Number);
            h += 9;
            h = h % 24;
            let expectedPunchOutTime = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

            let punchOutTime = (new Date().toLocaleTimeString('en-GB', { 
                timeZone: 'Asia/Kolkata', 
                hour12: false 
            }));
            
            let response = await checkForPunchOutIs9Hour(this.punchInTime,punchOutTime); 
            if(!response.status){
                let { timeDifference } = await checkForPunchOutIs9Hour(punchOutTime,expectedPunchOutTime);
                let timeLeftInMin = timeDifference;
                let hours = Math.floor(timeLeftInMin / 60);
                let minutes = timeLeftInMin % 60;
                this.timeLeft = `${hours} H ${minutes} M`;
                this.showWarning = true;
            }
            else{
                await this.punchOutUser();
            }
        }
        catch(err){
            console.log('Error from Navbar: ',JSON.stringify(err));
            console.log('Error from Check Punchin : ',err?.message);
        }
    }

    async punchOutUser(event){
        try{
            let punchOutTime = (new Date().toLocaleTimeString('en-GB', { 
                timeZone: 'Asia/Kolkata', 
                hour12: false 
            }))
            this.showWarning = false;
            this.punchedOut = false;

            if(event.currentTarget.dataset.id == 'punchOutAnyway'){
                const email = await getCookies('email');
                let user = await getUsers({email:email});
                let userDetail = {
                    'User Name': user?.Name,
                    'Email': user?.Email__c,
                    'Punch In Time': this.punchInTime ? this.punchInTime : 'Not Punched In',
                    'Punch Out Time': punchOutTime ? punchOutTime : 'Not Punched Out',
                    'Time Left': this.timeLeft ? this.timeLeft : '0 H 0 M',
                    'Work Mode': this.workingMode ? this.workingMode : 'Not Found'
                }

                this.showWarning = false;
                await sendEarlyPunchOutNotification({
                    emailAddresses: ['aman@astreait.com','amanrehman2020@gmail.com'],
                    userData: userDetail
                })
            }

            const uid = await getCookies('uid');
            publish(this.messageContext, MY_CHANNEL, {type: 'PUNCHOUT' ,disableTask: true, time: new Date().toLocaleString(), workMode: this.workingMode});
            
            
            let status = checkForPunchOutIs9Hour(this.punchInTime,punchOutTime).status ? 'On Time' : 'Late';
            
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
        catch(err){
            console.log('Error from Navbar: ',JSON.stringify(err));
            console.log('Error from Punch Out : ',err?.message);
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