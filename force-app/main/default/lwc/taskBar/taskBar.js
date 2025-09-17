import { getCookies, showAlert } from 'c/utils';
import { LightningElement, track, wire } from 'lwc';
import MY_CHANNEL from "@salesforce/messageChannel/MyChannel__c";
import { subscribe, MessageContext } from 'lightning/messageService';
// Task Class
import getAllTasks from '@salesforce/apex/Tasks.getAllTasks';
import createTask from '@salesforce/apex/Tasks.createTask';
// Report Class
import getUserPunchStatus from '@salesforce/apex/Reports.getUserPunchStatus';

export default class taskBar extends LightningElement {
    // Initialize Variables
    selectedDate;
    isToday = false;
    subscription;
    @track hours = Array.from({ length: 10 }, (_, i) => i);  
    @track minutes = Array.from({ length: 60 }, (_, i) => i); 
    formattedDuration = '';
    Modalhours = 0;
    Modalminutes = 0;
    punchInTime;
    punchOutTime;
    startTimePerTask;
    isEdit;
    dailyTotal;
    isPunchedIn = false;

    @track tasks = [];

    @track newTask = { id:'', title: '', duration: 0,startTime:'',endTime:'--:--', description: '' };
    showTaskForm = false;

    @track statusPanel = { class: 'status-panel status-pending', indicator: 'Waiting', text: 'Not Started',workType:'Please punch in to begin',punchTime: '' ,dailyTotal: '0h 0m' };

    @wire(MessageContext)
        MessageContext;

    // Run when the component is mounted/ Screen is refreshed
    async connectedCallback(){
        await this.getTodaysTask();
        try{
            if(!this.subscription){
                this.subscription = subscribe(this.MessageContext, MY_CHANNEL, (message) => {
                    this.handleMessage(message)
                })
            }

            // Managing Status Panel and Punch In Status
            const uid = await getCookies('uid');
            const specificDate = new Date().toISOString().split('T')[0];
            const reportData = await getUserPunchStatus({userId:uid,specificDate:specificDate});

            if(reportData.punchedIn == 'true' && reportData.punchedOut == 'false'){
                this.isPunchedIn = true;
                this.statusPanel = { class: 'status-panel status-active', indicator: 'Active', text: 'Currently Working',workType:reportData.workMode,punchTime:'Started : ' + reportData.punchInTime ,dailyTotal: this.dailyTotal}
            }
            else if(reportData.punchedIn == 'false' && reportData.punchedOut == 'false'){
                this.isPunchedIn = false;
                this.statusPanel = { class: 'status-panel status-pending', indicator: 'Waiting', text: 'Not Started',workType:'Please punch in to begin',punchTime: '' ,dailyTotal: '0h 0m' };
            }
            else{
                this.isPunchedIn = false;
                this.statusPanel = { class: 'status-panel status-inactive', indicator: 'Completed', text: 'Day Completed',workType:reportData.workMode,punchTime:'Ended : ' + reportData.punchOutTime ,dailyTotal: this.dailyTotal
                }
            }
        }
        catch(err){
            console.log('Error from TaskBar: ',err);
        }

    }

    updateTask(){
        this.tasks = this.tasks.map(task => ({
            ...task,
            formattedDuration: this.formatDuration(task.duration)
        }));
    }

    handleMessage(message){
        if(message.type == 'PUNCHIN'){
            this.isPunchedIn = true;
            this.punchInTime = message.time;
            this.newTask.startTime = new Date(message.time).toLocaleString().substring(11, 19);
            this.startTimePerTask = new Date(message.time).toLocaleString().substring(11, 19);
            this.statusPanel = { class: 'status-panel status-active', indicator: 'Active', text: 'Currently Working',workType:message.workMode == 'WFH' ? 'Work from Home': 'Work from Office',punchTime:'Started : ' + new Date(message.time).toLocaleString().substring(11, 19) ,dailyTotal: '0h 0m'}
        }
        else if(message.type == 'PUNCHOUT'){
            this.isPunchedIn = false;
            this.punchOutTime = message.time;
            this.statusPanel = { class: 'status-panel status-inactive', indicator: 'Complete', text: 'Day Completed',workType:message.workMode == 'WFH' ? 'Work from Home': 'Work from Office',punchTime: 'Ended : ' + new Date(message.time).toLocaleString().substring(11, 19) ,dailyTotal: '0h 0m'}
        }
    }

    formatDuration(duration){
        let hours = Math.floor(duration / 60);
        let minutes = duration % 60;
        return `${hours} H ${minutes} M`;
    }

    async getTodaysTask(){
        // Getting user Id to get related Tasks
        const Id = await getCookies('uid');
        let today = new Date().toISOString().split('T')[0]; 
        const tasks = await getAllTasks({userId: Id, specificDate: today});
        this.tasks = [];
        if(tasks.length > 0){
            tasks.map((task) => {
                this.tasks.push({
                    id: task.Id,
                    title: task.Name,
                    duration: task.Duration__c,
                    startTime: task.Start_Time__c,
                    endTime: task.End_Time__c,
                    formattedDuration: this.formatDuration(task.Duration__c),
                    description: task.Description__c
                })
            })
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

    editTask(event){
        this.showTaskForm = true;
        this.isEdit = true;
        this.tasks.map(task => {
            if(task.id == event.target.dataset.id){
                this.newTask = task;
            }
        })
    }

    // Open modal
    openTaskForm() {
        this.showTaskForm = true;
        this.isEdit = false;
        this.newTask = { id:'', title: '', duration: 0,startTime:this.startTimePerTask,endTime:'--:--', description: '' };
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
    
    // Save task
    async saveTask() {
        try{
            const uid = await getCookies('uid');
            this.newTask.duration = parseInt(this.Modalhours) * 60 + parseInt(this.Modalminutes);

            if (this.isEdit) {
            // update existing task
                this.tasks = this.tasks.map(task => task.id === this.newTask.id ? {...this.newTask} : task);
            } else {
                // add new task
                this.startTimePerTask = this.newTask.endTime;

                this.tasks = [...this.tasks, this.newTask];

                const response = await createTask({
                    userId: uid,
                    specificDate: new Date().toISOString().split('T')[0],
                    taskName: this.newTask.title,
                    taskDescription: this.newTask.description,
                    Duration: parseInt(parseInt(this.Modalhours) * 60 + parseInt(this.Modalminutes)),
                    startTime: this.newTask.startTime,
                    endTime: this.newTask.endTime
                })

                if(response){
                    await showAlert('Success', 'Task Added Successfully', 'success');
                }
                else{
                    await showAlert('Error', 'Error adding Task', 'error');
                }
                
            }
            this.statusPanel.dailyTotal = this.formatDuration(this.tasks.reduce((acc, task) => acc + task.duration, 0));
            this.updateTask();
            this.closeTaskForm();
        }
        catch(err){
            console.log(this.newTask);
            console.log(this.newTask.duration);
            console.log(err);
        }
    }

}
