// Query key constants
export const USERS = 'USERS';
export const USER = 'USER';

// Query key factory
export const usersKeys = {
  all: () => [USERS] as const,
  detail: (id: number | null | undefined) => [USER, id] as const,
};

// Grouped object for use in components/hooks
export const UsersQueryKeys = {
  USERS,
  USER,
} as const;
