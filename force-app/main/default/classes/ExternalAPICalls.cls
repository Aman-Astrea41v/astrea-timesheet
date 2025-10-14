public without sharing class ExternalAPICalls {

    @AuraEnabled(cacheable=true)
    public static Map<String, String> getAllCountries() {
        Map<String, String> countryMap = new Map<String, String>();

        try {
            String url = 'https://countriesnow.space/api/v0.1/countries/positions';
            
            Http http = new Http();
            HttpRequest req = new HttpRequest();
            req.setEndpoint(url);
            req.setMethod('GET');
            
            HttpResponse res = http.send(req);
            
            if(res.getStatusCode() == 200){
                // Deserialize the root JSON object
                Map<String, Object> root = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

                // The countries list is inside "data"
                List<Object> countries = (List<Object>) root.get('data');

                for(Object cObj : countries){
                    Map<String, Object> country = (Map<String, Object>) cObj;
                    String name = (String) country.get('name');
                    String iso2 = (String) country.get('iso2');
                    
                    if(name != null && iso2 != null){
                        countryMap.put(name, iso2);
                    }
                }
            }
        } catch(Exception e){
            System.debug('Error fetching countries: ' + e.getMessage());
        }

        return countryMap;
    }


    @AuraEnabled(cacheable=true)
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

}