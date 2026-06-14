export interface CreateGroupDto {
  name: string;
  baseCurrency?: string;
}

export interface UpdateGroupDto {
  name?: string;
  baseCurrency?: string;
}
