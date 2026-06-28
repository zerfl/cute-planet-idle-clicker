import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import defaultConfig from "../../firebase-applet-config.json";

// Dev override: when VITE_FIREBASE_* vars are present (via a gitignored .env.local), use them
// instead of the committed config so local development can talk to a Firebase project that
// allows localhost. Production builds have no .env.local and fall back to the JSON.
const env = import.meta.env;
const envDatabaseId = env.VITE_FIREBASE_DATABASE_ID || undefined;
const envConfig =
  env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID
    ? {
        apiKey: env.VITE_FIREBASE_API_KEY,
        authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.VITE_FIREBASE_APP_ID,
        measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
      }
    : null;

const firebaseConfig = envConfig ?? defaultConfig;

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Extract references
// Detect if running in Google AI Studio preview environment
const isAiStudio =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("run.app") ||
    window.location.hostname.includes("google.com") ||
    window.location.hostname.includes("aistudio") ||
    window.location.hostname.includes("vercel.app") ||
    window.location.hostname.includes("cute-planet-idle-clicker.vercel.app"));

const dbId =
  envDatabaseId ||
  (isAiStudio
    ? (firebaseConfig as any).firestoreDatabaseId || (firebaseConfig as any).databaseId
    : undefined);

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore error profiling as mandated by the Integration Skill
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection Validation Checklist
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration. Client is offline.");
    }
  }
}
testConnection();
