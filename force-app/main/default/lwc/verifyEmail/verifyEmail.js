import { LightningElement,wire } from 'lwc';
import { setCookies,showAlert, getCookies, removeCookies } from 'c/utils';
import sendOTPForResetPassword from '@salesforce/apex/TSNotification.sendOTPForResetPassword';
import CryptoJS from "@salesforce/resourceUrl/CryptoJS";
import { loadScript } from 'lightning/platformResourceLoader';
import { MessageContext } from 'lightning/messageService';

export default class VerifyEmail extends LightningElement {
    email='';
    error='';
    isOTP = false;
    otp;
    otpRelax = true;
    otpBtnLabel = "Send Verification Code";

    @wire(MessageContext)
    messageContext;


    connectedCallback(){
         loadScript(this, CryptoJS)
        .then(() => {
            this.cryptoLoaded = true;
            console.log('CryptoJS loaded with AES');
        })
        .catch(error => console.error('Failed to load CryptoJS', error));
    }

    handleEmailChange(event){
        let regexPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        this.email = event.target.value;
        if(!this.email.match(regexPattern)){
            this.error = 'Enter a valid Email';
            this.otpRelax = true;
        }
        else{
            this.error = '';
            this.otpRelax = false;
        }
    }

    handleOTPChange(event){
        this.otp = event.target.value;  
    }

    async sendOTP(){
        try{
            const encryptionKey = "timeSheetKey@431";
            let otp = Math.floor(100000 + Math.random() * 900000);
            await setCookies('otp',window.CryptoJS.AES.encrypt(otp.toString(),encryptionKey).toString());
            this.otpRelax = true;
            let response = await sendOTPForResetPassword({
                emailTo: this.email,
                otp: otp.toString()
            })
            if(response){
                this.isOTP = true;
                await showAlert(this,'Success','Email sent successfully','success');
            }
            let seconds = 5;
            let id = setInterval(() => {
                    this.otpBtnLabel = `Resend Code in ${seconds}`;
                    seconds--;
                    if(seconds < 0){
                        clearInterval(id);
                        this.otpRelax = false;
                        this.otpBtnLabel = "Resend Code";
                    }
                },1000);
            }   
        catch(err){
            console.log('Error in Sending OTP: ',JSON.stringify(err));
            console.log('Error message: ',err?.message);
            await showAlert(this,'Error','Email Limit Exceeded','error');
        }
    }


    async verifyOTP(){
        try{
            const encryptionKey = "timeSheetKey@431";
            let encryptOTP = await getCookies('otp');
            let otp = window.CryptoJS.AES.decrypt(encryptOTP,encryptionKey).toString(window.CryptoJS.enc.Utf8);
            if(otp == this.otp){
                await setCookies('resetEmail',window.CryptoJS.AES.encrypt(this.email,encryptionKey).toString());
                await showAlert(this,'Success','Email verified successfully','success');
                removeCookies('otp');
                let event = new CustomEvent('navigate', {detail: 'newPassword'});
                this.dispatchEvent(event);
                await setCookies('activeParent','forgetPassword');
            }
            else{
                await showAlert(this,'Error','Invalid OTP','error');
            }
        }
        catch(err){
            console.log('Error verifying OTP: ' ,JSON.stringify(err));
        }
    }


    updateEmail(){
        this.isOTP = false;
        this.otpRelax = false;
        this.otp = '';
    }

    async gotoLogin(){
        let event = new CustomEvent('navigate', {detail: 'login'});
        this.dispatchEvent(event);
        await setCookies('activeParent','login');
    }
}
