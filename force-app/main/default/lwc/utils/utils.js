import LightningAlert from 'lightning/alert';

export function showAlert(title, message, theme = 'info') {
    return LightningAlert.open({
            message: message,
            theme: theme,
            label: title
    });
}

export function setCookies(name,value){
    try{
        const expires = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    }catch(e){
        console.error(e);
    }
}

export function getCookies(name){
    try{
        const cookies = document.cookie.split(';');
        for(let cookie of cookies){
            const [cookieKey, cookieValue] = cookie.split('=');
            if(cookieKey.trim() === name){
                return decodeURIComponent(cookieValue);
            }
        }
        return null;
    }
    catch(e){
        console.error(e);
    }
}

export function removeCookies(name){
    try{
        document.cookie = name + '=' + '; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    }
    catch(err){
        console.error(err);
    }
}