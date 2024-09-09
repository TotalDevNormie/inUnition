export default async function makeRequest (url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message ? data.message : 'Something went wrong');
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
}