import { publish } from 'lightning/messageService';
import TOAST_MESSAGE_CHANNEL from '@salesforce/messageChannel/ToastMessage__c';

export function showAlert(component, title, message, theme = 'info') {
    if (!component.messageContext) return;

    publish(component.messageContext, TOAST_MESSAGE_CHANNEL, {
        title,
        message,
        variant: theme
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

// Convert miliseconds to HH:MM format

export function msToTime(ms){
        let totalSeconds = Math.floor(ms / 1000);
        let hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        let minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        return `${hours}:${minutes}`;
}

// It returns time difference between punchIn and punchOut Time.
export function checkForPunchOutIs9Hour(punchInTime, punchOutTime) {
    let [h1, m1] = punchInTime.split(':').map(Number);
    let [h2, m2] = punchOutTime.split(':').map(Number);

    let start = h1 * 60 + m1;
    let end = h2 * 60 + m2;

    if (end < start) end += 24 * 60;

    let totalMinutes = end - start;

    // Checking if user completed 9 Hours
    if(totalMinutes >= 540){
        return { status: true, timeDifference: totalMinutes };
    }
    else{
        return { status: false, timeDifference: totalMinutes };
    }
}

export function getFormattedNameAndAbbreviation(fname,lname){
    let fullName = (fname || '') + ' ' + (lname || '');
    fullName = fullName.trim().length > 0 ? fullName : 'Unknown' ;
    let profileText = '';
    let firstExist = fname && fname?.length > 0;
    let secondExist = lname && lname?.length > 0;
    if(firstExist && secondExist){
        profileText = fname[0] + lname[0];
    }
    else if(firstExist && !secondExist){
        profileText = fname[0] + fname[1];
    }
    else if(!firstExist && secondExist){
        profileText = lname[0] + lname[1];
    }
    else{
        profileText = 'NA';
    }

    profileText = profileText.toUpperCase();

    return {
        fullName,
        profileText
    };
}
