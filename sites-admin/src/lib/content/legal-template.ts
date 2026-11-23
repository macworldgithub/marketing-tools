import { SiteConfig } from './types';

export interface RenderContext {
  siteName: string;
  toolName: string;
  domain: string;
  contactEmail: string;
  effectiveDate: string;
  localStorageKeys: string;
  ads: boolean;
  analytics: boolean;
  localStorage: boolean;
}

export function buildContextFromSite(site: SiteConfig): RenderContext {
  return {
    siteName: site.siteName,
    toolName: site.toolName,
    domain: site.domain,
    contactEmail: site.contactEmail,
    effectiveDate: site.effectiveDate,
    localStorageKeys: site.features.localStorageKeys.join(', '),
    ads: site.features.ads,
    analytics: site.features.analytics !== 'none',
    localStorage: site.features.localStorageKeys.length > 0,
  };
}

const ALLOWED_VARIABLES = new Set([
  'siteName',
  'toolName',
  'domain',
  'contactEmail',
  'effectiveDate',
  'localStorageKeys',
]);

const ALLOWED_CONDITIONS = new Set(['ads', 'analytics', 'localStorage']);

/**
 * Deterministic template renderer.
 * Handles {{var}} and {{#if condition}}...{{/if}}.
 * Strictly fails on unknown variables, unknown conditions, or unbalanced blocks.
 * Byte-for-byte compatible with tool sites' core template renderer.
 */
export function renderLegalTemplate(template: string, context: RenderContext): string {
  // 1. Check for unbalanced block tags
  const openMatches = template.match(/\{\{#if\s+([a-zA-Z0-9_]+)\}\}/g) || [];
  const closeMatches = template.match(/\{\{\/if\}\}/g) || [];

  if (openMatches.length !== closeMatches.length) {
    throw new Error(
      `Unbalanced conditional blocks: found ${openMatches.length} '{{#if}}' tags and ${closeMatches.length} '{{/if}}' tags.`
    );
  }

  // 2. Verify all block conditions are allowed
  let blockMatch: RegExpExecArray | null;
  const checkBlockRegex = /\{\{#if\s+([a-zA-Z0-9_]+)\}\}/g;
  while ((blockMatch = checkBlockRegex.exec(template)) !== null) {
    const condName = blockMatch[1];
    if (!ALLOWED_CONDITIONS.has(condName)) {
      throw new Error(
        `Unknown condition in template: '{{#if ${condName}}}'. Allowed conditions: ${[...ALLOWED_CONDITIONS].join(', ')}`
      );
    }
  }

  // 3. Process conditional blocks
  let rendered = template;
  const blockRegex = /\{\{#if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  rendered = rendered.replace(blockRegex, (_match, conditionName: string, innerContent: string) => {
    const isTrue = Boolean(context[conditionName as keyof RenderContext]);
    return isTrue ? innerContent : '';
  });

  // Verify no orphaned tags remain
  if (rendered.includes('{{#if') || rendered.includes('{{/if}}')) {
    throw new Error('Unbalanced or malformed conditional tags remaining after processing.');
  }

  // 4. Verify variables
  const varRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  let varMatch: RegExpExecArray | null;
  while ((varMatch = varRegex.exec(rendered)) !== null) {
    const varName = varMatch[1];
    if (!ALLOWED_VARIABLES.has(varName)) {
      throw new Error(
        `Unknown variable in template: '{{${varName}}}'. Allowed variables: ${[...ALLOWED_VARIABLES].join(', ')}`
      );
    }
  }

  // 5. Replace variables
  rendered = rendered.replace(varRegex, (_match, varName: string) => {
    const value = context[varName as keyof RenderContext];
    return String(value ?? '');
  });

  return rendered.trim();
}

