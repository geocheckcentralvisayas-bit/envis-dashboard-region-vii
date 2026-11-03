export type Role = 'extractor' | 'rd' | 'emed' | 'cpd' | 'mis' | 'viewer' | 'gis';

export interface Account {
  username: string;
  role: Role;
  displayName: string;
  division: string;
  passwordHash: string;
}

export interface Session {
  username: string;
  role: Role;
  displayName: string;
  division: string;
  at: number;
}

const SESSION_KEY = 'envis.session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export const ACCOUNTS: Account[] = [
  { username: 'extractor', role: 'extractor', displayName: 'Data Extractor', division: 'Data Extraction', passwordHash: 'efe8e36ec61c1df5ca983b7df13c503c102ada81574aef1d57abb2f2a8e71e5a' },
  { username: 'rd.regional', role: 'rd', displayName: 'Regional Director', division: 'Office of the Regional Director', passwordHash: 'a406bce8e1daccd6c66dcff1f7ed68188c79d88e03e8b8079bae03bf3595fe07' },
  { username: 'emed.enforce', role: 'emed', displayName: 'Environmental Monitoring & Enforcement Division', division: 'EMED', passwordHash: 'a0fe7872bdd76e1fd997002a7655ff1d6de9e34c0545fccd294afd4399007ec0' },
  { username: 'cpd.permits', role: 'cpd', displayName: 'Clearance and Permitting Division', division: 'CPD', passwordHash: '61e1c46477800307d037dcf2b5395ea3de33dc75b6ef3f76cf79d95b7d754560' },
  { username: 'mis.systems', role: 'mis', displayName: 'Management and Information System', division: 'MIS', passwordHash: 'dbcde5c816e50c0b1cdfb4da7654cbb1bedb6d54888ab03b541c353d7bec2f48' },
  { username: 'gis.spatial', role: 'gis', displayName: 'GIS Unit', division: 'GIS / Spatial Data', passwordHash: '0786b228198bce0f95f62fd2aa013033ae32f6208f26ce3b892affa71b604870' },
];

export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function login(username: string, password: string): Promise<Session | null> {
  const account = ACCOUNTS.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
  if (!account) return null;
  const hash = await sha256(password);
  if (hash !== account.passwordHash) return null;
  const session: Session = {
    username: account.username,
    role: account.role,
    displayName: account.displayName,
    division: account.division,
    at: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session || !session.at || Date.now() - session.at > SESSION_TTL_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function canExport(session: Session | null): boolean {
  return session?.role === 'extractor' || session?.role === 'mis';
}

export function canDownloadGeoJson(session: Session | null): boolean {
  return session?.role === 'gis';
}
