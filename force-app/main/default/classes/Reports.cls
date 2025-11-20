public without sharing class Reports {

    // Filtering Methods

    @AuraEnabled
    public static List<Report__c> filterReports(String userId,String status,String workMode){
        try {
            String query = 'SELECT Id, Punch_In__c, Punch_Out__c, Date__c, Work_Mode__c ,Status__c FROM Report__c WHERE UserId__c = '+ '\'' + userId + '\'';
            if(workMode == 'All' && status == 'All'){
                query += ' Order BY Date__c DESC LIMIT 5';
            }
            else if(workMode == 'All' && status != 'All'){
                query += ' AND Status__c = '+ '\'' +status + '\'' +' Order BY Date__c DESC LIMIT 5';
            }
            else if(workMode != 'All' && status == 'All'){
                query += ' AND Work_Mode__c = ' + '\'' + workMode + '\'' + ' Order BY Date__c DESC LIMIT 5';
            }
            else{
                query += ' AND Work_Mode__c = ' + '\'' + workMode + '\'' + 'AND Status__c = '+ '\'' +status + '\'' + ' Order BY Date__c DESC LIMIT 5';
            }
            
            return Database.query(query);
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


    @AuraEnabled
    public static Decimal getDailyTotal(String userId,String specificDate){
        try {
            Date reportDate = Date.valueOf(specificDate);
            List<Report__c> report = [SELECT Id,Daily_Total_Time__c FROM Report__c WHERE UserId__c = :userId AND Date__c = :reportDate LIMIT 1];
            if(report.isEmpty()){
                return 0;
            }
            else{
                return report[0].Daily_Total_Time__c;
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static List<Report__c> getReportForThisWeek(String userId){
        try {
            return [
                SELECT Id, Punch_In__c, Punch_Out__c, Date__c, Work_Mode__c, Status__c
                FROM Report__c 
                WHERE UserId__c = :userId
                AND Date__c = THIS_WEEK
                ORDER BY Date__c ASC
                LIMIT 5
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


    @AuraEnabled
    public static List<Report__c> getReportForLastWeek(String userId){
        try {
            return [
                SELECT Id, Punch_In__c, Punch_Out__c, Date__c, Work_Mode__c, Status__c
                FROM Report__c
                WHERE UserId__c = :userId
                AND Date__c = LAST_WEEK
                ORDER BY Date__c ASC
                LIMIT 5
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    // Punch in Related Methods

    @AuraEnabled
    public static Boolean punchInUserApex(String punchInTime,String userId,String specificDate,String workMode){
        try{
            Date reportDate = Date.valueOf(specificDate);
            List<String> Timeparts = punchInTime.split(':');
            Time punchInTimeReport = Time.newInstance(
                Integer.valueOf(Timeparts[0]),
                Integer.valueOf(Timeparts[1]),
                Integer.valueOf(Timeparts[2]),
                0
            );
            List<Report__c> existingReport = [SELECT Id FROM Report__c WHERE UserId__c = :userId AND Date__c = :reportDate LIMIT 1];

            if(!existingReport.isEmpty()){
                return false;
            }
            else{
                Report__c report = new Report__c();
                report.UserId__c = userId;
                report.Punch_In__c = punchInTimeReport;
                report.Date__c = reportDate;
                report.Work_Mode__c = workMode;
                insert report;
                return true;
            }
        }
        catch(Exception e){
            System.debug('Error in punchInUser: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
            // return false;
        }
    }


    @AuraEnabled
    public static Boolean punchOutUserApex(String punchOutTime,String userId,String specificDate,String status){
        try{
            Date reportDate = Date.valueOf(specificDate);
            List<String> Timeparts = punchOutTime.split(':');
            Time punchOutTimeReport = Time.newInstance(
                Integer.valueOf(Timeparts[0]),
                Integer.valueOf(Timeparts[1]),
                Integer.valueOf(Timeparts[2]),
                0
            );
            List<Report__c> existingReport = [SELECT Id,Punch_Out__c,Status__c FROM Report__c WHERE UserId__c = :userId AND Date__c = :reportDate LIMIT 1];

            if(existingReport.isEmpty()){
                return false;
            }
            else{
                existingReport[0].Status__c = status;
                existingReport[0].Punch_Out__c = punchOutTimeReport;
                update existingReport;
                return true;
            }
        }
        catch(Exception e){
            System.debug('Error in punchInUser: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
            // return false;
        }
    }

    @AuraEnabled
    public static Map<String,String> getUserPunchStatus(String userId,String specificDate){
        try {
            Date reportDate = Date.valueOf(specificDate);
            List<Report__c> report = [SELECT Punch_In__c,Work_Mode__c,Punch_Out__c FROM Report__c WHERE UserId__c = :userId AND Date__c = :reportDate LIMIT 1];

            if(report.isEmpty()){
                return new Map<String,String>
                {
                    'punchedIn' => 'false',
                    'punchInTime' => '',
                    'workMode' => '',
                    'punchOutTime' => '',
                    'punchedOut' => 'false'
                };
            }
            else{   
                Map<String,String> reportData = new Map<String,String>();
                if(report[0].Punch_Out__c != null){
                    reportData.put('punchedOut','true');
                    reportData.put('punchOutTime', String.valueOf(report[0].Punch_Out__c));
                }
                else{
                    reportData.put('punchedOut','false');
                }
                if(report[0].Punch_In__c != null){
                    reportData.put('punchedIn', 'true');
                    reportData.put('punchInTime', String.valueOf(report[0].Punch_In__c));
                    reportData.put('workMode', report[0].Work_Mode__c);
                    return reportData;
                }
                else{
                    return new Map<String,String>
                        {
                            'punchedIn' => 'false',
                            'punchInTime' => '',
                            'workMode' => '',
                            'punchOutTime' => '',
                            'punchedOut' => 'false'
                        };
                }
            }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}