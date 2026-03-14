// Query key constants
export const SUBSCRIPTIONS = 'SUBSCRIPTIONS';

// Query key factory
export const subscriptionsKeys = {
  all: () => [SUBSCRIPTIONS] as const,
};

// Grouped object for use in components/hooks
export const SubscriptionsQueryKeys = {
  SUBSCRIPTIONS,
} as const;
