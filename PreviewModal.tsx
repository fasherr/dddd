export interface CalendarEvent {
  summary: string;
  start: string;
  end?: string;
  location?: string;
  description?: string;
  status?: string;
}

export function parseICS(icsContent: string): CalendarEvent[] {
  // Unfold folded lines (RFC 5545 specifies that lines starting with space or tab continue the previous line)
  const unfolded = icsContent.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const events: CalendarEvent[] = [];

  let inEvent = false;
  let current: Partial<CalendarEvent> = {};

  for (const raw of lines) {
    const line = raw.trim();
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
    } else if (line === 'END:VEVENT') {
      if (inEvent && current.summary) {
        events.push({
          summary: current.summary,
          start: current.start || 'N/A',
          end: current.end,
          location: current.location,
          description: current.description,
          status: current.status,
        });
      }
      inEvent = false;
    } else if (inEvent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const keyPart = line.substring(0, colonIdx);
      const val = line.substring(colonIdx + 1).replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
      const propName = keyPart.split(';')[0].toUpperCase();

      if (propName === 'SUMMARY') {
        current.summary = val;
      } else if (propName === 'DTSTART') {
        current.start = formatIcsDate(val);
      } else if (propName === 'DTEND') {
        current.end = formatIcsDate(val);
      } else if (propName === 'LOCATION') {
        current.location = val;
      } else if (propName === 'DESCRIPTION') {
        current.description = val;
      } else if (propName === 'STATUS') {
        current.status = val;
      }
    }
  }

  return events;
}

function formatIcsDate(raw: string): string {
  // 20260906T123000Z or 20260906
  const clean = raw.trim();
  if (clean.length === 8 && /^\d{8}$/.test(clean)) {
    return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`;
  }
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
  }
  return clean;
}

export function icsToCSV(events: CalendarEvent[]): string {
  const headers = ['Summary', 'Start', 'End', 'Location', 'Description', 'Status'];
  const rows = events.map(e => [
    `"${(e.summary || '').replace(/"/g, '""')}"`,
    `"${(e.start || '').replace(/"/g, '""')}"`,
    `"${(e.end || '').replace(/"/g, '""')}"`,
    `"${(e.location || '').replace(/"/g, '""')}"`,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    `"${(e.status || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function icsToMarkdown(events: CalendarEvent[]): string {
  const lines: string[] = ['# Calendar Agenda\n'];
  for (const e of events) {
    lines.push(`### ${e.summary}`);
    lines.push(`- **When**: ${e.start}${e.end ? ' -> ' + e.end : ''}`);
    if (e.location) lines.push(`- **Where**: ${e.location}`);
    if (e.status) lines.push(`- **Status**: ${e.status}`);
    if (e.description) lines.push(`- **Details**:\n  > ${e.description.replace(/\n/g, '\n  > ')}`);
    lines.push('');
  }
  return lines.join('\n');
}

// vCard (VCF)
export interface Contact {
  name: string;
  phone?: string;
  email?: string;
  organization?: string;
  title?: string;
  note?: string;
}

export function parseVCF(vcfContent: string): Contact[] {
  const unfolded = vcfContent.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const contacts: Contact[] = [];

  let inCard = false;
  let cur: Partial<Contact> = {};

  for (const raw of lines) {
    const line = raw.trim();
    if (line === 'BEGIN:VCARD') {
      inCard = true;
      cur = {};
    } else if (line === 'END:VCARD') {
      if (inCard && (cur.name || cur.phone || cur.email)) {
        contacts.push({
          name: cur.name || 'Unnamed Contact',
          phone: cur.phone,
          email: cur.email,
          organization: cur.organization,
          title: cur.title,
          note: cur.note,
        });
      }
      inCard = false;
    } else if (inCard) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const keyPart = line.substring(0, colonIdx);
      const val = line.substring(colonIdx + 1).replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');
      const prop = keyPart.split(';')[0].toUpperCase();

      if (prop === 'FN') {
        cur.name = val;
      } else if (prop === 'N' && !cur.name) {
        const parts = val.split(';').filter(Boolean);
        cur.name = parts.reverse().join(' ').trim();
      } else if (prop === 'TEL') {
        cur.phone = cur.phone ? `${cur.phone}; ${val}` : val;
      } else if (prop === 'EMAIL') {
        cur.email = cur.email ? `${cur.email}; ${val}` : val;
      } else if (prop === 'ORG') {
        cur.organization = val;
      } else if (prop === 'TITLE') {
        cur.title = val;
      } else if (prop === 'NOTE') {
        cur.note = val;
      }
    }
  }

  return contacts;
}

export function vcfToCSV(contacts: Contact[]): string {
  const headers = ['Full Name', 'Phone', 'Email', 'Organization', 'Job Title', 'Note'];
  const rows = contacts.map(c => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.phone || '').replace(/"/g, '""')}"`,
    `"${(c.email || '').replace(/"/g, '""')}"`,
    `"${(c.organization || '').replace(/"/g, '""')}"`,
    `"${(c.title || '').replace(/"/g, '""')}"`,
    `"${(c.note || '').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function vcfToJSON(contacts: Contact[]): string {
  return JSON.stringify(contacts, null, 2);
}
