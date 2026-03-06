import { useState, useRef } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { XpBar, LevelBadge, SectionLabel, ConfirmDialog, Spinner } from '../components/UI'
import { BADGES, MOTTOS } from '../lib/utils'
import { supabase } from '../lib/supabase'

const STATI_VALIDI = ['Spontanea','Inviata','Vista','Prima call','Colloquio','In attesa risposta','Secondo colloquio','Non mi piace','Rifiutata','GHOSTED']

// Mapping vecchi stati → nuovi (per import Excel)
const STATO_ALIAS = {
  'inviata': 'Inviata', 'inviata!': 'Inviata',
  'spontanea': 'Spontanea',
  'vista': 'Vista',
  'call conoscitiva': 'Prima call', 'prima call': 'Prima call', 'call': 'Prima call',
  'colloquio': 'Colloquio', 'colloquio :)': 'Colloquio',
  'in attesa': 'In attesa risposta', 'in attesa risposta': 'In attesa risposta', 'in attesa responso': 'In attesa risposta',
  'secondo colloquio': 'Secondo colloquio', 'secondo colloquio :))': 'Secondo colloquio',
  'non mi piace': 'Non mi piace',
  'rifiutato': 'Rifiutata', 'rifiutata': 'Rifiutata',
  'ghosted': 'GHOSTED',
  'assunto': 'Inviata', 'offerta ricevuta': 'Inviata', 'ritirata': 'Non mi piace',
}

