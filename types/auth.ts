
export interface Permission {
  id: string;
  label: string;
  description: string;
}

export interface Role {
  id?: string;
  name: string;
  description: string;
  permissions: string[]; // Array of permission IDs
  createdAt?: any;
}

export interface AppUser {
  id?: string;
  displayName: string;
  email: string;
  password?: string; // Added password field
  phone?: string;
  roleId: string; // Links to Role ID
  createdAt?: any;
}

export const AVAILABLE_PERMISSIONS: Permission[] = [
  // Menu Access Permissions
  { id: 'view_menu_dashboard', label: 'মেনু: ড্যাশবোর্ড', description: 'ড্যাশবোর্ড পেজ দেখার অনুমতি' },
  { id: 'view_menu_entry', label: 'মেনু: ডাটা এন্ট্রি', description: 'ডাটা এন্ট্রি পেজ দেখার অনুমতি' },
  { id: 'view_menu_results', label: 'মেনু: ফলাফল', description: 'ফলাফল তালিকা দেখার অনুমতি' },
  { id: 'view_menu_winners', label: 'মেনু: বিজয়ী', description: 'বিজয়ী তালিকা দেখার অনুমতি' },
  { id: 'view_menu_map', label: 'মেনু: ম্যাপ', description: 'মানচিত্র দেখার অনুমতি' },
  { id: 'view_menu_news', label: 'মেনু: লাইভ নিউজ', description: 'লাইভ নিউজ আপডেট দেখার অনুমতি' },
  { id: 'view_menu_admin', label: 'মেনু: এডমিন', description: 'এডমিন প্যানেল এক্সেস করার অনুমতি' },

  // Action Permissions
  { id: 'manage_entry', label: 'ডাটা এডিট', description: 'ভোটের সংখ্যা এন্ট্রি এবং আপডেট করার অনুমতি' },
  { id: 'manage_winner', label: 'বিজয় ঘোষণা', description: 'কাউকে বিজয়ী ঘোষণা বা বাতিল করার অনুমতি (চেকবক্স)' },
  { id: 'suspend_seat', label: 'আসন স্থগিত', description: 'কোনো আসনের ফলাফল স্থগিত/চালু করার অনুমতি' },
  { id: 'delete_data', label: 'ডাটা মুছে ফেলা', description: 'ডাটাবেস থেকে তথ্য মুছে ফেলার অনুমতি (Sensitive)' },
  
  // Management Permissions
  { id: 'manage_roles', label: 'রোল ম্যানেজমেন্ট', description: 'নতুন রোল তৈরি এবং পারমিশন ঠিক করার অনুমতি' },
  { id: 'manage_users', label: 'ইউজার ম্যানেজমেন্ট', description: 'নতুন ইউজার তৈরি এবং রোল এসাইন করার অনুমতি' },
];
