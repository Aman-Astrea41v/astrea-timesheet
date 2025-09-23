import { getCookies } from 'c/utils';
import { LightningElement } from 'lwc';

export default class HomePage extends LightningElement {
    currentPage;
    
    async connectedCallback(){
        const ID = await getCookies('uid');
        let activePage = await getCookies('activeChild');
        if(ID && activePage ==  null){
            this.currentPage = 'taskbar';
        }
        if(activePage != null){
            this.currentPage = activePage;
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