const TEMPLATE_B64 = 'UEsDBBQAAAAIAIpLZlxGx01IlQAAAM0AAAAQAAAAZG9jUHJvcHMvYXBwLnhtbE3PTQvCMAwG4L9SdreZih6kDkQ9ip68zy51hbYpbYT67+0EP255ecgboi6JIia2mEXxLuRtMzLHDUDWI/o+y8qhiqHke64x3YGMsRoPpB8eA8OibdeAhTEMOMzit7Dp1C5GZ3XPlkJ3sjpRJsPiWDQ6sScfq9wcChDneiU+ixNLOZcrBf+LU8sVU57mym/8ZAW/B7oXUEsDBBQAAAAIAIpLZlwhO1Ts7gAAACsCAAARAAAAZG9jUHJvcHMvY29yZS54bWzNksFKxDAQhl9Fcm8nbaFo6Oay4klBcEHxFpLZ3WDThGSk3be3jbtdRB/AY2b+fPMNTKeD0D7ic/QBI1lMN5PrhyR02LAjURAASR/RqVTOiWFu7n10iuZnPEBQ+kMdEGrOW3BIyihSsACLsBKZ7IwWOqIiH894o1d8+Ix9hhkN2KPDgRJUZQVMLhPDaeo7uAIWGGF06buAZiXm6p/Y3AF2Tk7JrqlxHMuxybl5hwrenh5f8rqFHRKpQeP8K1lBp4Abdpn82mzvdw9M1rxuC94UvN3xO1Hfirp6X1x/+F2FnTd2b/+x8UVQdvDrLuQXUEsDBBQAAAAIAIpLZlyZXJwjEAYAAJwnAAATAAAAeGwvdGhlbWUvdGhlbWUxLnhtbO1aW3PaOBR+76/QeGf2bQvGNoG2tBNzaXbbtJmE7U4fhRFYjWx5ZJGEf79HNhDLlg3tkk26mzwELOn7zkVH5+g4efPuLmLohoiU8nhg2S/b1ru3L97gVzIkEUEwGaev8MAKpUxetVppAMM4fckTEsPcgosIS3gUy9Zc4FsaLyPW6rTb3VaEaWyhGEdkYH1eLGhA0FRRWm9fILTlHzP4FctUjWWjARNXQSa5iLTy+WzF/NrePmXP6TodMoFuMBtYIH/Ob6fkTlqI4VTCxMBqZz9Wa8fR0kiAgsl9lAW6Sfaj0xUIMg07Op1YznZ89sTtn4zK2nQ0bRrg4/F4OLbL0otwHATgUbuewp30bL+kQQm0o2nQZNj22q6RpqqNU0/T933f65tonAqNW0/Ta3fd046Jxq3QeA2+8U+Hw66JxqvQdOtpJif9rmuk6RZoQkbj63oSFbXlQNMgAFhwdtbM0gOWXin6dZQa2R273UFc8FjuOYkR/sbFBNZp0hmWNEZynZAFDgA3xNFMUHyvQbaK4MKS0lyQ1s8ptVAaCJrIgfVHgiHF3K/99Ze7yaQzep19Os5rlH9pqwGn7bubz5P8c+jkn6eT101CznC8LAnx+yNbYYcnbjsTcjocZ0J8z/b2kaUlMs/v+QrrTjxnH1aWsF3Pz+SejHIju932WH32T0duI9epwLMi15RGJEWfyC265BE4tUkNMhM/CJ2GmGpQHAKkCTGWoYb4tMasEeATfbe+CMjfjYj3q2+aPVehWEnahPgQRhrinHPmc9Fs+welRtH2Vbzco5dYFQGXGN80qjUsxdZ4lcDxrZw8HRMSzZQLBkGGlyQmEqk5fk1IE/4rpdr+nNNA8JQvJPpKkY9psyOndCbN6DMawUavG3WHaNI8ev4F+Zw1ChyRGx0CZxuzRiGEabvwHq8kjpqtwhErQj5iGTYacrUWgbZxqYRgWhLG0XhO0rQR/FmsNZM+YMjszZF1ztaRDhGSXjdCPmLOi5ARvx6GOEqa7aJxWAT9nl7DScHogstm/bh+htUzbCyO90fUF0rkDyanP+kyNAejmlkJvYRWap+qhzQ+qB4yCgXxuR4+5Xp4CjeWxrxQroJ7Af/R2jfCq/iCwDl/Ln3Ppe+59D2h0rc3I31nwdOLW95GblvE+64x2tc0LihjV3LNyMdUr5Mp2DmfwOz9aD6e8e362SSEr5pZLSMWkEuBs0EkuPyLyvAqxAnoZFslCctU02U3ihKeQhtu6VP1SpXX5a+5KLg8W+Tpr6F0PizP+Txf57TNCzNDt3JL6raUvrUmOEr0scxwTh7LDDtnPJIdtnegHTX79l125COlMFOXQ7gaQr4Dbbqd3Do4npiRuQrTUpBvw/npxXga4jnZBLl9mFdt59jR0fvnwVGwo+88lh3HiPKiIe6hhpjPw0OHeXtfmGeVxlA0FG1srCQsRrdguNfxLBTgZGAtoAeDr1EC8lJVYDFbxgMrkKJ8TIxF6HDnl1xf49GS49umZbVuryl3GW0iUjnCaZgTZ6vK3mWxwVUdz1Vb8rC+aj20FU7P/lmtyJ8MEU4WCxJIY5QXpkqi8xlTvucrScRVOL9FM7YSlxi84+bHcU5TuBJ2tg8CMrm7Oal6ZTFnpvLfLQwJLFuIWRLiTV3t1eebnK56Inb6l3fBYPL9cMlHD+U751/0XUOufvbd4/pukztITJx5xREBdEUCI5UcBhYXMuRQ7pKQBhMBzZTJRPACgmSmHICY+gu98gy5KRXOrT45f0Usg4ZOXtIlEhSKsAwFIRdy4+/vk2p3jNf6LIFthFQyZNUXykOJwT0zckPYVCXzrtomC4Xb4lTNuxq+JmBLw3punS0n/9te1D20Fz1G86OZ4B6zh3OberjCRaz/WNYe+TLfOXDbOt4DXuYTLEOkfsF9ioqAEativrqvT/klnDu0e/GBIJv81tuk9t3gDHzUq1qlZCsRP0sHfB+SBmOMW/Q0X48UYq2msa3G2jEMeYBY8wyhZjjfh0WaGjPVi6w5jQpvQdVA5T/b1A1o9g00HJEFXjGZtjaj5E4KPNz+7w2wwsSO4e2LvwFQSwMEFAAAAAgAiktmXJNBXiiDBAAAwxAAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWyVmG1T4joUx79Kps443hfYUp6qAjMoosjiMuLuvfdlbANmbJNuEkR39sPfk7ZWLCFwfaFNen4n56T/PBy7ay5e5DMhCr0lMZM951mp9Nx1ZfhMEixPeUoYvFlwkWAFTbF0ZSoIjjIoiV3f89pugilz+t2sbyb6Xb5SMWVkJpBcJQkW75ck5uueU3c+Oh7o8lnpDrffTfGSzIn6kc4EtNzSS0QTwiTlDAmy6DmD+vkk0PaZwU9K1nLjGelMnjh/0Y1x1HM8R3tmBL3P05hmYyHF029koa5IHIM/30E4VPSVzMCs5zxxpXii30OUCivoWgj+m7BsTBITsIVY0i3j3EnhVKf4q4jXKdPRQW0+f0Q+yuYV5ukJS3LF479ppJ57TuCgiCzwKlYPfH1LirlqaX8hj2X2G61zW99zULiSEE0BQwQJZflf/FbM8Sbg7wD8AvAPBRoF0DgUaBZA81CgVQCtClAPdgDtAmhXgV0jdAqgUwXaO4CgAIJDgbMCODsUqHsfX86rII3WLqT82LnocpVkEhtihftdwddIZPZaSp9+SnHBagm1RSbgfLH0HMr0Mp4rAW8pOFT9wW9KWIS7roJRdJcbFuClHXxY8ZgbsCs7NoeFaMKGdkwnjcbslXJ08i/81KbT2nD4l8HR9QGOYGHG/Ndqv7PRnmRIRAzUjZ2aYSJN2K0dG3GmTNh434RT2PIjyHVKGTp5OT4KGu3mhSnbu4M94Te7p4nd0z2vZuKCnktR+6V2/cyNvyuglCu6eDdp1w7++AcNiaRLRoRJwXZYqxBEZNKwHfQ9v13zGjWvbpLtLvZTi3bvUxpjZlpZN3vSUTimpmxu7dw3yl5INGYmRW6S+h7x2m+0uu7rptS2TZoVk4l9/GLjQhRWhSBS4q3V8UVTjVJTDavbERGCCNM8XtrBbGMZMBy/S2USlZ0udySTrOxoLiu/5nsmWR3CNmp1Ezuys4P4CaOTq3vT+r+xo7s1t4djESGRSXGNbcV5FcVtmzQrJhP76DNBE45C85f6IrZmKbamfQrDkDC1EqZt/dKOzqYmkdmZMUNYKSIxElSmXJo3MbuPD7XVWya1HcLCBmhiR3b2gSemaG/2ZLxTaHtGIwvYB3Bsklpzr47utk1a1c1t1/hbWmqXWmpnSGNHyMdHZ0EQXBwftVte4+wCzR8Hj+NzBGckU1DhYPQHFScXPP2kMvurJY1RiOMYGp+3Im1alQp0zknIWbSxBKDvHiqohKKU4pBA84Eu6Erlg9zcfp8/Xg8t66RT5tb5X7mNvt/r3D6OoCxevTNkDwt+x5+kHj/GUkacCx1X8UF1FlRxhPPTI9YxX0O1q18MYlXd+L9EG5TRBlm0zQOjhZOBoLzg5ujzvnmKrmMKl32MIAoBt3aC4F6YpDCtafZZIopoknKhsCCnprjcjXogIWKZlawSPs+KqfzEK3uLirt9PskKqWp/53zSMfUHRYXufrrPy/spFkvKJIS+gKG80w4UICKvPPIGVObZ/S+vq/NCheCICG0A7xcc7oBFQw9Q/t+i/x9QSwMEFAAAAAgAiktmXO3JgBz4AgAApA0AAA0AAAB4bC9zdHlsZXMueG1s3VdRb5swEP4riB8wEmhYmJJILVWkSdtUqX3YqxMMsWRsZkxH+uvnwwRC6qvatXsZUYR9n7/vzndnEKtaHzm9P1Cqvbbkol77B62rL0FQ7w+0JPUnWVFhkFyqkmgzVUVQV4qSrAZSyYNwNouDkjDhb1aiKbelrr29bIRe+zM/2KxyKUbLwrcGs5SU1HskfO2nhLOdYt1aUjJ+tOYQDHvJpfK0CYWu/TlY6icLz+0Moux1SiakAmNgPVz6uVaMcMB3vcLoQBU7E+1s210TL7PXCE5Erm4Wizh6uwjDoopvPofL2blg8i692zSMwxjT62610WWcD2W78q1hs6qI1lSJrZl0nM74DPL68cOxMnUrFDnOw4X/akItOcvAZZFOEnEbLm9trGfUd4puF9vI1twp2t1MOnZSZVQNCZn7J9NmxWmuDV2x4gB3LSvoMam1LM0gY6SQgnTZOjH6gZHdU87v4Qj+zCfabe7Zs/Q1g2PkQVFOQxNQP7QydgL652pW+0x28VeyXsUepb5pzG5EN//VSE3vFM1Z283bfPCPqc9H9fBCnVQVP15zVoiS2r2/2uFmRU487yAVezLeoJn3xkCV7z1Spdn+3PJbkeqBtro/FEGb4zGHY8zRx2ck+qf5vvoQ9aDvn7MmnbToYPXg4bP2f8Abgo8S3q5hXDPRzw4sy6h41qlGXpOdeQVN9M36jOak4fphANf+OP5OM9aUybDqDrbVrxrH3+BEzuPhAWh8MZHRlmZpPzXPgMnDwF5AuETGV8NzBONYzI0AhvnBIsA4loX5+Z/2s0T3YzEstqUTWaKcJcqxLBeSdj/Mj5uTmMu90ySJojjGMpqmzghSLG9xDH+3GhYbMDA/4OltucarjXfIy32A1fSlDsF2incitlM814C48waMJHFXG/MDDKwKWO+Af7cf6Ck3J4qgqlhs2AnGkSTBEOhFd4/GMZKdGH7u+mCnJIqSxI0A5o4gijAETiOOYBFADBgSdV8IwcX7KDi9p4Lxu2zzB1BLAwQUAAAACACKS2Zcl4q7HMAAAAATAgAACwAAAF9yZWxzLy5yZWxznZK5bsMwDEB/xdCeMAfQIYgzZfEWBPkBVqIP2BIFikWdv6/apXGQCxl5PTwS3B5pQO04pLaLqRj9EFJpWtW4AUi2JY9pzpFCrtQsHjWH0kBE22NDsFosPkAuGWa3vWQWp3OkV4hc152lPdsvT0FvgK86THFCaUhLMw7wzdJ/MvfzDDVF5UojlVsaeNPl/nbgSdGhIlgWmkXJ06IdpX8dx/aQ0+mvYyK0elvo+XFoVAqO3GMljHFitP41gskP7H4AUEsDBBQAAAAIAIpLZlzA0ONSNwEAACgCAAAPAAAAeGwvd29ya2Jvb2sueG1sjVHRTsMwDPyVKh9AxwSTmNa9bAImIUAM7T1r3NVaEleOu8G+HrdVxSReeErubF3uLosz8XFPdMy+go+pMLVIM8/zVNYQbLqhBqJOKuJgRSEf8tQwWJdqAAk+n04mszxYjGa5GLXeOb8GJFAKUlSyI3YI5/Q772B2woR79CjfhenvHkwWMGLAC7jCTEyWajo/E+OFoli/LZm8L8ztMNgBC5Z/6G1n8tPuU8+I3X9YNVKY2UQFK+Qk/Uavb9XjCXR5QK3QI3oBXluBJ6a2wXjoZDRFfhWj72E8hxLn/J8aqaqwhDWVbYAoQ48MvjMYU41NMlm0AQqzstGhs9IydKn0mY0bEopau+qL56gD3rjB5OjMQYUR3KuKJeW1pfKds+7odaZ397cP2kbr/Uq5t/hC1o1Bx09a/gBQSwMEFAAAAAgAiktmXCQem6KtAAAA+AEAABoAAAB4bC9fcmVscy93b3JrYm9vay54bWwucmVsc7WRPQ6DMAyFrxLlADVQqUMFTF1YKy4QBfMjEhLFrgq3L4UBkDp0YbKeLX/vyU6faBR3bqC28yRGawbKZMvs7wCkW7SKLs7jME9qF6ziWYYGvNK9ahCSKLpB2DNknu6Zopw8/kN0dd1pfDj9sjjwDzC8XeipRWQpShUa5EzCaLY2wVLiy0yWoqgyGYoqlnBaIOLJIG1pVn2wT06053kXN/dFrs3jCa7fDHB4dP4BUEsDBBQAAAAIAIpLZlxlkHmSGQEAAM8DAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbK2TTU7DMBCFrxJlWyUuLFigphtgC11wAWNPGqv+k2da0tszTtpKoBIVhU2seN68z56XrN6PEbDonfXYlB1RfBQCVQdOYh0ieK60ITlJ/Jq2Ikq1k1sQ98vlg1DBE3iqKHuU69UztHJvqXjpeRtN8E2ZwGJZPI3CzGpKGaM1ShLXxcHrH5TqRKi5c9BgZyIuWFCKq4Rc+R1w6ns7QEpGQ7GRiV6lY5XorUA6WsB62uLKGUPbGgU6qL3jlhpjAqmxAyBn69F0MU0mnjCMz7vZ/MFmCsjKTQoRObEEf8edI8ndVWQjSGSmr3ghsvXs+0FOW4O+kc3j/QxpN+SBYljmz/h7xhf/G87xEcLuvz+xvNZOGn/mi+E/Xn8BUEsBAhQDFAAAAAgAiktmXEbHTUiVAAAAzQAAABAAAAAAAAAAAAAAAIABAAAAAGRvY1Byb3BzL2FwcC54bWxQSwECFAMUAAAACACKS2ZcITtU7O4AAAArAgAAEQAAAAAAAAAAAAAAgAHDAAAAZG9jUHJvcHMvY29yZS54bWxQSwECFAMUAAAACACKS2ZcmVycIxAGAACcJwAAEwAAAAAAAAAAAAAAgAHgAQAAeGwvdGhlbWUvdGhlbWUxLnhtbFBLAQIUAxQAAAAIAIpLZlyTQV4ogwQAAMMQAAAYAAAAAAAAAAAAAACAgSEIAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWxQSwECFAMUAAAACACKS2Zc7cmAHPgCAACkDQAADQAAAAAAAAAAAAAAgAHaDAAAeGwvc3R5bGVzLnhtbFBLAQIUAxQAAAAIAIpLZlyXirscwAAAABMCAAALAAAAAAAAAAAAAACAAf0PAABfcmVscy8ucmVsc1BLAQIUAxQAAAAIAIpLZlzA0ONSNwEAACgCAAAPAAAAAAAAAAAAAACAAeYQAAB4bC93b3JrYm9vay54bWxQSwECFAMUAAAACACKS2ZcJB6boq0AAAD4AQAAGgAAAAAAAAAAAAAAgAFKEgAAeGwvX3JlbHMvd29ya2Jvb2sueG1sLnJlbHNQSwECFAMUAAAACACKS2ZcZZB5khkBAADPAwAAEwAAAAAAAAAAAAAAgAEvEwAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLBQYAAAAACQAJAD4CAAB5FAAAAAA='

