"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, User, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { DataTable, Column } from "@/components/ui/data-table";
import { UserForm } from "@/components/forms/UserForm";
import { createUserAction, updateUserAction, deleteUserAction, toggleUserAction } from "@/app/actions/users";
import { toast } from "sonner";
import type { Role } from "@/types";

interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
  active: boolean;
}

interface UserListProps {
  initialUsers: User[];
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  STAFF: "bg-blue-100 text-blue-700",
  TEACHER: "bg-purple-100 text-purple-700",
  STUDENT: "bg-green-100 text-green-700",
};

export function UserList({ initialUsers }: UserListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const columns: Column<User>[] = [
    {
      key: "username",
      header: "Username",
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user.username}</p>
            <p className="text-xs text-gray-500">{user.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "name",
      header: "Full Name",
      sortable: true,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (user) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${roleColors[user.role] || "bg-gray-100 text-gray-700"}`}>
          {user.role}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      sortable: true,
      render: (user) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {user.active ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = editingUser
        ? await updateUserAction(editingUser.id, data)
        : await createUserAction(data);

      if (result.success) {
        toast.success(editingUser ? "User updated" : "User created");
        handleClose();
        router.refresh();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const result = await deleteUserAction(id);
      if (result.success) {
        toast.success("User deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const result = await toggleUserAction(id);
      if (result.success) {
        toast.success("User status updated");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update");
      }
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const renderActions = (user: User) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => handleToggle(user.id)}
        className={`p-2 rounded-lg transition-all ${user.active ? "text-red-400 hover:bg-red-50" : "text-green-400 hover:bg-green-50"}`}
        title={user.active ? "Deactivate" : "Activate"}
      >
        {user.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
      </button>
      <button
        onClick={() => handleOpenEdit(user)}
        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button
        onClick={() => handleDelete(user.id)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );

  const filterOptions = [
    {
      key: "role",
      label: "Select Role",
      options: [
        { value: "ADMIN", label: "Admin" },
        { value: "STAFF", label: "Staff" },
        { value: "TEACHER", label: "Teacher" },
        { value: "STUDENT", label: "Student" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add User
        </button>
      </div>

      <DataTable
        data={initialUsers}
        columns={columns}
        searchFields={["username", "name"]}
        placeholder="Search users..."
        pageSize={15}
        renderActions={renderActions}
        filterOptions={filterOptions}
        emptyMessage="No users found"
      />

      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingUser ? "Edit User" : "Add User"}
      >
        <UserForm
          initialData={editingUser || undefined}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </DataModal>
    </div>
  );
}
