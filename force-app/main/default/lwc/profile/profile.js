import getUsers from '@salesforce/apex/Users.getUsers';
import updateUserProfile from '@salesforce/apex/Users.updateUserProfile';
// API Class Imports
import getCityByState from '@salesforce/apex/ExternalAPICalls.getCityByState';
import getStatesByCountry from '@salesforce/apex/ExternalAPICalls.getStatesByCountry';
import { getCookies, showAlert, getFormattedNameAndAbbreviation } from 'c/utils';
import { LightningElement, track, wire } from 'lwc';
import { MessageContext } from 'lightning/messageService';

export default class Profile extends LightningElement {
    @track user = {};
    isLoading = false;
    cannotEdit = true;

    @wire(MessageContext)
    messageContext;

    @track countries = [{ label: 'India', value:'IN' }];
    @track states = [];
    @track cities = [];

    collegeOptions = [
        { label:'AIT', value:'AIT'},
        { label:'GBU', value:'GBU'},
        { label:'GLA', value:'GLA'}
    ]

    async connectedCallback() {
        try {
            this.isLoading = true;
            this.getUserProfile();
            
        } catch (err) {
            console.log('Error from Profile: ', JSON.stringify(err));
            console.log('Error Message from Profile: ', err?.message);
        } finally {
            this.isLoading = false;
        }
    }


    async getUserProfile(){
        try{
            this.isLoading = true;
            const email = await getCookies('email');   
            const user = await getUsers({ email: email });
            let formattedName = getFormattedNameAndAbbreviation(user?.Custom_user?.Name.split(' ')[0], user?.Custom_user?.Name.split(' ')[1]);
            this.user.Id = user?.Custom_user?.Employee_Id__c;
            this.user.batch = user?.Custom_user?.Batch__c;
            this.user.abbreviation = formattedName?.profileText;
            this.user.fullname = formattedName?.fullName;
            this.user.fname = user?.Custom_user?.Name.split(' ')[0] || 'N/A';
            this.user.lname = user?.Custom_user?.Name.split(' ')[1] || 'N/A';
            this.user.email = user?.Custom_user?.Email__c || 'N/A';
            this.user.collegeName = user?.Custom_user?.CollegeName__c || 'N/A';
            this.user.phone = user?.Custom_user?.Phone__c || 'N/A';
            this.user.street = user?.Custom_user?.Address__c?.street || 'N/A';
            this.user.city = user?.Custom_user?.Address__c?.city;
            this.user.state = user?.StateCode || 'UP';
            this.user.country = user?.CountryCode;
            this.user.pinCode = user?.Custom_user?.Address__c?.postalCode;

            this.states = await getStatesByCountry({ countryName: 'India' });
            this.cities = await getCityByState({ countryName: 'India', state: user?.Custom_user?.Address__c?.state || 'Uttar Pradesh' });

            this.isLoading = false;
        }
        catch(err){
            console.error(err);
            this.isLoading = false;
        }
    }

    get collegeWithSelection(){
        return this.collegeOptions.map(clg => ({
            ...clg,
            selected: clg.value === this.user.collegeName
        }));
    }

    get statesWithSelection() {
        return this.states.map(st => ({
            ...st,
            selected: st.value === this.user.state
        }));
    }

    get cityWithSelection() {
        return this.cities.map(ct => ({
            ...ct,
            selected: ct.value === this.user.city
        }));
    }

    async handleStateChange(event) {
        this.isLoading = true;
        this.user.state = event.target.value;
        let stateLabel = event.target.options[event.target.selectedIndex].text;
        this.cities = await getCityByState({ countryName: this.countries[0].label, state: stateLabel });
        this.isLoading = false;
    }

    handleCityChange(event){
        this.user.city = event.target.value;
    }

    updateField(event) {
        const field = event.target.dataset.field;
        if (field) {
            this.user = { ...this.user, [field]: event.target.value };
        }
    }

    get editButtonText() {
        return !this.cannotEdit ? 'Update Profile' : 'Edit Profile';
    }

    cancelEdit(){
        this.isLoading = true;
        this.cannotEdit = true;
        this.getUserProfile();
        this.isLoading = false;
    }

    async updateProfile() {
        try {
            if (this.cannotEdit) {
                this.cannotEdit = false;
            } else {
                if(!/^[0-9]{6}$/.test(this.user.pinCode.trim())){
                    showAlert(this, 'Error', 'Pin Code must be of exact 6 digits and not contain any alphabet', 'error');
                    return;
                }
                if(!/^[0-9]{10}$/.test(this.user.phone.trim())){
                    showAlert(this, 'Error', 'Phone must be of exact 10 digits and not contain any alphabet', 'error');
                    return;
                }
                this.isLoading = true;
                const uid = await getCookies('uid');
                const response = await updateUserProfile({
                    userId: uid,
                    address: {
                        street: this.user.street,
                        city: this.user.city,
                        state: this.user.state,
                        postalCode: this.user.pinCode
                    },
                    collegeName: this.user.collegeName,
                    phone: this.user.phone,
                    email: this.user.email
                });
                if (response) {
                    await showAlert(this, 'Success', 'Profile Updated Successfully', 'success');
                } else {
                    await showAlert(this, 'Error', 'Error Updating Profile', 'error');
                }
                this.cannotEdit = true;
            }
        } catch (err) {
            await showAlert(this, 'Error', 'Some Error Occured', 'error')
            console.log('Error from Profile: ', JSON.stringify(err));
            console.log('Error Message from Profile: ', err?.message);
        } finally {
            this.isLoading = false;
        }
    }
}


