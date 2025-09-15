import { LightningElement,track } from 'lwc';

export default class Report extends LightningElement {
    
    reports = [
        {
            dayName: 'Monday',
            date: 'Sep 08, 2025',
            login: '09:00 AM',
            logout: '06:00 PM'
        },
        {
            dayName: 'Tuesday',
            date: 'Sep 09, 2025',
            login: '09:10 AM',
            logout: '06:15 PM'
        },
        {
            dayName: 'Wednesday',
            date: 'Sep 10, 2025',
            login: '09:05 AM',
            logout: '06:20 PM'
        },
        {
            dayName: 'Thursday',
            date: 'Sep 11, 2025',
            login: '09:02 AM',
            logout: '06:12 PM'
        },
        {
            dayName: 'Friday',
            date: 'Sep 12, 2025',
            login: '09:08 AM',
            logout: '06:18 PM'
        }
    ];

    
}