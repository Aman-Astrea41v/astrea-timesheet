import { LightningElement } from 'lwc';
import { setCookies } from 'c/utils';

export default class VerifyEmail extends LightningElement {
        email;
        error = "Error message";
    
        setEmail(event){
            regexPattern = "/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/";
            this.email = event.target.value;
            console.log(event.target);
            if(!this.email.match(regexPattern)){
                this.error = 'Enter valid Email';
            }
        }
    
        async gotoLogin(){
            let event = new CustomEvent('navigate', {detail: 'login'});
            this.dispatchEvent(event);
            await setCookies('activeParent','login');
    }
}
