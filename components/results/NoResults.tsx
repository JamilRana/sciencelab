import Link from "next/link";

export default function NoResults({ examId, isStudent }: { examId: number, isStudent: boolean }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow text-center">
      {isStudent ? (
        <>
      <p className="text-gray-500">No marks entered yet.</p>

      <Link
        href={`/admin-route/exams/${examId}/subjects`}
        className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Enter Marks
      </Link>
      </>
      ) : (
        <p className="text-gray-500">Results will be published soon.</p>
      )}
    </div>
  );
}