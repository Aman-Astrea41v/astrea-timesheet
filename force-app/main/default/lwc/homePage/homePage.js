import { getCookies } from 'c/utils';
import { LightningElement, track } from 'lwc';

export default class HomePage extends LightningElement {
    currentPage;
    
    async connectedCallback(){
        const ID = await getCookies('uid');
        if(ID){
            this.currentPage = 'taskbar';
        }
    }

    navigateTo(event){
        this.currentPage = event.detail;
    }

    get isTaskbar(){
        return this.currentPage === 'taskbar';
    }
    
    get isProfile(){
        return this.currentPage === 'profile';
    }
    
    get isReport(){
        return this.currentPage === 'report';
    }
}