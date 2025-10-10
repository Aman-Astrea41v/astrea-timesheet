import getUsers from '@salesforce/apex/Users.getUsers';
import updateUserProfile from '@salesforce/apex/Users.updateUserProfile';
import { getCookies, showAlert } from 'c/utils';
import { LightningElement, track, wire } from 'lwc';
import { MessageContext } from 'lightning/messageService';

export default class Profile extends LightningElement {
    @track user = {};
    isLoading = false;
    cannotEdit = true;

    @wire(MessageContext)
    messageContext

    async connectedCallback(){
        try{
            this.isLoading = true;
            const email = await getCookies('email');
            const user = await getUsers({email: email});
            if(user){
                this.user.abbreviation = user.First_Name__c.charAt(0) + user.Last_Name__c.charAt(0);
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

    updateField(event) {
        const field = event.target.dataset.field;
        if (field) {
            this.user = { ...this.user, [field]: event.target.value };
        }
    }

    get editButtonText(){
        return !this.cannotEdit ? 'Update Profile' : 'Edit Profile';
    }

    async updateProfile(){
        try{
            if(this.cannotEdit){
                this.cannotEdit = false;
            }
            else{
                this.isLoading = true;
                const uid = await getCookies('uid');
                const response = await updateUserProfile({
                    userId: uid,
                    firstName: this.user.fname,
                    lastName: this.user.lname,
                    address: {
                        street: this.user.street,
                        city: this.user.city
                    },
                    collegeName: this.user.collegeName,
                    phone: this.user.phone,
                    email: this.user.email,
                    username: this.user.username
                })
                if(response){
                    await showAlert(this,'Success', 'Profile Updated Successfully', 'success');
                }
                else{
                    await showAlert(this,'Error', 'Error Updating Profile', 'error');
                }
                this.cannotEdit = true;
                this.isLoading = false;
            }
        }
        catch(err){
            console.log('Error from Profile: ',JSON.stringify(err));
            console.log('Error Message from Profile: ',err?.message);
        }
    }
}