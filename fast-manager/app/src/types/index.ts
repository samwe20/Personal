export type FieldType = 'text' | 'date' | 'select' | 'number' | 'checkbox' | 'reference';

export interface FieldDef {
  key: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: string | number | boolean;
  options?: string[];
  referenceSupertag?: string;
}

export interface SupertagDef {
  id: string;
  name: string;
  color: string;
  icon: string;
  fields: FieldDef[];
  description?: string;
}

export interface NodeRecord {
  id: string;
  workspaceId: string;
  parentId: string | null;
  content: string;
  order: number;
  supertagIds: string[];
  fieldValues: Record<string, Record<string, string | number | boolean>>;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  icon: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export interface SavedQueryRecord {
  id: string;
  name: string;
  icon: string;
  expression: QueryExpression;
  order: number;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export interface QueryExpression {
  supertagId?: string;
  filters: QueryFilter[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface QueryFilter {
  field: string;
  op: 'eq' | 'neq' | 'lt' | 'gt' | 'contains' | 'exists';
  value?: string | number | boolean;
}

export interface SyncChange {
  id: string;
  entityType: 'node' | 'workspace' | 'query' | 'supertag';
  entityId: string;
  payload: string;
  updatedAt: string;
  deleted: boolean;
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'cs' | 'en';

export interface AppSettings {
  theme: Theme;
  language: Language;
  syncUrl: string;
  workspaceId: string;
  lastSyncAt: string | null;
  clientId: string;
}
