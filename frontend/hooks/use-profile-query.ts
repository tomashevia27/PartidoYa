import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UsersService } from "@/services/users.service"

export const usersKeys = {
  all: ['users'] as const,
  profile: () => [...usersKeys.all, 'profile'] as const,
}

export function useProfile() {
  return useQuery({
    queryKey: usersKeys.profile(),
    queryFn: () => UsersService.getProfile(),
  })
}

export function useProfileMutations() {
  const queryClient = useQueryClient()

  const updateProfile = useMutation({
    mutationFn: (data: Parameters<typeof UsersService.updateProfile>[0]) => UsersService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.profile() })
    },
  })

  return { updateProfile }
}
