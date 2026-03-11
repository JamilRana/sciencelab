// components/profile/ProfileView.tsx (updated)
import { getUserProfileAction } from "@/app/actions/registration";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { ProfileField } from "./ProfileField";
import { User, GraduationCap, Users, ShieldCheck, Mail, Phone, MapPin, Building2, Calendar, BookOpen } from "lucide-react";

export async function ProfileView({ userId }: { userId: number }) {
  const profileData = await getUserProfileAction(userId);
  
  if (!profileData) {
    return (
      <div className="py-6 bg-white p-6 rounded-lg shadow border border-red-100">
        <p className="text-red-500 font-medium">Failed to load profile data.</p>
      </div>
    );
  }

  const { user, profile } = profileData;
  const RoleIcon = user.role === "TEACHER" ? GraduationCap : user.role === "STUDENT" ? Users : User;
  const roleColor = user.role === "ADMIN" ? "bg-red-500" : user.role === "TEACHER" ? "bg-emerald-500" : "bg-blue-500";
  const roleBg = user.role === "ADMIN" ? "from-red-50 to-orange-50" : user.role === "TEACHER" ? "from-emerald-50 to-teal-50" : "from-blue-50 to-indigo-50";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="py-6 px-4 md:px-0 space-y-6">
      {/* Header Banner */}
      <div className={`bg-gradient-to-r ${roleBg} rounded-2xl p-6 border border-gray-100`}>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-24 h-24 ${roleColor} rounded-2xl flex items-center justify-center shadow-lg`}>
              <span className="text-3xl font-bold text-white">{getInitials(user.name)}</span>
            </div>
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 ${roleColor} rounded-full flex items-center justify-center border-4 border-white`}>
              <RoleIcon className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600 capitalize">{user.role.toLowerCase()} Account</p>
            <div className="flex flex-wrap gap-4 mt-3">
              {profile?.mobile && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {profile.mobile}
                </div>
              )}
              {profile?.email && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <ProfilePageClient
            userId={userId}
            userData={{
              username: user.username,
              name: user.name,
              role: user.role,
            }}
            profileData={profile}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </p>
                <p className="font-semibold text-gray-900 text-lg">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Username
                </p>
                <p className="font-semibold text-gray-900">{user.username}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Mobile
                </p>
                <p className="font-medium text-gray-900">{profile?.mobile || "Not set"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </p>
                <p className="font-medium text-gray-900">{profile?.email || "Not set"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Gender
                </p>
                <p className="font-medium text-gray-900 capitalize">{profile?.gender || "Not set"}</p>
              </div>
              {profile?.address && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Address
                  </p>
                  <p className="font-medium text-gray-900">{profile.address}</p>
                </div>
              )}
            </div>

            {/* Student Specific */}
            {user.role === "STUDENT" && (
              <>
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    Academic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-blue-600 font-medium">Class</p>
                      <p className="text-xl font-bold text-gray-900">{profile?.class || "N/A"}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <p className="text-sm text-purple-600 font-medium">Batch</p>
                      <p className="text-xl font-bold text-gray-900">{profile?.batch?.name || "N/A"}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-sm text-emerald-600 font-medium">School</p>
                      <p className="text-xl font-bold text-gray-900">{profile?.school?.name || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-pink-600" />
                    Parent Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-pink-50 rounded-xl p-4">
                      <p className="text-sm text-pink-600 font-medium">Father's Name</p>
                      <p className="font-semibold text-gray-900">{profile?.fatherName || "Not set"}</p>
                    </div>
                    <div className="bg-pink-50 rounded-xl p-4">
                      <p className="text-sm text-pink-600 font-medium">Mother's Name</p>
                      <p className="font-semibold text-gray-900">{profile?.motherName || "Not set"}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Teacher Specific */}
            {user.role === "TEACHER" && (
              <>
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    Professional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-blue-600 font-medium">School</p>
                      <p className="font-semibold text-gray-900">{profile?.school?.name || "Not set"}</p>
                    </div>
                    {(profile as any)?.qualification && (
                      <div className="bg-emerald-50 rounded-xl p-4">
                        <p className="text-sm text-emerald-600 font-medium">Qualification</p>
                        <p className="font-semibold text-gray-900">{(profile as any).qualification}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Security Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            </div>
            <div className="p-6">
              <PasswordChangeForm userId={userId} />
            </div>
          </div>

          {/* Quick Stats for Student */}
          {user.role === "STUDENT" && (
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Total Fees</span>
                  <span className="font-bold">৳ 0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Paid</span>
                  <span className="font-bold">৳ 0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100">Due</span>
                  <span className="font-bold">৳ 0</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}