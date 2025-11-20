public without sharing class Users {
    
    public class UserWrapper{
        @AuraEnabled
        public User__c Custom_user;

        @AuraEnabled
        public String StateCode;

        @AuraEnabled
        public String CountryCode;
    }
    
    @AuraEnabled
    public static UserWrapper getUsers(String email){
        try{
            User__c user1 = [SELECT Id,UserId__c,First_Name__c,Last_Name__c, Name, Email__c,Password__c,Address__c,College_Name__c,Phone__c  FROM User__c WHERE Email__c = :email LIMIT 1];
            UserWrapper userData = new UserWrapper();
            userData.Custom_user = user1;
            userData.StateCode = user1?.Address__c != null ? user1.Address__c.getStateCode() : 'UP' ;
            userData.CountryCode = user1?.Address__c != null ? user1.Address__c.getCountryCode() : 'IN';
            return userData;
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

    @AuraEnabled
    public static Boolean updateUserProfile(
        String userId,
        Map<String,String> address,
        String collegeName,
        String phone,
        String email,
        String username
    ) {
        try {
            User__c user = [
                SELECT Id, UserId__c, Name, Address__c, College_Name__c, Phone__c
                FROM User__c
                WHERE Email__c = :email
                LIMIT 1
            ];

            user.Address__Street__s  = address.get('street');
            user.Address__City__s = address.get('city');
            user.Address__PostalCode__s = address.get('postalCode');
            user.Address__StateCode__s = address.get('state');
            user.College_Name__c = collegeName;
            user.Phone__c = phone;
            user.Name = username;

            update user;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return true;
    }


    @AuraEnabled
    public static Boolean resetUserPassword(String email,String newPassword){
        try {
            User__c user = [SELECT Id, Password__c FROM User__c WHERE Email__c = :email LIMIT 1];
            if (user != null){
                user.Password__c = newPassword;
                update user;
                return true;
            }
            else{
                return false;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}