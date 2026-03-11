// components/profile/ProfilePageClient.tsx
"use client";
import { useState } from "react";
import { ProfileEditModal } from "./ProfileEditModal";
import { Button } from "../ui/button";
import { Pencil } from "lucide-react";

interface ProfilePageClientProps {
  userId: number;
  userData: {
    username: string;
    name: string;
    role: string;
  };
  profileData?: {
    email?: string;
    mobile?: string;
    fatherName?: string;
    motherName?: string;
    address?: string;
    gender?: string;
    class?: string;
    batch?: { id: number; name: string; code?: number };
    school?: { id: number; name: string };
  } | null;
}

export function ProfilePageClient({ 
  userId, 
  userData, 
  profileData 
}: ProfilePageClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => {
          console.log("Opening modal with:", { userId, userData, profileData });
          setIsEditModalOpen(true);
        }}
        className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm"
      >
        <Pencil className="h-4 w-4" />
        Edit Profile
      </Button>

      <ProfileEditModal
        userId={userId}
        initialData={{
          username: userData.username,
          name: userData.name,
          email: profileData?.email || "",
          mobile: profileData?.mobile || "",
          fatherName: profileData?.fatherName || "",
          motherName: profileData?.motherName || "",
          address: profileData?.address || "",
        }}
        role={userData.role}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}