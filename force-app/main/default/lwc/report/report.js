import { LightningElement,track } from 'lwc';
import { getCookies, msToTime } from 'c/utils';
// Report Class
import getUserPunchStatus from '@salesforce/apex/Reports.getUserPunchStatus';
import getReportForThisWeek from '@salesforce/apex/Reports.getReportForThisWeek';
import getReportForLastWeek from '@salesforce/apex/Reports.getReportForLastWeek';
import getReportByStatus from '@salesforce/apex/Reports.getReportByStatus';
import getReportByWorkMode from '@salesforce/apex/Reports.getReportByWorkMode';

export default class Report extends LightningElement {
    @track selectedDate;
    @track displayRecords = [];
    isLoading = false;

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
            reports.map(report => {
                let day = new Date(report.Date__c).toLocaleDateString('en-US', { weekday: 'long' });
                this.allReports.push({
                    id: report.Id,
                    date: report.Date__c,
                    day: day,
                    punchIn: report.Punch_In__c ? msToTime(report.Punch_In__c): '--:--',
                    punchOut: report.Punch_Out__c ? msToTime(report.Punch_Out__c) : '--:--',
                    location: report.Work_Mode__c,
                    status: report.Status__c ? report.Status__c : '--',
                    statusClass: report.Status__c == "Late" ? "badge status late" : "badge status ontime"
                })
            })
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from Report: ',JSON.stringify(err));
            this.isLoading = false;
        }
    }


    // Filtering Methods
    async setLastWeekReport(){
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            
            const reports = await getReportForLastWeek({userId: uid});
            
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
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            
            const reports = await getReportByStatus({userId:uid,status: event.target.value});
            
            this.updateReport(reports);
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from Report: ',JSON.stringify(err));
            console.log('Error Message from Report: ',err?.message);
            this.isLoading = false;
        }
    }

    async handleLocationChange(event){
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            
            const reports = await getReportByWorkMode({userId:uid,workMode: event.target.value});
            
            this.updateReport(reports);
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from Report: ',JSON.stringify(err));
            console.log('Error Message from Report: ',err?.message);
            this.isLoading = false;
        }
    }

    get recordsCount() {
        return this.allReports.length;
    }

    handleDateChange(event) {
        this.selectedDate = event.target.value;
    }

}