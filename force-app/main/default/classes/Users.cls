public with sharing class Users {
    @AuraEnabled
    public static User__c getUsers(String email){
        try{
            User__c user1 = [SELECT Id,UserId__c,First_Name__c,Last_Name__c, Name, Email__c,Password__c,Address__c,College_Name__c,Phone__c  FROM User__c WHERE Email__c = :email LIMIT 1];
            return user1;
        }
        catch(Exception err){
            System.debug(err);
            return null;
        }
    }

    @AuraEnabled
    public static String createNewUser(String username, String email, String password) {
        try {
            List<User__c> users = [
                SELECT UserId__c 
                FROM User__c 
                WHERE Email__c = :email 
                LIMIT 1
            ];
            
            if (users.isEmpty()) {
                User__c newUser = new User__c(
                    Name = username,
                    Email__c = email,
                    Password__c = password
                );
                insert newUser;
                return 'success';
            } else {
                return 'exist';
            }
        } catch (Exception e) {
            System.debug('Error in createNewUser: ' + e.getMessage());
            return 'error';
        }
    }

}