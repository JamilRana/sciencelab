import { Trophy } from "lucide-react";

export default function MeritListTable({ data, results }: any) {

  return (

    <div className="bg-white rounded-xl border overflow-hidden">

      <div className="p-4 border-b">

        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500"/>
          Class Merit List
        </h2>

      </div>

      <table className="w-full text-sm">

        <thead className="bg-gray-50">
          <tr>

            <th className="p-3">Pos</th>
            <th className="p-3">Student</th>
            <th className="p-3">Batch</th>

            {data.subjects.map((s:any)=>(
              <th key={s.id} className="p-3">{s.subject}</th>
            ))}

            <th className="p-3">Total</th>

          </tr>
        </thead>

        <tbody>

          {results.map((r:any)=>(

            <tr key={r.student.id} className={r.isCurrentStudent ? "bg-blue-50" : ""}>

              <td className="p-3 font-bold">
                #{r.position}
              </td>

              <td className="p-3">
                {r.student.name}
              </td>

              <td className="p-3">
                {r.student.batch?.name}
              </td>

              {data.subjects.map((s:any)=>{

                const mark = r.subjectMarks.find((m:any)=>m.subject===s.subject)

                return <td key={s.id} className="p-3 text-center">
                  {mark?.total ?? "-"}
                </td>

              })}

              <td className="p-3 font-bold text-center">
                {r.total}
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}