public without sharing class TSNotification {
    
    @AuraEnabled
    public static void sendEarlyPunchOutNotification(List<String> emailAddresses, Map<String, String> userData){
        try {
            List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();

            String logoUrl = 'https://astreaitservices-1fb-dev-ed--c.develop.vf.force.com/resource/1758613948000/astreaLogo';

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

    @AuraEnabled
    public static Boolean sendOTPForResetPassword(String emailTo,String otp){
        try {
            List<Employee__c> users = [SELECT Id,Name FROM Employee__c WHERE Email__c =:emailTo LIMIT 1];

            if(users.isEmpty()){
                throw new AuraHandledException('No User Exist with this mail.Contact your Admin');
            }


            OrgWideEmailAddress owe = [
                SELECT Id 
                FROM OrgWideEmailAddress 
                WHERE Address = 'aman@astreait.com' 
                LIMIT 1
            ];



            String year = String.valueOf(Date.today().year());

             String htmlBody = ''
            + '<!DOCTYPE html>'
            + '<html>'
            + '<head>'
            + '  <style>'
            + '    body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }'
            + '    .container { max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }'
            + '    .logo { text-align: center; margin-bottom: 20px; }'
            + '    .otp-box {'
            + '        font-size: 22px;'
            + '        font-weight: bold;'
            + '        background: #fff4e6;'
            + '        color: #d35400;'
            + '        padding: 15px;'
            + '        text-align: center;'
            + '        border-radius: 8px;'
            + '        letter-spacing: 4px;'
            + '        margin: 20px auto;'
            + '        width: fit-content;'
            + '    }'
            + '    .content { font-size: 14px; color: #333; line-height: 1.6; }'
            + '    .btn {'
            + '        display: inline-block;'
            + '        background: #d35400;'
            + '        color: #fff;'
            + '        padding: 12px 24px;'
            + '        border-radius: 6px;'
            + '        text-decoration: none;'
            + '        font-weight: bold;'
            + '        margin: 20px 0;'
            + '    }'
            + '    .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }'
            + '  </style>'
            + '</head>'
            + '<body>'
            + '  <div class="container">'
            + '    <div class="logo">'
            + '      <img src="https://astreaitservices-1fb-dev-ed--c.develop.vf.force.com/resource/1758613948000/astreaLogo" alt="Company Logo" height="60"/>'
            + '    </div>'
            + '    <div class="content">'
            + '      <h2>Password Reset Request</h2>'
            + '      <p>We received a request to reset the password for your <strong>Astrea It Timesheet</strong> account.</p>'
            + '      <p>Use the One-Time Password (OTP) below to continue with your password reset:</p>'
            + '      <div class="otp-box">' + otp + '</div>'
            + '      <p>This OTP is valid for <strong>5 minutes</strong>. For your security, do not share this code with anyone.</p>'
            + '      <p>If you did not request a password reset, please ignore this email or contact our support team immediately.</p>'
            + '    </div>'
            + '    <div class="footer">© ' + year + ' Astrea IT Services. All rights reserved.<br/>'
            + '    Need help? Contact us at <a href="mailto:support@astreait.com">support@astreait.com</a></div>'
            + '  </div>'
            + '</body>'
            + '</html>';

            // Create email
            Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
            email.setToAddresses(new String[] { emailTo });
            email.setSubject('Password Reset Request for TimeSheet');
            email.setHtmlBody(htmlBody);
            email.setOrgWideEmailAddressId(owe.Id);

            // Send
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { email });
            return true;
        } 
        catch(AuraHandledException e){
            throw e;
        }
        catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}