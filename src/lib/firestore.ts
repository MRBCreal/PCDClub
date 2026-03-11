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
import { Club, Member, Payment, Invoice, Event, Attendance, ClubDocument, ClubSettings, DashboardStats, Notification, Court, Booking, Match, PlayerCategory, Division } from '@/types';

// ==================== CLUBS ====================

export async function createClub(data: Omit<Club, 'id' | 'createdAt' | 'updatedAt' | 'memberCount'>): Promise<string> {
  const batch = writeBatch(db);
  const clubRef = doc(collection(db, 'clubs'));
  const clubId = clubRef.id;

  const clubData = {
    ...data,
    id: clubId,
    memberCount: 1, // Start with 1 (the owner)
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Create the club
  batch.set(clubRef, clubData);

  // Add the owner as the first member
  const memberRef = doc(db, 'clubs', clubId, 'members', data.ownerId);
  batch.set(memberRef, {
    clubId,
    userId: data.ownerId,
    email: data.email,
    firstName: 'Admin', // Default for new clubs
    lastName: 'Principal',
    role: 'owner',
    joinedAt: serverTimestamp(),
    isActive: true,
  });

  await batch.commit();
  return clubId;
}

export async function getClub(clubId: string): Promise<Club | null> {
  const clubDoc = await getDoc(doc(db, 'clubs', clubId));
  return clubDoc.exists() ? ({ ...clubDoc.data(), id: clubDoc.id } as Club) : null;
}

export async function getUserClubs(userId: string): Promise<Club[]> {
  const q = query(collection(db, 'clubs'), where('ownerId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Club));
}

export async function getUserClubsForUser(userId: string): Promise<Club[]> {
  const clubIds = new Set<string>();

  try {
    const qMembers = query(collectionGroup(db, 'members'), where('userId', '==', userId));
    const snapshotMembers = await getDocs(qMembers);
    snapshotMembers.docs.forEach(d => {
      const cid = (d.data() as { clubId?: string }).clubId;
      if (cid) clubIds.add(cid);
    });
  } catch (error) {
    console.warn('Membership query failed (likely building index):', error);
  }

  // 2. Get clubs where user is the owner
  try {
    const qOwned = query(collection(db, 'clubs'), where('ownerId', '==', userId));
    const snapshotOwned = await getDocs(qOwned);
    snapshotOwned.docs.forEach(d => clubIds.add(d.id));
  } catch (error) {
    console.warn('Ownership query failed:', error);
  }

  // 3. Fetch all unique clubs
  if (clubIds.size === 0) return [];

  const clubs = await Promise.all(Array.from(clubIds).map(async (clubId) => {
    try {
      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      return clubDoc.exists() ? ({ ...clubDoc.data(), id: clubDoc.id } as Club) : null;
    } catch { return null; }
  }));

  return clubs.filter((c): c is Club => c != null);
}

export async function getAllClubs(): Promise<Club[]> {
  const snapshot = await getDocs(collection(db, 'clubs'));
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Club));
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
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Member));
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
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Payment));
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
  if (members.length === 0) return [];
  const batch = writeBatch(db);
  const ids: string[] = [];

  for (const member of members) {
    if (!member.id) {
      console.warn('Skipping member with no ID:', member);
      continue;
    }
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
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Invoice));
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
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Event));
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
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Attendance));
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

export async function deleteClubDocument(clubId: string, documentId: string): Promise<void> {
  await deleteDoc(doc(db, 'clubs', clubId, 'documents', documentId));
}

// ==================== CLUBS (extended) ====================

export async function deleteClub(clubId: string): Promise<void> {
  await deleteDoc(doc(db, 'clubs', clubId));
}

// ==================== INVOICES (extended) ====================

export async function getInvoice(clubId: string, invoiceId: string): Promise<Invoice | null> {
  const invoiceDoc = await getDoc(doc(db, 'clubs', clubId, 'invoices', invoiceId));
  return invoiceDoc.exists() ? (invoiceDoc.data() as Invoice) : null;
}

export async function updateInvoice(clubId: string, invoiceId: string, data: Partial<Invoice>): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId, 'invoices', invoiceId), data);
}

// ==================== EVENTS (extended) ====================

export async function getEvent(clubId: string, eventId: string): Promise<Event | null> {
  const eventDoc = await getDoc(doc(db, 'clubs', clubId, 'events', eventId));
  return eventDoc.exists() ? (eventDoc.data() as Event) : null;
}

export async function updateEvent(clubId: string, eventId: string, data: Partial<Event>): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId, 'events', eventId), data);
}

export async function deleteEvent(clubId: string, eventId: string): Promise<void> {
  await deleteDoc(doc(db, 'clubs', clubId, 'events', eventId));
}

