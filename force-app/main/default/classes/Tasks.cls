public with sharing class Tasks {
    
    @AuraEnabled(cacheable=true)
    public static List<Task__c> getTasks(String userId,Date specificDate){
        try {
            // List<Task__c> tasks = [SELECT Id, Name, Time__c, Description__c FROM Task__c WHERE UserId__c = :userId AND Date__c = :specificDate];
            // return tasks;
            return new List<Task__c>();
        } catch (Exception e) {
            System.debug('Error in getTasks: ' + e.getMessage());
            return null;
        }
    }
}