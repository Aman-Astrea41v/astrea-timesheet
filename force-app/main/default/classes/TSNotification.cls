public with sharing class TSNotification {
    
    @AuraEnabled
    public static void sendEarlyPunchOutNotification(List<String> emailAddresses, Map<String, String> userData){
        try {
            List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

            String logoUrl = 'https://yourcompany.com/logo.png';

            for(String emailAddr : emailAddresses) {
                Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                mail.setToAddresses(new String[] { emailAddr });
                mail.setSubject('Early Punch Out User Status');

                String htmlBody = '<html><body style="font-family:Arial, sans-serif;">';

                htmlBody += '<div style="background-color:#f4f4f4;padding:10px;text-align:center;">';
                htmlBody += '<img src="' + logoUrl + '" alt="Company Logo" style="height:60px;">';
                htmlBody += '</div>';

                htmlBody += '<h2 style="color:#333;">Hello Admin,</h2>';
                htmlBody += '<p>Punch Out Status:</p>';

                htmlBody += '<table style="border-collapse:collapse;width:100%;">';
                htmlBody += '<thead><tr style="background-color:#0070d2;color:white;">';
                htmlBody += '<th style="padding:8px;border:1px solid #ddd;text-align:left;">Field</th>';
                htmlBody += '<th style="padding:8px;border:1px solid #ddd;text-align:left;">Value</th></tr></thead><tbody>';

                for(String key : userData.keySet()) {
                    htmlBody += '<tr>';
                    htmlBody += '<td style="padding:8px;border:1px solid #ddd;">' + key + '</td>';
                    htmlBody += '<td style="padding:8px;border:1px solid #ddd;">' + userData.get(key) + '</td>';
                    htmlBody += '</tr>';
                }

                htmlBody += '</tbody></table>';

                // Footer
                htmlBody += '<p style="margin-top:20px;color:#555;">This is an automated message.Do not reply to this email.</p>';
                htmlBody += '<p style="color:#0070d2;">Regards,<br/>Astrea IT Services</p>';

                htmlBody += '</body></html>';

                mail.setHtmlBody(htmlBody);

                emails.add(mail);
            }

            Messaging.sendEmail(emails);
            System.debug('Email sent successfully');
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}