// ==================== PAYMENTS (extended) ====================

export async function cancelPayment(clubId: string, paymentId: string): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId, 'payments', paymentId), {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });
}

export async function getPayment(clubId: string, paymentId: string): Promise<Payment | null> {
  const paymentDoc = await getDoc(doc(db, 'clubs', clubId, 'payments', paymentId));
  return paymentDoc.exists() ? (paymentDoc.data() as Payment) : null;
}

// ==================== NOTIFICATIONS ====================

export async function getNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50),
  ];
  if (unreadOnly) {
    constraints.splice(1, 0, where('read', '==', false));
  }
  const q = query(collection(db, 'notifications'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as Notification);
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await deleteDoc(doc(db, 'notifications', notificationId));
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats(clubId: string): Promise<DashboardStats> {
  const [membersSnap, paymentsSnap] = await Promise.all([
    getDocs(collection(db, 'clubs', clubId, 'members')),
    getDocs(collection(db, 'clubs', clubId, 'payments')),
  ]);

  const members = membersSnap.docs.map(d => d.data() as Member);
  const payments = paymentsSnap.docs.map(d => d.data() as Payment);

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.isActive).length;

  const paidPayments = payments.filter(p => p.status === 'paid');
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  const overduePayments = payments.filter(p => p.status === 'overdue').length;

  const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDue = payments.filter(p => p.status !== 'cancelled' && p.status !== 'refunded').length;
  const collectionRate = totalDue > 0 ? Math.round((paidPayments.length / totalDue) * 100) : 0;

  const recentPayments = payments
    .sort((a, b) => {
      const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    })
    .slice(0, 5) as Payment[];

  const monthlyRevenue = getMonthlyRevenueFromPayments(paidPayments, 12);

  return {
    totalMembers,
    activeMembers,
    totalRevenue,
    pendingPayments,
    overduePayments,
    collectionRate,
    recentPayments,
    monthlyRevenue,
  };
}

function getMonthlyRevenueFromPayments(
  paidPayments: Payment[],
  months: number
): { month: string; amount: number }[] {
  const now = new Date();
  const result: { month: string; amount: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const label = date.toLocaleDateString('es-CL', { month: 'short' });

    const amount = paidPayments
      .filter(p => {
        if (!p.paidAt) return false;
        const paidDate = p.paidAt instanceof Timestamp ? p.paidAt.toDate() : new Date(p.paidAt as unknown as string);
        return paidDate.getFullYear() === year && paidDate.getMonth() === month;
      })
      .reduce((sum, p) => sum + p.amount, 0);

    result.push({ month: label, amount });
  }

  return result;
}

export async function getRecentPayments(clubId: string, count = 10): Promise<Payment[]> {
  const q = query(
    collection(db, 'clubs', clubId, 'payments'),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Payment));
}

// ==================== COURTS ====================

export async function getCourts(clubId: string): Promise<Court[]> {
  const snapshot = await getDocs(collection(db, 'clubs', clubId, 'courts'));
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Court));
}

export async function addCourt(clubId: string, data: Omit<Court, 'id'>): Promise<string> {
  const courtRef = doc(collection(db, 'clubs', clubId, 'courts'));
  await setDoc(courtRef, {
    ...data,
    id: courtRef.id,
  });
  return courtRef.id;
}

export async function updateCourt(clubId: string, courtId: string, data: Partial<Court>): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId, 'courts', courtId), data);
}

export async function deleteCourt(clubId: string, courtId: string): Promise<void> {
  await deleteDoc(doc(db, 'clubs', clubId, 'courts', courtId));
}

// ==================== BOOKINGS ====================

export async function getBookings(clubId: string, constraints: QueryConstraint[] = []): Promise<Booking[]> {
  const q = query(collection(db, 'clubs', clubId, 'bookings'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Booking));
}

export async function addBooking(clubId: string, data: Omit<Booking, 'id' | 'createdAt'>): Promise<string> {
  const bookingRef = doc(collection(db, 'clubs', clubId, 'bookings'));
  await setDoc(bookingRef, {
    ...data,
    id: bookingRef.id,
    createdAt: serverTimestamp(),
  });
  return bookingRef.id;
}

export async function updateBooking(clubId: string, bookingId: string, data: Partial<Booking>): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId, 'bookings', bookingId), data);
}

export async function deleteBooking(clubId: string, bookingId: string): Promise<void> {
  await deleteDoc(doc(db, 'clubs', clubId, 'bookings', bookingId));
}

// ==================== MATCHES ====================

export async function getMatches(clubId: string, constraints: QueryConstraint[] = []): Promise<Match[]> {
  const q = query(collection(db, 'clubs', clubId, 'matches'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Match));
}

