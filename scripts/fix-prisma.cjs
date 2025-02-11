const fs = require('fs');
const path = require('path');

function fixPrismaPath() {
  const prismaClientPath = path.join(
    process.cwd(),
    'node_modules',
    '@prisma',
    'client',
    'index.js'
  );

  if (fs.existsSync(prismaClientPath)) {
    const content = fs.readFileSync(prismaClientPath, 'utf-8');

    if (!content.includes('regeneratorRuntime')) {
      const newContent = `var regeneratorRuntime;\n${content}`;
      fs.writeFileSync(prismaClientPath, newContent);
      console.log('✅ Successfully patched Prisma Client');
    } else {
      console.log('✅ Prisma Client already patched');
    }
  } else {
    console.log('❌ Could not find Prisma client at:', prismaClientPath);
  }
}

fixPrismaPath();
