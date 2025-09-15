import getUsers from '@salesforce/apex/Users.getUsers';
import { getCookies } from 'c/utils';
import { LightningElement, track } from 'lwc';

export default class Profile extends LightningElement {
    @track user = {};
    isLoading = false;

    async connectedCallback(){
        try{
            this.isLoading = true;
            const email = await getCookies('email');
            const user = await getUsers({email: email});
            if(user){
                this.user.fname = user.First_Name__c;
                this.user.lname = user.Last_Name__c;
                this.user.email = user.Email__c;
                this.user.username = user.Name;
                this.user.collegeName = user.College_Name__c;
                this.user.phone = user.Phone__c;
                this.user.street = user.Address__c?.street,
                this.user.city = user.Address__c?.city,
                this.user.state = user.Address__c?.state,
                this.user.country = user.Address__c?.country
            }
            this.isLoading = false;
        }
        catch(err){
            this.isLoading = false;
            console.log(err);
        }
    }

}