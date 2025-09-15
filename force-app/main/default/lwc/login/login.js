import { LightningElement, track } from 'lwc';
import getUsers from "@salesforce/apex/Users.getUsers";
import { showAlert, setCookies } from 'c/utils';

export default class Login extends LightningElement {
    email;
    password;

    setEmail(event){
        this.email = event.target.value;
    }

    setPassword(event){
        this.password = event.target.value;
    }

    navigateToSignup(){
        let event = new CustomEvent('navigate', {detail: 'signup'});
        this.dispatchEvent(event);
    }

    async login(){
        try{
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
                }
            }
        }
        catch(err){
            console.error(err);
            this.showError(err);
        }
    }

}