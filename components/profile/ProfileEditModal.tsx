"use client";

import { Modal } from "../ui/Modal";
import { ProfileEditFormInner } from "./ProfileEditFormInner";

interface ProfileEditModalProps {
  userId: number;
  initialData: {
    username: string;
    name: string;
    email?: string;
    mobile?: string;
    fatherName?: string;
    motherName?: string;
    address?: string;
  };
  role: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditModal({
  userId,
  initialData,
  role,
  isOpen,
  onClose,
}: ProfileEditModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      <ProfileEditFormInner
        userId={userId}
        initialData={initialData}
        role={role}
        onClose={onClose}
      />
    </Modal>
  );
}