import { getSupabase } from './supabase';
import { getSiteId } from '../constants/site';

export type RemoteTicket = {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  qrValue: string;
  colors: [string, string];
};

export type RemoteAgent = {
  name: string;
  subtitle: string;
  avatarUrl: string;
  whatsappUrl: string;
};

export type RemoteOffice = {
  name: string;
  address: string;
  hours: string;
};

export type RemoteFAQ = {
  q: string;
  a: string;
};

const normalizeColors = (value: unknown): [string, string] | null => {
  if (Array.isArray(value) && value.length >= 2) {
    const a = String(value[0] ?? '').trim();
    const b = String(value[1] ?? '').trim();
    if (a && b) return [a, b];
  }
  return null;
};

export const fetchWalletTickets = async (customerEmail: string): Promise<RemoteTicket[]> => {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured, returning empty tickets');
    return [];
  }
  const siteId = getSiteId();
  const email = customerEmail.trim().toLowerCase();

  if (!email) return [];

  const { data, error } = await supabase
    .from('user_tickets')
    .select('id,title,date,time,guests,total_price,qr_value,site_id,colors')
    .eq('site_id', siteId)
    .eq('customer_email', email)
    .order('date', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data
    .map((row: any) => {
      const id = String(row.id ?? '').trim();
      const title = String(row.title ?? '').trim();
      const guests = row.guests != null ? String(row.guests).trim() : '';
      const totalPrice = row.total_price != null ? String(row.total_price).trim() : '';
      const subtitleParts = [
        guests ? `${guests} guests` : null,
        totalPrice ? `€${totalPrice}` : null,
      ].filter(Boolean);
      const subtitle = subtitleParts.join(' • ');

      const date = String(row.date ?? '').trim();
      const time = String(row.time ?? '').trim();
      const dateLabel = [date, time].filter(Boolean).join(' • ');
      const qrValue = String(row.qr_value ?? '').trim();
      const colors = normalizeColors(row.colors) ?? ['#111111', '#2D2D2D'];

      if (!id || !title || !qrValue) return null;
      return { id, title, subtitle, dateLabel, qrValue, colors };
    })
    .filter(Boolean) as RemoteTicket[];
};

export const fetchConcierge = async (): Promise<{
  agent: RemoteAgent | null;
  offices: RemoteOffice[];
  faqs: RemoteFAQ[];
}> => {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured, returning empty concierge data');
    return { agent: null, offices: [], faqs: [] };
  }
  const siteId = getSiteId();

  const [{ data: agentRows, error: agentError }, { data: officeRows, error: officeError }, { data: faqRows, error: faqError }] =
    await Promise.all([
      supabase
        .from('concierge_agents')
        .select('name,subtitle,avatar_url,whatsapp_url,site_id')
        .eq('site_id', siteId)
        .limit(1),
      supabase
        .from('office_locations')
        .select('name,address,hours,site_id')
        .eq('site_id', siteId)
        .order('name', { ascending: true }),
      supabase
        .from('faqs')
        .select('question,answer,site_id,order_index')
        .eq('site_id', siteId)
        .order('order_index', { ascending: true }),
    ]);

  if (agentError) throw agentError;
  if (officeError) throw officeError;
  if (faqError) throw faqError;

  const agentRow = agentRows?.[0];
  const agent: RemoteAgent | null = agentRow
    ? {
        name: String(agentRow.name ?? '').trim(),
        subtitle: String(agentRow.subtitle ?? '').trim(),
        avatarUrl: String(agentRow.avatar_url ?? '').trim(),
        whatsappUrl: String(agentRow.whatsapp_url ?? '').trim(),
      }
    : null;

  const offices: RemoteOffice[] =
    officeRows?.map((o: any) => ({
      name: String(o.name ?? '').trim(),
      address: String(o.address ?? '').trim(),
      hours: String(o.hours ?? '').trim(),
    })) ?? [];

  const faqs: RemoteFAQ[] =
    faqRows?.map((f: any) => ({
      q: String(f.question ?? '').trim(),
      a: String(f.answer ?? '').trim(),
    })) ?? [];

  return { agent, offices, faqs };
};
