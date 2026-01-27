import { LightningElement,track } from 'lwc';
import { getCookies, msToTime } from 'c/utils';
// Report Class
import getUserPunchStatus from '@salesforce/apex/Reports.getUserPunchStatus';
import getReportForThisWeek from '@salesforce/apex/Reports.getReportForThisWeek';
import getReportForLastWeek from '@salesforce/apex/Reports.getReportForLastWeek';
import filterReports from '@salesforce/apex/Reports.filterReports';

export default class Report extends LightningElement {
    @track displayRecords = [];
    isLoading = false;
    status = 'All';
    workMode = 'All';

    @track reportStatus = { punchInTime: '--:--' , punchOutTime: '--:--', workMode: '' };
    
    @track allReports = [];

    async connectedCallback() {
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            const specificDate = new Date().toISOString().split('T')[0];
            const reportData = await getUserPunchStatus({userId: uid,specificDate:specificDate});
            
            this.reportStatus = {
                punchInTime: reportData?.punchedIn == 'true' ? reportData?.punchInTime.split('.')[0]: '--:--',
                punchOutTime: reportData?.punchedOut == 'true' ? reportData?.punchOutTime.split('.')[0] : '--:--',
                workMode: reportData?.workMode
            }

            this.setThisWeekReport();
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from Report: ',JSON.stringify(err));
            console.log('Error Message from Report: ',err?.message);
            this.isLoading = false;
        }

    }


    updateReport(reports){
        try{
            this.isLoading = true;
            this.allReports = [];
            let today = new Date().toDateString();
            reports.map(report => {
                let day = new Date(report?.Date__c).toLocaleDateString('en-US', { weekday: 'long' });
                this.allReports.push({
                    id: report?.Id,
                    date: report?.Date__c,
                    day: day,
                    punchIn: report?.Punch_In_Time__c ? msToTime(report.Punch_In_Time__c): '--:--',
                    punchOut: report?.Punch_Out_Time__c ? msToTime(report.Punch_Out_Time__c) : '--:--',
                    location: report?.Work_Location__c,
                    status: report?.On_Time__c ? "On Time" : 'Late',
                    statusClass: !report?.On_Time__c ? "badge status late" : "badge status ontime",
                    isToday: new Date(report?.Date__c).toDateString() === today
                })
            })
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from Report: ',JSON.stringify(err));
            this.isLoading = false;
        }
    }


    async getFilteredReports(){
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            
            const reports = await filterReports({userId: uid,status: this.status,workMode: this.workMode});
            this.updateReport(reports);
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from Report: ',JSON.stringify(err));
            console.log('Error Message from Report: ',err?.message);
            this.isLoading = false;
        }
    }

    // Filtering Methods
    async setLastWeekReport(){
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            
            const reports = await getReportForLastWeek({userId: uid});

            // resetting the filter options to All
            this.status = 'All';
            this.workMode = 'All';

            this.updateReport(reports);
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from Report: ',JSON.stringify(err));
            console.log('Error Message from Report: ',err?.message);
            this.isLoading = false;
        }
    }

    async setThisWeekReport(){
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            
            const reports = await getReportForThisWeek({userId: uid});

            // resetting the filter options to All
            this.status = 'All';
            this.workMode = 'All';

            this.updateReport(reports);
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from Report: ',JSON.stringify(err));
            console.log('Error Message from Report: ',err?.message);
            this.isLoading = false;
        }
    }

    async handleStatusChange(event){
        this.status = event.target.value;
        this.getFilteredReports();
    }

    async handleLocationChange(event){
        this.workMode = event.target.value;
        this.getFilteredReports();
    }

    get recordsCount() {
        return this.allReports.length;
    }

    get locationOptions() {
        return [
            { label: 'All', value: 'All', selected: this.workMode == 'All' },
            { label: 'Work from Office', value: 'Office', selected: this.workMode == 'Office' },
            { label: 'Work from Home', value: 'Home', selected: this.workMode == 'Home' }
        ];
    }

    get statusOptions() {
        return [
            { label: 'All', value: 'All', selected: this.status == 'All' },
            { label: 'On Time', value: 'On Time', selected: this.status == 'On Time' },
            { label: 'Late', value: 'Late', selected: this.status == 'Late' }
        ];
    }

}