import { useFirestoreCollection, where, orderBy, type UseFirestoreCollectionResult } from './useFirestore';
import type { DocumentData } from 'firebase/firestore';

export interface Email {
  id: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  from: string;
  to: string[];
  candidateId: string;
  jobId: string;
  direction: 'inbound' | 'outbound';
  status: 'draft' | 'sent' | 'failed' | 'delivered' | 'opened' | 'clicked' | 'received' | 'processed';
  messageId?: string;
  threadId?: string;
  sentBy?: string;
  sentAt?: Date;
  receivedAt?: Date; // For inbound emails
  isRead?: boolean; // Whether the email has been read
  isStarred?: boolean; // Whether the email is starred
  isArchived?: boolean; // Whether the email is archived
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transform Firestore document to Email type
 * Converts Firestore Timestamps to JavaScript Date objects
 */
function transformEmailDocument(doc: DocumentData): Email {
  // Helper to convert Firestore Timestamp to Date
  const toDate = (value: unknown): Date | undefined => {
    if (!value) return undefined;
    // Firestore Timestamp has toDate() method
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: unknown }).toDate === 'function') {
      return ((value as { toDate: () => Date }).toDate());
    }
    // Already a Date
    if (value instanceof Date) {
      return value;
    }
    // Try to parse as date
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  };

  return {
    ...doc,
    sentAt: toDate(doc.sentAt),
    receivedAt: toDate(doc.receivedAt),
    createdAt: toDate(doc.createdAt) || new Date(),
    updatedAt: toDate(doc.updatedAt) || new Date(),
  } as Email;
}

/**
 * Hook to get all emails with realtime updates
 */
export function useEmails(options?: { enabled?: boolean }): UseFirestoreCollectionResult<Email> {
  return useFirestoreCollection<Email>({
    collectionPath: 'emails',
    queryConstraints: [
      orderBy('createdAt', 'desc'),
    ],
    enabled: options?.enabled,
    transform: transformEmailDocument,
  });
}

/**
 * Hook to get emails for a specific candidate and job
 */
export function useEmailsByCandidateAndJob(
  candidateId: string | undefined,
  jobId: string | undefined,
  options?: { enabled?: boolean }
): UseFirestoreCollectionResult<Email> {
  const enabled = options?.enabled !== false && !!candidateId && !!jobId;
  
  return useFirestoreCollection<Email>({
    collectionPath: 'emails',
    queryConstraints: [
      ...(candidateId ? [where('candidateId', '==', candidateId)] : []),
      ...(jobId ? [where('jobId', '==', jobId)] : []),
      orderBy('createdAt', 'desc'),
    ],
    enabled,
    transform: transformEmailDocument,
  });
}

/**
 * Hook to get emails for a specific candidate
 */
export function useEmailsByCandidate(
  candidateId: string | undefined,
  options?: { enabled?: boolean }
): UseFirestoreCollectionResult<Email> {
  const enabled = options?.enabled !== false && !!candidateId;
  
  return useFirestoreCollection<Email>({
    collectionPath: 'emails',
    queryConstraints: [
      ...(candidateId ? [where('candidateId', '==', candidateId)] : []),
      orderBy('createdAt', 'desc'),
    ],
    enabled,
    transform: transformEmailDocument,
  });
}

/**
 * Hook to get emails by thread
 */
export function useEmailsByThread(
  threadId: string | undefined,
  options?: { enabled?: boolean }
): UseFirestoreCollectionResult<Email> {
  const enabled = options?.enabled !== false && !!threadId;
  
  return useFirestoreCollection<Email>({
    collectionPath: 'emails',
    queryConstraints: [
      ...(threadId ? [where('threadId', '==', threadId)] : []),
      orderBy('createdAt', 'asc'),
    ],
    enabled,
    transform: transformEmailDocument,
  });
}

/**
 * Hook to get emails by status
 */
export function useEmailsByStatus(
  status: Email['status'],
  options?: { enabled?: boolean }
): UseFirestoreCollectionResult<Email> {
  return useFirestoreCollection<Email>({
    collectionPath: 'emails',
    queryConstraints: [
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
    ],
    enabled: options?.enabled,
    transform: transformEmailDocument,
  });
}
