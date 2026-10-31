export interface Player {
  name: string;
  tokenHash: string;
  connectionId?: string;
  online: boolean;
  offlineSince?: number;
  joinedAt: number;
  kicked: boolean;
  // Rules-owned extras (hill, away, userId...) ride along untouched.
  [extra: string]: unknown;
}
export interface Tv {
  connectionId?: string;
  tvTokenHash?: string;
}
