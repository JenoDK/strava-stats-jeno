import { useState } from "react";

function hasValidToken(): boolean {
    return localStorage.getItem("accessToken") != null && Number(localStorage.getItem("expirationDate")) * 1000 > new Date().getTime();
}

function getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
}

function isEmpty(str: string) {
    return (!str || str.length === 0);
}

function useConstructor(callBack = () => { }) {
    const [hasBeenCalled, setHasBeenCalled] = useState(false);
    if (hasBeenCalled) return;
    callBack();
    setHasBeenCalled(true);
}

function getAxiosBearerTokenConfig(access_token: string) {
    return {
        headers: {
            'Authorization': 'Bearer ' + access_token
        }
    };
}

export { useConstructor, hasValidToken, getAccessToken, isEmpty, getAxiosBearerTokenConfig };
