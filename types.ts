
export interface SpectroMetadata {
  name?: string;
  uid: string;
  creationTimestamp: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface SpectroSpec {
  firstName: string;
  lastName: string;
  emailId: string;
  roles?: string[]; // Array of Role IDs
}

export interface SpectroStatus {
  isActive: boolean;
  lastSignIn?: string;
}

export interface SpectroUser {
  metadata: SpectroMetadata;
  spec: SpectroSpec;
  status: SpectroStatus;
}

export interface SpectroRole {
  metadata: {
    uid: string;
    name: string;
  };
  spec: {
    displayName?: string;
  }
}

export interface SpectroTeam {
  metadata: {
    uid: string;
    name: string;
  };
  spec: {
    users?: Array<{
      uid: string;
      name?: string;
    }>;
    projects?: Array<{
      uid: string;
      name: string;
    }>;
  };
}

export interface SpectroListResponse<T> {
  items: T[];
  listmeta?: {
    continue?: string;
    count?: number;
    limit?: number;
    offset?: number;
  };
  metadata?: {
    continue?: string;
    remainingItemCount?: number;
  };
}

export interface ProcessedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  lastSignIn: string;
  roleNames: string[];
  teamNames: string[];
  projectNames: string[];
  createdAt: string;
}
