/**
 * Component Spec Logger - Save JSON specs for debugging
 */

import { ComponentSpec } from '@/types/componentSpec';
import fs from 'fs/promises';
import path from 'path';

export async function logComponentSpec(spec: ComponentSpec): Promise<string | null> {
  try {
    const logsDir = path.join(process.cwd(), 'logs', 'component-specs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${spec.componentName}_${timestamp}.json`;
    const filepath = path.join(logsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(spec, null, 2), 'utf-8');
    console.log(`✅ JSON spec saved: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error('Failed to log spec:', error);
    return null;
  }
}

/**
 * Read a saved component spec
 */
export async function loadComponentSpec(filepath: string): Promise<ComponentSpec | null> {
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content) as ComponentSpec;
  } catch (error) {
    console.error('Failed to load spec:', error);
    return null;
  }
}
