import { readFile, writeFile } from 'node:fs/promises';

const sourcePath = new URL('../src/data/products.json', import.meta.url);
const outputPath = new URL('../supabase/seed-products.sql', import.meta.url);
const products = JSON.parse(await readFile(sourcePath, 'utf8'));

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const rows = products.map((product) => `(
  ${sqlLiteral(product.id)},
  ${sqlLiteral(product.name)},
  ${sqlLiteral(product.description)},
  ${sqlLiteral(product.image)},
  ${sqlLiteral(product.category)},
  ${Number(product.price)},
  ${Boolean(product.available)},
  ${sqlLiteral(JSON.stringify(product.customizations ?? []))}::jsonb
)`);

const sql = `-- Generado desde src/data/products.json. No editar a mano.\n\nbegin;\n\ninsert into public.products (\n  id, name, description, image, category, base_price, available, customizations\n) values\n${rows.join(',\n')}\non conflict (id) do update set\n  name = excluded.name,\n  description = excluded.description,\n  image = excluded.image,\n  category = excluded.category,\n  base_price = excluded.base_price,\n  available = excluded.available,\n  customizations = excluded.customizations,\n  updated_at = now();\n\ncommit;\n`;

await writeFile(outputPath, sql, 'utf8');
console.log(`Generado: ${outputPath.pathname}`);
