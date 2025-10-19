// Figma related types
export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  characters?: string;
}

export interface FigmaField {
  section: string;
  subsection: string;
  fieldName: string;
  order: number;
  screenName: string;
}

// DB Mapping types
export interface DBMapping {
  fieldName: string;
  dbColumn: string;
}

// Computed field types
export interface ComputedField {
  fieldName: string;
  formula: string;
  isComputed: boolean;
}

// Consolidated Excel row
export interface ConsolidatedRow {
  section: string;
  subsection: string;
  field_name: string;
  order: number;
  screen_name: string;
  DB_mapping: string;
  is_computed: string; // "YES" or "NO"
  formula: string;
  plan_type: string;
}

// Validation error
export interface ValidationError {
  row: number;
  field: string;
  message: string;
  type: 'error' | 'warning';
}

// Config JSON field types
export interface ValidationRule {
  type: string;
  value?: any;
  message?: string;
}

export interface UIConfig {
  label: string;
  placeholder: string;
  order: number;
  help_text?: string;
}

export interface OutputTransform {
  enabled: boolean;
  output_field_path: string;
  transformation_type: string;
  array_item_property?: string;
  array_item_type?: string;
  create_array_item?: boolean;
}

export interface FieldConfig {
  name: string;
  type: string;
  ui_config: UIConfig;
  validation_rules: ValidationRule[];
  options?: any[];
  api_config?: any;
  output_transform: OutputTransform;
}

export interface ScreenContext {
  screen: string;
  section: string;
  sub_section?: string;
  order: number;
  disabled?: boolean;
}

export interface ConfigJSON {
  type: string;
  subType: string;
  module: string;
  field: FieldConfig;
  screen_contexts: ScreenContext[];
}

// File upload types
export interface FileUploadProps {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
  file: File | null;
}

// Processing status
export interface ProcessingStatus {
  stage: string;
  progress: number;
  message: string;
  isProcessing: boolean;
}