import axios from 'axios';
import { FigmaNode, FigmaField } from './types';

interface FigmaAPIResponse {
  document: FigmaNode;
  name: string;
}

/**
 * Fetch Figma file data using Figma API
 */
export async function fetchFigmaData(
  fileKey: string,
  nodeId: string,
  accessToken: string
): Promise<FigmaField[]> {
  try {
    const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`;
    
    const response = await axios.get<{ nodes: Record<string, { document: FigmaNode }> }>(url, {
      headers: {
        'X-Figma-Token': accessToken,
      },
    });

    const nodeData = response.data.nodes[nodeId]?.document;
    if (!nodeData) {
      throw new Error('Node not found in Figma file');
    }

    console.log('Node found:', nodeData.name, 'Type:', nodeData.type);
    console.log('Node has children:', nodeData.children?.length || 0);
    
    // Debug: Print node tree structure
    console.log('===== FIGMA NODE TREE STRUCTURE =====');
    printNodeTree(nodeData, 0, 3);
    console.log('===== END NODE TREE =====');

    // Extract fields from the Figma node
    const fields = extractFieldsFromNode(nodeData);
    
    console.log(`\n✅ Extracted ${fields.length} fields from Figma`);
    if (fields.length > 0) {
      console.log('Sample fields:', fields.slice(0, 5));
      console.table(fields.map(f => ({
        section: f.section,
        subsection: f.subsection,
        field: f.fieldName,
        order: f.order
      })));
    } else {
      console.error('❌ No fields extracted!');
      console.log('\nTrying aggressive field search...');
      const aggressiveFields = aggressiveFieldExtraction(nodeData);
      console.log(`Found ${aggressiveFields.length} fields with aggressive search`);
      if (aggressiveFields.length > 0) {
        return aggressiveFields;
      }
    }
    
    return fields;
  } catch (error: any) {
    console.error('Error fetching Figma data:', error);
    throw new Error(`Failed to fetch Figma data: ${error.message}`);
  }
}

/**
 * Recursively extract fields from Figma node hierarchy
 * Handles real-world Figma form structures with intelligent detection
 */
function extractFieldsFromNode(node: FigmaNode, context: {
  section?: string;
  subsection?: string;
  screenName?: string;
} = {}): FigmaField[] {
  const fields: FigmaField[] = [];
  
  // Detect screen name from top-level frame name
  if (!context.screenName && node.type === 'FRAME') {
    const screenMatch = node.name.match(/(create|view|edit|delete)/i);
    if (screenMatch) {
      context.screenName = screenMatch[1].toLowerCase();
    }
  }

  // Detect section headers (all caps text or frames with specific naming)
  const newSection = detectSection(node);
  if (newSection) {
    context.section = newSection;
    context.subsection = undefined; // Reset subsection when new section starts
  }

  // Detect subsection headers
  const newSubsection = detectSubsection(node);
  if (newSubsection && context.section) {
    context.subsection = newSubsection;
  }

  // Check if this node is a form container with input fields
  if (node.children && node.children.length > 0) {
    // Look for input field groups (frames containing label + input)
    const fieldGroups = findFieldGroups(node.children);
    
    if (fieldGroups.length > 0 && context.section) {
      // Sort fields by position (left-to-right, top-to-bottom)
      const sortedFields = sortFieldsByPosition(fieldGroups);
      
      sortedFields.forEach((fieldGroup, index) => {
        const fieldName = extractFieldLabel(fieldGroup);
        if (fieldName) {
          fields.push({
            section: context.section!,
            subsection: context.subsection || '',
            fieldName: fieldName,
            order: index + 1,
            screenName: context.screenName || 'create',
          });
        }
      });
    }

    // Recursively process children to find nested sections
    for (const child of node.children) {
      const childFields = extractFieldsFromNode(child, { ...context });
      fields.push(...childFields);
    }
  }

  return fields;
}

/**
 * Detect section header from node
 */
function detectSection(node: FigmaNode): string | null {
  // Check for all-caps text nodes (common for section headers)
  if (node.type === 'TEXT' && node.characters) {
    const text = node.characters.trim();
    // Check if text is all uppercase and looks like a header
    if (text === text.toUpperCase() && text.length > 3 && /^[A-Z\s]+$/.test(text)) {
      // Convert to camelCase for consistency
      return toCamelCase(text);
    }
  }

  // Check node name for section indicators
  if (node.name.match(/section/i) && !node.name.match(/subsection|sub-section/i)) {
    const match = node.name.match(/section[:\s]*(.+)/i);
    if (match) {
      return toCamelCase(match[1]);
    }
  }

  return null;
}

/**
 * Detect subsection header from node
 */
function detectSubsection(node: FigmaNode): string | null {
  // Check for subsection in node name or text
  if (node.name.match(/subsection|sub-section|special/i)) {
    const match = node.name.match(/(?:subsection|sub-section|special)[:\s]*(.+)/i);
    if (match) {
      return toCamelCase(match[1]);
    }
  }

  // Check for text nodes that might be subsection headers
  if (node.type === 'TEXT' && node.characters) {
    const text = node.characters.trim();
    if (text.match(/^(SPECIAL|IN NETWORK|OUT OF NETWORK|OTHER)/i)) {
      return toCamelCase(text);
    }
  }

  return null;
}

/**
 * Find field groups (frames/groups containing input fields)
 */
function findFieldGroups(nodes: FigmaNode[]): FigmaNode[] {
  const fieldGroups: FigmaNode[] = [];

  for (const node of nodes) {
    // Check if node is a field container
    if (isFieldContainer(node)) {
      fieldGroups.push(node);
    } else if (node.children) {
      // Recursively search children
      const childGroups = findFieldGroups(node.children);
      fieldGroups.push(...childGroups);
    }
  }

  return fieldGroups;
}

/**
 * Check if node is a field container
 */
function isFieldContainer(node: FigmaNode): boolean {
  if (!node.children || node.children.length === 0) {
    return false;
  }

  // Look for patterns indicating this is a field:
  // 1. Contains a text label and an input component
  // 2. Node name contains 'field', 'input', 'dropdown', 'select'
  // 3. Has exactly 2-3 children (label, input, maybe icon)
  
  const hasLabelChild = node.children.some(child => 
    child.type === 'TEXT' || child.name.match(/label/i)
  );
  
  const hasInputChild = node.children.some(child => 
    child.name.match(/input|dropdown|select|textbox|field/i) ||
    child.type === 'INSTANCE' ||
    child.type === 'COMPONENT'
  );

  const nameIndicatesField = node.name.match(/field|input|dropdown|select|form-control/i);

  return (hasLabelChild && hasInputChild) || Boolean(nameIndicatesField);
}

/**
 * Extract field label from field group
 */
function extractFieldLabel(fieldGroup: FigmaNode): string | null {
  if (!fieldGroup.children) {
    return null;
  }

  // Find text node that serves as label
  for (const child of fieldGroup.children) {
    if (child.type === 'TEXT' && child.characters) {
      const label = child.characters.trim();
      // Filter out placeholder text or asterisks
      if (label && !label.match(/^(select|enter|choose)/i) && label !== '*') {
        return label;
      }
    }
    // Recursively search in nested groups
    if (child.children) {
      const nestedLabel = extractFieldLabel(child);
      if (nestedLabel) {
        return nestedLabel;
      }
    }
  }

  // Fallback to node name if no text label found
  return cleanFieldName(fieldGroup.name);
}

/**
 * Sort field groups by position (left-to-right, top-to-bottom)
 */
function sortFieldsByPosition(fieldGroups: FigmaNode[]): FigmaNode[] {
  // Note: Figma API provides absoluteBoundingBox for positioning
  // Since we don't have type definitions for that, we'll do best effort
  return fieldGroups.sort((a, b) => {
    const aBox = (a as any).absoluteBoundingBox;
    const bBox = (b as any).absoluteBoundingBox;
    
    if (!aBox || !bBox) {
      return 0;
    }

    // Sort by row first (top to bottom with tolerance)
    const rowTolerance = 20; // pixels
    const rowDiff = aBox.y - bBox.y;
    
    if (Math.abs(rowDiff) > rowTolerance) {
      return rowDiff; // Top to bottom
    }
    
    // Same row, sort left to right
    return aBox.x - bBox.x;
  });
}

/**
 * Convert text to camelCase
 */
function toCamelCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((word, index) => 
      index === 0 
        ? word 
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

/**
 * Determine if a node represents a form field (legacy, kept for compatibility)
 */
function isFieldNode(node: FigmaNode): boolean {
  return isFieldContainer(node);
}

/**
 * Extract clean field name from node
 */
function extractFieldName(node: FigmaNode): string {
  // Try to get from characters (text content)
  if (node.characters) {
    return cleanFieldName(node.characters);
  }
  // Fallback to node name
  return cleanFieldName(node.name);
}

/**
 * Clean up field name by removing prefixes and standardizing format
 */
function cleanFieldName(name: string): string {
  return name
    .replace(/^(field|input|label)[:\s]+/i, '')
    .replace(/[\n\r]+/g, ' ')
    .trim();
}

/**
 * Parse Figma URL to extract file key and node ID
 * Supports both /file/ and /design/ paths
 */
export function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  try {
    const urlObj = new URL(url);
    // Modern Figma URLs use /design/, older ones use /file/
    const pathMatch = urlObj.pathname.match(/\/(file|design)\/([^\/]+)/);
    let nodeId = urlObj.searchParams.get('node-id');

    if (pathMatch && nodeId) {
      // Figma URLs use hyphens (453-32363) but API expects colons (453:32363)
      nodeId = nodeId.replace(/-/g, ':');
      
      return {
        fileKey: pathMatch[2], // File key is now in capture group 2
        nodeId: nodeId,
      };
    }
  } catch (error) {
    console.error('Error parsing Figma URL:', error);
  }
  return null;
}