import { LightningElement,wire } from 'lwc';
// User Class Imports
import getUsers from "@salesforce/apex/Users.getUsers";
import setLastLogin from "@salesforce/apex/Users.setLastLogin";

import { showAlert, setCookies } from 'c/utils';
import CryptoJS from "@salesforce/resourceUrl/CryptoJS";
import { loadScript } from 'lightning/platformResourceLoader';
import astreaLogo from "@salesforce/resourceUrl/astreaLogo";
import { MessageContext } from 'lightning/messageService';


export default class Login extends LightningElement {
    email;
    password;
    isPassword = true;
    astreaLogo;

    @wire(MessageContext)
    messageContext;

    connectedCallback(){
        loadScript(this, CryptoJS)
        .then(() => {
            console.log('CryptoJS loaded with AES');
        })
        .catch(error => console.error('Failed to load CryptoJS', error));
        this.astreaLogo = astreaLogo;
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
                showAlert(this,'Error','Account does not exist','error');
                return;
            }
            else{
                if(user.Custom_user.Active__c == false){
                    showAlert(this,'Error','You are Blocked by the Admin.','error');
                }
                else if(user.Custom_user.Password__c != this.password){
                    showAlert(this,'Error','Incorrect password','error');
                }
                else{
                    await setCookies('email',this.email);
                    await setCookies('uid',user.Custom_user.Id);
                    await setLastLogin({email:this.email});
                    showAlert(this,'Success','Login successful','success');
                    let event = new CustomEvent('navigate', {detail: 'home'});
                    this.dispatchEvent(event);
                    // To remember the page
                    await setCookies('activeParent','home');
                }
            }
        }
        catch(err){
            console.error(err);
            this.showAlert(this,'Error','Something went wrong','error');
        }
    }

}