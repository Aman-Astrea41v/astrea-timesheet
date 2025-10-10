public without sharing class Tasks {
    
    @AuraEnabled
    public static List<Task__c> getAllTasks(String userId,String specificDate){
        try {
            Date taskDate = Date.valueOf(specificDate);
            List<Task__c> tasks = [SELECT Id, Name, Duration__c,StartTime__c,EndTime__c, Description__c FROM Task__c WHERE UserId__c = :userId AND Date__c = :taskDate ORDER BY StartTime__c ASC];

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
    public static Boolean updateTask(String taskId, String taskName, String taskDescription, Integer Duration, String startTime, String endTime) {
        try {
            // Get the task to update
            Task__c existingTask = [SELECT Id, Name, Duration__c, StartTime__c, EndTime__c, Description__c 
                                    FROM Task__c WHERE Id = :taskId LIMIT 1];

            if(existingTask != null){
                // Parse startTime and endTime
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

                // Update current task
                existingTask.Name = taskName;
                existingTask.Description__c = taskDescription;
                existingTask.Duration__c = Duration;
                existingTask.StartTime__c = sTime;
                existingTask.EndTime__c = eTime;
                update existingTask;

                // Get subsequent tasks that start after this task
                List<Task__c> subsequentTasks = [SELECT Id, StartTime__c, EndTime__c, Duration__c
                FROM Task__c
                WHERE StartTime__c > :existingTask.StartTime__c
                ORDER BY StartTime__c ASC];

                // Shift subsequent tasks
                Time prevEnd = eTime;
                for(Task__c t : subsequentTasks){
                    t.StartTime__c = prevEnd;
                    t.EndTime__c = prevEnd.addMinutes(Integer.valueOf(Math.round(t.Duration__c)));
                    prevEnd = t.EndTime__c;
                }

                if(!subsequentTasks.isEmpty()){
                    update subsequentTasks;
                }

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
            Task__c taskToDelete = [SELECT Id, StartTime__c, EndTime__c, Duration__c 
                                    FROM Task__c WHERE Id = :taskId LIMIT 1];

            if(taskToDelete == null) {
                return false;
            }

            List<Task__c> prevList = [SELECT Id, EndTime__c 
                                    FROM Task__c 
                                    WHERE EndTime__c <= :taskToDelete.StartTime__c
                                    AND Date__c = TODAY
                                    AND UserId__c = :userId 
                                    ORDER BY EndTime__c DESC 
                                    LIMIT 1];
            Task__c previousTask = prevList.isEmpty() ? null : prevList[0];

            List<Task__c> subsequentTasks = [SELECT Id, StartTime__c, EndTime__c, Duration__c
                                            FROM Task__c
                                            WHERE StartTime__c > :taskToDelete.StartTime__c
                                            AND Date__c = TODAY
                                            ORDER BY StartTime__c ASC];

            delete taskToDelete;

            Time newStart = previousTask != null ? previousTask.EndTime__c : punchInTime;

            for(Task__c t : subsequentTasks){
                t.StartTime__c = newStart;
                t.EndTime__c = newStart.addMinutes(Integer.valueOf(t.Duration__c));
                newStart = t.EndTime__c;
            }

            if(!subsequentTasks.isEmpty()){
                update subsequentTasks;
            }

            return true;

        } catch(Exception e) {
            System.debug('Error deleting task: ' + e.getMessage());
            return false;
        }
    }


}