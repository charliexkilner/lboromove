import { PrismaClient } from '@prisma/client';
import { calculateWalkingTime, isCloseToUniversity } from '../utils/distance';

const prisma = new PrismaClient();

export async function updateWalkingDistances() {
  try {
    // Only get properties with valid coordinates
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { latitude: { not: 0 } },
          { longitude: { not: 0 } },
        ],
      },
    });

    console.log(`Calculating distances for ${properties.length} properties...`);

    for (const property of properties) {
      try {
        const walkTimeToTown = calculateWalkingTime(property, 'town');
        const walkTimeToCampus = calculateWalkingTime(property, 'campus');
        const nearCampus = isCloseToUniversity(property);

        await prisma.property.update({
          where: { id: property.id },
          data: {
            distanceToTown: walkTimeToTown,
            distanceToCampus: walkTimeToCampus,
            isNearCampus: nearCampus,
          },
        });

        console.log(
          `✓ ${property.street}: ` +
            `${walkTimeToTown}min to town, ${walkTimeToCampus}min to campus, ` +
            `near campus: ${nearCampus}`
        );
      } catch (error) {
        console.error(
          `Failed to update distances for ${property.street}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error('Error in updateWalkingDistances:', error);
  }
}

if (require.main === module) {
  updateWalkingDistances()
    .catch(console.error)
    .finally(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
}
