export interface ChefProfileMini {
  profileImageUrl: string | null;
}

export interface ChefMeDTO {
  id: string;
  firstName: string;
  
 
  profile: ChefProfileMini | null;
}

export interface ApiOk<T> { ok: true; data: T }
