import { UserList } from "@/components/UserList";
import { getUsersAction } from "@/app/actions/users";

export default async function UsersPage() {
  const users = await getUsersAction();

  return (
    <div className="py-6 px-4 md:px-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
        <p className="text-gray-500 mt-1">Manage system users and their roles.</p>
      </div>

      <UserList initialUsers={users} />
    </div>
  );
}