export default function Profile() {
  const { profile, updateProfile, notifications, markAllNotificationsRead,
    unreadCount, refreshMotto, requestNotificationPermission, addBulkCandidature } = useApp()
  const { user, signOut } = useAuth()
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [editBio, setEditBio] = useState(false)
  const [editNome, setEditNome] = useState(false)
  const [bio, setBio] = useState(profile?.bio_lavoro || '')
  const [nomeEdit, setNomeEdit] = useState(profile?.nome || '')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const fileRef = useRef()

  const nome = profile?.nome || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utente'
  const foto = user?.user_metadata?.avatar_url
  const xp = profile?.xp_points || 0
  const earned = (profile?.badge_lista || '').split(',').filter(Boolean)
  const streak = profile?.streak_giorni || 0
  const motto = MOTTOS[profile?.motto_index ?? 0]

  const handleSignOut = async () => { await signOut() }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      await supabase.from('candidature').delete().eq('user_id', user.id)
      await supabase.from('user_profiles').delete().eq('id', user.id)
      await supabase.auth.admin?.deleteUser(user.id)
      await signOut()
    } catch {
      await signOut()
    }
    setDeletingAccount(false)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true); setImportError('')
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs')
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const today = new Date().toISOString().split('T')[0]
      const parsed = rows.filter(r => r['Azienda'] && r['Ruolo']).map(r => ({
        azienda: String(r['Azienda'] || '').trim(),
        ruolo: String(r['Ruolo'] || '').trim(),
        stato: STATI_VALIDI.includes(r['Stato']) ? r['Stato'] : 'Inviata',
        data_invio: r['Data Invio (YYYY-MM-DD)'] ? String(r['Data Invio (YYYY-MM-DD)']).slice(0,10) : today,
        data_colloquio: r['Data Colloquio (YYYY-MM-DD)'] ? String(r['Data Colloquio (YYYY-MM-DD)']).slice(0,10) : null,
        sede: String(r['Sede'] || '').trim() || null,
        paese: String(r['Paese'] || '').trim() || 'Italia',
        fonte: String(r['Fonte'] || '').trim() || 'Altro',
        stipendio_min: r['Stipendio Min (k€)'] ? parseInt(r['Stipendio Min (k€)']) : null,
        stipendio_max: r['Stipendio Max (k€)'] ? parseInt(r['Stipendio Max (k€)']) : null,
        note: String(r['Note'] || '').trim() || null,
        notifiche_push: true,
      }))
      if (parsed.length === 0) { setImportError('Nessuna riga valida trovata.'); setImporting(false); return }
      await addBulkCandidature(parsed)
    } catch { setImportError('Errore durante l\'importazione. Usa il template fornito.') }
    setImporting(false); e.target.value = ''
  }

  const handleShare = () => {
    const text = '🚀 Stai cercando lavoro? Prova Hireflow — traccia tutte le candidature, colloqui e notifiche in un posto solo. Gratis!\n\nhttps://hireflow-mocha.vercel.app'
    if (navigator.share) {
      navigator.share({ title: 'Hireflow', text, url: 'https://hireflow-mocha.vercel.app' })
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Link copiato! Condividilo con chi cerca lavoro 💜'))
    }
  }

  const Toggle = ({ value, onChange, label, sub }) => (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-txt">{label}</p>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all duration-200 relative flex-shrink-0 ${value ? 'bg-purple' : 'bg-border'}`}>
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${value ? 'left-[26px]' : 'left-0.5'}`} />
      </button>
    </div>
  )

  if (showNotifs) {
    return (
      <div className="screen">
        <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
          <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
          <h2 className="font-bold text-txt">Notifiche 🔔</h2>
          {unreadCount > 0 && (
            <button onClick={markAllNotificationsRead} className="ml-auto text-xs text-purple-soft">
              Segna tutto letto
            </button>
          )}
        </div>
        <div className="flex-1 scrollable px-4 py-4">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔕</div>
              <p className="text-muted text-sm">Nessuna notifica ancora.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id} className={`card flex items-start gap-3 ${!n.read ? 'border-purple/30' : ''}`}>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-purple mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.read ? 'text-muted' : 'text-txt'}`}>{n.title}</p>
                    <p className="text-xs text-muted mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-disabled mt-1">
                      {new Date(n.time).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      {/* Header con campanellino */}
      <div className="px-5 pt-safe pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-bold text-txt">Profilo 👤</h2>
        <button onClick={() => setShowNotifs(true)} className="relative p-2">
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 scrollable px-4 pb-8 space-y-4">

        {/* User header */}
        <div className="card flex items-center gap-4">
          {foto ? (
            <img src={foto} alt={nome} className="w-16 h-16 rounded-full ring-2 ring-purple object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple ring-2 ring-purple/50 flex items-center justify-center text-white text-2xl font-bold">
              {nome.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {editNome ? (
              <div className="flex gap-2 mb-1">
                <input className="input-field text-sm py-1 flex-1"
                  value={nomeEdit} onChange={e => setNomeEdit(e.target.value)}
                  placeholder="Il tuo nome" />
                <button onClick={() => { updateProfile({ nome: nomeEdit }); setEditNome(false) }}
                  className="text-purple-soft text-sm font-medium">✓</button>
              </div>
            ) : (
              <button onClick={() => { setEditNome(true); setNomeEdit(nome) }} className="text-left w-full">
                <p className="font-bold text-txt text-lg">{nome} <span className="text-xs text-muted">✏️</span></p>
              </button>
            )}
            <p className="text-xs text-muted truncate">{user?.email}</p>
            {editBio ? (
              <div className="mt-1 flex gap-2">
                <input className="input-field text-xs py-1 flex-1"
                  value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Es: UX Designer a Milano 🎨" />
                <button onClick={() => { updateProfile({ bio_lavoro: bio }); setEditBio(false) }}
                  className="text-purple-soft text-xs font-medium">✓</button>
              </div>
            ) : (
              <button onClick={() => setEditBio(true)} className="text-left">
                <p className="text-sm text-purple-soft italic mt-0.5">
                  {profile?.bio_lavoro || 'Aggiungi una bio... ✏️'}
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Level & XP */}
        <div className="card">
          <SectionLabel>IL TUO LIVELLO ⭐</SectionLabel>
          <XpBar xp={xp} />
          <div className="flex items-center gap-4 mt-3">
            {streak > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-lg animate-streak">🔥</span>
                <div>
                  <p className="text-sm font-bold text-amber">{streak}</p>
                  <p className="text-[10px] text-muted">giorni di fila</p>
                </div>
              </div>
            )}
            <div className="text-right ml-auto">
              <p className="text-lg font-bold text-gold">{xp}</p>
              <p className="text-[10px] text-muted">XP totali</p>
            </div>
          </div>
        </div>

        {/* Badges - cliccabili */}
        <div className="card">
          <SectionLabel>I TUOI BADGE 🏅</SectionLabel>
          <p className="text-xs text-muted mb-3">{earned.length}/{BADGES.length} sbloccati — tocca un badge per info</p>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map(badge => {
              const isEarned = earned.includes(badge.id)
              return (
                <button key={badge.id}
                  onClick={() => isEarned && setSelectedBadge(badge)}
                  className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all
                    ${isEarned ? 'bg-purple/10 border-purple/30 active:scale-95' : 'bg-surface border-border opacity-40'}`}>
                  <span className="text-2xl mb-1">{isEarned ? badge.emoji : '🔒'}</span>
                  <p className="text-[9px] text-muted leading-tight">{isEarned ? badge.name : '???'}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Motto */}
        <div className="card border-l-[3px] border-l-purple">
          <SectionLabel>IL TUO MOTTO 💜</SectionLabel>
          <p className="text-sm italic text-purple-soft mb-3 leading-relaxed">"{motto}"</p>
          <button onClick={refreshMotto} className="text-xs text-muted border border-border rounded-full px-3 py-1.5 active:scale-95">
            🔄 Cambia frase
          </button>
        </div>

        {/* Condividi */}
        <div className="card">
          <SectionLabel>CONDIVIDI CON CHI CERCA LAVORO 💌</SectionLabel>
          <p className="text-xs text-muted mb-3">Conosci qualcuno che sta mandando candidature? Mandagli Hireflow!</p>
          <button onClick={handleShare}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
            📤 Condividi Hireflow
          </button>
        </div>

        {/* Importa */}
        <div className="card">
          <SectionLabel>📥 IMPORTA CANDIDATURE</SectionLabel>
          <p className="text-xs text-muted mb-3 leading-relaxed">
            Hai già un foglio Excel con le tue candidature? Scarica il template, compilalo e ricaricalo qui. Supporta anche file Excel tuoi — rileva le colonne automaticamente.
          </p>
          <button onClick={downloadTemplate}
            className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm mb-3">
            📄 Scarica template Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
            {importing ? <><Spinner size={16} /> Importazione...</> : '📤 Carica il tuo file Excel'}
          </button>
          {importError && <p className="text-xs text-red mt-2">{importError}</p>}
          <p className="text-[10px] text-disabled mt-2 text-center">Supporta .xlsx, .xls, .csv — max 500 righe</p>
        </div>

        {/* Preferenze notifiche */}
        <div className="card">
          <SectionLabel>PREFERENZE 🔔</SectionLabel>
          <Toggle
            value={profile?.notifiche_push_globali ?? true}
            onChange={v => { if (v) requestNotificationPermission(); updateProfile({ notifiche_push_globali: v }) }}
            label="🔔 Notifiche push"
            sub="Promemoria colloqui, ghosting, streak"
          />
          <div className="border-t border-border pt-2.5 mt-1">
            <p className="text-xs text-muted mb-2">📅 Riepilogo settimanale</p>
            <div className="flex gap-2">
              {['Lunedì','Venerdì','Entrambi'].map(g => (
                <button key={g} onClick={() => updateProfile({ recap_giorno: g })}
                  className={`pill-btn text-xs flex-1 ${profile?.recap_giorno === g ? 'bg-purple border-purple text-white' : 'border-border text-muted'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-disabled mt-3 leading-relaxed">
            ⚠️ Le notifiche push su mobile richiedono che l'app sia installata come PWA e che il browser supporti le notifiche in background.
          </p>
        </div>

        {/* Supporto */}
        <div className="card space-y-2">
          <SectionLabel>SUPPORTO</SectionLabel>
          <a href="mailto:feedback@hireflow.app" className="flex items-center gap-2 py-2 text-sm text-txt active:text-muted">
            💬 Dai il tuo feedback
          </a>
          <div className="border-t border-border" />
          <p className="text-xs text-disabled text-center pt-1">Hireflow v1.0 — Fatto con 💜</p>
        </div>

        {/* Azioni account */}
        {user && (
          <div className="space-y-3">
            <button onClick={() => setConfirmSignOut(true)}
              className="w-full py-3 rounded-2xl border font-semibold text-sm active:scale-95 transition-all"
              style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
              🚪 Esci dall'account
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="btn-danger w-full py-3">
              🗑️ Elimina account
            </button>
          </div>
        )}

      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60"
          onClick={() => setSelectedBadge(null)}>
          <div className="card max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
            <span className="text-5xl block mb-3">{selectedBadge.emoji}</span>
            <h3 className="font-bold text-txt text-lg mb-1">{selectedBadge.name}</h3>
            <p className="text-sm text-muted leading-relaxed">{selectedBadge.desc}</p>
            <button onClick={() => setSelectedBadge(null)} className="mt-4 text-xs text-purple-soft">Chiudi</button>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmSignOut} title="Esci dall'account"
        message="Sicuro/a? I tuoi dati saranno al sicuro."
        onConfirm={handleSignOut} onCancel={() => setConfirmSignOut(false)} />

      <ConfirmDialog isOpen={confirmDelete} title="Elimina account"
        message="Attenzione! Tutti i tuoi dati e candidature verranno eliminati definitivamente. Questa azione è irreversibile."
        onConfirm={handleDeleteAccount} onCancel={() => setConfirmDelete(false)} danger />
    </div>
  )
}