export async function createMatch(clubId: string, userId: string, data: Omit<Match, 'id' | 'createdAt' | 'createdBy' | 'paymentIds'>): Promise<string> {
  const matchRef = doc(collection(db, 'clubs', clubId, 'matches'));
  await setDoc(matchRef, {
    ...data,
    id: matchRef.id,
    paymentIds: [],
    createdAt: serverTimestamp(),
    createdBy: userId,
  });
  return matchRef.id;
}

export async function createMatchWithPayments(
  clubId: string,
  userId: string,
  matchData: Omit<Match, 'id' | 'createdAt' | 'createdBy' | 'paymentIds' | 'participants' | 'participantNames'>,
  members: Member[]
): Promise<string> {
  const batch = writeBatch(db);
  
  // Filter members by category
  const eligibleMembers = members.filter(m => 
    m.isActive && 
    m.category && 
    (matchData.category === 'mixto' || m.category === matchData.category)
  );

  const matchRef = doc(collection(db, 'clubs', clubId, 'matches'));
  const matchId = matchRef.id;
  
  const paymentIds: string[] = [];
  const participants: string[] = [];
  const participantNames: string[] = [];

  // Create payments for each eligible member
  for (const member of eligibleMembers) {
    const paymentRef = doc(collection(db, 'clubs', clubId, 'payments'));
    const paymentId = paymentRef.id;
    
    batch.set(paymentRef, {
      id: paymentId,
      clubId,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      amount: matchData.cost,
      currency: 'CLP',
      concept: matchData.title,
      description: matchData.description || '',
      status: 'pending',
      method: 'transfer',
      dueDate: matchData.date,
      isRecurring: false,
      matchId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    paymentIds.push(paymentId);
    participants.push(member.id);
    participantNames.push(`${member.firstName} ${member.lastName}`);
  }

  // Create the match
  batch.set(matchRef, {
    ...matchData,
    id: matchId,
    participants,
    participantNames,
    paymentIds,
    createdAt: serverTimestamp(),
    createdBy: userId,
  });

  await batch.commit();
  return matchId;
}

export async function createBulkMatches(
  clubId: string,
  userId: string,
  matches: Array<Omit<Match, 'id' | 'createdAt' | 'createdBy' | 'paymentIds' | 'participants' | 'participantNames'>>,
  members: Member[]
): Promise<string[]> {
  const matchIds: string[] = [];
  
  for (const matchData of matches) {
    const matchId = await createMatchWithPayments(clubId, userId, matchData, members);
    matchIds.push(matchId);
  }
  
  return matchIds;
}

export async function updateMatch(clubId: string, matchId: string, data: Partial<Match>): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId, 'matches', matchId), data);
}

export async function deleteMatch(clubId: string, matchId: string): Promise<void> {
  // Delete associated payments
  const matchDoc = await getDoc(doc(db, 'clubs', clubId, 'matches', matchId));
  if (matchDoc.exists()) {
    const match = matchDoc.data() as Match;
    const batch = writeBatch(db);
    
    for (const paymentId of match.paymentIds || []) {
      batch.delete(doc(db, 'clubs', clubId, 'payments', paymentId));
    }
    
    batch.delete(doc(db, 'clubs', clubId, 'matches', matchId));
    await batch.commit();
  }
}

// ==================== DIVISIONS ====================

export async function getDivisions(clubId: string): Promise<Division[]> {
  const q = query(
    collection(db, 'clubs', clubId, 'divisions'),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Division));
}

export async function createDivision(clubId: string, data: Omit<Division, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const divisionRef = doc(collection(db, 'clubs', clubId, 'divisions'));
  await setDoc(divisionRef, {
    ...data,
    id: divisionRef.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return divisionRef.id;
}

export async function updateDivision(clubId: string, divisionId: string, data: Partial<Division>): Promise<void> {
  await updateDoc(doc(db, 'clubs', clubId, 'divisions', divisionId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDivision(clubId: string, divisionId: string): Promise<void> {
  await deleteDoc(doc(db, 'clubs', clubId, 'divisions', divisionId));
}

export async function createDefaultDivisions(clubId: string): Promise<void> {
  const defaultDivisions = [
    { name: 'Maxi Blanco', color: '#FFFFFF', order: 1 },
    { name: 'Maxi Azul', color: '#3B82F6', order: 2 },
    { name: 'Segunda', color: '#10B981', order: 3 },
    { name: 'Primera', color: '#F59E0B', order: 4 },
  ];

  const batch = writeBatch(db);
  
  for (const div of defaultDivisions) {
    const divRef = doc(collection(db, 'clubs', clubId, 'divisions'));
    batch.set(divRef, {
      id: divRef.id,
      clubId,
      name: div.name,
      color: div.color,
      order: div.order,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  await batch.commit();
}
