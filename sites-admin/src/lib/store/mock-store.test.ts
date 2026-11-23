import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { MockStore } from './mock-store';
import { SiteSchema, FaqsSchema } from '../content/schemas';
import { buildContextFromSite, renderLegalTemplate } from '../content/legal-template';

describe('Mock Store & Fixtures Contract', () => {
  const fixturesDir = path.resolve(__dirname, '../../../tests/fixtures');

  function loadFixturesIntoStore(): MockStore {
    const store = new MockStore();
    const slugs = ['bmi-calculator', 'loan-calculator', 'qr-code-generator'];

    // Load _shared baselines
    const privMaster = fs.readFileSync(path.join(fixturesDir, '_shared', 'privacy.master.md'), 'utf-8');
    const termsMaster = fs.readFileSync(path.join(fixturesDir, '_shared', 'terms.master.md'), 'utf-8');
    store.setFile('_shared/privacy.master.md', privMaster);
    store.setFile('_shared/terms.master.md', termsMaster);

    for (const slug of slugs) {
      const cDir = path.join(fixturesDir, slug, 'content');
      for (const f of ['site.json', 'faqs.json', 'privacy.md', 'terms.md', 'explainer.md']) {
        const filePath = path.join(cDir, f);
        if (fs.existsSync(filePath)) {
          store.setFile(`${slug}/content/${f}`, fs.readFileSync(filePath, 'utf-8'));
        }
      }
    }
    return store;
  }

  it('discovers all fixture sites dynamically', async () => {
    const store = loadFixturesIntoStore();
    const sites = await store.listSites();
    expect(sites).toEqual(['bmi-calculator', 'loan-calculator', 'qr-code-generator']);
  });

  it('loads and validates all content for each fixture site', async () => {
    const store = loadFixturesIntoStore();
    const baselines = await store.readBaselines();
    expect(baselines.privacyMasterMd).toContain('{{siteName}}');

    for (const slug of ['bmi-calculator', 'loan-calculator', 'qr-code-generator']) {
      const content = await store.readSiteContent(slug, baselines);
      expect(content.slug).toBe(slug);

      // Schema checks
      expect(SiteSchema.safeParse(content.site).success).toBe(true);
      expect(FaqsSchema.safeParse(content.faqs).success).toBe(true);

      // Render checks
      const context = buildContextFromSite(content.site);
      const renderedPrivacy = renderLegalTemplate(content.privacyMd, context);
      const renderedTerms = renderLegalTemplate(content.termsMd, context);

      expect(renderedPrivacy).toContain(content.site.siteName);
      expect(renderedTerms).toContain(content.site.siteName);
    }
  });

  it('executes batch commits and preserves history', async () => {
    const store = loadFixturesIntoStore();
    const changes = [
      {
        path: 'bmi-calculator/content/faqs.json',
        content: JSON.stringify({
          schemaVersion: 1,
          items: [{ id: 'new-faq', question: 'New Question?', answer: 'New Answer' }],
        }),
      },
    ];

    const result = await store.commitBatch(changes, 'test: update bmi faqs');
    expect(result.success).toBe(true);
    expect(result.commitSha).toBeDefined();

    const updated = await store.readFile('bmi-calculator/content/faqs.json');
    expect(updated).toContain('New Question?');

    const history = await store.history('bmi-calculator/content/faqs.json');
    expect(history[0].message).toBe('test: update bmi faqs');
  });
});

