
import { prisma } from "../../../lib/prisma";
import type { UpdateChefInput } from "../validators/chef.update.schema";

export async function updateChefAccountById(chefId: string, data: UpdateChefInput) {
  return prisma.chef.update({
    where: { id: chefId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      countryCode: data.countryCode,
      phonePrefix: data.phonePrefix,
      phoneNumber: data.phoneNumber,
      email: data.email,
    },
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
    },
  });
}

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
