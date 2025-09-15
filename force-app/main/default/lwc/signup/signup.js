import { LightningElement } from 'lwc';
import createNewUser from "@salesforce/apex/Users.createNewUser";
import { showAlert } from 'c/utils';

export default class Signup extends LightningElement {
    email;
    password;
    username;
    result;

    setUsername(event){
        this.username = event.target.value;
    }

    setEmail(event){
        this.email = event.target.value;
    }

    setPassword(event){
        this.password = event.target.value;
    }

    navigateToLogin(){
        const event = new CustomEvent('navigate', {detail: 'login'});
        this.dispatchEvent(event);
    }

    async createUser(){
        try{
            this.result = await createNewUser({username:this.username,email:this.email,password:this.password});
            if(this.result == 'success'){
                showAlert('Success','User Created Successfully','success');
                this.navigateToLogin();
            }
            else if(this.result == 'exist'){
                showAlert('Error','User Already Exists','error');
            }
            else{
                showAlert('Error','Some Error occured','error');
            }
        }
        catch(err){
            showAlert('Error','Some Error occured','error');
            console.error(err);
        }
    }
}