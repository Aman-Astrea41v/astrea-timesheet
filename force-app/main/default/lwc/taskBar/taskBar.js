import { getCookies, showAlert, setCookies, msToTime } from 'c/utils';
import { LightningElement, track, wire } from 'lwc';
import MY_CHANNEL from "@salesforce/messageChannel/MyChannel__c";
import { subscribe, MessageContext } from 'lightning/messageService';
// Task Class
import getAllTasks from '@salesforce/apex/Tasks.getAllTasks';
import createTask from '@salesforce/apex/Tasks.createTask';
import updateTask from '@salesforce/apex/Tasks.updateTask';
import deleteTask from '@salesforce/apex/Tasks.deleteTask';
// Report Class
import getUserPunchStatus from '@salesforce/apex/Reports.getUserPunchStatus';

export default class taskBar extends LightningElement {
    // Initialize Variables
    @track today;
    selectedDate;
    subscription;
    formattedDuration = '';
    Modalhours = 0;
    Modalminutes = 0;
    punchInTime;
    punchOutTime;
    @track startTimePerTask;
    isEdit;
    isPunchedIn = false;
    isLoading = false;

    @track tasks = [];

    @track newTask = { title: '', duration: 0,startTime:'',endTime:'--:--', description: '' };
    showTaskForm = false;

    @track statusPanel = { class: 'status-panel status-pending', indicator: 'Waiting', text: 'Not Started',workType:'Please punch in to begin',punchTime: '' ,dailyTotal: '0 H 0 M' };

    @wire(MessageContext)
        messageContext;

    // Run when the component is mounted/ Screen is refreshed
    async connectedCallback(){
        try{
            const d = new Date();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            const year = d.getFullYear();
            this.today = `${year}-${month}-${day}`;
            this.isLoading = true;
            await this.getTodaysTask(true);
            if(!this.subscription){
                this.subscription = subscribe(this.messageContext, MY_CHANNEL, (message) => {
                    this.handleMessage(message)
                })
            }
            
            // Managing Status Panel and Punch In Status
            const uid = await getCookies('uid');
            let dailyTotal = await getCookies('dailyTotal'+uid);
            this.calculateDailyTotal();
            if(dailyTotal == null){
                dailyTotal = this.formatDuration(0);
            }
            else{
                if( dailyTotal && dailyTotal.split(' ')[0] != this.statusPanel.dailyTotal.split(' ')[0] || dailyTotal.split(' ')[2] != this.statusPanel.dailyTotal.split(' ')[2] ){
                    dailyTotal = this.statusPanel.dailyTotal;
                }
            }
            const specificDate = new Date().toISOString().split('T')[0];
            const reportData = await getUserPunchStatus({userId:uid,specificDate:specificDate});
            if(reportData.punchedIn == 'true' && reportData.punchedOut == 'false'){
                this.isPunchedIn = true;
                this.punchInTime = reportData?.punchInTime.split('.')[0]

                this.startTimePerTask = this.calculateStartTime(this.punchInTime,dailyTotal);

                this.statusPanel = { class: 'status-panel status-active', indicator: 'Active', text: 'Currently Working',workType:reportData.workMode,punchTime:'Started : ' + this.punchInTime ,dailyTotal: dailyTotal
                }
            }
            else if(reportData.punchedIn == 'false' && reportData.punchedOut == 'false'){
                this.isPunchedIn = false;
                this.statusPanel = { class: 'status-panel status-pending', indicator: 'Waiting', text: 'Not Started',workType:'Please punch in to begin',punchTime: '' ,dailyTotal: '0 H 0 M' };
            }
            else{
                this.isPunchedIn = false;
                this.punchOutTime = reportData?.punchOutTime.split('.')[0];
                this.statusPanel = { class: 'status-panel status-inactive', indicator: 'Completed', text: 'Day Completed',workType:reportData.workMode,punchTime:'Ended : ' + this.punchOutTime ,dailyTotal: dailyTotal
                }
            }
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from TaskBar ConnectedCallback: ',JSON.stringify(err));
            console.log('Error from TaskBar ConnectedCallback: ',err?.message);
            this.isLoading = false;
        }

    }

    calculateDailyTotal(){
        this.statusPanel.dailyTotal = this.formatDuration(this.tasks.reduce((acc, task) => acc + task.duration, 0));
    }

    async updateTask(){
        this.isLoading = true;
        await this.getTodaysTask(true);
        this.tasks = this.tasks.map(task => ({
            ...task,
            formatDescription: task.description ? task.description.substring(0, 40) + '...' : '',
            formattedDuration: this.formatDuration(task.duration)
        }));
        this.isLoading = false;
    }

