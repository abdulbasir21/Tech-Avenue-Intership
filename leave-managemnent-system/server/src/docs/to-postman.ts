import fs from 'node:fs';
import path from 'node:path';
import Converter from 'openapi-to-postmanv2';

const openApiPath = path.resolve(__dirname, '../../docs/openapi.json');
const postmanPath = path.resolve(__dirname, '../../docs/leave-management.postman_collection.json');

if (!fs.existsSync(openApiPath)) {
  console.error(`OpenAPI file not found at ${openApiPath}. Run "npm run docs:export" first.`);
  process.exit(1);
}

const openApiData = fs.readFileSync(openApiPath, 'utf8');

Converter.convert(
  { type: 'string', data: openApiData },
  {
    folderStrategy: 'Tags',
    includeAuthInfoInExample: true,
  },
  (err, conversionResult) => {
    if (err) {
      console.error('Failed to convert OpenAPI to Postman collection:', err);
      process.exit(1);
    }

    if (!conversionResult.result || !conversionResult.output || conversionResult.output.length === 0) {
      console.error(
        'Conversion unsuccessful:',
        conversionResult.reason ?? 'Unknown conversion failure',
      );
      process.exit(1);
    }

    const collection = conversionResult.output[0].data;
    fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2), 'utf8');
    console.log(`Postman collection exported to ${postmanPath}`);
  },
);
