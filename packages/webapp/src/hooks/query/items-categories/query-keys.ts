// Query key constants
export const ITEMS_CATEGORIES = 'ITEMS_CATEGORIES';
export const ITEM_CATEGORY = 'ITEM_CATEGORY';

// Query key factory
export const itemsCategoriesKeys = {
  all: () => [ITEMS_CATEGORIES] as const,
  detail: (id: number | null | undefined) => [ITEM_CATEGORY, id] as const,
};

// Grouped object for use in components/hooks
export const ItemsCategoriesQueryKeys = {
  ITEMS_CATEGORIES,
  ITEM_CATEGORY,
} as const;
