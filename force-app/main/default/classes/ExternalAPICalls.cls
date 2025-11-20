public without sharing class ExternalAPICalls {

    @AuraEnabled
    public static List<Map<String, String>> getStatesByCountry(String countryName) {
        List<Map<String, String>> statesList = new List<Map<String, String>>();
        
        try {
            Http http = new Http();
            HttpRequest req = new HttpRequest();
            String url = 'https://countriesnow.space/api/v0.1/countries/states/q?country='+countryName;
            
            req.setEndpoint(url);
            req.setMethod('GET');
            
            HttpResponse res = http.send(req);
            
            if(res.getStatusCode() == 200){
                Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
                
                if(!((Boolean)root.get('error'))){
                    Map<String, Object> data = (Map<String, Object>) root.get('data');
                    List<Object> states = (List<Object>) data.get('states');
                    
                    for(Object sObj : states){
                        Map<String, Object> stateMap = (Map<String, Object>) sObj;
                        Map<String, String> stateEntry = new Map<String, String>();
                        stateEntry.put('label', (String) stateMap.get('name'));
                        stateEntry.put('value', (String) stateMap.get('state_code'));
                        statesList.add(stateEntry);
                    }
                }
            } else {
                System.debug('HTTP Status: ' + res.getStatus());
            }
        } catch(Exception e){
            System.debug('Error fetching states: ' + e.getMessage());
        }
        
        return statesList;
    }


    @AuraEnabled
    public static List<Map<String, String>> getCityByState(String countryName, String state) {
        List<Map<String, String>> cityList = new List<Map<String, String>>();
        String formattedState = state.replaceAll(' ','%20');
        String originalUrl = 'https://countriesnow.space/api/v0.1/countries/state/cities/q?state='+ formattedState + '&country='+countryName;
    
        try {
            Http http = new Http();
            HttpRequest req = new HttpRequest();
            
            req.setEndpoint(originalUrl);
            req.setMethod('GET');
            
            HttpResponse res = http.send(req);    
            Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            List<Object> cities = (List<Object>) root.get('data');

            for(Object cityObj : cities){
                Map<String,String> city = new Map<String,String>();
                city.put('label',(String) cityObj);
                city.put('value',(String) cityObj);
                
                cityList.add(city);
            }
    
        } catch (Exception e) {
            System.debug('Error fetching cities: ' + e.getMessage());
        }
        
        return cityList;
    }


}