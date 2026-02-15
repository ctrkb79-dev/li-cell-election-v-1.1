import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AppUser } from '../types/auth';

export const useUserManager = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: AppUser[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as AppUser);
      });
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("ইউজার তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const createUser = async (user: Omit<AppUser, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, "users"), {
        ...user,
        createdAt: serverTimestamp()
      });
      await fetchUsers(); // Refresh list
      return true;
    } catch (err: any) {
      console.error("Error creating user:", err);
      throw new Error("ইউজার তৈরি করতে সমস্যা হয়েছে।");
    }
  };

  const updateUser = async (id: string, data: Partial<AppUser>) => {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, data);
      await fetchUsers(); // Refresh list
      return true;
    } catch (err: any) {
      console.error("Error updating user:", err);
      throw new Error("ইউজার আপডেট করতে সমস্যা হয়েছে।");
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিত যে এই ইউজারকে মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      console.error("Error deleting user:", err);
      alert("ইউজার মুছতে সমস্যা হয়েছে।");
    }
  };

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers
  };
};