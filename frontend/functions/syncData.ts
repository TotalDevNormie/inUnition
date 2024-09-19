import { useMutation } from "@tanstack/react-query"
import { RequestError, useAuth } from "../components/auth/authContext";


export const syncData = (apiUrl: string) => {
    
    const {user, isOnline, isLoadingUser} = useAuth();
    console.log('check how many times runs', {user, isOnline, isLoadingUser});
    const {data, error, mutate} = useMutation({
        mutationKey: ['notes'],
        mutationFn: async () => {
            const response = await fetch(`${apiUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
            })
            if (!response.ok) {
                const data = await (response.json()) as RequestError;
                throw data ?? {message: response.statusText};
            }
            const data = await response.json();
            return data;
        }
    })
}