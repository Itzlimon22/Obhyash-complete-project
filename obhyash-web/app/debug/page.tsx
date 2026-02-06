'use client';
import { useEffect, useState } from 'react';
import { getUserProfile, getSubjects } from '@/services/database';

export default function DebugPage() {
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await getUserProfile('me');
        setUser(u);
        if (u) {
          console.log('User found:', u);
          const s = await getSubjects(u.division, u.stream, u.optional_subject);
          console.log('Subjects fetched:', s);
          setSubjects(s);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-10">Loading Debug Info...</div>;

  return (
    <div className="p-10 font-mono text-sm space-y-8">
      <h1 className="text-xl font-bold">Debug Info</h1>

      <section className="border p-4 rounded bg-slate-50">
        <h2 className="font-bold mb-2">User Profile (getUserProfile('me'))</h2>
        <pre className="whitespace-pre-wrap break-all">
          {JSON.stringify(user, null, 2)}
        </pre>
        {user && (
          <div className="mt-4 p-2 bg-yellow-100">
            <div>
              <strong>Division Sent to getSubjects:</strong>{' '}
              {JSON.stringify(user.division)}
            </div>
            <div>
              <strong>Stream Sent to getSubjects:</strong>{' '}
              {JSON.stringify(user.stream)}
            </div>
            <div>
              <strong>Optional Subject Sent:</strong>{' '}
              {JSON.stringify(user.optional_subject)}
            </div>
          </div>
        )}
      </section>

      <section className="border p-4 rounded bg-slate-50">
        <h2 className="font-bold mb-2">
          Filtered Subjects (getSubjects(division, stream, optional))
        </h2>
        <div className="mb-2 font-bold">Total Count: {subjects.length}</div>
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-slate-200">
              <th className="border p-1">ID</th>
              <th className="border p-1">Name</th>
              <th className="border p-1">Division (DB)</th>
              <th className="border p-1">Stream (DB)</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s, i) => (
              <tr
                key={i}
                className={
                  s.division !== user?.division && s.division !== 'General'
                    ? 'bg-red-100'
                    : ''
                }
              >
                <td className="border p-1">{s.id}</td>
                <td className="border p-1">{s.name_en || s.name}</td>
                <td className="border p-1">{s.division}</td>
                <td className="border p-1">{s.stream}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
