import { getCookies, showAlert, msToTime } from 'c/utils';
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
import getDailyTotal from '@salesforce/apex/Reports.getDailyTotal';

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
    isEdit;
    isPunchedIn = false;
    isLoading = false;
    showOtherCategoryText = false;
    isToday = false;

    @track tasks = [];

    @track newTask = { title: '', duration: 0,startTime:'--:--',endTime:'--:--', description: '', 
    category: 'Salesforce Admin' ,otherCategory: '' };
    showTaskForm = false;

    @track statusPanel = { class: 'status-panel status-pending', indicator: 'Waiting', text: 'Not Started',workType:'Please punch in to begin',punchTime: '' ,dailyTotal: '0 H 0 M' };

    @wire(MessageContext)
        messageContext;

    async connectedCallback(){
        try{
            const d = new Date();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            const year = d.getFullYear();
            this.today = `${year}-${month}-${day}`;
            this.isLoading = true;
            await this.getTodaysTask();
            if(!this.subscription){
                this.subscription = subscribe(this.messageContext, MY_CHANNEL, (message) => {
                    this.handleMessage(message)
                })
            }
            
            const specificDate = new Date().toISOString().split('T')[0];
            
            // Managing Status Panel and Punch In Status
            const uid = await getCookies('uid');
            let dailyTotal = await getDailyTotal({userId:uid,specificDate:specificDate});            
            if(dailyTotal == null){
                dailyTotal = this.formatDuration(0);
            }
            else{
                dailyTotal = this.formatDuration(dailyTotal);
            }
            const reportData = await getUserPunchStatus({userId:uid,specificDate:specificDate});

            if(reportData.punchedIn == 'true' && reportData.punchedOut == 'false'){
                this.isPunchedIn = true;
                this.punchInTime = reportData?.punchInTime.split('.')[0]

                this.statusPanel = { class: 'status-panel status-active', indicator: 'Active', text: 'Currently Working',workType:reportData.workMode,punchTime:'Started : ' + this.punchInTime.split(':')[0] + " : " + this.punchInTime.split(':')[1], dailyTotal: dailyTotal
                }
            }
            else if(reportData.punchedIn == 'false' && reportData.punchedOut == 'false'){
                this.isPunchedIn = false;
                this.statusPanel = { class: 'status-panel status-pending', indicator: 'Waiting', text: 'Not Started',workType:'Please punch in to begin',punchTime: '' ,dailyTotal: '0 H 0 M' };
            }
            else{
                this.isPunchedIn = false;
                this.punchOutTime = reportData?.punchOutTime.split('.')[0];
                this.statusPanel = { class: 'status-panel status-inactive', indicator: 'Completed', text: 'Day Completed',workType:reportData.workMode,punchTime:'Ended : ' + this.punchOutTime.split(":")[0] +  " : " + this.punchOutTime.split(":")[1], dailyTotal: dailyTotal
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

    async updateTask(){
        this.isLoading = true;
        await this.filterTaskByDate({ target: { value: null } });
        this.tasks = this.tasks.map(task => ({
            ...task,
            formatTitle: task.title ? (task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title) : '',
            formatDescription: task.description ? (task.description.length > 40 ? task.description.substring(0, 40) + '...' : task.description) : '',
            formattedDuration: this.formatDuration(task.duration)
        }));

        const uid = await getCookies('uid');
        let dailyTotal = await getDailyTotal({userId:uid,specificDate:this.selectedDate});
        if(dailyTotal == null){
            this.statusPanel.dailyTotal = this.formatDuration(0);
        }
        else{
            this.statusPanel.dailyTotal = this.formatDuration(dailyTotal);
        }
        this.isLoading = false;
    }

    handleMessage(message){
        if(message.type == 'PUNCHIN'){
            const uid = getCookies('uid');
            this.isPunchedIn = true;
            this.punchInTime = message.time;
            this.statusPanel = { 
                class: 'status-panel status-active', 
                indicator: 'Active', 
                text: 'Currently Working',
                workType:message.workMode == 'WFH' ? 'Work from Home': 'Work from Office',
                punchTime:'Started : ' + new Date(message.time).toLocaleTimeString('en-GB', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                dailyTotal: '0 H 0 M'
            }
        }
        else if(message.type == 'PUNCHOUT'){
            this.isPunchedIn = false;
            this.punchOutTime = message.time;
            this.statusPanel = { 
                class: 'status-panel status-inactive', 
                indicator: 'Complete', text: 'Day Completed',
                workType:message.workMode == 'WFH' ? 'Work from Home': 'Work from Office',
                punchTime: 'Ended : ' + new Date(message.time).toLocaleTimeString('en-GB', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                }),
            }
        }
    }

    formatDuration(duration){
        let hours = Math.floor(duration / 60);
        let minutes = duration % 60;
        return `${hours} H ${minutes} M`;
    }

    async getTodaysTask(){
        // Getting user Id to get related Tasks
        try{
            this.isLoading = true;
            const uid = await getCookies('uid');
            let today = new Date().toISOString().split('T')[0]; 
            this.selectedDate = today;
            this.isToday = this.selectedDate == this.today;
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
                        category: task.Category__c,
                        formatDescription: task.description ? (task.description.length > 40 ? task.description.substring(0, 40) + '...' : task.description) : '',
                        formatTitle: task.Name ? (task.Name.length > 15 ? task.Name.substring(0, 15) + '...' : task.Name) : ''
                    })
                })
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
                this.selectedDate = event.target.value == null ? this.selectedDate : event.target.value;
                this.isToday = this.selectedDate == this.today;      
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
                            category: task.Category__c,
                            formatDescription: task.description ? (task.description.length > 40 ? task.description.substring(0, 40) + '...' : task.description) : '',
                            formatTitle: task.Name ? (task.Name.length > 15 ? task.Name.substring(0, 15) + '...' : task.Name) : ''
                        })
                    })
                }
                let dailyTotal = await getDailyTotal({userId:uid,specificDate:this.selectedDate});
                if(dailyTotal == null){
                    this.statusPanel.dailyTotal = this.formatDuration(0);
                }
                else{
                    this.statusPanel.dailyTotal = this.formatDuration(dailyTotal);
                }
            }
            this.isLoading = false;
        }
        catch(err){
            console.log('Error from TaskBar: ',JSON.stringify(err));
            this.isLoading = false;
        }
    }

    get modalTitle() {
        return this.isEdit ? 'Edit Task' : 'New Task';
    }

    get allowSaveTask(){
        return !this.newTask.title || (!this.Modalhours > 0 && !this.Modalminutes > 0);
    }

    editTask(event){
        this.showTaskForm = true;
        this.tasks.map(task => {
            if(task.id == event.target.dataset.id){
                this.newTask = {...task};
            }
        })
        this.Modalhours = parseInt(this.newTask.duration / 60);
        this.Modalminutes = parseInt(this.newTask.duration % 60);
        this.isEdit = true;
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
            
            // Update the Daily Total
            let dailyTotal = await getDailyTotal({userId:uid,specificDate:this.selectedDate});
            if(dailyTotal == null){
                this.statusPanel.dailyTotal = this.formatDuration(0);
            }
            else{
                this.statusPanel.dailyTotal = this.formatDuration(dailyTotal);
            }

            this.isLoading = false;
        }
        catch(err){
            console.log('Taskbar Error Save Task: ',JSON.stringify(err));
            console.log('Taskbar Error Message Save Task: ',err?.message);
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

    }

    // Open modal
    openTaskForm() {
        this.showTaskForm = true;
        this.isEdit = false;
        this.newTask = { title: '', duration: 0,startTime:'--:--',endTime:'--:--', description: '', category: 'Salesforce Admin', otherCategory: '' };
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

    handleCategoryChange(event) {
        this.newTask.category = event.target.value;
        if(event.target.value == 'Others'){
            this.showOtherCategoryText = true;
        }
        else{
            this.showOtherCategoryText = false;
        }
    }

    updateStartTime(event){
        this.newTask.startTime = event.target.value;
    }

    updateEndTime(event){
        this.newTask.endTime = event.target.value;
    }

    handleOtherCategory(event){
        this.newTask.otherCategory = event.target.value;
    }

    get taskButtonTitle(){
        return !this.isPunchedIn ? 'Punch In to Add Task' : 'Add Task';
    }

    get disableTaskButton(){
        return !this.isPunchedIn || this.selectedDate != this.today;
    }

    get hoursOptions() {
        return Array.from({ length: 10 }, (_, i) => ({
            value: i,
            label: `${i} Hours`,
            selected: i === this.Modalhours
        }));
    }

    get categoryOptions(){
        return [
            { label: 'Salesforce Admin', value: 'Salesforce Admin', selected: this.newTask.category  === 'Salesforce Admin' },
            { label: 'Apex', value: 'Apex', selected: this.newTask.category  === 'Apex' },
            { label: 'LWC', value: 'LWC', selected: this.newTask.category  === 'LWC' },
            { label: 'Aura', value: 'Aura', selected: this.newTask.category  === 'Aura' },
            { label: 'Integration', value: 'Integration', selected: this.newTask.category  === 'Integration' },
            { label: 'Agentforce', value: 'Agentforce', selected: this.newTask.category  === 'Agentforce' },
            { label: 'Service Cloud', value: 'Service Cloud', selected: this.newTask.category  === 'Service Cloud' },
            { label: 'Others', value: 'Others', selected: this.newTask.category  === 'Others' }
        ];
    }

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
                    endTime: this.newTask.endTime,
                    category: this.newTask.category,
                    otherCategory: this.newTask.otherCategory
                })
                if(response){
                    await showAlert(this,'Success', 'Task Updated Successfully', 'success');
                }
                else{
                    await showAlert(this,'Error', 'Error updating Task', 'error');
                }
            } else {
                
                const response = await createTask({
                    userId: uid,
                    specificDate: new Date().toISOString().split('T')[0],
                    taskName: this.newTask.title,
                    taskDescription: this.newTask.description,
                    Duration: this.newTask.duration,
                    startTime: this.newTask.startTime,
                    endTime: this.newTask.endTime,
                    category: this.newTask.category,
                    otherCategory: this.newTask.otherCategory,
                })

                if(response){
                    await showAlert(this,'Success', 'Task Added Successfully', 'success');
                }
                
            }
            await this.updateTask();
            this.closeTaskForm();
            this.Modalhours = 0;
            this.Modalminutes = 0;
            this.showOtherCategoryText = false;
            this.isLoading = false;
        }
        catch(err){
            console.log('Taskbar Error Save Task: ',JSON.stringify(err));
            console.log('Taskbar Error Message Save Task: ',err?.message);
            await showAlert(this,'Error', 'Error adding Task', 'error');
            this.closeTaskForm();
            this.isLoading = false;
        }
    }

}
