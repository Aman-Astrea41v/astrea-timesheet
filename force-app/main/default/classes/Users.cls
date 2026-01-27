public without sharing class Users {
    
    public class UserWrapper{
        @AuraEnabled
        public Employee__c Custom_user;

        @AuraEnabled
        public String StateCode;

        @AuraEnabled
        public String CountryCode;
    }
    
    @AuraEnabled
    public static UserWrapper getUsers(String email){
        try{
            Employee__c user1 = [SELECT Id,Employee_Id__c,CollegeName__c,First_Name__c,Last_Name__c, Name, Email__c,Password__c,Address__c,Phone__c,Active__c,Batch__c  FROM Employee__c WHERE Email__c = :email LIMIT 1];
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
    public static void setLastLogin(String email){
        try {
            Employee__c user = [SELECT Last_Login__c FROM Employee__c WHERE Email__c = :email LIMIT 1];
            user.Last_Login__c = Datetime.now();
            update user;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String createNewUser(String username, String email, String password) {
        try {
            List<Employee__c> users = [
                SELECT Email__c 
                FROM Employee__c 
                WHERE Email__c = :email 
                LIMIT 1
            ];
            
            if (users.isEmpty()) {
                Employee__c newUser = new Employee__c(
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
            Employee__c user = [
                SELECT Id, Name,CollegeName__c,Address__c, Phone__c
                FROM Employee__c
                WHERE Email__c = :email
                LIMIT 1
            ];

            user.Address__Street__s  = address.get('street');
            user.Address__City__s = address.get('city');
            user.Address__PostalCode__s = address.get('postalCode');
            user.Address__StateCode__s = address.get('state');
            user.CollegeName__c = collegeName;
            user.Phone__c = phone;

            update user;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return true;
    }


    @AuraEnabled
    public static Boolean resetUserPassword(String email,String newPassword){
        try {
            Employee__c user = [SELECT Id, Password__c FROM Employee__c WHERE Email__c = :email LIMIT 1];
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