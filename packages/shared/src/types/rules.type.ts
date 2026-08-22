/**
 * Module Rules Configuration Type
 * 
 * Corresponds to rules.schema.json
 * Schema for rules.yaml of a module - defines validation or business rules with manual edit tracking
 */
export interface Rules {
  _version: string;
  manually_edited: boolean;
  rules?: Rule[];
}

export interface Rule {
  id: string;
  description: string;
  condition?: string;
  action?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
}
