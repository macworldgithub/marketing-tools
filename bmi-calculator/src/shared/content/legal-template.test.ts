// GENERATED from _template — do not edit here
import { describe, it, expect } from 'vitest';
import { renderLegalTemplate, RenderContext } from './legal-template';

const sampleContext: RenderContext = {
  siteName: 'BMI Calculator',
  toolName: 'BMI Calculator',
  domain: 'bmicalc.test',
  contactEmail: 'support@bmicalc.test',
  effectiveDate: '2026-11-23',
  localStorageKeys: 'theme',
  ads: false,
  analytics: false,
  localStorage: true,
};

describe('renderLegalTemplate', () => {
  it('replaces all allowed variables correctly', () => {
    const template = 'Welcome to {{siteName}} ({{domain}}) created for {{toolName}}. Contact {{contactEmail}} on {{effectiveDate}}.';
    const result = renderLegalTemplate(template, sampleContext);
    expect(result).toBe('Welcome to BMI Calculator (bmicalc.test) created for BMI Calculator. Contact support@bmicalc.test on 2026-11-23.');
  });

  it('renders conditional blocks when condition is true', () => {
    const template = 'Start.{{#if localStorage}} Stored keys: {{localStorageKeys}}.{{/if}} End.';
    const result = renderLegalTemplate(template, sampleContext);
    expect(result).toBe('Start. Stored keys: theme. End.');
  });

  it('removes conditional blocks when condition is false', () => {
    const template = 'Start.{{#if ads}} Ads are enabled.{{/if}} End.';
    const result = renderLegalTemplate(template, sampleContext);
    expect(result).toBe('Start. End.');
  });

  it('throws an error on unknown variable', () => {
    const template = 'Hello {{unknownVar}}!';
    expect(() => renderLegalTemplate(template, sampleContext)).toThrowError(/Unknown variable in template: '{{unknownVar}}'/);
  });

  it('throws an error on unknown condition', () => {
    const template = '{{#if invalidCond}}Some content{{/if}}';
    expect(() => renderLegalTemplate(template, sampleContext)).toThrowError(/Unknown condition in template: '{{#if invalidCond}}'/);
  });

  it('throws an error on unbalanced conditional blocks', () => {
    const template = '{{#if ads}}Some content';
    expect(() => renderLegalTemplate(template, sampleContext)).toThrowError(/Unbalanced conditional blocks/);
  });
});

