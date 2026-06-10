const COLLEGE_DATA = [
  { name: 'ঢাকা কলেজ', search: ['dhaka college', 'dc'] }
];

function searchColleges(query) {
  const q = query.toLowerCase().trim();
  if (q.length === 0) return [];

  const seen = new Set();
  const results = [];

  for (const entry of COLLEGE_DATA) {
    if (seen.has(entry.name)) continue;
    const matches =
      entry.name.toLowerCase().includes(q) ||
      entry.search.some((s) => s.includes(q));
    if (matches) {
      seen.add(entry.name);
      results.push(entry.name);
      if (results.length >= 8) break;
    }
  }

  return results;
}

console.log(searchColleges('ঢাকা কলেজ'));
console.log(searchColleges('ঢাকা'));
console.log(searchColleges('college'));
