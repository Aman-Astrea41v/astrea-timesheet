public with sharing class Reports {
    
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
    public static Boolean punchOutUserApex(String punchOutTime,String userId,String specificDate){
        try{
            Date reportDate = Date.valueOf(specificDate);
            List<String> Timeparts = punchOutTime.split(':');
            Time punchOutTimeReport = Time.newInstance(
                Integer.valueOf(Timeparts[0]),
                Integer.valueOf(Timeparts[1]),
                Integer.valueOf(Timeparts[2]),
                0
            );
            List<Report__c> existingReport = [SELECT Id,Punch_Out__c FROM Report__c WHERE UserId__c = :userId AND Date__c = :reportDate LIMIT 1];

            if(existingReport.isEmpty()){
                return false;
            }
            else{
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
                    'workMode' => 'Empty',
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
                            'workMode' => 'is Null',
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