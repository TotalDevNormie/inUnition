import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthFetch from './authFetch';

export const useUserProfile = () => {
  const authFetch = useAuthFetch();
  
  return useQuery(['userProfile'], () => authFetch('/user/profile'));
};

export const useUpdateProfile = () => {
  const authFetch = useAuthFetch();
  const queryClient = useQueryClient();

  return useMutation(
    (profileData) => authFetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['userProfile']);
      },
    }
  );
};