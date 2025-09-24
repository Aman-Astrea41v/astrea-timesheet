import { LightningElement } from 'lwc';
import getUsers from "@salesforce/apex/Users.getUsers";
import { showAlert, setCookies } from 'c/utils';
import CryptoJS from "@salesforce/resourceUrl/CryptoJS";
import { loadScript } from 'lightning/platformResourceLoader';

export default class Login extends LightningElement {
    email;
    password;
    isPassword = true;

    connectedCallback(){
        loadScript(this, CryptoJS)
        .then(() => {
            console.log('CryptoJS loaded with AES');
        })
        .catch(error => console.error('Failed to load CryptoJS', error));
    }


    setEmail(event){
        this.email = event.target.value;
    }

    setPassword(event){
        this.password = event.target.value;
    }

    async navigateToForgetPassword(){
        let event = new CustomEvent('navigate', {detail: 'forgetPassword'});
        this.dispatchEvent(event);
        await setCookies('activeParent','forgetPassword');
    }

    togglePassword(){
        this.template.querySelector('.password-input').type = this.isPassword ? 'text' : 'password';
        this.isPassword = !this.isPassword;
    }

    async login(event){
        try{
            event.preventDefault();
            const user = await getUsers({email:this.email});
            if(user == null){
                showAlert('Error','Account does not exist','error');
                return;
            }
            else{
                if(user.Password__c != this.password){
                    showAlert('Error','Incorrect password','error');
                }
                else{
                    await setCookies('email',this.email);
                    await setCookies('uid',user.Id);
                    showAlert('Success','Login successful','success');
                    let event = new CustomEvent('navigate', {detail: 'home'});
                    this.dispatchEvent(event);
                    // To remember the page
                    await setCookies('activeParent','home');
                }
            }
        }
        catch(err){
            console.error(err);
            this.showAlert('Error','Something went wrong','error');
        }
    }

}