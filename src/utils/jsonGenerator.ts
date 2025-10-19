import { ConsolidatedRow, ConfigJSON, ValidationRule } from './types';

/**
 * Infer field type from field name
 */
function inferFieldType(fieldName: string): string {
  const name = fieldName.toLowerCase();
  
  if (name.includes('currency') || name.includes('amount') || name.includes('premium')) {
    return 'currency-input';
  }
  if (name.includes('date')) {
    return 'date';
  }
  if (name.includes('email')) {
    return 'email';
  }
  if (name.includes('phone') || name.includes('tel')) {
    return 'tel';
  }
  if (name.includes('dropdown') || name.includes('select')) {
    return 'customSelect';
  }
  if (name.includes('number') || name.includes('count') || name.includes('age')) {
    return 'number';
  }
  if (name.includes('percent') || name.includes('percentage')) {
    return 'percentage';
  }
  
  return 'text';
}

/**
 * Infer validation rules from field name and type
 */
function inferValidationRules(fieldName: string, fieldType: string, isRequired: boolean = true): ValidationRule[] {
  const rules: ValidationRule[] = [];
  
  if (isRequired) {
    rules.push({
      type: 'required',
      message: `${fieldName} is required`,
    });
  }
  
  if (fieldType === 'email') {
    rules.push({
      type: 'email',
      message: 'Please enter a valid email address',
    });
  }
  
  if (fieldType === 'number' || fieldType === 'currency-input') {
    rules.push({
      type: 'min',
      value: 0,
      message: 'Value cannot be negative',
    });
  }
  
  return rules;
}

/**
 * Determine transformation type based on DB mapping and field type
 */
function inferTransformationType(dbMapping: string, fieldType: string): string {
  if (fieldType === 'currency-input' && dbMapping.includes('Balance')) {
    return 'amount_object';
  }
  return 'plain_value';
}

/**
 * Parse output transform from DB mapping
 */
function parseOutputTransform(row: ConsolidatedRow, fieldType: string) {
  const transformationType = inferTransformationType(row.DB_mapping, fieldType);
  
  const baseTransform = {
    enabled: true,
    output_field_path: row.DB_mapping,
    transformation_type: transformationType,
  };
  
  // For amount_object transformation
  if (transformationType === 'amount_object') {
    // Try to infer array item type from field name
    const name = row.field_name.toLowerCase();
    let arrayItemType = '';
    
    if (name.includes('deductible')) {
      arrayItemType = 'DEDUCTIBLE';
    } else if (name.includes('copay')) {
      arrayItemType = 'COPAY';
    } else if (name.includes('coinsurance')) {
      arrayItemType = 'COINSURANCE';
    } else if (name.includes('oop') || name.includes('out of pocket')) {
      arrayItemType = 'OOP_MAX';
    }
    
    return {
      ...baseTransform,
      array_item_property: 'empValue',
      array_item_type: arrayItemType,
      create_array_item: true,
    };
  }
  
  return baseTransform;
}

/**
 * Generate config JSON from consolidated row
 */
export function generateConfigFromRow(row: ConsolidatedRow): ConfigJSON {
  const fieldType = inferFieldType(row.field_name);
  const validationRules = inferValidationRules(row.field_name, fieldType);
  const outputTransform = parseOutputTransform(row, fieldType);
  
  // Create base field name (camelCase)
  const fieldNameCamel = row.field_name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((word, index) => 
      index === 0 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
  
  const config: ConfigJSON = {
    type: row.plan_type.toUpperCase(),
    subType: 'field',
    module: 'CPQ',
    field: {
      name: fieldNameCamel,
      type: fieldType,
      ui_config: {
        label: row.field_name,
        placeholder: fieldType === 'currency-input' ? '0.00' : row.field_name,
        order: row.order,
      },
      validation_rules: validationRules,
      options: [],
      output_transform: outputTransform,
    },
    screen_contexts: [
      {
        screen: row.screen_name,
        section: row.section,
        sub_section: row.subsection || undefined,
        order: row.order,
        disabled: false,
      },
    ],
  };
  
  return config;
}

/**
 * Generate all config JSONs from consolidated rows
 */
export function generateAllConfigs(rows: ConsolidatedRow[]): ConfigJSON[] {
  const configs: ConfigJSON[] = [];
  const fieldMap = new Map<string, ConfigJSON>();
  
  // Group by field name to merge screen contexts
  rows.forEach((row) => {
    const fieldKey = `${row.field_name}_${row.plan_type}`;
    
    if (fieldMap.has(fieldKey)) {
      // Add screen context to existing config
      const existingConfig = fieldMap.get(fieldKey)!;
      existingConfig.screen_contexts.push({
        screen: row.screen_name,
        section: row.section,
        sub_section: row.subsection || undefined,
        order: row.order,
        disabled: false,
      });
    } else {
      // Create new config
      const config = generateConfigFromRow(row);
      fieldMap.set(fieldKey, config);
      configs.push(config);
    }
  });
  
  return configs;
}

/**
 * Export configs as JSON file
 */
export function exportConfigsAsJSON(configs: ConfigJSON[], filename: string = 'config.json'): void {
  const jsonString = JSON.stringify(configs, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}