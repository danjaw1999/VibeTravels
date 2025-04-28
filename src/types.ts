// Common types
export type UUID = string;
export type ISODateTime = string;

// Authentication types
export interface RegisterUserCommand {
  email: string;
  password: string;
  profile_description?: string | null;
}

export interface LoginCommand {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  accessToken: string;
  user: UserDTO;
}

// User types
export interface UserDTO {
  id: string;
  email: string;
  profile_description: string | null;
  createdAt: string;
}

export interface UpdateUserProfileCommand {
  profile_description?: string | null;
}

// Image types
export interface ImageDTO {
  url: string;
  photographer: string;
  photographerUrl: string;
  source: string;
}

// Attraction types
export interface AttractionDTO {
  id: string;
  name: string;
  description: string;
  image: ImageDTO | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface CreateAttractionCommand {
  name: string;
  description: string;
  image?: string | null;
  imagePhotographer?: string | null;
  imagePhotographerUrl?: string | null;
  imageSource?: string | null;
  latitude: number;
  longitude: number;
}

export interface GeneratedAttractionDTO {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  image: ImageDTO | null;
  estimatedPrice: string;
}

// Travel Note types
export interface TravelNoteDTO {
  id: string;
  user_id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  attractions: AttractionDTO[];
}

export interface CreateTravelNoteCommand {
  name: string;
  description: string;
  is_public?: boolean;
}

export interface UpdateTravelNoteCommand {
  name?: string;
  description?: string;
  is_public?: boolean;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export type PaginatedTravelNotesResponse = PaginatedResponse<TravelNoteDTO>;

// API Response types
export interface APIErrorResponse {
  message: string;
  code: string;
}

export interface APISuccessResponse<T> {
  data: T;
}

export type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;

export interface TravelNote {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Query Parameters
export interface TravelNoteQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isPublic?: boolean;
  includeAttractions?: boolean;
}

// Type Guards and Validators
export const isTravelNoteDTO = (obj: unknown): obj is TravelNoteDTO => {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "id" in obj &&
    "user_id" in obj &&
    "name" in obj &&
    "description" in obj &&
    "is_public" in obj &&
    "attractions" in obj
  );
};

export const isAttractionDTO = (obj: unknown): obj is AttractionDTO => {
  return (
    obj !== null && typeof obj === "object" && "id" in obj && "name" in obj && "latitude" in obj && "longitude" in obj
  );
};

export interface UserProfileDTO extends Pick<UserDTO, "id" | "email" | "profile_description"> {
  updated_at: ISODateTime;
}

export interface UserRegisterCommand {
  email: string;
  password: string;
  profile_description?: string;
}

export interface UserUpdateCommand {
  profile_description?: string;
}

export interface AttractionSuggestionDTO {
  id?: UUID;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  image: {
    url: string;
    photographer: string;
    photographerUrl: string;
    source: string;
  } | null;
  estimatedPrice: string;
}

export interface AttractionBulkCreateCommand {
  attractions: CreateAttractionCommand[];
}

export interface AttractionBulkCreateResponseDTO {
  attractions: AttractionDTO[];
}

export interface GenerateAttractionsResponseDTO {
  suggestions: GeneratedAttractionDTO[];
}
