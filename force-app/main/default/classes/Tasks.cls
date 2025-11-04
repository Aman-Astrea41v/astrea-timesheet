public without sharing class Tasks {
    
    @AuraEnabled
    public static List<Task__c> getAllTasks(String userId,String specificDate){
        try {
            Date taskDate = Date.valueOf(specificDate);
            List<Task__c> tasks = [SELECT Id, Name, Duration__c,StartTime__c,EndTime__c, Description__c,Category__c FROM Task__c WHERE UserId__c = :userId AND Date__c = :taskDate ORDER BY StartTime__c ASC];

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
    public static void updateDailyTotal(String userId,Date specificDate){
        try {
            List<Task__c> allTasks = [SELECT Id, Duration__c FROM Task__c WHERE Date__c = :specificDate AND UserId__c = :userId];
            Report__c report = [SELECT Id, Daily_Total_Time__c FROM Report__c WHERE UserId__c = :userId AND Date__c = :specificDate LIMIT 1];

            if(report != null){
                report.Daily_Total_Time__c = 0;
                for(Task__c task : allTasks){
                    report.Daily_Total_Time__c += task.Duration__c;
                }
                update report;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Boolean createTask(String userId,String specificDate,String taskName,String taskDescription,Integer Duration,String startTime , String endTime, String category, String otherCategory){
        try{
            // Parsing Format
            Time sTime = Time.newInstance(
                Integer.valueOf(startTime.split(':')[0]),
                Integer.valueOf(startTime.split(':')[1]),
                0,
                0
            );

            Time eTime = Time.newInstance(
                Integer.valueOf(endTime.split(':')[0]),
                Integer.valueOf(endTime.split(':')[1]),
                0,
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
            task.Category__c = category;
            task.Others_Category_Text__c = otherCategory;
            insert task;

            // Update Daily Total in Report
            updateDailyTotal(userId,taskDate);
        }
        catch(Exception e){
            System.debug('Error in createTask: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
        return true;
    }

    @AuraEnabled
    public static Boolean updateTask(String taskId, String taskName, String taskDescription, Integer Duration, String startTime, String endTime, String category, String otherCategory) {
        try {
            // Get the task to update
            Task__c existingTask = [SELECT Id, Name, Duration__c, StartTime__c, EndTime__c, Description__c ,UserId__c, Date__c
                                    FROM Task__c WHERE Id = :taskId LIMIT 1];

            if(existingTask != null){
                // Parse startTime and endTime
                Time sTime = Time.newInstance(
                    Integer.valueOf(startTime.split(':')[0]),
                    Integer.valueOf(startTime.split(':')[1]),
                    0,
                    0
                );

                Time eTime = Time.newInstance(
                    Integer.valueOf(endTime.split(':')[0]),
                    Integer.valueOf(endTime.split(':')[1]),
                    0,
                    0
                );

                // Update current task
                existingTask.Name = taskName;
                existingTask.Description__c = taskDescription;
                existingTask.Duration__c = Duration;
                existingTask.StartTime__c = sTime;
                existingTask.EndTime__c = eTime;
                existingTask.Category__c = category;
                existingTask.Others_Category_Text__c = otherCategory;
                update existingTask;

                // Update Daily Total in Report
                updateDailyTotal(existingTask.UserId__c,existingTask.Date__c);

                return true;
            } else {
                return false;
            }

        } catch (Exception e) {
            System.debug('Error updating task: ' + e.getMessage());
            return false;
        }
    }

    @AuraEnabled
    public static Boolean deleteTask(String taskId, String userId) {
        try {
            Report__c report = [SELECT Id,Punch_In__c FROM Report__c WHERE UserId__c = :userId AND Date__c = TODAY LIMIT 1];

            Time punchInTime = report.Punch_In__c;
            
            Task__c taskToDelete = [SELECT Id, StartTime__c, EndTime__c, Duration__c, Date__c 
                                    FROM Task__c WHERE Id = :taskId LIMIT 1];

            Date dateToUpdateDailyTotal = taskToDelete.Date__c;

            if(taskToDelete == null) {
                return false;
            }
                                            
            delete taskToDelete;
            
            // Update Daily Total in Report
            updateDailyTotal(userId,dateToUpdateDailyTotal);
            
            return true;

        } catch(Exception e) {
            System.debug('Error deleting task: ' + e.getMessage());
            return false;
        }
    }


}