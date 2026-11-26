import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { MyProfile } from "../../types/me";
import MyAssetsPanel from "./MyAssetsPanel";
import ChangeRequestsSection from "./ChangeRequestsSection";
import ResumeSection from "./ResumeSection";

type Tab = "personal" | "professional" | "experience" | "assets";

type Draft = {
  displayName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  linkedin: string;
  about: string;
  hobbies: string;
  currentAddress: string;
  permanentAddress: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  married: boolean;
  spouseName: string;
  spouseProfession: string;
  children: string;
  parentsOrGuardians: string;
  bloodGroup: string;
  allergies: string;
  healthConditions: string;
  medications: string;
};

type Experience = {
  id: number;
  company: string;
  role: string;
  duration: string;
  description: string;
};

type Course = {
  id: number;
  name: string;
  certificate: string;
};

const inputClass =
  "mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200";

function Field({
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className={`${inputClass} ${readOnly ? "bg-slate-50 text-slate-500" : ""}`}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  maxLength,
  maxWords,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  maxWords?: number;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          const words = nextValue.trim().split(/\s+/).filter(Boolean);
          onChange(maxWords !== undefined && words.length > maxWords
            ? words.slice(0, maxWords).join(" ")
            : nextValue);
        }}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={3}
        className={inputClass}
      />
      {maxWords !== undefined ? <span className="mt-1 block text-right text-xs font-normal text-slate-400">{value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0}/{maxWords} words</span> : maxLength ? <span className="mt-1 block text-right text-xs font-normal text-slate-400">{value.length}/{maxLength}</span> : null}
    </label>
  );
}

