import { getCookies } from 'c/utils';
import { LightningElement, track } from 'lwc';
import getTasks from '@salesforce/apex/Tasks.getTasks';

export default class taskBar extends LightningElement {
    // Initialize Variables
    currentDateTime;
    selectedDate;
    isToday = false;

    @track tasks = [];

    @track newTask = { task: '', time: '', description: '' };
    showTaskForm = false;

    columns = [
        { label: 'Task', fieldName: 'task' },
        { label: 'Time', fieldName: 'time' },
        { label: 'Description', fieldName: 'description' },
        {
            type: 'button-icon',
            initialWidth: 50,
            typeAttributes: {
                iconName: 'utility:edit',
                name: 'edit',
                title: 'Edit',
                variant: 'bare',
                alternativeText: 'Edit'
            }
        },
    ];

    // Run when the component is mounted/ Screen is refreshed
    async connectedCallback(){
        await this.getTodaysTask();
        // Updating time
        this.updateTime();
        setInterval(() => {
            this.updateTime();
        },1000);
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
                    let formattedTime = new Date(task.Time__c).toISOString().substring(11, 19);
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

    async handleDateChange(event){
        if(this.selectedDate == event.target.value){
            return;
        }
        this.selectedDate = event.target.value;
        if(event.target.value == null){
            if(!this.isToday){
                await this.getTodaysTask();
            }
        }
        else{
            const Id = await getCookies('uid');
            const date = new Date(this.selectedDate);
            const tasks = await getTasks({userId: Id, specificDate: date});
            this.tasks = [];
            if(tasks.length > 0){
                tasks.map((task) => {
                    let formattedTime = new Date(task.Time__c).toISOString().substring(11, 19);
                    this.tasks.push({
                        id: task.Id,
                        task: task.Name,
                        time: formattedTime,
                        description: task.Description__c
                    })
                })
            }
            this.isToday = false;
        }
    }

    get modalTitle() {
        return this.isEdit ? 'Edit Task' : 'New Task';
    }

    // Open modal
    openTaskForm() {
        this.showTaskForm = true;
        this.isEdit = false;
        this.newTask = { id: '', task: '', time: '', description: '' };
    }

    // Close modal
    closeTaskForm() {
        this.showTaskForm = false;
    }

    // Input handlers
    handleTaskChange(event) {
        this.newTask.task = event.target.value;
    }

    handleTimeChange(event) {
        this.newTask.time = event.target.value;
    }

    handleDescChange(event) {
        this.newTask.description = event.target.value;
    }

    // To update current time
    updateTime(){
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = now.toLocaleDateString('en-US', options);
        const time = now.toLocaleTimeString('en-US');
        this.currentDateTime = `${date}, ${time}`;
    }

    // Save task
    saveTask() {
        if (this.isEdit) {
            // update existing task
            this.tasks = this.tasks.map(task => task.id === this.newTask.id ? {...this.newTask} : task);
        } else {
            // add new task
            this.newTask.id = Date.now().toString();
            this.tasks = [...this.tasks, this.newTask];
        }
        this.closeTaskForm();
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'edit') {
            this.isEdit = true;
            this.newTask = { ...row };
            this.showTaskForm = true;
        }
    }
}
