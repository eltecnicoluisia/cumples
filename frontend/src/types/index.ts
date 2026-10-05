export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export type RelationType = 'BIOLOGICAL' | 'ADOPTIVE' | 'FOSTER' | 'STEP';
export type SpouseType = 'MARRIED' | 'PARTNER' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED';
export type UserRole = 'ADMIN' | 'USER' | 'EDITOR' | 'VIEWER';
export type UserPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role: UserRole;
  plan?: UserPlan;
  isActive?: boolean;
  createdAt?: string;
}

export interface TreeItem {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  createdAt: string;
  _count?: {
    persons: number;
  };
}

export interface UserAdminItem {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role: UserRole;
  plan: UserPlan;
  isActive: boolean;
  createdAt: string;
  totalRelatives: number;
}

export interface AdminPlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalPersons: number;
  planCounts: {
    FREE: number;
    PRO: number;
    ENTERPRISE: number;
  };
}

export interface PersonSummary {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  avatarUrl?: string | null;
  gender: Gender;
  isAlive: boolean;
  birthDate?: string | null;
}

export interface ParentRelationItem {
  id: string;
  parentId: string;
  childId: string;
  type: RelationType;
  parent: PersonSummary;
}

export interface ChildRelationItem {
  id: string;
  parentId: string;
  childId: string;
  type: RelationType;
  child: PersonSummary;
}

export interface SpouseRelationItem {
  id: string;
  person1Id: string;
  person2Id: string;
  type: SpouseType;
  marriageDate?: string | null;
  divorceDate?: string | null;
  notes?: string | null;
  person1?: PersonSummary;
  person2?: PersonSummary;
}

export interface Person {
  id: string;
  userId?: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  maidenName?: string | null;
  nickname?: string | null;
  gender: Gender;
  isAlive: boolean;
  birthDate?: string | null; // YYYY-MM-DD
  birthPlace?: string | null;
  deathDate?: string | null; // YYYY-MM-DD
  deathPlace?: string | null;
  burialPlace?: string | null;
  causeOfDeath?: string | null;
  avatarUrl?: string | null;
  biography?: string | null;
  profession?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  generation?: number | null;
  kinshipRole?: string | null;
  merkleHash?: string | null;
  createdAt?: string;
  updatedAt?: string;

  parentRelations?: ParentRelationItem[];
  childRelations?: ChildRelationItem[];
  spousesAsFirst?: SpouseRelationItem[];
  spousesAsSecond?: SpouseRelationItem[];
}

export interface TreeGraphNode {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  maidenName?: string | null;
  nickname?: string | null;
  gender: Gender;
  isAlive: boolean;
  birthDate?: string | null;
  birthPlace?: string | null;
  deathDate?: string | null;
  deathPlace?: string | null;
  avatarUrl?: string | null;
  profession?: string | null;
  generation?: number | null;
  kinshipRole?: string | null;
}

export interface TreeParentChildEdge {
  id: string;
  parentId: string;
  childId: string;
  type: RelationType;
}

export interface TreeSpouseEdge {
  id: string;
  person1Id: string;
  person2Id: string;
  type: SpouseType;
  marriageDate?: string | null;
  divorceDate?: string | null;
}

export interface TreeGraphData {
  nodes: TreeGraphNode[];
  parentChildEdges: TreeParentChildEdge[];
  spouseEdges: TreeSpouseEdge[];
}

export interface BirthdayEvent {
  personId: string;
  fullName: string;
  avatarUrl?: string | null;
  gender: Gender;
  isAlive: boolean;
  birthDate: string;
  birthDay: number;
  birthMonth: number;
  birthYear?: number;
  birthPlace?: string | null;
  ageTurning: number | null;
  daysUntil: number;
  eventDateThisYear: string;
  type: 'BIRTHDAY';
}

export interface MemorialEvent {
  personId: string;
  fullName: string;
  avatarUrl?: string | null;
  gender: Gender;
  birthDate?: string | null;
  deathDate: string;
  birthPlace?: string | null;
  deathPlace?: string | null;
  deathDay: number;
  deathMonth: number;
  deathYear?: number;
  yearsPassed: number | null;
  daysUntil: number;
  eventDateThisYear: string;
  ageAtDeath: number | null;
  type: 'MEMORIAL';
}

export interface MarriageEvent {
  relationId: string;
  spouse1Name: string;
  spouse2Name: string;
  spouse1Id: string;
  spouse2Id: string;
  marriageDate: string;
  marriageDay: number;
  marriageMonth: number;
  marriageYear?: number;
  yearsMarried: number | null;
  daysUntil: number;
  eventDateThisYear: string;
  type: 'MARRIAGE';
}

export interface CustomEventItem {
  id: string;
  personId: string;
  personName: string;
  title: string;
  eventType: string;
  eventDate: string;
  eventDay: number;
  eventMonth: number;
  eventYear?: number;
  yearsAnniversary: number | null;
  daysUntil: number;
  eventDateThisYear: string;
  description?: string | null;
  type: 'CUSTOM';
}

export interface UpcomingEventsResponse {
  today: string;
  totalBirthdays: number;
  totalMemorials: number;
  totalMarriages?: number;
  totalCustomEvents?: number;
  next7DaysBirthdays: BirthdayEvent[];
  next30DaysBirthdays: BirthdayEvent[];
  allBirthdays: BirthdayEvent[];
  allMemorials: MemorialEvent[];
  allMarriages?: MarriageEvent[];
  allCustomEvents?: CustomEventItem[];
}

export interface DemographicsResponse {
  totalPersons: number;
  livingCount: number;
  deceasedCount: number;
  genderDistribution: {
    males: number;
    females: number;
    others: number;
  };
  totalRelations: number;
  totalMarriages: number;
  avgLivingAge: number | null;
  avgDeceasedLifespan: number | null;
  monthlyBirthCounts: number[];
}
