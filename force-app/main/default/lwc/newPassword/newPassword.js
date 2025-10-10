import { LightningElement,wire } from 'lwc';
import { setCookies,getCookies, showAlert, removeCookies } from 'c/utils';
import resetUserPassword from '@salesforce/apex/Users.resetUserPassword';
import CryptoJS from "@salesforce/resourceUrl/CryptoJS";
import { loadScript } from 'lightning/platformResourceLoader';
import { MessageContext } from 'lightning/messageService';

export default class NewPassword extends LightningElement {
    password;
    conPassword;
    error = '';

    @wire(MessageContext)
    messageContext;

    connectedCallback(){
        loadScript(this, CryptoJS)
        .then(() => {
            console.log('CryptoJS loaded with AES');
        })
        .catch(error => console.error('Failed to load CryptoJS', error));

    }

    handlePasswordChange(event){
        this.password = event.target.value;
        this.error = '';
    }

    handleConPasswordChange(event){
        this.conPassword = event.target.value;
        this.error = '';
    }


    async resetPassword(event){
        event.preventDefault();
        try{
            if(this.password != this.conPassword){
                await showAlert(this,'Error','Passwords do not match','error');
            }
            else{
                const encryptionKey = "timeSheetKey@431";
                let encryptedMail = await getCookies('resetEmail');
                let email = window.CryptoJS.AES.decrypt(encryptedMail,encryptionKey).toString(window.CryptoJS.enc.Utf8);
                this.error = '';
                let response = resetUserPassword({
                    email: email,
                    newPassword: this.password
                })
                if(response){
                    await removeCookies('resetEmail');
                    await showAlert(this,'Success','Password reset successfully','success');
                    this.gotoLogin();
                }
                else{
                    await showAlert(this,'Error','Error resetting password','error');
                }
            }
        }
        catch(err){
            console.log('Error in resetting password: ',JSON.stringify(err));
            await showAlert(this,'Error','Error resetting password','error');
        }
    }

    gotoLogin(){
        let event = new CustomEvent('navigate', {detail: 'login'});
        this.dispatchEvent(event);
        setCookies('activeParent','login');
    }
}