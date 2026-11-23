import fs from 'node:fs';

const groups: Record<string, string[]> = {
  calculators: ['bmi-calculator', 'loan-calculator', 'percentage-calculator'],
  textTools: ['character-counter', 'base64-encoder', 'alphabetical-order-sorter'],
  generators: ['password-generator', 'lorem-ipsum-generator', 'fake-name-generator'],
  imageTools: ['image-resizer', 'image-to-pdf', 'qr-code-generator'],
};

for (const [group, slugs] of Object.entries(groups)) {
  console.log(`\n=== GROUP: ${group.toUpperCase()} ===`);
  for (const slug of slugs) {
    const faqs = JSON.parse(fs.readFileSync(`${slug}/content/faqs.json`, 'utf-8'));
    console.log(`\n--- [${slug}] ---`);
    for (let i = 0; i < Math.min(2, faqs.items.length); i++) {
      console.log(`Q: ${faqs.items[i].question}`);
      console.log(`A: ${faqs.items[i].answer}`);
    }
  }
}

