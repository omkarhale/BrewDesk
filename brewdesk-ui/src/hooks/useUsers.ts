'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getUsers,
  createUser,
  updateUser,
  disableUser,
  enableUser,
  resetPassword,
} from '@/services/user.service'
import {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  CreateUserResponse,
  ResetPasswordResponse,
} from '@/types/user'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateUserRequest) => createUser(request),
    onSuccess: (data: CreateUserResponse) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      return data
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to create user'
      toast.error(message)
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, request }: { id: number; request: UpdateUserRequest }) =>
      updateUser(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to update user'
      toast.error(message)
    },
  })
}

export function useDisableUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => disableUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User disabled successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to disable user'
      toast.error(message)
    },
  })
}

export function useEnableUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => enableUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User enabled successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to enable user'
      toast.error(message)
    },
  })
}

export function useResetPassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => resetPassword(id),
    onSuccess: (data: ResetPasswordResponse) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      return data
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Failed to reset password'
      toast.error(message)
    },
  })
}
