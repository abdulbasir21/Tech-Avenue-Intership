import fs from 'node:fs';
import path from 'node:path';
import { swaggerSpec } from './swagger';

const outputPath = path.resolve(__dirname, '../../docs/openapi.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2), 'utf8');
console.log(`OpenAPI specification exported to ${outputPath}`);
