import { LightningElement,track } from 'lwc';

export default class Report extends LightningElement {
    @track selectedDate;
    @track displayRecords = [];

    
    
    allReports = [
        { id: 1, date: '2025-09-15', day: 'Monday', punchIn: '09:15 AM', punchOut: '06:05 PM', location: 'Office HQ', status: 'On Time' },
        { id: 2, date: '2025-09-14', day: 'Sunday', punchIn: '10:10 AM', punchOut: '05:30 PM', location: 'Remote', status: 'Late' },
        { id: 3, date: '2025-09-13', day: 'Saturday', punchIn: '09:05 AM', punchOut: '06:00 PM', location: 'Office HQ', status: 'On Time' },
        { id: 4, date: '2025-09-12', day: 'Friday', punchIn: '09:20 AM', punchOut: '06:10 PM', location: 'Office HQ', status: 'Late' },
        { id: 5, date: '2025-09-11', day: 'Thursday', punchIn: '09:00 AM', punchOut: '05:55 PM', location: 'Remote', status: 'On Time' },
        { id: 6, date: '2025-09-10', day: 'Wednesday', punchIn: '09:30 AM', punchOut: '06:15 PM', location: 'Office HQ', status: 'Late' },
        { id: 7, date: '2025-09-09', day: 'Tuesday', punchIn: '09:10 AM', punchOut: '05:45 PM', location: 'Office HQ', status: 'On Time' }
    ];

    connectedCallback() {
        let filtered = this.allReports.slice(0, 7);

        let workingDays = this.getWorkingDays(filtered, 5);

        this.displayRecords = workingDays.map(record => ({
            ...record,
            statusClass: record.status === 'Late' ? 'badge status late' : 'badge status ontime',
            locationClass: 'badge location'
        }));
    }

    

    get recordsCount() {
        return this.displayRecords.length;
    }

    handleDateChange(event) {
        this.selectedDate = event.target.value;
    }

    filterReports() {
        if (this.selectedDate) {
            const index = this.allReports.findIndex(
                rec => rec.date === this.selectedDate
            );

            if (index !== -1) {
                let filtered = this.allReports.slice(index, index + 7); // take a bigger slice
                this.displayRecords = this.getWorkingDays(filtered, 5);
            } else {
                this.displayRecords = [];
            }
        }
    }

    showTodayReport() {
        const today = '2025-09-15'; // hardcoded for now
        this.selectedDate = today;
        this.filterReports();
    }

    setDefaultRecords() {
        let filtered = this.allReports.slice(0, 7); // take latest week
        this.displayRecords = this.getWorkingDays(filtered, 5);
    }

    // Helper → only Mon–Fri
    getWorkingDays(records, limit) {
        return records
            .filter(rec => rec.day !== 'Saturday' && rec.day !== 'Sunday')
            .slice(0, limit);
    }

    getStatusClass(status) {
        return status === 'Late' ? 'badge status late' : 'badge status ontime';
    }

}