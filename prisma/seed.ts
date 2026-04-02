// @ts-nocheck
const { PrismaClient } = require("@prisma/client/wasm");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  const senhaHash = await bcrypt.hash("admin123", 10);
  await prisma.usuario.upsert({
    where: { email: "admin@escola.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@escola.com",
      senha: senhaHash,
      perfil: "ADMIN",
      ativo: true,
    },
  });

  const senhaOp = await bcrypt.hash("operador123", 10);
  await prisma.usuario.upsert({
    where: { email: "operador@escola.com" },
    update: {},
    create: {
      nome: "Operador Padrão",
      email: "operador@escola.com",
      senha: senhaOp,
      perfil: "OPERADOR",
      ativo: true,
    },
  });

  console.log("✅ Seed executado com sucesso!");
  console.log("📧 Admin: admin@escola.com / admin123");
  console.log("📧 Operador: operador@escola.com / operador123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
