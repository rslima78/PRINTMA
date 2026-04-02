const fs = require('fs');
const paths = [
"app/api/admin/associacoes/[id]/route.ts",
"app/api/admin/importar/[entidade]/route.ts",
"app/api/pedidos/[id]/prioridade/route.ts",
"app/api/pedidos/[id]/reimprimir/route.ts",
"app/api/pedidos/[id]/status/route.ts"
];

for (const p of paths) {
  let c = fs.readFileSync(p, 'utf8');
  let match = c.match(/(req: NextRequest,\s*)\{\s*params\s*\}:\s*\{\s*params:\s*\{\s*([^}]+)\s*\}\s*\}/);
  if (match) {
    let paramName = match[2].trim(); // e.g. "id: string" or "entidade: string"
    c = c.replace(match[0], `${match[1]}props: { params: Promise<{ ${paramName} }> }`);
    c = c.replace('try {', 'try {\n    const params = await props.params;');
    fs.writeFileSync(p, c);
    console.log("Fixed " + p);
  } else {
    console.log("No match in " + p);
  }
}
