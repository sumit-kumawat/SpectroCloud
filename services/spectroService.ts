import { 
  SpectroListResponse, 
  ProcessedUser, 
  SpectroUser, 
  SpectroRole, 
  SpectroTeam 
} from '../types';
import { getUsersFromCache, saveUsersToCache, setLastSyncTime } from './dbService';

// Backend Discovery Logic
const getBackendBaseUrl = async (): Promise<string> => {
  const backendPort = '3001';
  let hostname = window.location.hostname;
  if (!hostname) hostname = 'localhost';

  // CANDIDATES: Prioritize the specific IP you are using
  const candidates = [
    `http://10.129.152.5:${backendPort}`,   // Priority 1: Known Working IP
    `http://${hostname}:${backendPort}`,    // Priority 2: Current Hostname
    `http://helixit.bmc.com:${backendPort}`,// Priority 3: DNS Name
    `http://localhost:${backendPort}`       // Priority 4: Localhost
  ];
  
  // Dedup
  const uniqueCandidates = [...new Set(candidates)];
  console.log("Discovery Candidates:", uniqueCandidates);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
      // We use Promise.any logic via simple loop for max compatibility
      // We want the FIRST one that responds successfully
      const checkCandidate = async (url: string) => {
          const res = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
          if (res.ok) return url;
          throw new Error('Failed');
      };

      // Try candidates in order (Sequential check is often safer for mixed content)
      // But Promise.any is faster. Let's do a custom race.
      const promises = uniqueCandidates.map(url => checkCandidate(url));
      
      // Since Promise.any is ES2021, let's implement a simple "first success"
      const winner = await new Promise<string>((resolve, reject) => {
          let failures = 0;
          promises.forEach(p => {
              p.then(resolve).catch(() => {
                  failures++;
                  if (failures === promises.length) reject(new Error("All backends failed"));
              });
          });
      });

      clearTimeout(timeoutId);
      console.log("Connected to backend:", winner);
      return winner;
  } catch (e) {
      clearTimeout(timeoutId);
      console.warn("Discovery failed, defaulting to Priority 1 IP.");
      return `http://10.129.152.5:${backendPort}`;
  }
};

async function fetchResource<T>(endpointPath: string, onProgress?: (count: number) => void): Promise<T[]> {
  let allItems: T[] = [];
  let continueToken: string | undefined = undefined;
  let hasMore = true;
  const LIMIT = 50;
  
  let base: string;
  try {
    base = await getBackendBaseUrl();
  } catch (err) {
    base = `http://10.129.152.5:3001`; // Ultimate fallback
  }

  const baseUrlObj = new URL(endpointPath, base);
  const fullUrl = baseUrlObj.toString();

  while (hasMore) {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', LIMIT.toString());
    if (continueToken) queryParams.append('continue', continueToken);
    
    try {
        const fetchUrl = `${fullUrl}?${queryParams.toString()}`;
        const res = await fetch(fetchUrl, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!res.ok) throw new Error(`Status ${res.status}`);
        
        const data: SpectroListResponse<T> = await res.json();
        
        if (data.items && data.items.length > 0) {
            allItems = [...allItems, ...data.items];
            if (onProgress) onProgress(allItems.length);
        }

        const nextToken = data.listmeta?.continue || data.metadata?.continue;
        if (nextToken && nextToken.length > 2) {
            continueToken = nextToken;
        } else {
            hasMore = false;
        }
    } catch (e) {
        console.warn(`Fetch error for ${endpointPath}:`, e);
        // If we failed on the first page, throw to show error UI
        if (allItems.length === 0) throw e;
        hasMore = false;
    }
  }
  return allItems;
}

export const loadLocalData = async () => getUsersFromCache();

export const fetchAndSyncUsers = async (onProgress: (count: number) => void) => {
  const usersPromise = fetchResource<SpectroUser>('/spectro/users', onProgress);
  const rolesPromise = fetchResource<SpectroRole>('/spectro/roles');
  const teamsPromise = fetchResource<SpectroTeam>('/spectro/teams');

  const [users, roles, teams] = await Promise.all([usersPromise, rolesPromise, teamsPromise]);
  const processed = processUsers(users, roles, teams);
  
  if (processed.length > 0) {
      saveUsersToCache(processed).then(() => {
          setLastSyncTime(new Date());
      }).catch(console.error);
  }
  return processed;
};

const processUsers = (users: SpectroUser[], roles: SpectroRole[], teams: SpectroTeam[]): ProcessedUser[] => {
  const roleMap = new Map<string, string>();
  roles.forEach(r => roleMap.set(r.metadata.uid, r.spec?.displayName || r.metadata.name));

  const teamMap = new Map<string, string[]>();
  const projectMap = new Map<string, Set<string>>();

  teams.forEach(t => {
      if (t.spec.users) {
          t.spec.users.forEach(member => {
              if (!teamMap.has(member.uid)) teamMap.set(member.uid, []);
              teamMap.get(member.uid)?.push(t.metadata.name);

              if (t.spec.projects) {
                  if (!projectMap.has(member.uid)) projectMap.set(member.uid, new Set());
                  t.spec.projects.forEach(p => projectMap.get(member.uid)?.add(p.name));
              }
          });
      }
  });

  return users.map(u => {
    const roleIds = u.spec.roles || [];
    const resolvedRoles = roleIds.map(rid => roleMap.get(rid) || rid);
    const resolvedTeams = teamMap.get(u.metadata.uid) || [];
    const resolvedProjects = Array.from(projectMap.get(u.metadata.uid) || []);

    return {
        id: u.metadata.uid,
        email: u.spec.emailId,
        firstName: u.spec.firstName,
        lastName: u.spec.lastName,
        fullName: `${u.spec.firstName} ${u.spec.lastName}`,
        isActive: u.status.isActive,
        lastSignIn: u.status.lastSignIn || 'Never',
        roleNames: resolvedRoles,
        teamNames: resolvedTeams,
        projectNames: resolvedProjects,
        createdAt: u.metadata.creationTimestamp
    };
  });
};
