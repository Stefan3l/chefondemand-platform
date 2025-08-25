
import { prisma } from "../../../lib/prisma";

export async function getChefWithProfileById(chefId: string) {
  return prisma.chef.findUnique({
    where: { id: chefId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      countryCode: true,
      phonePrefix: true,
      phoneNumber: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      //  include profilul, dar fără path intern
      profile: {
        select: {
          id: true,
          chefId: true,
          profileImageUrl: true,
          profileImageMime: true,
          bio: true,
          website: true,
          languages: true,
          skills: true,
          address: true,
          region: true,
          country: true,
          serviceRadiusKm: true,
          createdAt: true,
          updatedAt: true,
        }
      }
    }
  });
}
