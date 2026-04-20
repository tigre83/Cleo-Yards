import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const DataContext = createContext(null);
const COMPANY_ID = "00000000-0000-0000-0000-000000000001";
const STATE_TAX = 6.25;
const EMAIL_API = "https://cleo-yards-emails-production.up.railway.app/api/emails";

/* ── Snake ↔ Camel converters ── */
const toCamel = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  const n = {};
  for (const [k, v] of Object.entries(obj)) {
    const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    n[ck] = v;
  }
  return n;
};

const toSnake = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  const n = {};
  for (const [k, v] of Object.entries(obj)) {
    const sk = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    n[sk] = v;
  }
  return n;
};

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [companyProfile, setCompanyProfile] = useState({ profileComplete: false });
  const [crews, setCrews] = useState([]);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);

  /* ══════════════════════════════════════════════
     LOAD ALL DATA ON MOUNT
     ══════════════════════════════════════════════ */
  useEffect(() => {
    const load = async () => {
      try {
        // Company
        const { data: compData } = await supabase.from("companies").select("*").eq("id", COMPANY_ID).single();
        if (compData) {
          const c = toCamel(compData);
          setCompanyProfile({ ...c, phone: c.phone || "", profileComplete: c.profileComplete || false });
        }

        // Crews
        const { data: crewData } = await supabase.from("crews").select("*").eq("company_id", COMPANY_ID);
        setCrews((crewData || []).map(toCamel));

        // Services
        const { data: svcData } = await supabase.from("services").select("*").eq("company_id", COMPANY_ID).order("category").order("name");
        setServices((svcData || []).map(toCamel));

        // Clients + their services
        const { data: clientData } = await supabase.from("clients").select("*").eq("company_id", COMPANY_ID);
        const { data: csData } = await supabase.from("client_services").select("*");
        const clientsWithSvc = (clientData || []).map(cl => {
          const clCamel = toCamel(cl);
          const svcList = (csData || []).filter(cs => cs.client_id === cl.id).map(cs => ({ serviceId: cs.service_id, qty: cs.qty }));
          return { ...clCamel, services: svcList };
        });
        setClients(clientsWithSvc);

        // Jobs + their services
        const { data: jobData } = await supabase.from("jobs").select("*").eq("company_id", COMPANY_ID).order("date").order("time");
        const { data: jsData } = await supabase.from("job_services").select("*");
        const jobsWithSvc = (jobData || []).map(j => {
          const jCamel = toCamel(j);
          const svcList = (jsData || []).filter(js => js.job_id === j.id).map(js => ({ serviceId: js.service_id, qty: js.qty }));
          return { ...jCamel, serviceIds: svcList, completedServices: j.completed_services || [] };
        });
        setJobs(jobsWithSvc);

        // Invoices + items
        const { data: invData } = await supabase.from("invoices").select("*").eq("company_id", COMPANY_ID).order("date", { ascending: false });
        const { data: iiData } = await supabase.from("invoice_items").select("*");
        const invoicesWithItems = (invData || []).map(inv => {
          const invCamel = toCamel(inv);
          const items = (iiData || []).filter(ii => ii.invoice_id === inv.id).map(toCamel);
          return { ...invCamel, items };
        });
        setInvoices(invoicesWithItems);

        // Auto-mark overdue: sent invoices past due date
        const today = new Date().toISOString().split("T")[0];
        const overdueIds = invoicesWithItems
          .filter(i => i.status === "sent" && i.dueDate && i.dueDate < today)
          .map(i => i.id);
        if (overdueIds.length > 0) {
          setInvoices(prev => prev.map(i => overdueIds.includes(i.id) ? { ...i, status: "overdue" } : i));
          overdueIds.forEach(id => {
            supabase.from("invoices").update({ status: "overdue" }).eq("id", id).then(() => {});
          });
        }

      } catch (err) {
        console.error("DataContext load error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ══════════════════════════════════════════════
     COMPANY PROFILE
     ══════════════════════════════════════════════ */
  const updateCompanyProfile = async (data) => {
    const updated = { ...companyProfile, ...data };
    setCompanyProfile(updated);
    const { profileComplete, createdAt, updatedAt, ...dbData } = updated;
    await supabase.from("companies").update({ ...toSnake(dbData), profile_complete: profileComplete }).eq("id", COMPANY_ID);
  };

  /* ══════════════════════════════════════════════
     CREWS
     ══════════════════════════════════════════════ */
  const addCrew = async (crew) => {
    const { data, error } = await supabase.from("crews").insert({ ...toSnake(crew), company_id: COMPANY_ID }).select().single();
    if (data) {
      const newCrew = toCamel(data);
      setCrews(p => [...p, newCrew]);
      return newCrew;
    }
    return null;
  };

  const updateCrew = async (id, updates) => {
    setCrews(p => p.map(c => c.id === id ? { ...c, ...updates } : c));
    const { createdAt, id: _, companyId, ...dbData } = updates;
    await supabase.from("crews").update(toSnake(dbData)).eq("id", id);
  };

  /* ══════════════════════════════════════════════
     SERVICES
     ══════════════════════════════════════════════ */
  const addService = async (svc) => {
    const { data } = await supabase.from("services").insert({ ...toSnake(svc), company_id: COMPANY_ID }).select().single();
    if (data) {
      const newSvc = toCamel(data);
      setServices(p => [...p, newSvc]);
      return newSvc;
    }
    return null;
  };

  const updateService = async (id, updates) => {
    setServices(p => p.map(s => s.id === id ? { ...s, ...updates } : s));
    const { createdAt, id: _, companyId, ...dbData } = updates;
    await supabase.from("services").update(toSnake(dbData)).eq("id", id);
  };

  /* ══════════════════════════════════════════════
     CLIENTS
     ══════════════════════════════════════════════ */
  const addClient = async (client) => {
    const { services: svcList, ...clientData } = client;
    const cleaned = Object.fromEntries(
      Object.entries(toSnake(clientData)).map(([k, v]) => [k, v === "" ? null : v])
    );
    const { data } = await supabase.from("clients").insert({ ...cleaned, company_id: COMPANY_ID }).select().single();
    if (data) {
      // Insert client_services
      if (svcList?.length) {
        const rows = svcList.filter(s => {
          const qty = typeof s === "object" ? s.qty : 1;
          return qty > 0;
        }).map(s => ({
          client_id: data.id,
          service_id: typeof s === "object" ? s.serviceId : s,
          qty: typeof s === "object" ? s.qty : 1,
        }));
        if (rows.length) await supabase.from("client_services").insert(rows);
      }
      const newClient = { ...toCamel(data), services: svcList || [] };
      setClients(p => [...p, newClient]);
      return newClient;
    }
    return null;
  };

  const updateClient = async (id, updates) => {
    const { services: svcList, ...clientData } = updates;
    setClients(p => p.map(c => c.id === id ? { ...c, ...updates } : c));
    
    const { createdAt, id: _, companyId, ...dbData } = clientData;
    // Clean empty strings to null for date/uuid columns
    const cleaned = Object.fromEntries(
      Object.entries(toSnake(dbData)).map(([k, v]) => [k, v === "" ? null : v])
    );
    await supabase.from("clients").update(cleaned).eq("id", id);
    
    // Update client_services
    if (svcList) {
      await supabase.from("client_services").delete().eq("client_id", id);
      const rows = svcList.filter(s => {
        const qty = typeof s === "object" ? s.qty : 1;
        return qty > 0;
      }).map(s => ({
        client_id: id,
        service_id: typeof s === "object" ? s.serviceId : s,
        qty: typeof s === "object" ? s.qty : 1,
      }));
      if (rows.length) await supabase.from("client_services").insert(rows);
    }
  };

  /* ══════════════════════════════════════════════
     JOBS
     ══════════════════════════════════════════════ */
  const addJob = async (job) => {
    const { serviceIds, ...jobData } = job;
    const { data } = await supabase.from("jobs").insert({
      ...toSnake(jobData),
      company_id: COMPANY_ID,
    }).select().single();
    if (data) {
      // Insert job_services
      if (serviceIds?.length) {
        const rows = serviceIds.map(s => ({
          job_id: data.id,
          service_id: typeof s === "object" ? s.serviceId : s,
          qty: typeof s === "object" ? s.qty : 1,
        }));
        await supabase.from("job_services").insert(rows);
      }
      const newJob = { ...toCamel(data), serviceIds: serviceIds || [] };
      setJobs(p => [...p, newJob]);
      addNotification("job_created", newJob);
      return newJob;
    }
    return null;
  };

  const updateJob = async (id, updates) => {
    setJobs(p => p.map(j => j.id === id ? { ...j, ...updates } : j));
    const { serviceIds, createdAt, id: _, companyId, ...dbData } = updates;
    await supabase.from("jobs").update(toSnake(dbData)).eq("id", id);
  };

  const deleteJob = async (id) => {
    setJobs(p => p.filter(j => j.id !== id));
    await supabase.from("jobs").delete().eq("id", id);
  };

  const getJobsByDate = (date) => jobs.filter(j => j.date === date);
  const getJobsByCrew = (crewId) => jobs.filter(j => j.crewId === crewId);
  const getJobsByClient = (clientId) => jobs.filter(j => j.clientId === clientId);
  const getJobsByWeek = (startDate) => {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 5);
    return jobs.filter(j => {
      const d = new Date(j.date + "T00:00:00");
      return d >= start && d < end;
    });
  };

  const completeJob = async (id) => {
    await updateJob(id, { status: "completed" });
    
    // Check auto-invoicing
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    const client = clients.find(cl => cl.id === job.clientId);
    if (!client) return;

    if (client.billingType === "per_visit") {
      // Immediate invoice for this job
      const jobSvcs = (job.serviceIds || []).map(entry => {
        const sid = typeof entry === "object" ? entry.serviceId : entry;
        const qty = typeof entry === "object" ? entry.qty || 1 : 1;
        const svc = services.find(s => s.id === sid);
        return svc ? { serviceId: sid, name: svc.name, qty, price: svc.price } : null;
      }).filter(Boolean);
      
      const subtotal = jobSvcs.reduce((s, i) => s + i.qty * i.price, 0);
      const taxAmount = subtotal * (STATE_TAX / 100);
      
      const newInv = await addInvoice({
        clientId: client.id,
        invoiceNumber: getNextInvoiceNumber(),
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "sent",
        sentDate: new Date().toISOString().split("T")[0],
        subtotal,
        taxRate: STATE_TAX,
        taxAmount,
        total: subtotal + taxAmount,
        notes: "Service completed " + job.date,
        paymentMethod: client.paymentMethod,
        items: jobSvcs,
      });

      // Send invoice email
      if (newInv?.id && client.email) {
        try {
          await fetch(`${EMAIL_API}/invoice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ company: companyProfile, client, invoice: newInv, items: jobSvcs }),
          });
        } catch (err) { console.error("Auto-invoice email error:", err); }
      }
    } else if (client.billingType === "monthly") {
      // Check if all jobs for this client this month are completed
      const jobDate = new Date(job.date + "T12:00:00");
      const monthStart = new Date(jobDate.getFullYear(), jobDate.getMonth(), 1).toISOString().split("T")[0];
      const monthEnd = new Date(jobDate.getFullYear(), jobDate.getMonth() + 1, 0).toISOString().split("T")[0];
      
      // Get all jobs for this client this month (use updated state)
      const updatedJobs = jobs.map(j => j.id === id ? { ...j, status: "completed" } : j);
      const clientMonthJobs = updatedJobs.filter(j => 
        j.clientId === client.id && j.date >= monthStart && j.date <= monthEnd
      );
      
      const allCompleted = clientMonthJobs.length > 0 && clientMonthJobs.every(j => j.status === "completed" || j.status === "cancelled");
      
      if (allCompleted) {
        // Consolidate all completed jobs into one invoice
        const completedJobs = clientMonthJobs.filter(j => j.status === "completed");
        const allItems = {};
        
        completedJobs.forEach(j => {
          (j.serviceIds || []).forEach(entry => {
            const sid = typeof entry === "object" ? entry.serviceId : entry;
            const qty = typeof entry === "object" ? entry.qty || 1 : 1;
            if (allItems[sid]) {
              allItems[sid].qty += qty;
            } else {
              const svc = services.find(s => s.id === sid);
              if (svc) allItems[sid] = { serviceId: sid, name: svc.name, qty, price: svc.price };
            }
          });
        });
        
        const items = Object.values(allItems);
        const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
        const taxAmount = subtotal * (STATE_TAX / 100);
        const monthName = jobDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        
        const newInv = await addInvoice({
          clientId: client.id,
          invoiceNumber: getNextInvoiceNumber(),
          date: new Date().toISOString().split("T")[0],
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          status: "sent",
          sentDate: new Date().toISOString().split("T")[0],
          subtotal,
          taxRate: STATE_TAX,
          taxAmount,
          total: subtotal + taxAmount,
          notes: monthName + " services",
          paymentMethod: client.paymentMethod,
          items,
        });

        // Send invoice email
        if (newInv?.id && client.email) {
          try {
            await fetch(`${EMAIL_API}/invoice`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ company: companyProfile, client, invoice: newInv, items }),
            });
          } catch (err) { console.error("Auto-invoice email error:", err); }
        }
      }
    }

    // Send job completion email (informational, no prices)
    try {
      if (client?.email) {
        const jobSvcNames = (job.serviceIds || []).map(entry => {
          const sid = typeof entry === "object" ? entry.serviceId : entry;
          const svc = services.find(s => s.id === sid);
          return svc ? { name: svc.name } : null;
        }).filter(Boolean);

        await fetch(`${EMAIL_API}/job-complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: companyProfile,
            client,
            job: { ...job, status: "completed" },
            services: jobSvcNames,
          }),
        });
      }
    } catch (err) {
      console.error("Job complete email error:", err);
    }
  };
  const cancelJob = (id) => updateJob(id, { status: "cancelled" });

  const toggleServiceComplete = async (jobId, serviceId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    
    const completed = [...(job.completedServices || [])];
    const idx = completed.indexOf(serviceId);
    if (idx >= 0) {
      completed.splice(idx, 1);
    } else {
      completed.push(serviceId);
    }
    
    // Update local state
    setJobs(p => p.map(j => j.id === jobId ? { ...j, completedServices: completed } : j));
    
    // Update Supabase
    await supabase.from("jobs").update({ completed_services: completed }).eq("id", jobId);
    
    // Auto-start if first service toggled
    if (completed.length > 0 && job.status === "assigned") {
      await updateJob(jobId, { status: "inProgress" });
    }
    
    // Check if all services are completed
    const allSvcIds = (job.serviceIds || []).map(s => typeof s === "object" ? s.serviceId : s);
    const allDone = allSvcIds.every(sid => completed.includes(sid));
    
    return { completed, allDone };
  };
  const startJob = (id) => updateJob(id, { status: "inProgress" });
  const reassignJob = (id, crewId) => updateJob(id, { crewId });

  /* ══════════════════════════════════════════════
     GENERATE MONTHLY JOBS
     ══════════════════════════════════════════════ */
  const generateMonthlyJobs = async (year, month) => {
    const monthlyClients = clients.filter(cl => cl.billingType === "monthly" && cl.defaultCrewId && cl.status === "active");
    const generated = [];

    const weekdays = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month - 1, d);
      if (dt.getDay() >= 1 && dt.getDay() <= 5) weekdays.push(dt);
    }

    const startHours = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00"];

    monthlyClients.forEach((cl, clIdx) => {
      const svcs = (cl.services || []).map(cs => ({
        serviceId: typeof cs === "string" ? cs : cs.serviceId,
        qty: typeof cs === "string" ? 1 : (cs.qty || 1),
      }));
      if (svcs.length === 0) return;

      // Max qty determines number of visits per month
      const maxVisits = Math.max(...svcs.map(s => s.qty));
      const spacing = Math.max(1, Math.floor(weekdays.length / maxVisits));

      for (let visit = 0; visit < maxVisits; visit++) {
        const dayIdx = Math.min(visit * spacing, weekdays.length - 1);
        const dt = weekdays[dayIdx];
        const dateStr = dt.toISOString().split("T")[0];

        // Services for this visit: include service if visit < its qty
        const visitSvcs = svcs.filter(s => visit < s.qty).map(s => ({ serviceId: s.serviceId, qty: 1 }));
        if (visitSvcs.length === 0) continue;

        // Check if a job already exists for this client on this date
        const exists = jobs.some(j => j.clientId === cl.id && j.date === dateStr);
        if (exists) continue;

        const duration = Math.max(1, Math.round(visitSvcs.length * 0.5 * 10) / 10);
        const time = startHours[clIdx % startHours.length];

        generated.push({
          clientId: cl.id,
          serviceIds: visitSvcs,
          crewId: cl.defaultCrewId,
          date: dateStr,
          time,
          duration,
          status: "assigned",
          notes: "",
          autoGenerated: true,
        });
      }
    });

    // Batch insert to Supabase
    if (generated.length > 0) {
      const jobRows = generated.map(j => ({
        company_id: COMPANY_ID,
        client_id: j.clientId,
        crew_id: j.crewId,
        date: j.date,
        time: j.time,
        duration: j.duration,
        status: j.status,
        notes: j.notes,
        auto_generated: j.autoGenerated,
      }));

      const { data: insertedJobs } = await supabase.from("jobs").insert(jobRows).select();

      if (insertedJobs) {
        // Insert job_services for each
        const jsRows = [];
        insertedJobs.forEach((ij, idx) => {
          (generated[idx].serviceIds || []).forEach(s => {
            jsRows.push({
              job_id: ij.id,
              service_id: typeof s === "object" ? s.serviceId : s,
              qty: typeof s === "object" ? s.qty : 1,
            });
          });
        });
        if (jsRows.length) await supabase.from("job_services").insert(jsRows);

        // Update local state
        const newJobs = insertedJobs.map((ij, idx) => ({
          ...toCamel(ij),
          serviceIds: generated[idx].serviceIds,
        }));
        setJobs(prev => [...prev, ...newJobs]);
      }
    }

    return generated.length;
  };

  /* ══════════════════════════════════════════════
     INVOICES
     ══════════════════════════════════════════════ */
  const getNextInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const nums = invoices.filter(i => i.invoiceNumber?.startsWith("INV-" + year)).map(i => parseInt(i.invoiceNumber.split("-")[2]) || 0);
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `INV-${year}-${String(next).padStart(3, "0")}`;
  };

  const addInvoice = async (invoice) => {
    const { items, ...invData } = invoice;
    const invNumber = invData.invoiceNumber || invData.id || getNextInvoiceNumber();
    
    const { data } = await supabase.from("invoices").insert({
      ...toSnake(invData),
      invoice_number: invNumber,
      company_id: COMPANY_ID,
    }).select().single();

    if (data) {
      // Insert items
      if (items?.length) {
        const rows = items.map(item => ({
          invoice_id: data.id,
          service_id: item.serviceId || null,
          name: item.name,
          qty: item.qty,
          price: item.price,
        }));
        await supabase.from("invoice_items").insert(rows);
      }
      const newInv = { ...toCamel(data), items: items || [] };
      setInvoices(p => [newInv, ...p]);
      return newInv;
    }
    return null;
  };

  const updateInvoice = async (id, updates) => {
    setInvoices(p => p.map(i => i.id === id ? { ...i, ...updates } : i));
    const { items, createdAt, id: _, companyId, ...dbData } = updates;
    await supabase.from("invoices").update(toSnake(dbData)).eq("id", id);

    if (items) {
      await supabase.from("invoice_items").delete().eq("invoice_id", id);
      const rows = items.map(item => ({
        invoice_id: id,
        service_id: item.serviceId || null,
        name: item.name,
        qty: item.qty,
        price: item.price,
      }));
      if (rows.length) await supabase.from("invoice_items").insert(rows);
    }
  };

  const sendInvoice = async (id) => {
    const now = new Date().toISOString().split("T")[0];
    setInvoices(p => p.map(i => i.id === id ? { ...i, status: "sent", sentDate: now } : i));
    await supabase.from("invoices").update({ status: "sent", sent_date: now }).eq("id", id);

    // Send email via backend
    try {
      const inv = invoices.find(i => i.id === id);
      if (!inv) return;
      const client = clients.find(c => c.id === inv.clientId);
      if (!client?.email) return;
      const items = inv.items || [];

      await fetch(`${EMAIL_API}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: companyProfile,
          client,
          invoice: { ...inv, status: "sent", sentDate: now },
          items,
        }),
      });
    } catch (err) {
      console.error("Email send error:", err);
    }
  };

  const markPaid = async (id, paymentDetails = {}) => {
    const now = new Date().toISOString().split("T")[0];
    const updates = {
      status: "paid",
      paidDate: paymentDetails.paidDate || now,
      paymentMethod: paymentDetails.paymentMethod || undefined,
      notes: paymentDetails.notes || undefined,
    };
    // Clean undefined values
    const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
    setInvoices(p => p.map(i => i.id === id ? { ...i, ...cleanUpdates } : i));
    await supabase.from("invoices").update(toSnake(cleanUpdates)).eq("id", id);
  };

  /* ══════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════ */
  const getStateTax = () => STATE_TAX;
  const getClientState = (clientId) => {
    const cl = clients.find(c => c.id === clientId);
    return cl ? STATE_TAX : STATE_TAX;
  };
  const calculateInvoice = (items, taxRate) => {
    const subtotal = items.reduce((s, i) => s + (i.qty || 1) * (i.price || 0), 0);
    const taxAmount = subtotal * (taxRate / 100);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  };
  const getInvoicesByClient = (clientId) => invoices.filter(i => i.clientId === clientId);
  const getNextJobId = () => "auto";

  const getServiceById = (id) => services.find(s => s.id === id);
  const getClientServices = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return [];
    return (client.services || []).map(cs => {
      const svc = typeof cs === "string" ? services.find(s => s.id === cs) : services.find(s => s.id === cs.serviceId);
      if (!svc) return null;
      const qty = typeof cs === "string" ? 1 : (cs.qty || 1);
      return { ...svc, qty };
    }).filter(Boolean);
  };
  const getClientMonthlyTotal = (clientId) => {
    return getClientServices(clientId).reduce((sum, s) => sum + s.price * (s.qty || 1), 0);
  };

  const addNotification = (type, data) => {
    setNotifications(p => [...p, { type, data, time: new Date() }]);
  };

  /* ══════════════════════════════════════════════
     PROVIDER
     ══════════════════════════════════════════════ */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080808" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#16A34A", marginBottom: 8 }}>cleo<span style={{ color: "#4ADE80" }}>yards</span></div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{
      companyProfile, updateCompanyProfile, crews, jobs, services, clients, invoices, notifications, STATE_TAX,
      addCrew, updateCrew,
      addJob, updateJob, deleteJob, getJobsByDate, getJobsByCrew, getJobsByClient, getJobsByWeek,
      completeJob, cancelJob, startJob, reassignJob, getNextJobId, generateMonthlyJobs, toggleServiceComplete,
      addService, updateService,
      addClient, updateClient,
      addInvoice, updateInvoice, sendInvoice, markPaid,
      getNextInvoiceNumber, getStateTax, getClientState, calculateInvoice, getInvoicesByClient,
      addNotification, getServiceById, getClientServices, getClientMonthlyTotal
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
