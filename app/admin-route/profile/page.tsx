// app/admin-route/profile/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserProfileAction } from "@/app/actions/registration";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { ProfileEditFormInner } from "@/components/profile/ProfileEditFormInner";
import { User, GraduationCap, Users } from "lucide-react";

export default async function ProfilePage() {

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id);
  const profileData = await getUserProfileAction(userId);

  if (!profileData) {
    return (
      <div className="py-6 px-4 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Profile</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-red-500">Failed to load profile data.</p>
        </div>
      </div>
    );
  }

  const { user, profile } = profileData;

  const roleIcon =
    user.role === "TEACHER"
      ? <GraduationCap className="h-5 w-5" />
      : user.role === "STUDENT"
      ? <Users className="h-5 w-5" />
      : <User className="h-5 w-5" />;

  return (
    <div className="py-6 px-4 md:px-0">

      <h1 className="text-2xl md:text-3xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Profile Info */}
        <div className="bg-white p-6 rounded-lg shadow">

          <div className="flex items-center gap-3 mb-6">
            {roleIcon}
            <h2 className="text-xl font-bold">Account Information</h2>
          </div>

          <div className="space-y-4">

            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Username</span>
              <span className="font-medium">{user.username}</span>
            </div>

            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Role</span>
              <span className="font-medium capitalize">{user.role.toLowerCase()}</span>
            </div>

            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{user.name}</span>
            </div>

            {profile && (
              <>
                {profile.mobile && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Mobile</span>
                    <span className="font-medium">{profile.mobile}</span>
                  </div>
                )}

                {profile.email && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{profile.email}</span>
                  </div>
                )}

                {profile.fatherName && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Father's Name</span>
                    <span className="font-medium">{profile.fatherName}</span>
                  </div>
                )}

                {profile.motherName && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Mother's Name</span>
                    <span className="font-medium">{profile.motherName}</span>
                  </div>
                )}

                {profile.address && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Address</span>
                    <span className="font-medium">{profile.address}</span>
                  </div>
                )}

                {profile.class && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Class</span>
                    <span className="font-medium">{profile.class}</span>
                  </div>
                )}

                {profile.batch && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Batch</span>
                    <span className="font-medium">{profile.batch.name}</span>
                  </div>
                )}

                {profile.school && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">School</span>
                    <span className="font-medium">{profile.school.name}</span>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-6">Change Password</h2>
          <PasswordChangeForm userId={userId} />
        </div>

      </div>

      {/* Edit Profile Form */}
      {(user.role === "TEACHER" || user.role === "STUDENT") && profile && (
        <div className="mt-6">

          <ProfileEditFormInner
            userId={userId}
            role={user.role}
            onClose={() => {}}
            initialData={{
              username: user.username,
              name: user.name,
              email: profile.email || "",
              mobile: profile.mobile || "",
              fatherName: profile.fatherName || "",
              motherName: profile.motherName || "",
              address: profile.address || "",
            }}
          />

        </div>
      )}

    </div>
  );
}