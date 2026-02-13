export type ListFilters = {
    includeInactive: boolean;
    type?: "CUSTOMER" | "SUPPLIER";
    q?: string;
  };