export default function ProfileEditorPanel({ profile, salaryContent }: { profile?: MyProfile; salaryContent?: ReactNode }) {
  const [tab, setTab] = useState<Tab>("personal");
  const [showBirthday, setShowBirthday] = useState(true);
  const [showWorkAnniversary, setShowWorkAnniversary] = useState(true);
  const [notice, setNotice] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [panName, setPanName] = useState("");
  const [identityName, setIdentityName] = useState("");
  const [draft, setDraft] = useState<Draft>({
    displayName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    linkedin: "",
    about: "",
    hobbies: "",
    currentAddress: "",
    permanentAddress: "",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: "",
    married: false,
    spouseName: "",
    spouseProfession: "",
    children: "",
    parentsOrGuardians: "",
    bloodGroup: "",
    allergies: "",
    healthConditions: "",
    medications: "",
  });
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      displayName: current.displayName || profile?.full_name || "",
      email: current.email || profile?.email || "",
      phone: current.phone || profile?.phone || "",
    }));
  }, [profile?.full_name, profile?.email, profile?.phone]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function savePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Draft updated in this page only. Nothing was sent to or saved by the server.");
  }

  function addExperience() {
    setExperiences((items) => [...items, {
      id: Date.now(),
      company: "",
      role: "",
      duration: "",
      description: "",
    }]);
  }

  function addCourse() {
    setCourses((items) => [...items, { id: Date.now(), name: "", certificate: "" }]);
  }

  function chooseCourseCertificate(courseId: number, file: File | undefined) {
    if (!file) return;
    if (file.size > 200 * 1024) {
      setNotice("Each course certificate must be 200 KB or smaller.");
      return;
    }
    setCourses((items) => items.map((item) =>
      item.id === courseId ? { ...item, certificate: file.name } : item,
    ));
    setNotice("Certificate selected in this preview; it has not been uploaded.");
  }

  return (
    <section className="overflow-hidden rounded-[24px] border shadow-sm"
      style={{ backgroundColor: "var(--mo-surface)", borderColor: "var(--mo-border)", boxShadow: "var(--mo-shadow)" }}>
      <header className="border-b p-5 sm:p-7" style={{ borderColor: "var(--mo-border)" }}>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-700">Employee profile</p>
        <h2 className="mt-1 text-xl font-bold">{draft.displayName || profile?.full_name || "My Profile"}</h2>
        <p className="mt-1 text-xs text-slate-500">Frontend draft · private details are not sent or saved</p>
      </header>

      <form onSubmit={savePreview}>
        <div className="flex gap-2 overflow-x-auto border-b px-5 pt-3 sm:px-7" style={{ borderColor: "var(--mo-border)" }}>
          {([
            ["personal", "Personal details"],
            ["professional", "Professional Details"],
            ["experience", "Experience & courses"],
            ["assets", "My Assets"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)}
              className={`whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-bold ${
                tab === value ? "border-violet-700 text-violet-800" : "border-transparent text-slate-500"
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          {tab === "personal" && (
            <>
              <section>
                <h3 className="font-bold">Identity & contact</h3>
                <p className="mt-1 text-xs text-slate-500">Legal-name changes require an authorized correction process.</p>
                
                <div className="mt-4 max-w-xl">
                  <label className="block text-sm font-semibold">Profile photo
                    <input type="file" accept="image/*" onChange={(event) => {
                      const file = event.target.files?.[0];
                      setPhotoName(file?.name ?? "");
                      if (!file) {
                        setPhotoPreview("");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setPhotoPreview(typeof reader.result === "string" ? reader.result : "");
                      reader.readAsDataURL(file);
                    }} className={inputClass} />
                    <span className="mt-1 block text-xs font-normal text-slate-500">{photoName || "No photo selected"}</span>{photoPreview && <img src={photoPreview} alt="Selected profile preview" className="mt-3 h-20 w-20 rounded-full object-cover" />}
                  </label>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Legal name · verified" value={profile?.full_name ?? "Not linked"} readOnly />
                  <Field label="Display name" value={draft.displayName} onChange={(value) => update("displayName", value)} />
                  <Field label="Personal email" type="email" value={draft.email} onChange={(value) => update("email", value)} />
                  <Field label="Phone number" type="tel" value={draft.phone} onChange={(value) => update("phone", value)} />
                  <Field label="Date of birth" type="date" value={draft.dateOfBirth} onChange={(value) => update("dateOfBirth", value)} />
                  <Field label="LinkedIn profile" value={draft.linkedin} onChange={(value) => update("linkedin", value)} placeholder="https://linkedin.com/in/…" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <TextArea label="About me" value={draft.about} onChange={(value) => update("about", value)} maxLength={1000} />
                  <TextArea label="Hobbies" value={draft.hobbies} onChange={(value) => update("hobbies", value)} maxLength={500} />
                </div>
                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-3 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--mo-border)" }}>
                    <input type="checkbox" checked={showBirthday} onChange={(event) => setShowBirthday(event.target.checked)} />
                    Show my birthday and birthday announcements to colleagues
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--mo-border)" }}>
                    <input type="checkbox" checked={showWorkAnniversary} onChange={(event) => setShowWorkAnniversary(event.target.checked)} />
                    Show my work anniversary and anniversary announcements to colleagues
                  </label>
                  <p className="text-xs text-slate-500">Preview preferences only; they are not saved yet.</p>
                </div>
              </section>

              <section className="border-t pt-5" style={{ borderColor: "var(--mo-border)" }}>
                <h3 className="font-bold">Addresses & emergency contact</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <TextArea label="Current address" value={draft.currentAddress} onChange={(value) => update("currentAddress", value)} />
                  <TextArea label="Permanent address" value={draft.permanentAddress} onChange={(value) => update("permanentAddress", value)} />
                  <Field label="Emergency contact name" value={draft.emergencyName} onChange={(value) => update("emergencyName", value)} />
                  <Field label="Relationship" value={draft.emergencyRelationship} onChange={(value) => update("emergencyRelationship", value)} />
                  <Field label="Emergency contact phone" type="tel" value={draft.emergencyPhone} onChange={(value) => update("emergencyPhone", value)} />
                </div>
              </section>

              <section className="border-t pt-5" style={{ borderColor: "var(--mo-border)" }}>
                <h3 className="font-bold">Family details</h3>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={draft.married} onChange={(event) => update("married", event.target.checked)} />
                  Married
                </label>
                {draft.married ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label="Spouse name" value={draft.spouseName} onChange={(value) => update("spouseName", value)} />
                    <Field label="Spouse profession" value={draft.spouseProfession} onChange={(value) => update("spouseProfession", value)} />
                    <TextArea label="Children" value={draft.children} onChange={(value) => update("children", value)} />
                  </div>
                ) : (
                  <div className="mt-4 max-w-xl">
                    <TextArea label="Parents or guardians" value={draft.parentsOrGuardians} onChange={(value) => update("parentsOrGuardians", value)} />
                  </div>
                )}
              </section>

              <details className="rounded-2xl border p-4" style={{ borderColor: "var(--mo-border)" }}>
                <summary className="cursor-pointer font-bold">Sensitive health details</summary>
                <p className="mt-2 text-xs text-slate-500">These fields are only a local preview. Access restrictions need backend enforcement.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-semibold">Blood group
                    <select value={draft.bloodGroup} onChange={(event) => update("bloodGroup", event.target.value)} className={inputClass}>
                      <option value="">Select</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </label>
                  <Field label="Allergies" value={draft.allergies} onChange={(value) => update("allergies", value)} />
                  <Field label="Health conditions" value={draft.healthConditions} onChange={(value) => update("healthConditions", value)} />
                  <Field label="Medications" value={draft.medications} onChange={(value) => update("medications", value)} />
                </div>
              </details>

              <section className="border-t pt-5" style={{ borderColor: "var(--mo-border)" }}>
                <h3 className="font-bold">Identity Documents</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="block text-sm font-semibold">PAN document
                    <input type="file" accept="image/*,.pdf" onChange={(event) => setPanName(event.target.files?.[0]?.name ?? "")} className={inputClass} />
                    <span className="mt-1 block text-xs font-normal text-slate-500">{panName || "Preview only · locked after verification"}</span>
                  </label>
                  <label className="block text-sm font-semibold">Aadhaar document
                    <input type="file" accept="image/*,.pdf" onChange={(event) => setIdentityName(event.target.files?.[0]?.name ?? "")} className={inputClass} />
                    <span className="mt-1 block text-xs font-normal text-slate-500">{identityName || "Preview only · not uploaded"}</span>
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">OCR and document verification are not connected.</p>
              </section>
            </>
          )}

          {tab === "professional" && (
            <section>
              <div className="flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 text-cyan-950">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">Professional profile changes are managed by HR or a person authorized by Organization Admin.</p>
              </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Official name" value={profile?.full_name ?? "Not linked"} readOnly />
                <Field label="Employee ID" value={profile?.employee_code ?? "Not assigned"} readOnly />
                <Field label="Designation" value={profile?.designation ?? "Not set"} readOnly />
                <Field label="Department" value={profile?.department_name ?? "Not set"} readOnly />
                <Field label="Manager" value="Not linked" readOnly />
                <Field label="Team lead" value="Not linked" readOnly />
                <Field label="Work contact" value={profile?.phone ?? "Not set"} readOnly />
              </div>
              <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "var(--mo-border)" }}>
                <h3 className="font-bold">Skills & résumé</h3>
                <p className="mt-1 text-sm text-slate-500">Your existing skills and résumé tools remain below this profile editor.</p>
                <p className="mt-2 text-xs text-slate-500">Skills: {profile?.skills.map((skill) => skill.name).join(", ") || "None listed"}</p>
              </div>
              <div className="mt-6 space-y-6">
                <ResumeSection />
                <ChangeRequestsSection />
              </div>
              {salaryContent}
            </section>
          )}

          {tab === "experience" && (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">Work experience</h3>
                  <p className="mt-1 text-xs text-slate-500">Optional descriptions are limited to 1,000 words.</p>
                </div>
                <button type="button" onClick={() => setExperiences((items) => [...items, { id: Date.now(), company: "", role: "", duration: "", description: "" }])}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white">
                  <Plus className="h-4 w-4" />Add experience
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {experiences.map((item) => (
                  <article key={item.id} className="rounded-xl border p-4" style={{ borderColor: "var(--mo-border)" }}>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Previous company" value={item.company}
                        onChange={(value) => setExperiences((items) => items.map((entry) => entry.id === item.id ? { ...entry, company: value } : entry))} />
                      <Field label="Job role" value={item.role}
                        onChange={(value) => setExperiences((items) => items.map((entry) => entry.id === item.id ? { ...entry, role: value } : entry))} />
                      <Field label="Time duration" value={item.duration}
                        onChange={(value) => setExperiences((items) => items.map((entry) => entry.id === item.id ? { ...entry, duration: value } : entry))} placeholder="Jan 2021 – Mar 2023" />
                    </div>
                    <div className="mt-4">
                      <TextArea label="Description · optional" value={item.description} maxWords={1000}
                        onChange={(value) => setExperiences((items) => items.map((entry) => entry.id === item.id ? { ...entry, description: value } : entry))} />
                    </div>
                    <button type="button" onClick={() => setExperiences((items) => items.filter((entry) => entry.id !== item.id))}
                      className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-rose-700">
                      <Trash2 className="h-4 w-4" />Remove
                    </button>
                  </article>
                ))}
                {experiences.length === 0 && <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500" style={{ borderColor: "var(--mo-border)" }}>No experience entries in this preview yet.</p>}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: "var(--mo-border)" }}>
                <div>
                  <h3 className="font-bold">Professional courses & certificates</h3>
                  <p className="mt-1 text-xs text-slate-500">Each certificate file must be 200 KB or smaller.</p>
                </div>
                <button type="button" onClick={addCourse}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-bold text-violet-800">
                  <Plus className="h-4 w-4" />Add a course
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {courses.map((course) => (
                  <article key={course.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_1fr_auto]" style={{ borderColor: "var(--mo-border)" }}>
                    <Field label="Course name" value={course.name}
                      onChange={(value) => setCourses((items) => items.map((item) => item.id === course.id ? { ...item, name: value } : item))} />
                    <label className="block text-sm font-semibold">Certificate · max 200 KB
                      <input type="file" accept="image/*,.pdf" onChange={(event) => chooseCourseCertificate(course.id, event.target.files?.[0])} className={inputClass} />
                      <span className="mt-1 block text-xs font-normal text-slate-500">{course.certificate || "No certificate selected"}</span>
                    </label>
                    <button type="button" aria-label="Remove course" onClick={() => setCourses((items) => items.filter((item) => item.id !== course.id))}
                      className="self-end rounded-lg border p-2 text-rose-700"><Trash2 className="h-4 w-4" /></button>
                  </article>
                ))}
                {courses.length === 0 && <p className="rounded-xl border border-dashed p-5 text-sm text-slate-500" style={{ borderColor: "var(--mo-border)" }}>No course entries in this preview yet.</p>}
              </div>
            </section>
          )}

          {tab === "assets" && <MyAssetsPanel />}

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-5" style={{ borderColor: "var(--mo-border)" }}>
            <p role="status" className="text-xs text-slate-500">{notice || "Draft values exist only while this page is open."}</p>
            <button type="submit" className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white">Save draft preview</button>
          </footer>
        </div>
      </form>
    </section>
  );
}