    calculateStartTime(punchInTime,dailyTotal){
        let TotalHour = parseInt(dailyTotal.split('H')[0].trim());
        let TotalMin = parseInt(dailyTotal.split('M')[0].split('H')[1].trim());

        let [startHour,startMin,startSec] = punchInTime.split(":").map(Number)

        let hour = TotalHour+startHour;
        let min = TotalMin+startMin;

        if(min >= 60){
            hour += 1
            min = min - 60;
        }

        return `${hour}:${min}:${startSec}`;

    }

    handleMessage(message){
        if(message.type == 'PUNCHIN'){
            const uid = getCookies('uid');
            this.isPunchedIn = true;
            this.punchInTime = message.time;
            this.newTask.startTime = new Date(message.time).toLocaleTimeString('en-GB', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'   
            });
            this.startTimePerTask = this.newTask.startTime;
            this.statusPanel = { class: 'status-panel status-active', indicator: 'Active', text: 'Currently Working',workType:message.workMode == 'WFH' ? 'Work from Home': 'Work from Office',punchTime:'Started : ' + new Date(message.time).toLocaleString().substring(11, 19) ,dailyTotal: '0 H 0 M'}
            setCookies('dailyTotal'+uid, '0 H 0 M');
        }
        else if(message.type == 'PUNCHOUT'){
            this.isPunchedIn = false;
            this.punchOutTime = message.time;
            this.statusPanel = { class: 'status-panel status-inactive', indicator: 'Complete', text: 'Day Completed',workType:message.workMode == 'WFH' ? 'Work from Home': 'Work from Office',punchTime: 'Ended : ' + new Date(message.time).toLocaleString().substring(11, 19) ,dailyTotal: '0 H 0 M'}
        }
    }

    formatDuration(duration){
        let hours = Math.floor(duration / 60);
        let minutes = duration % 60;
        return `${hours} H ${minutes} M`;
    }

    async getTodaysTask(reload = false){
        // Getting user Id to get related Tasks
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            let today = new Date().toISOString().split('T')[0]; 
            if(this.selectedDate != today || reload){
                this.selectedDate = today;
                this.template.querySelector('.filter-date-task').value = today;
                const tasks = await getAllTasks({userId: uid, specificDate: today});
                this.tasks = [];
                if(tasks.length > 0){
                    tasks.map((task) => {
                        this.tasks.push({
                            id: task.Id,
                            title: task.Name,
                            duration: task.Duration__c,
                            startTime: msToTime(task.StartTime__c),
                            endTime: msToTime(task.EndTime__c),
                            formattedDuration: this.formatDuration(task.Duration__c),
                            description: task.Description__c,
                            formatDescription: task.Description__c ? task.Description__c.substring(0, 40) + '...' : '',
                        })
                    })
                }
            }
        this.isLoading = false;
        }
        catch(err){
            console.log('Error in TaskBar: ',JSON.stringify(err));
            console.log('Error in TaskBar: ',err?.message);
            this.isLoading = false;
        }
    }


    async filterTaskByDate(event){
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            if(this.selectedDate != event.target.value){
                this.selectedDate = event.target.value;       
                const tasks = await getAllTasks({userId: uid, specificDate: this.selectedDate});
                this.tasks = [];
                if(tasks.length > 0){
                    tasks.map((task) => {
                        this.tasks.push({
                            id: task.Id,
                            title: task.Name,
                            duration: task.Duration__c,
                            startTime: msToTime(task.StartTime__c),
                            endTime: msToTime(task.EndTime__c),
                            formattedDuration: this.formatDuration(task.Duration__c),
                            description: task.Description__c,
                            formatDescription: task.Description__c ? task.Description__c.substring(0, 40) + '...' : '',
                        })
                    })
                }
            }
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from TaskBar: ',JSON.stringify(err));
            this.isLoading = false;
        }
    }

    updateTaskTimes(event) {
        // Update the selected value
        if (event.target.dataset.id === 'taskHours') {
            this.Modalhours = parseInt(event.target.value) || 0;
        } else {
            this.Modalminutes = parseInt(event.target.value) || 0;
        }

        // Split startTime
        let [h, m, s] = this.newTask.startTime.split(':').map(Number);

        // Add selected hours and minutes
        let updatedHour = h + this.Modalhours;
        let updatedMin = m + this.Modalminutes;

        // Handle minute overflow
        if (updatedMin >= 60) {
            updatedHour += Math.floor(updatedMin / 60);
            updatedMin = updatedMin % 60;
        }

        // Optionally handle hour overflow if you want 24h format
        updatedHour = updatedHour % 24;

        // Update endTime
        this.newTask.endTime = `${String(updatedHour).padStart(2, '0')}:${String(updatedMin).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    }


    get modalTitle() {
        return this.isEdit ? 'Edit Task' : 'New Task';
    }

    get allowSaveTask(){
        return !this.newTask.title || (!this.Modalhours > 0 && !this.Modalminutes > 0);
    }

    editTask(event){
        this.showTaskForm = true;
        this.isEdit = true;
        this.tasks.map(task => {
            if(task.id == event.target.dataset.id){
                this.newTask = task;
            }
        })
        this.Modalhours = parseInt(this.newTask.duration / 60);
        this.Modalminutes = parseInt(this.newTask.duration % 60);
    }

    async deleteTask(event){
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            const taskId = event.target.dataset.id;

            const response = await deleteTask({
                taskId:taskId,
                userId: uid
            });
            if(response){
                await showAlert(this,'Success', 'Task Deleted Successfully', 'success');
            }
            else{
                await showAlert(this,'Error', 'Error deleting Task', 'error');
            }
            await this.updateTask();
            this.calculateDailyTotal();
            this.startTimePerTask = this.calculateStartTime(this.punchInTime,this.statusPanel.dailyTotal);
            await setCookies('dailyTotal'+ uid, this.statusPanel.dailyTotal);
            this.selectedDate = null;
            this.isLoading = false;
        }
        catch(err){
            console.log('Taskbar Error Save Task: ',JSON.stringify(err));
            console.log('Taskbar Error Message Save Task: ',err?.message);
            this.isLoading = false;
        }
    }

    // Open modal
    openTaskForm() {
        this.showTaskForm = true;
        this.isEdit = false;
        this.newTask = { title: '', duration: 0,startTime:this.startTimePerTask,endTime:'--:--', description: '' };
    }

    // Close modal
    closeTaskForm() {
        this.showTaskForm = false;
    }

    // Input handlers
    handleTitleChange(event) {
        this.newTask.title = event.target.value;
    }

    handleDescChange(event) {
        this.newTask.description = event.target.value;
    }

    get taskButtonTitle(){
        return !this.isPunchedIn ? 'Punch In to Add Task' : 'Add Task';
    }

    get disableTaskButton(){
        return !this.isPunchedIn;
    }

    get hoursOptions() {
        return Array.from({ length: 10 }, (_, i) => ({
            value: i,
            label: `${i} Hours`,
            selected: i === this.Modalhours
        }));
    }

    // minutes array with `selected` flag
    get minutesOptions() {
        return Array.from({ length: 60 }, (_, i) => ({
            value: i,
            label: `${i} Minutes`,
            selected: i === this.Modalminutes
        }));
    }
    
    // Save task
    async saveTask() {
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            this.newTask.duration = parseInt(this.Modalhours) * 60 + parseInt(this.Modalminutes);

            if (this.isEdit) {
            // update existing task
                const response = await updateTask({
                    taskId: this.newTask.id,
                    taskName: this.newTask.title,
                    taskDescription: this.newTask.description,
                    Duration: this.newTask.duration,
                    startTime: this.newTask.startTime,
                    endTime: this.newTask.endTime
                })
                if(response){
                    await showAlert(this,'Success', 'Task Updated Successfully', 'success');
                }
                else{
                    await showAlert(this,'Error', 'Error updating Task', 'error');
                }
            } else {
                // add new task
                this.startTimePerTask = this.newTask.endTime;
                
                const response = await createTask({
                    userId: uid,
                    specificDate: new Date().toISOString().split('T')[0],
                    taskName: this.newTask.title,
                    taskDescription: this.newTask.description,
                    Duration: this.newTask.duration,
                    startTime: this.newTask.startTime,
                    endTime: this.newTask.endTime
                })

                if(response){
                    await showAlert(this,'Success', 'Task Added Successfully', 'success');
                }
                else{
                    await showAlert(this,'Error', 'Error adding Task', 'error');
                }
                
            }
            await this.updateTask();
            this.calculateDailyTotal();
            await setCookies('dailyTotal'+ uid, this.statusPanel.dailyTotal);
            this.selectedDate = null;
            this.closeTaskForm();
            this.Modalhours = 0;
            this.Modalminutes = 0;
            this.isLoading = false;
        }
        catch(err){
            console.log('Taskbar Error Save Task: ',JSON.stringify(err));
            console.log('Taskbar Error Message Save Task: ',err?.message);
            this.isLoading = false;
        }
    }

}
