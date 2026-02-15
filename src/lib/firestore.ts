import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  DocumentSnapshot,
  QueryConstraint,
  addDoc,
  Timestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Club, Member, Payment, Invoice, Event, Attendance, ClubDocument, ClubSettings } from '@/types';

// ==================== CLUBS ====================

export async function createClub(data: Omit<Club, 'id' | 'createdAt' | 'updatedAt' | 'memberCount'>): Promise<string> {
  const clubRef = doc(collection(db, 'clubs'));
  const clubData = {
    ...data,
    id: clubRef.id,
    memberCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(clubRef, clubData);

  return clubRef.id;
}

export async function getClub(clubId: string): Promise<Club | null> {
  const clubDoc = await getDoc(doc(db, 'clubs', clubId));
  return clubDoc.exists() ? (clubDoc.data() as Club) : null;
}

export async function getUserClubs(userId: string): Promise<Club[]> {
  const q = query(collection(db, 'clubs'), where('ownerId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Club);
}

export async function getUserClubsForUser(userId: string): Promise<Club[]> {
  const q = query(collectionGroup(db, 'members'), where('userId', '==', userId));
  const snapshot = await getDocs(q);

  const clubIds = Array.from(new Set(snapshot.docs
    .map(d => (d.data() as { clubId?: string }).clubId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)));

  const clubs = await Promise.all(clubIds.map(async (clubId) => {
    const clubDoc = await getDoc(doc(db, 'clubs', clubId));
    return clubDoc.exists() ? (clubDoc.data() as Club) : null;
  }));

  return clubs.filter((c): c is Club => c != null);
}

export async function updateClub(clubId: string, data: Partial<Club>): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ==================== MEMBERS ====================

export async function addMember(clubId: string, data: Omit<Member, 'id' | 'joinedAt'>): Promise<string> {
  const memberRef = doc(collection(db, 'clubs', clubId, 'members'));
  await setDoc(memberRef, {
    ...data,
    id: memberRef.id,
    clubId,
    joinedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'clubs', clubId), {
    memberCount: increment(1),
  });
  return memberRef.id;
}

export async function getMembers(clubId: string, constraints: QueryConstraint[] = []): Promise<Member[]> {
  const q = query(collection(db, 'clubs', clubId, 'members'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Member);
}

export async function getMember(clubId: string, memberId: string): Promise<Member | null> {
  const memberDoc = await getDoc(doc(db, 'clubs', clubId, 'members', memberId));
  return memberDoc.exists() ? (memberDoc.data() as Member) : null;
}

export async function updateMember(clubId: string, memberId: string, data: Partial<Member>): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId, 'members', memberId), data);
}

export async function deleteMember(clubId: string, memberId: string): Promise<void> {
  await deleteDoc(doc(db, 'clubs', clubId, 'members', memberId));
  await updateDoc(doc(db, 'clubs', clubId), {
    memberCount: increment(-1),
  });
}

// ==================== PAYMENTS ====================

export async function createPayment(clubId: string, data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const paymentRef = doc(collection(db, 'clubs', clubId, 'payments'));
  await setDoc(paymentRef, {
    ...data,
    id: paymentRef.id,
    clubId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return paymentRef.id;
}

export async function getPayments(clubId: string, constraints: QueryConstraint[] = []): Promise<Payment[]> {
  const q = query(collection(db, 'clubs', clubId, 'payments'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Payment);
}

export async function updatePayment(clubId: string, paymentId: string, data: Partial<Payment>): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId, 'payments', paymentId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function createBulkPayments(
  clubId: string,
  members: Member[],
  paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'memberId' | 'memberName' | 'clubId'>
): Promise<string[]> {
  const batch = writeBatch(db);
  const ids: string[] = [];

  for (const member of members) {
    const paymentRef = doc(collection(db, 'clubs', clubId, 'payments'));
    ids.push(paymentRef.id);
    batch.set(paymentRef, {
      ...paymentData,
      id: paymentRef.id,
      clubId,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return ids;
}

// ==================== INVOICES ====================

export async function createInvoice(clubId: string, data: Omit<Invoice, 'id'>): Promise<string> {
  const invoiceRef = doc(collection(db, 'clubs', clubId, 'invoices'));
  await setDoc(invoiceRef, {
    ...data,
    id: invoiceRef.id,
  });
  return invoiceRef.id;
}

export async function getInvoices(clubId: string, constraints: QueryConstraint[] = []): Promise<Invoice[]> {
  const q = query(collection(db, 'clubs', clubId, 'invoices'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Invoice);
}

// ==================== EVENTS ====================

export async function createEvent(clubId: string, data: Omit<Event, 'id' | 'createdAt'>): Promise<string> {
  const eventRef = doc(collection(db, 'clubs', clubId, 'events'));
  await setDoc(eventRef, {
    ...data,
    id: eventRef.id,
    createdAt: serverTimestamp(),
  });
  return eventRef.id;
}

export async function getEvents(clubId: string, constraints: QueryConstraint[] = []): Promise<Event[]> {
  const q = query(collection(db, 'clubs', clubId, 'events'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Event);
}

// ==================== ATTENDANCE ====================

export async function recordAttendance(clubId: string, data: Omit<Attendance, 'id'>): Promise<string> {
  const attendanceRef = doc(collection(db, 'clubs', clubId, 'attendance'));
  await setDoc(attendanceRef, {
    ...data,
    id: attendanceRef.id,
  });
  return attendanceRef.id;
}

export async function getAttendance(clubId: string, constraints: QueryConstraint[] = []): Promise<Attendance[]> {
  const q = query(collection(db, 'clubs', clubId, 'attendance'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Attendance);
}

// ==================== DOCUMENTS ====================

export async function addClubDocument(clubId: string, data: Omit<ClubDocument, 'id' | 'createdAt'>): Promise<string> {
  const docRef = doc(collection(db, 'clubs', clubId, 'documents'));
  await setDoc(docRef, {
    ...data,
    id: docRef.id,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getClubDocuments(clubId: string): Promise<ClubDocument[]> {
  const snapshot = await getDocs(collection(db, 'clubs', clubId, 'documents'));
  return snapshot.docs.map(d => d.data() as ClubDocument);
}
