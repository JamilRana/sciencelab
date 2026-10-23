import { Metadata } from "next";
import { getCurrentSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getLiveDatabaseStats, listStoredBackups } from "@/lib/services/backup-service";
import { BackupManager } from "@/components/backup/BackupManager";

export const metadata: Metadata = {
  title: "Database Backup & Restore | ScienceLab",
  description: "Create snapshots and restore database records safely",
};

export const dynamic = "force-dynamic";

export default async function BackupPage() {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin-route/dashboard");
  }

  const [stats, backups] = await Promise.all([
    getLiveDatabaseStats(),
    listStoredBackups(),
  ]);

  return (
    <div className="py-6 px-4 md:px-6">
      <BackupManager
        initialStats={stats}
        initialBackups={backups}
        currentUsername={session.user.name || session.user.username || "Admin"}
      />
    </div>
  );
}
