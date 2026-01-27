public without sharing class Tasks {
    @AuraEnabled
    public static List<TimeSheet__c> getAllTasks(String userId,String specificDate){
        try {
            Date taskDate = Date.valueOf(specificDate);
            List<TimeSheet__c> tasks = [SELECT Id, Task__c, Time__c,StartTime__c,EndTime__c, Comment__c,Category__c FROM TimeSheet__c WHERE Employee__c = :userId AND Date__c = :taskDate ORDER BY StartTime__c ASC];

            if(tasks.isEmpty()){
                return new List<TimeSheet__c>();
            }
            return tasks;
        } catch (Exception e) {
            System.debug('Error in getTasks: ' + e.getMessage());
            return new List<TimeSheet__c>();
        }
    }

    @AuraEnabled
    public static void updateDailyTotal(String userId,Date specificDate){
        try {
            List<TimeSheet__c> allTasks = [SELECT Id, Time__c FROM TimeSheet__c WHERE Date__c = :specificDate AND Employee__c = :userId];
            Punch_In_Out__c report = [SELECT Id, Daily_Total_Time__c FROM Punch_In_Out__c WHERE Employee__c  = :userId AND Date__c = :specificDate LIMIT 1];

            if(report != null){
                report.Daily_Total_Time__c = 0;
                for(TimeSheet__c task : allTasks){
                    report.Daily_Total_Time__c += Integer.valueOf(task.Time__c);
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

            // Getting Day of Week
            Datetime dt = Datetime.newInstance(taskDate.year(), taskDate.month(), taskDate.day());
            String dayOfWeek = dt.format('EEEE');

            // Inserting Task
            TimeSheet__c task = new TimeSheet__c();
            task.Employee__c = userId;
            task.Date__c = taskDate;
            task.Task__c = taskName;
            task.Comment__c = taskDescription;
            task.Time__c = String.valueOf(Duration);
            task.StartTime__c = sTime;
            task.EndTime__c = eTime;
            task.Category__c = category;
            task.Others_Category_Text__c = otherCategory;
            task.Day__c = dayOfWeek;
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
            TimeSheet__c existingTask = [SELECT Id, Task__c, Time__c, StartTime__c, EndTime__c, Comment__c ,Employee__c, Date__c
                                    FROM TimeSheet__c WHERE Id = :taskId LIMIT 1];

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
                existingTask.Task__c = taskName;
                existingTask.Comment__c = taskDescription;
                existingTask.Time__c = String.valueOf(Duration);
                existingTask.StartTime__c = sTime;
                existingTask.EndTime__c = eTime;
                existingTask.Category__c = category;
                existingTask.Others_Category_Text__c = otherCategory;
                update existingTask;

                // Update Daily Total in Report
                updateDailyTotal(existingTask.Employee__c,existingTask.Date__c);

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
            Punch_In_Out__c report = [SELECT Id,Punch_In_Time__c FROM Punch_In_Out__c WHERE Employee__c  = :userId AND Date__c = TODAY LIMIT 1];

            Time punchInTime = report.Punch_In_Time__c;
            
            TimeSheet__c taskToDelete = [SELECT Id, StartTime__c, EndTime__c, Time__c, Date__c 
                                    FROM TimeSheet__c WHERE Id = :taskId LIMIT 1];

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