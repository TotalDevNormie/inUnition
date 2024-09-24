export const API_URL = 'http://10.13.14.118:8000/api';
export type RequestError = {
    message?: string;
    errors?: { [key: string]: string[] };
}

export default async function sendRequest<T>(url: string,  options?: RequestInit, responseType?: string): Promise<T> {

    if (!options) {
        options = {
            method: 'GET',
            headers: {
                Accepts: 'application/json',
                'Content-Type': 'application/json',
            },
        };
    }else {
        options = {
            ...options,
            headers: {
                Accepts: 'application/json',
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };
    }

    const response = await fetch(API_URL + url, options);
    console.log(response);

    if (!response.ok) {
        const data = await (response.json()) as RequestError;
        console.log(data);
        throw data ?? { message: response.statusText } as RequestError;
    }
    return await response.json() as unknown as T;
}

