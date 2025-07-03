import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Permissions
  const permissions = [
    { name: 'user:create', description: 'สร้างผู้ใช้งาน' },
    { name: 'user:edit', description: 'แก้ไขข้อมูลผู้ใช้งาน' },
    { name: 'user:ban', description: 'แบนผู้ใช้งาน' },
    { name: 'auth:resend-otp', description: 'ขอ OTP ใหม่' },
    { name: 'profile:read', description: 'ดูโปรไฟล์' },
  ];

  const permissionRecords = await Promise.all(
    permissions.map((perm) =>
      prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      }),
    ),
  );

  // Roles
  const roles = [
    {
      name: 'ADMIN',
      permissionNames: [
        'user:create',
        'user:edit',
        'user:ban',
        'auth:resend-otp',
        'profile:read',
      ],
    },
    {
      name: 'USER',
      permissionNames: ['auth:resend-otp', 'profile:read'],
    },
  ];

  for (const role of roles) {
    const existingRole = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        permissions: {
          connect: role.permissionNames.map((p) => ({
            name: p,
          })),
        },
      },
    });
    console.log(`Created or updated role: ${existingRole.name}`);
  }

  console.log('✅ Seeder completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seeder failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
