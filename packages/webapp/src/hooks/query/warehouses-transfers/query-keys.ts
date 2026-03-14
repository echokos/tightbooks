// Query key constants
export const WAREHOUSE_TRANSFERS = 'WAREHOUSE_TRANSFERS';
export const WAREHOUSE_TRANSFER = 'WAREHOUSE_TRANSFER';
export const ITEM_WAREHOUSES_LOCATION = 'ITEM_WAREHOUSES_LOCATION';

// Query key factory
export const warehousesTransfersKeys = {
  all: () => [WAREHOUSE_TRANSFERS] as const,
  list: (query?: Record<string, unknown>) => [WAREHOUSE_TRANSFERS, query] as const,
  detail: (id: number | null | undefined) => [WAREHOUSE_TRANSFER, id] as const,
};

// Grouped object for use in components/hooks
export const WarehousesTransfersQueryKeys = {
  WAREHOUSE_TRANSFERS,
  WAREHOUSE_TRANSFER,
  ITEM_WAREHOUSES_LOCATION,
} as const;
