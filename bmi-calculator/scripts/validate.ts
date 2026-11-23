import { validateContent } from '../src/shared/content/validator';

const result = validateContent(process.cwd());

if (!result.valid) {
  console.error('\n❌ Content validation failed:');
  for (const issue of result.issues) {
    if (issue.type === 'error') {
      console.error(`  - [${issue.file}] ${issue.message}`);
    }
  }
  process.exit(1);
}

if (result.issues.length > 0) {
  console.warn('\n⚠️ Content validation warnings:');
  for (const issue of result.issues) {
    if (issue.type === 'warning') {
      console.warn(`  - [${issue.file}] ${issue.message}`);
    }
  }
}

console.log('✅ Content validation passed.');
