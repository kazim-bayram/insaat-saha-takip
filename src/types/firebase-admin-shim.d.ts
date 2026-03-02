declare module 'firebase-admin/app' {
  // Minimal typings to satisfy TypeScript in scripts using the Admin SDK.
  // At runtime you must still have the real `firebase-admin` package installed.
  export interface AppOptions {
    credential?: any;
    [key: string]: any;
  }

  export function initializeApp(options?: AppOptions): any;

  export interface Cert {
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  }

  export function cert(serviceAccount: Cert | string): any;
}

declare module 'firebase-admin/firestore' {
  export interface Firestore {
    collection(path: string): any;
  }

  export function getFirestore(): Firestore;
}

