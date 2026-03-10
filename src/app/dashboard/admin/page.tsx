'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Club, UserRole } from '@/types';
import { ArrowLeft, Users, UserPlus, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string | null;
}

interface ClubMember {
  id: string;
  userId: string;
  clubId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export default function AdminPage() {
  const { user, isSuperAdmin, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<FirebaseUser[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [memberships, setMemberships] = useState<ClubMember[]>([]);

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [isSuperAdmin, loading, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers();
      loadClubs();
      loadMemberships();
    }
  }, [isSuperAdmin]);

  const loadUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs.map(d => ({
        uid: d.id,
        email: d.data().email || '',
        displayName: d.data().displayName || null,
      }));
      setUsers(usersList);
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Error al cargar usuarios');
    }
  };

  const loadClubs = async () => {
    try {
      const clubsSnap = await getDocs(collection(db, 'clubs'));
      const clubsList = clubsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Club));
      setClubs(clubsList);
    } catch (err) {
      console.error('Error loading clubs:', err);
      toast.error('Error al cargar clubs');
    }
  };

  const loadMemberships = async () => {
    try {
      const clubsSnap = await getDocs(collection(db, 'clubs'));
      const allMembers: ClubMember[] = [];
      
      for (const clubDoc of clubsSnap.docs) {
        const membersSnap = await getDocs(collection(db, 'clubs', clubDoc.id, 'members'));
        membersSnap.docs.forEach(memberDoc => {
          allMembers.push({
            id: memberDoc.id,
            clubId: clubDoc.id,
            ...memberDoc.data(),
          } as ClubMember);
        });
      }
      
      setMemberships(allMembers);
    } catch (err) {
      console.error('Error loading memberships:', err);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedClub || !firstName || !lastName) {
      toast.error('Completa todos los campos');
      return;
    }

    setSubmitting(true);
    try {
      const selectedUserData = users.find(u => u.uid === selectedUser);
      if (!selectedUserData) {
        toast.error('Usuario no encontrado');
        return;
      }

      await setDoc(doc(db, 'clubs', selectedClub, 'members', selectedUser), {
        id: selectedUser,
        userId: selectedUser,
        clubId: selectedClub,
        firstName,
        lastName,
        email: selectedUserData.email,
        role: selectedRole,
        joinedAt: serverTimestamp(),
        isActive: true,
        balance: 0,
      });

      toast.success(`Usuario asignado como ${selectedRole}`);
      setSelectedUser('');
      setFirstName('');
      setLastName('');
      loadMemberships();
    } catch (err: any) {
      console.error('Error assigning user:', err);
      toast.error(err.message || 'Error al asignar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (clubId: string, userId: string) => {
    if (!confirm('¿Eliminar esta membresía?')) return;

    try {
      await deleteDoc(doc(db, 'clubs', clubId, 'members', userId));
      toast.success('Membresía eliminada');
      loadMemberships();
    } catch (err) {
      console.error('Error removing membership:', err);
      toast.error('Error al eliminar membresía');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-500 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-sm text-gray-500">Asigna usuarios a clubs con roles específicos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assign User Form */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Asignar Usuario a Club
            </h2>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuario</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecciona un usuario</option>
                  {users.map(u => (
                    <option key={u.uid} value={u.uid}>
                      {u.email} {u.displayName ? `(${u.displayName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-field"
                    placeholder="Juan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-field"
                    placeholder="Pérez"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Club</label>
                <select
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecciona un club</option>
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="input-field"
                  required
                >
                  <option value="owner">Owner (Dueño)</option>
                  <option value="admin">Admin (Administrador)</option>
                  <option value="member">Member (Socio)</option>
                  <option value="parent">Parent (Apoderado)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50"
              >
                {submitting ? 'Asignando...' : 'Asignar Usuario'}
              </button>
            </form>
          </div>

          {/* Current Memberships */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Membresías Actuales
            </h2>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {memberships.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No hay membresías asignadas</p>
              ) : (
                memberships.map(m => {
                  const club = clubs.find(c => c.id === m.clubId);
                  const roleColors: Record<UserRole, string> = {
                    owner: 'bg-purple-100 text-purple-700',
                    admin: 'bg-blue-100 text-blue-700',
                    member: 'bg-green-100 text-green-700',
                    parent: 'bg-orange-100 text-orange-700',
                  };

                  return (
                    <div key={`${m.clubId}-${m.userId}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {m.firstName} {m.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{m.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-600">{club?.name || m.clubId}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[m.role]}`}>
                            {m.role}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(m.clubId, m.userId)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar membresía"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
