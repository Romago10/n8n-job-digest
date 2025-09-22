// email_template.js — n8n Function node snippet

const items = $input.all();
const rows = items.map((item, i) => {
  const j = item.json;
  return `<tr>
    <td>${i + 1}</td>
    <td><strong>${j.score}/10</strong></td>
    <td><a href="${j.url || '#'}">${j.title || '(no title)'}</a></td>
    <td>${j.company || ''}</td>
    <td>${j.location || 'Remote'}</td>
  </tr>`;
}).join('');

const html = `
  <h2>Job Digest — ${new Date().toLocaleString()}</h2>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>#</th><th>Score</th><th>Role</th><th>Company</th><th>Location</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
`;

return [{
  json: {
    subject: `Job Digest (${items.length} roles)`,
    html
  }
}];
