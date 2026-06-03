import type { Role } from '../../common/enums/role.enum';

export interface UserInterface {
  roles: Role[];
  userId: string;
}
