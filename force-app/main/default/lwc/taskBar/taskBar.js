import { getCookies } from 'c/utils';
import { LightningElement, track, wire } from 'lwc';
import MY_CHANNEL from "@salesforce/messageChannel/MyChannel__c";
import { subscribe, MessageContext } from 'lightning/messageService';
import getTasks from '@salesforce/apex/Tasks.getTasks';

export default class taskBar extends LightningElement {
    // Initialize Variables
    currentDateTime;
    selectedDate;
    isToday = false;
    subscription;
    @track hours = Array.from({ length: 10 }, (_, i) => i);  
    @track minutes = Array.from({ length: 60 }, (_, i) => i); 
    disableTaskBtn = true;
    formattedDuration = '';
    Modalhours = 0;
    Modalminutes = 0;
    punchInTime;
    punchOutTime;
    startTimePerTask;
    isEdit;

    @track tasks = [];

    @track newTask = { id:'', title: '', duration: 0,startTime:'',endTime:'--:--', description: '' };
    showTaskForm = false;

    @wire(MessageContext)
        MessageContext;

    // Run when the component is mounted/ Screen is refreshed
    async connectedCallback(){
        // await this.getTodaysTask();
        if(!this.subscription){
            this.subscription = subscribe(this.MessageContext, MY_CHANNEL, (message) => {
                this.handleMessage(message)
            })
        }

        this.tasks = this.tasks.map(task => ({
            ...task,
            formattedDuration: this.formatDuration(task.duration)
        }));

    }

    handleMessage(message){
        if(message.type == 'PUNCHIN'){
            this.disableTaskBtn = message.disableTask;
            this.punchInTime = message.time;
            this.newTask.startTime = new Date(message.time).toLocaleString().substring(11, 19);
            this.startTimePerTask = new Date(message.time).toLocaleString().substring(11, 19);
        }
        else if(message.type == 'PUNCHOUT'){
            this.disableTaskBtn = message.disableTask;
            this.punchOutTime = message.time;
        }
    }

    formatDuration(duration){
        let hours = Math.floor(duration / 60);
        let minutes = duration % 60;
        return `${hours} H ${minutes} M`;
    }

    async getTodaysTask(){
        // Getting user Id to get related Tasks
        if(!this.isToday){
            const Id = await getCookies('uid');
            let today = new Date().toISOString().split('T')[0]; 
            const tasks = await getTasks({userId: Id, specificDate: today});
            this.tasks = [];
            if(tasks.length > 0){
                tasks.map((task) => {
                    let formattedTime = new Date(task.StartTime__c).toISOString().substring(11, 19);
                    this.tasks.push({
                        id: task.Id,
                        task: task.Name,
                        time: formattedTime,
                        description: task.Description__c
                    })
                })
                this.isToday = true;
                this.selectedDate = today;
            }
        }
    }

    updateTaskTimes(event) {
        // Update the selected value
        if (event.target.dataset.id === 'taskHours') {
            this.Modalhours = parseInt(event.target.value) || 0;
        } else {
            console.log(parseInt(event.target.value));
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
        return this.disableTaskBtn ? 'Punch In to Add Task' : 'Add Task';
    }

    // Save task
    saveTask() {
        if (this.isEdit) {
            // update existing task
            this.tasks = this.tasks.map(task => task.id === this.newTask.id ? {...this.newTask} : task);
        } else {
            // add new task
            this.startTimePerTask = this.newTask.endTime;

            this.newTask.id = Date.now().toString();
            this.newTask.duration = parseInt(this.Modalhours) * 60 + parseInt(this.Modalminutes);
            this.tasks = [...this.tasks, this.newTask];

        }
        this.closeTaskForm();
    }

}
