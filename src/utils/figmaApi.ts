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

    // Extract fields from the Figma node
    const fields = extractFieldsFromNode(nodeData);
    return fields;
  } catch (error: any) {
    console.error('Error fetching Figma data:', error);
    throw new Error(`Failed to fetch Figma data: ${error.message}`);
  }
}

/**
 * Recursively extract fields from Figma node hierarchy
 * Detects sections, subsections, and field names based on naming conventions
 */
function extractFieldsFromNode(node: FigmaNode, context: {
  section?: string;
  subsection?: string;
  order?: number;
  screenName?: string;
} = {}): FigmaField[] {
  const fields: FigmaField[] = [];
  let currentOrder = context.order || 0;

  // Detect section from node name (e.g., "Section: Medical Benefits")
  const sectionMatch = node.name.match(/section[:\s]+(.+)/i);
  if (sectionMatch) {
    context.section = sectionMatch[1].trim();
  }

  // Detect subsection (e.g., "Subsection: In Network")
  const subsectionMatch = node.name.match(/subsection[:\s]+(.+)/i);
  if (subsectionMatch) {
    context.subsection = subsectionMatch[1].trim();
  }

  // Detect screen name (e.g., "Screen: create", "Screen: view")
  const screenMatch = node.name.match(/screen[:\s]+(create|view|edit|delete)/i);
  if (screenMatch) {
    context.screenName = screenMatch[1].toLowerCase();
  }

  // Detect field (text nodes or input fields)
  // Look for nodes that represent form fields
  const isField = isFieldNode(node);
  if (isField && context.section) {
    currentOrder++;
    fields.push({
      section: context.section,
      subsection: context.subsection || '',
      fieldName: extractFieldName(node),
      order: currentOrder,
      screenName: context.screenName || 'create',
    });
  }

  // Recursively process children
  if (node.children) {
    for (const child of node.children) {
      const childFields = extractFieldsFromNode(child, { ...context, order: currentOrder });
      fields.push(...childFields);
      currentOrder += childFields.length;
    }
  }

  return fields;
}

/**
 * Determine if a node represents a form field
 */
function isFieldNode(node: FigmaNode): boolean {
  // Check if node is a text node with field-like naming
  if (node.type === 'TEXT' && node.characters) {
    const text = node.characters.toLowerCase();
    // Look for common field patterns
    const fieldPatterns = [
      /^field[:\s]/i,
      /^input[:\s]/i,
      /label$/i,
      /\w+(name|number|date|amount|deductible|premium|coverage)\w*/i,
    ];
    return fieldPatterns.some(pattern => pattern.test(node.name) || pattern.test(text));
  }

  // Check for component instances that might be form inputs
  if (node.type === 'INSTANCE' || node.type === 'COMPONENT') {
    const componentPatterns = [
      /input/i,
      /field/i,
      /textbox/i,
      /dropdown/i,
      /select/i,
    ];
    return componentPatterns.some(pattern => pattern.test(node.name));
  }

  return false;
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
 */
export function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/file\/([^\/]+)/);
    const nodeId = urlObj.searchParams.get('node-id');

    if (pathMatch && nodeId) {
      return {
        fileKey: pathMatch[1],
        nodeId: nodeId,
      };
    }
  } catch (error) {
    console.error('Error parsing Figma URL:', error);
  }
  return null;
}