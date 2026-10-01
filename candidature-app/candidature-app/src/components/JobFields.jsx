import { useId } from 'react'
import { useTranslation } from 'react-i18next'

const roles = ['Digital Marketing Specialist', 'Social Media Manager', 'SEO Specialist', 'Copywriter', 'Content Creator', 'Graphic Designer', 'UX/UI Designer', 'Project Manager', 'Product Manager', 'Software Developer', 'Frontend Developer', 'Backend Developer', 'Data Analyst', 'Business Analyst', 'Account Manager', 'Sales Account', 'Customer Service Specialist', 'HR Specialist', 'Recruiter', 'Impiegato amministrativo', 'Impiegata amministrativa', 'Contabile', 'Segretario', 'Segretaria', 'Receptionist', 'Addetto vendite', 'Addetta vendite', 'Magazziniere', 'Operaio', 'Operaia', 'Tecnico manutentore', 'Ingegnere meccanico', 'Ingegnere elettronico', 'Cameriere', 'Cameriera', 'Cuoco', 'Cuoca', 'Barista', 'Educatore', 'Educatrice', 'Infermiere', 'Infermiera', 'E-commerce Specialist', 'Office Manager']

export function RoleInput({ value, onChange, className, placeholder }) {
  const id = useId()
  const { i18n } = useTranslation()
  return <>
    <input aria-label={i18n.language === 'en' ? 'Role' : 'Ruolo'} className={className} placeholder={placeholder} value={value || ''} onChange={e => onChange(e.target.value)} list={id} autoComplete="off" />
    <datalist id={id}>{value?.trim().length >= 2 && roles.filter(role => role.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 8).map(role => <option key={role} value={role} />)}</datalist>
  </>
}

export default function JobFields({ form, onChange, compact = false }) {
  const { i18n } = useTranslation()
  const en = i18n.language === 'en'
  const fields = [
    ['orario_lavoro', en ? 'Working hours' : 'Orario', [['full-time','Tempo pieno','Full-time'],['part-time','Part-time','Part-time']]],
    ['tipo_contratto', en ? 'Contract' : 'Contratto', [['permanent','Indeterminato','Permanent'],['fixed-term','Determinato','Fixed-term'],['internship','Stage / tirocinio','Internship'],['apprenticeship','Apprendistato','Apprenticeship'],['freelance','Partita IVA / freelance','Freelance'],['temporary','Somministrazione','Agency contract'],['seasonal','Stagionale','Seasonal']]],
    ['modalita_lavoro', en ? 'Work arrangement' : 'Modalità di lavoro', [['onsite','In sede','On-site'],['hybrid','Ibrido','Hybrid'],['remote','Da remoto','Remote']]],
    ['livello_ruolo', en ? 'Seniority' : 'Livello', [['entry','Prima esperienza','Entry-level'],['junior','Junior','Junior'],['mid','Intermedio','Mid-level'],['senior','Senior','Senior'],['lead','Responsabile','Lead']]],
  ]
  return <div className="space-y-3">
    {fields.filter(([key])=>!compact || key!=='livello_ruolo').map(([key, label, options]) => <label key={key} className="block text-xs text-muted">{label}
      <select className="input-field w-full mt-1" value={form[key] || ''} onChange={e => onChange(key, e.target.value)}>
        <option value="">{en ? 'Not specified' : 'Non specificato'}</option>
        {options.map(([value,it,english]) => <option key={value} value={value}>{en ? english : it}</option>)}
      </select>
    </label>)}
  </div>
}
