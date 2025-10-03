public without sharing class Tasks {
    
    @AuraEnabled
    public static List<Task__c> getAllTasks(String userId,String specificDate){
        try {
            Date taskDate = Date.valueOf(specificDate);
            List<Task__c> tasks = [SELECT Id, Name, Duration__c,StartTime__c,EndTime__c, Description__c FROM Task__c WHERE UserId__c = :userId AND Date__c = :taskDate];

            if(tasks.isEmpty()){
                return new List<Task__c>();
            }
            return tasks;
        } catch (Exception e) {
            System.debug('Error in getTasks: ' + e.getMessage());
            return new List<Task__c>();
        }
    }

    @AuraEnabled
    public static Boolean createTask(String userId,String specificDate,String taskName,String taskDescription,Integer Duration,String startTime , String endTime){
        try{
            // Parsing Format
            Time sTime = Time.newInstance(
                Integer.valueOf(startTime.split(':')[0]),
                Integer.valueOf(startTime.split(':')[1]),
                Integer.valueOf(startTime.split(':')[2]),
                0
            );

            Time eTime = Time.newInstance(
                Integer.valueOf(endTime.split(':')[0]),
                Integer.valueOf(endTime.split(':')[1]),
                Integer.valueOf(endTime.split(':')[2]),
                0
            );

            Date taskDate = Date.valueOf(specificDate);

            // Inserting Task
            Task__c task = new Task__c();
            task.UserId__c = userId;
            task.Date__c = taskDate;
            task.Name = taskName;
            task.Description__c = taskDescription;
            task.Duration__c = Duration;
            task.StartTime__c = sTime;
            task.EndTime__c = eTime;
            insert task;
            return true;
        }
        catch(Exception e){
            System.debug('Error in createTask: ' + e.getMessage());
            // throw new AuraHandledException(e.getMessage());
            return false;
        }
    }

    @AuraEnabled
    public static Boolean updateTask(String taskId,String taskName,String taskDescription,Integer Duration,String startTime , String endTime){
        try {
            Task__c existingTask = [SELECT Id, Name, Duration__c,StartTime__c,EndTime__c, Description__c FROM Task__c WHERE Id =:taskId LIMIT 1];

            if(existingTask != null){
                // Parsing Format
                Time sTime = Time.newInstance(
                    Integer.valueOf(startTime.split(':')[0]),
                    Integer.valueOf(startTime.split(':')[1]),
                    Integer.valueOf(startTime.split(':')[2]),
                    0
                );

                Time eTime = Time.newInstance(
                    Integer.valueOf(endTime.split(':')[0]),
                    Integer.valueOf(endTime.split(':')[1]),
                    Integer.valueOf(endTime.split(':')[2]),
                    0
                );


                existingTask.Name = taskName;
                existingTask.Description__c = taskDescription;
                existingTask.Duration__c = Duration;
                existingTask.StartTime__c = sTime;
                existingTask.EndTime__c = eTime;
                update existingTask;
                return true;
            }
            else{
                return false;
            }
            
        } catch (Exception e) {
            // throw new AuraHandledException(e.getMessage());
            return false;
        }
    }
}