import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Role } from '../types/auth';

export const useRoleManager = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "roles"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedRoles: Role[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRoles.push({ id: doc.id, ...doc.data() } as Role);
      });
      setRoles(fetchedRoles);
    } catch (err: any) {
      console.error("Error fetching roles:", err);
      setError("রোল লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const createRole = async (name: string, description: string, permissions: string[]) => {
    try {
      const docRef = await addDoc(collection(db, "roles"), {
        name,
        description,
        permissions,
        createdAt: serverTimestamp()
      });
      await fetchRoles(); // Refresh list
      return docRef.id;
    } catch (err: any) {
      console.error("Error creating role:", err);
      throw new Error("রোল তৈরি করতে সমস্যা হয়েছে।");
    }
  };

  const updateRole = async (id: string, name: string, description: string, permissions: string[]) => {
    try {
      const roleRef = doc(db, "roles", id);
      await updateDoc(roleRef, {
        name,
        description,
        permissions
      });
      await fetchRoles(); // Refresh list
      return true;
    } catch (err: any) {
      console.error("Error updating role:", err);
      throw new Error("রোল আপডেট করতে সমস্যা হয়েছে।");
    }
  };

  const deleteRole = async (roleId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এই রোলটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "roles", roleId));
      setRoles(prev => prev.filter(r => r.id !== roleId));
    } catch (err: any) {
      console.error("Error deleting role:", err);
      alert("রোল মুছতে সমস্যা হয়েছে।");
    }
  };

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refreshRoles: fetchRoles
  };
};