import { LightningElement } from 'lwc';
import { setCookies,getCookies, showAlert, removeCookies } from 'c/utils';
import resetUserPassword from '@salesforce/apex/Users.resetUserPassword';
import CryptoJS from "@salesforce/resourceUrl/CryptoJS";
import { loadScript } from 'lightning/platformResourceLoader';

export default class NewPassword extends LightningElement {
    password;
    conPassword;
    error = '';

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
                this.error = 'Passwords do not match';
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
                    await showAlert('Success','Password reset successfully','success');
                    this.gotoLogin();
                }
                else{
                    await showAlert('Error','Error resetting password','error');
                }
            }
        }
        catch(err){
            console.log('Error in resetting password: ',JSON.stringify(err));
            await showAlert('Error','Error resetting password','error');
        }
    }

    gotoLogin(){
        let event = new CustomEvent('navigate', {detail: 'login'});
        this.dispatchEvent(event);
        setCookies('activeParent','login');
    }
}