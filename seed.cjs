const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const DATABASE_URL = process.env.DATABASE_URL;
console.log("DATABASE_URL:", DATABASE_URL ? "encontrada" : "NAO ENCONTRADA");

const prisma = new PrismaClient({
  datasourceUrl: DATABASE_URL,
});

async function main() {
  console.log("Iniciando seed...");

  const h1 = await bcrypt.hash("admin123", 10);
  await prisma.usuario.upsert({
    where: { email: "admin@escola.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@escola.com",
      senha: h1,
      perfil: "ADMIN",
      ativo: true,
    },
  });

  const h2 = await bcrypt.hash("operador123", 10);
  await prisma.usuario.upsert({
    where: { email: "operador@escola.com" },
    update: {},
    create: {
      nome: "Operador Padrao",
      email: "operador@escola.com",
      senha: h2,
      perfil: "OPERADOR",
      ativo: true,
    },
  });

  console.log("Seed OK!");
  console.log("admin@escola.com / admin123");
  console.log("operador@escola.com / operador123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
