import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { XpBar, LevelBadge, SectionLabel, ConfirmDialog, Spinner } from '../components/UI'
import { BADGES } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { Edit2, LogOut, Share2, Coffee, Bell } from 'lucide-react'

const GENERI = [
  { value: 'f', label: 'Donna', emoji: '👩' },
  { value: 'm', label: 'Uomo', emoji: '👨' },
  { value: 'nb', label: 'Non binario/a', emoji: '🌈' },
  { value: 'x', label: 'Preferisco non dirlo', emoji: '🤐' },
]
const SETTORI = [
  'Tech/IT','Marketing/Comunicazione','Finanza/Contabilità','Legale','HR/Recruitment',
  'Design/Creatività','Salute/Medicina','Istruzione/Formazione','Moda/Retail',
  'Logistica/Operations','Commerciale/Vendite','Ingegneria','Altro'
]
const FONTI = ['Instagram','TikTok','LinkedIn','Amico/a','Google','Reddit','Altro']

const getBadgeName = (badge, genere, t) => t(`badges.${badge.id}`);

const getBadgeDesc = (badge, genere, t) => {
  if (badge.descF && badge.descM) {
    if (genere === 'f') return badge.descF
    if (genere === 'm') return badge.descM
    return badge.desc
  }
  const d = badge.desc || ''
  // resolve inline * endings
  return d.replace(/(\w+)\*/g, (match, word) => {
    if (genere === 'f') return word + 'a'
    if (genere === 'm') return word + 'o'
    return match
  })
}

const STATI_VALIDI = ['Spontanea','Inviata','Vista','Prima call','Colloquio','In attesa risposta','Secondo colloquio','Non mi piace','Rifiutata','GHOSTED']
const STATO_ALIAS = {
  'inviata': 'Inviata', 'inviata!': 'Inviata', 'spontanea': 'Spontanea', 'vista': 'Vista',
  'call conoscitiva': 'Prima call', 'prima call': 'Prima call', 'call': 'Prima call',
  'colloquio': 'Colloquio', 'colloquio :)': 'Colloquio',
  'in attesa': 'In attesa risposta', 'in attesa risposta': 'In attesa risposta', 'in attesa responso': 'In attesa risposta',
  'secondo colloquio': 'Secondo colloquio', 'secondo colloquio :))': 'Secondo colloquio',
  'non mi piace': 'Non mi piace', 'rifiutato': 'Rifiutata', 'rifiutata': 'Rifiutata',
  'ghosted': 'GHOSTED', 'assunto': 'Inviata', 'offerta ricevuta': 'Inviata', 'ritirata': 'Non mi piace',
}
const TEMPLATE_B64 = 'UEsDBBQAAAAIAKpoZlxGx01IlQAAAM0AAAAQAAAAZG9jUHJvcHMvYXBwLnhtbE3PTQvCMAwG4L9SdreZih6kDkQ9ip68zy51hbYpbYT67+0EP255ecgboi6JIia2mEXxLuRtMzLHDUDWI/o+y8qhiqHke64x3YGMsRoPpB8eA8OibdeAhTEMOMzit7Dp1C5GZ3XPlkJ3sjpRJsPiWDQ6sScfq9wcChDneiU+ixNLOZcrBf+LU8sVU57mym/8ZAW/B7oXUEsDBBQAAAAIAKpoZlzd9FQI7gAAACsCAAARAAAAZG9jUHJvcHMvY29yZS54bWzNks9qwzAMh19l+J7ISVgOJs1lY6cWBits7GZstTWL/2BrJH37JV6bMrYH2NHSz58+gToVhPIRn6MPGMlgupvs4JJQYcNOREEAJHVCK1M5J9zcPPhoJc3PeIQg1Yc8ItSct2CRpJYkYQEWYSWyvtNKqIiSfLzgtVrx4TMOGaYV4IAWHSWoygpYv0wM52no4AZYYITRpu8C6pWYq39icwfYJTkls6bGcSzHJufmHSp4221f8rqFcYmkUzj/SkbQOeCGXSe/Ng+P+yfW17xuC94UvN1XjeD3oq7eF9cffjdh67U5mH9sfBXsO/h1F/0XUEsDBBQAAAAIAKpoZlyZXJwjEAYAAJwnAAATAAAAeGwvdGhlbWUvdGhlbWUxLnhtbO1aW3PaOBR+76/QeGf2bQvGNoG2tBNzaXbbtJmE7U4fhRFYjWx5ZJGEf79HNhDLlg3tkk26mzwELOn7zkVH5+g4efPuLmLohoiU8nhg2S/b1ru3L97gVzIkEUEwGaev8MAKpUxetVppAMM4fckTEsPcgosIS3gUy9Zc4FsaLyPW6rTb3VaEaWyhGEdkYH1eLGhA0FRRWm9fILTlHzP4FctUjWWjARNXQSa5iLTy+WzF/NrePmXP6TodMoFuMBtYIH/Ob6fkTlqI4VTCxMBqZz9Wa8fR0kiAgsl9lAW6Sfaj0xUIMg07Op1YznZ89sTtn4zK2nQ0bRrg4/F4OLbL0otwHATgUbuewp30bL+kQQm0o2nQZNj22q6RpqqNU0/T933f65tonAqNW0/Ta3fd046Jxq3QeA2+8U+Hw66JxqvQdOtpJif9rmuk6RZoQkbj63oSFbXlQNMgAFhwdtbM0gOWXin6dZQa2R273UFc8FjuOYkR/sbFBNZp0hmWNEZynZAFDgA3xNFMUHyvQbaK4MKS0lyQ1s8ptVAaCJrIgfVHgiHF3K/99Ze7yaQzep19Os5rlH9pqwGn7bubz5P8c+jkn6eT101CznC8LAnx+yNbYYcnbjsTcjocZ0J8z/b2kaUlMs/v+QrrTjxnH1aWsF3Pz+SejHIju932WH32T0duI9epwLMi15RGJEWfyC265BE4tUkNMhM/CJ2GmGpQHAKkCTGWoYb4tMasEeATfbe+CMjfjYj3q2+aPVehWEnahPgQRhrinHPmc9Fs+welRtH2Vbzco5dYFQGXGN80qjUsxdZ4lcDxrZw8HRMSzZQLBkGGlyQmEqk5fk1IE/4rpdr+nNNA8JQvJPpKkY9psyOndCbN6DMawUavG3WHaNI8ev4F+Zw1ChyRGx0CZxuzRiGEabvwHq8kjpqtwhErQj5iGTYacrUWgbZxqYRgWhLG0XhO0rQR/FmsNZM+YMjszZF1ztaRDhGSXjdCPmLOi5ARvx6GOEqa7aJxWAT9nl7DScHogstm/bh+htUzbCyO90fUF0rkDyanP+kyNAejmlkJvYRWap+qhzQ+qB4yCgXxuR4+5Xp4CjeWxrxQroJ7Af/R2jfCq/iCwDl/Ln3Ppe+59D2h0rc3I31nwdOLW95GblvE+64x2tc0LihjV3LNyMdUr5Mp2DmfwOz9aD6e8e362SSEr5pZLSMWkEuBs0EkuPyLyvAqxAnoZFslCctU02U3ihKeQhtu6VP1SpXX5a+5KLg8W+Tpr6F0PizP+Txf57TNCzNDt3JL6raUvrUmOEr0scxwTh7LDDtnPJIdtnegHTX79l125COlMFOXQ7gaQr4Dbbqd3Do4npiRuQrTUpBvw/npxXga4jnZBLl9mFdt59jR0fvnwVGwo+88lh3HiPKiIe6hhpjPw0OHeXtfmGeVxlA0FG1srCQsRrdguNfxLBTgZGAtoAeDr1EC8lJVYDFbxgMrkKJ8TIxF6HDnl1xf49GS49umZbVuryl3GW0iUjnCaZgTZ6vK3mWxwVUdz1Vb8rC+aj20FU7P/lmtyJ8MEU4WCxJIY5QXpkqi8xlTvucrScRVOL9FM7YSlxi84+bHcU5TuBJ2tg8CMrm7Oal6ZTFnpvLfLQwJLFuIWRLiTV3t1eebnK56Inb6l3fBYPL9cMlHD+U751/0XUOufvbd4/pukztITJx5xREBdEUCI5UcBhYXMuRQ7pKQBhMBzZTJRPACgmSmHICY+gu98gy5KRXOrT45f0Usg4ZOXtIlEhSKsAwFIRdy4+/vk2p3jNf6LIFthFQyZNUXykOJwT0zckPYVCXzrtomC4Xb4lTNuxq+JmBLw3punS0n/9te1D20Fz1G86OZ4B6zh3OberjCRaz/WNYe+TLfOXDbOt4DXuYTLEOkfsF9ioqAEativrqvT/klnDu0e/GBIJv81tuk9t3gDHzUq1qlZCsRP0sHfB+SBmOMW/Q0X48UYq2msa3G2jEMeYBY8wyhZjjfh0WaGjPVi6w5jQpvQdVA5T/b1A1o9g00HJEFXjGZtjaj5E4KPNz+7w2wwsSO4e2LvwFQSwMEFAAAAAgAqmhmXK6b0c1HAwAACgkAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWyNVlFv0zAQ/itWkHhqlzRZyxhtJdYOmMSgWmGIRy+5ttYcX7CdhfHrOTtp6FgarQ9tfb7vu/vOzl2mFep7swOw7HculZkFO2uL8zA06Q5ybk6wAEU7G9Q5t7TU29AUGnjmQbkM4yiahDkXKphPvW2l51MsrRQKVpqZMs+5frwAidUsGAV7w43Y7qwzhPNpwbewBvu9WGlahS1LJnJQRqBiGjaz4P3ofDlx/t7hVkBlDv4zp+QO8d4trrJZEAWOWQF7XBdS+FjMYvEZNnYBUhJfHDCeWvEAK3KbBXdoLeZun7K03JJpo/EPKB8TJJAv5VI8c65JGlIn8VeTb9DKcUkd/t9n/sHXlep0xw0sUP4Qmd3NgrOAZbDhpbQ3WH2CplZjx5eiNP6bVbVvTM5paSibBkwZ5ELVv/x3U+NDQHwEEDeA+H/A5AggaQDJSyOcNoBTX5laiq/Dkls+n2qsmPbeTm8S7VnaCtCRps7DV7k+0VkglLtra6tpVxChnb//I0BlfBpaiuJMYdoAL/qBLg224CoTGbel7mJY9DOs6eJgB2z5ksAoJf4qxX/4kMrS1iZuSxB7wvhYHgVasXnsKkE/MI7iyTBKhtGoS3w/9ko9CBLSJf8Y8JnApBWY9Mb6iLiV0KWvH1fri4dx1KWvH3vkgGqFLwmbDEdRz+GettpPe8k+gNagu7K46AfuxY/GXeL7sVeKcWvBcKaFKdB0n/NL4tPlGvdUYdJWYeLJkiNkr1+9PTs7e/f61WQcJW/fsUspqMlwJoEy3O6AZYKBgbwQyAotcu4MIi9QW67hhNEzB+esnmzIftJneH09XC67UgsPulQOeuu7vWEplqrpS621GVaTZliF/9xpohHBLZeuu9AoeYJ/urWfIYv4fDGKIuqEZofVUmOxxEq54eYNV6oo7TUYQxO0NV5qjfrQyOnWVheSq/u6AT0WZJfCWArr5JeSj+YBdQxlabbxQfMYD27JhQ9WvnQpkQza+z94fhkGa0hRZUia9k5fSEcuWCF4CoMbsRGldbQfP31df7tcBtOwDT4Nn8p/ZjD1W8I111tBdZM0d0nayZtx4M+6XdCA9xrr8VyPEnpZAe0caH+DaPcLdzjt68/8L1BLAwQUAAAACACqaGZcZW3aFuICAAD1DAAADQAAAHhsL3N0eWxlcy54bWzdV1FvmzAQ/iuIHzAS3LIwJZFSqkiTtqlS+7BXJxhiydjMmCrpr58PkxASX9etfRpRhX2fv+/Od2ejzhtzEOxxx5gJ9pWQzSLcGVN/iaJmu2MVbT6pmkmLFEpX1NipLqOm1ozmDZAqEcWTSRJVlMtwOZdtta5ME2xVK80inITRcl4oOVhuQmewS2nFgmcqFmFGBd9o3q2lFRcHZ47BsFVC6cDYUNginIKleXHw1M0gyl6n4lJpMEbOw6WfleZUAL7pFQYHutzYaCfr7rn28idBjgkmd5/j2WQkOHmXYJqtyGoUYXqm170aq8uFGKfcGpbzmhrDtFzbScfpjFdQ0I+fDrXNeanpYRrfhm8mNErwHFyW2SgT9/Hs3sV6Rn2n6Pp2TVy9vKLdy6Zjo3TO9Ckh0/BoWs4FK4yla17u4G1UDf2hjFGVHeSclkrSLltHRj+wslsmxCMcn5/FSHtfBO4cfM3hCARQlOPQBtQPnYybgP65mtM+k735J9mg5s/K3LV2N7Kb/2qVYQ+aFXzfzffFyT+mPh3U4wt1WtfisBK8lBVze3+zw+WcHnnBTmn+Yr1BM2+tgekweGba8O2ZBTK0L/Aw4yFM8vFJIB+S4qgv6lnnjPrmZA3gRliEP+DKFYNEsGm5MFz2sx3Pcyav2sfKG7qxd/pI367PWUFbYZ5O4CIcxt9ZztsqPa16gG31q4bxNzgm0+R0K1lfXOZsz/Ksn9qDOTqh7gHCJTLctdcIxnGYHwEM84NFgHEcC/PzP+1nhu7HYVhsMy8yQzkzlONYPiTrfpgfPye1j3+naUpIkmAZzTJvBBmWtySBP78aFhswMD/g6e9yjVcb75DX+wCr6Wsdgu0U70Rsp3iuAfHnDRhp6q825gcYWBWw3gH/fj/QU34OIVBVLDbsBONImmII9KK/R5MEyU4CP399sFNCSJr6EcD8ERCCIXAacQSLAGLAEEK67+DF9yg6fqei4R+d5W9QSwMEFAAAAAgAqmhmXJeKuxzAAAAAEwIAAAsAAABfcmVscy8ucmVsc52SuW7DMAxAf8XQnjAH0CGIM2XxFgT5AVaiD9gSBYpFnb+v2qVxkAsZeT08EtweaUDtOKS2i6kY/RBSaVrVuAFItiWPac6RQq7ULB41h9JARNtjQ7BaLD5ALhlmt71kFqdzpFeIXNedpT3bL09Bb4CvOkxxQmlISzMO8M3SfzL38ww1ReVKI5VbGnjT5f524EnRoSJYFppFydOiHaV/Hcf2kNPpr2MitHpb6PlxaFQKjtxjJYxxYrT+NYLJD+x+AFBLAwQUAAAACACqaGZcwNDjUjcBAAAoAgAADwAAAHhsL3dvcmtib29rLnhtbI1R0U7DMAz8lSofQMcEk5jWvWwCJiFADO09a9zVWhJXjrvBvh63VcUkXnhK7mxd7i6LM/FxT3TMvoKPqTC1SDPP81TWEGy6oQaiTiriYEUhH/LUMFiXagAJPp9OJrM8WIxmuRi13jm/BiRQClJUsiN2COf0O+9gdsKEe/Qo34Xp7x5MFjBiwAu4wkxMlmo6PxPjhaJYvy2ZvC/M7TDYAQuWf+htZ/LT7lPPiN1/WDVSmNlEBSvkJP1Gr2/V4wl0eUCt0CN6AV5bgSemtsF46GQ0RX4Vo+9hPIcS5/yfGqmqsIQ1lW2AKEOPDL4zGFONTTJZtAEKs7LRobPSMnSp9JmNGxKKWrvqi+eoA964weTozEGFEdyriiXltaXynbPu6HWmd/e3D9pG6/1Kubf4QtaNQcdPWv4AUEsDBBQAAAAIAKpoZlwkHpuirQAAAPgBAAAaAAAAeGwvX3JlbHMvd29ya2Jvb2sueG1sLnJlbHO1kT0OgzAMha8S5QA1UKlDBUxdWCsuEAXzIxISxa4Kty+FAZA6dGGyni1/78lOn2gUd26gtvMkRmsGymTL7O8ApFu0ii7O4zBPahes4lmGBrzSvWoQkii6QdgzZJ7umaKcPP5DdHXdaXw4/bI48A8wvF3oqUVkKUoVGuRMwmi2NsFS4stMlqKoMhmKKpZwWiDiySBtaVZ9sE9OtOd5Fzf3Ra7N4wmu3wxweHT+AVBLAwQUAAAACACqaGZcZZB5khkBAADPAwAAEwAAAFtDb250ZW50X1R5cGVzXS54bWytk01OwzAQha8SZVslLixYoKYbYAtdcAFjTxqr/pNnWtLbM07aSqASFYVNrHjevM+el6zejxGw6J312JQdUXwUAlUHTmIdIniutCE5SfyatiJKtZNbEPfL5YNQwRN4qih7lOvVM7Ryb6l46XkbTfBNmcBiWTyNwsxqShmjNUoS18XB6x+U6kSouXPQYGciLlhQiquEXPkdcOp7O0BKRkOxkYlepWOV6K1AOlrAetriyhlD2xoFOqi945YaYwKpsQMgZ+vRdDFNJp4wjM+72fzBZgrIyk0KETmxBH/HnSPJ3VVkI0hkpq94IbL17PtBTluDvpHN4/0MaTfkgWJY5s/4e8YX/xvO8RHC7r8/sbzWThp/5ovhP15/AVBLAQIUAxQAAAAIAKpoZlxGx01IlQAAAM0AAAAQAAAAAAAAAAAAAACAAQAAAABkb2NQcm9wcy9hcHAueG1sUEsBAhQDFAAAAAgAqmhmXN30VAjuAAAAKwIAABEAAAAAAAAAAAAAAIABwwAAAGRvY1Byb3BzL2NvcmUueG1sUEsBAhQDFAAAAAgAqmhmXJlcnCMQBgAAnCcAABMAAAAAAAAAAAAAAIAB4AEAAHhsL3RoZW1lL3RoZW1lMS54bWxQSwECFAMUAAAACACqaGZcrpvRzUcDAAAKCQAAGAAAAAAAAAAAAAAAgIEhCAAAeGwvd29ya3NoZWV0cy9zaGVldDEueG1sUEsBAhQDFAAAAAgAqmhmXGVt2hbiAgAA9QwAAA0AAAAAAAAAAAAAAIABngsAAHhsL3N0eWxlcy54bWxQSwECFAMUAAAACACqaGZcl4q7HMAAAAATAgAACwAAAAAAAAAAAAAAgAGrDgAAX3JlbHMvLnJlbHNQSwECFAMUAAAACACqaGZcwNDjUjcBAAAoAgAADwAAAAAAAAAAAAAAgAGUDwAAeGwvd29ya2Jvb2sueG1sUEsBAhQDFAAAAAgAqmhmXCQem6KtAAAA+AEAABoAAAAAAAAAAAAAAIAB+BAAAHhsL19yZWxzL3dvcmtib29rLnhtbC5yZWxzUEsBAhQDFAAAAAgAqmhmXGWQeZIZAQAAzwMAABMAAAAAAAAAAAAAAIAB3REAAFtDb250ZW50X1R5cGVzXS54bWxQSwUGAAAAAAkACQA+AgAAJxMAAAAA'


function GuestConvertModal({ onClose, onSuccess, migrateGuestToAccount }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = async () => {
    if (!email || !password) return setError('Compila tutti i campi')
    if (password.length < 6) return setError('Password minimo 6 caratteri')
    setLoading(true); setError('')
    const result = await migrateGuestToAccount(email, password)
    setLoading(false)
    if (result?.error) setError(result.error.message || 'Errore — riprova.')
    else onSuccess?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 space-y-4" style={{ background: '#1A1A2E' }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-2" />
        <div className="text-center">
          <p className="text-3xl mb-2">👻✨</p>
          <h3 className="font-bold text-txt text-lg">Salva i tuoi progressi</h3>
          <p className="text-muted text-sm mt-1">Crea un account gratuito e non perdi nulla — candidature, XP e badge.</p>
        </div>
        <input className="input-field" type="email" placeholder="La tua email"
          value={email} onChange={e => setEmail(e.target.value)} autoFocus />
        <input className="input-field" type="password" placeholder="Scegli una password (min. 6 caratteri)"
          value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-red text-xs text-center">{error}</p>}
        <button onClick={handle} disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-white transition-opacity"
          style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)', opacity: loading ? 0.6 : 1 }}>
          {loading ? '⏳ Salvataggio...' : '🚀 Crea account e salva tutto'}
        </button>
        <button onClick={onClose} className="w-full text-center text-muted text-sm py-2 active:text-txt">
          Continua come ospite
        </button>
      </div>
    </div>
  )
}

export default function Profile() {
  const { profile, updateProfile, notifications, markAllNotificationsRead,
    unreadCount, requestNotificationPermission, addBulkCandidature,
    candidature: tutteLeCandidature, updateCandidatura, recalcXP, migrateGuestToAccount } = useApp()
  const { user, signOut, isGuest, enterAsGuest } = useAuth()

  const [confirmSignOut, setConfirmSignOut]   = useState(false)
  const [showGuestModal, setShowGuestModal]   = useState(false)
  const [confirmDelete, setConfirmDelete]     = useState(false)
  const [showNotifs, setShowNotifs]           = useState(false)
  const [editBio, setEditBio]                 = useState(false)
  const [editIndirizzo, setEditIndirizzo]     = useState(false)
  const [indirizzoEdit, setIndirizzoEdit]     = useState(profile?.indirizzo_home || '')
  const [showArchive, setShowArchive]         = useState(false)
  const [editNome, setEditNome]               = useState(false)
  const [bio, setBio]                         = useState(profile?.bio_lavoro || '')
  const [nomeEdit, setNomeEdit]               = useState(profile?.nome || '')
  const [importing, setImporting]             = useState(false)
  const [importError, setImportError]         = useState('')
  const [selectedBadge, setSelectedBadge]     = useState(null)
  const [linkedinPending, setLinkedinPending] = useState(null)
  const [editInfoBase, setEditInfoBase]       = useState(false)
  const [recalcLoading, setRecalcLoading]     = useState(false)
  const [infoGenere, setInfoGenere]           = useState(profile?.genere || '')
  const [infoEta, setInfoEta]                 = useState(profile?.eta?.toString() || '')
  const [infoSettore, setInfoSettore]         = useState(profile?.settore || '')
  const [infoSettoreCustom, setInfoSettoreCustom] = useState('')
  const [infoFonte, setInfoFonte]             = useState(profile?.come_conosciuto || '')
  const fileRef = useRef()
const { t, i18n } = useTranslation()
  const nome   = profile?.nome || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utente'
  const foto   = user?.user_metadata?.avatar_url
  const xp     = profile?.xp_points || 0
  const earned = (profile?.badge_lista || '').split(',').filter(Boolean)
  const streak = profile?.streak_giorni || 0

  const downloadTemplate = () => {
    const bytes = atob(TEMPLATE_B64)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    const blob = new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'template_candidature_lefaremosapere.xlsx'
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true); setImportError('')
    try {
      const buf  = await file.arrayBuffer()
      const wb   = XLSX.read(buf, { type: 'array', cellDates: true })
      const ws   = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const today = new Date().toISOString().split('T')[0]

      const fmtDate = (v) => {
        if (!v) return null
        if (v instanceof Date) return v.toISOString().slice(0,10)
        const s = String(v).trim()
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
        const m = s.match(/^(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})$/)
        if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
        const n = parseFloat(s)
        if (!isNaN(n) && n > 40000) return new Date(Math.round((n - 25569) * 86400 * 1000)).toISOString().slice(0,10)
        return null
      }

      const col = (row, ...keys) => {
        const rk = Object.keys(row)
        for (const k of keys) {
          const f = rk.find(h => h && h.toLowerCase().includes(k.toLowerCase()))
          if (f !== undefined && row[f] !== '' && row[f] !== null && row[f] !== undefined) return row[f]
        }
        return ''
      }

      const resolveStato = (raw) => {
        if (!raw) return 'Inviata'
        const key = String(raw).toLowerCase().trim()
        return STATO_ALIAS[key] || (STATI_VALIDI.includes(String(raw)) ? String(raw) : 'Inviata')
      }

      const parsed = rows
        .filter(r => {
          const az = String(col(r, 'aziend', 'company') || '').trim()
          return az && !az.startsWith('⚠') && az.toLowerCase() !== 'azienda'
        })
        .map(r => ({
          azienda: String(col(r, 'aziend', 'company') || '?').trim(),
          ruolo: String(col(r, 'ruol', 'role', 'posiz', 'job', 'titolo') || '—').trim(),
          stato: resolveStato(col(r, 'stato', 'status')),
          data_invio: fmtDate(col(r, 'data cand', 'data invio', 'invio', 'data')) || today,
          data_colloquio: (() => {
            const dataColl = fmtDate(col(r, 'data coll', 'colloquio', 'data 1° colloquio', 'data colloquio'))
            const stato = resolveStato(col(r, 'stato', 'status'))
            const statiConColloquio = ['In attesa risposta','Colloquio','Secondo colloquio','Non mi piace','Rifiutata','GHOSTED','Prima call']
            // Se lo stato implica che un colloquio è avvenuto, preserva la data
            if (dataColl && statiConColloquio.includes(stato)) return dataColl
            if (dataColl && ['Colloquio','Secondo colloquio','Prima call'].includes(stato)) return dataColl
            return dataColl || null
          })(),
          notifiche_push: true,
        }))

      if (parsed.length === 0) {
        setImportError('Nessuna riga valida trovata — assicurati che ci sia la colonna "Azienda".')
        setImporting(false); return
      }
      await addBulkCandidature(parsed)
    } catch (err) {
      setImportError('Errore: ' + (err.message || 'controlla il file e riprova.'))
      console.error('Import error:', err)
    }
    setImporting(false); e.target.value = ''
  }

  const handleDeleteAccount = async () => {
    try {
      // Ottieni il token della sessione corrente
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { await signOut(); return }

      // Chiama la API route che usa service role per eliminare da auth.users
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) {
        // Fallback: elimina solo i dati (meglio di niente)
        await supabase.from('candidature').delete().eq('user_id', user.id)
        await supabase.from('user_profiles').delete().eq('id', user.id)
      }
    } catch {
      // Fallback silenzioso
    }
    await signOut()
  }

  const handleShare = () => {
    const url = 'https://lefaremosapere-mocha.vercel.app'
    const text = '🚀 Stai cercando lavoro? Ti presento Le faremo sapere — il job tracker gratuito per tenere tutto sotto controllo: candidature, colloqui, notifiche e molto altro. Provalo!'
    if (navigator.share) navigator.share({ title: 'Le faremo sapere', text, url })
    else navigator.clipboard.writeText(url).then(() => alert('Link copiato! 💜'))
  }

  // Notification panel
  if (showNotifs) return (
    <div className="screen">
      <div className="flex items-center gap-3 px-5 pt-safe pt-4 pb-3 border-b border-border flex-shrink-0">
        <button onClick={() => { setShowNotifs(false); markAllNotificationsRead() }} className="text-muted text-lg">←</button>
        <h2 className="font-bold text-txt">{t('profile.notifiche')}</h2>
        {unreadCount > 0 && <button onClick={markAllNotificationsRead} className="ml-auto text-xs text-purple-soft">{t('profile.segnaTutte')}</button>}
      </div>
      <div className="flex-1 scrollable px-4 py-4">
        {notifications.length === 0
          ? <div className="text-center py-16"><p className="text-4xl mb-2">🔕</p><p className="text-muted text-sm">{t('profile.nessunaNotifica')}</p></div>
          : notifications.map(n => (
            <div key={n.id} className={`card mb-2 flex items-start gap-3 ${!n.read ? 'border-purple/30' : ''}`}>
              {!n.read && <div className="w-2 h-2 rounded-full bg-purple mt-1.5 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.read ? 'text-muted' : 'text-txt'}`}>{n.title}</p>
                <p className="text-xs text-muted mt-0.5">{n.body}</p>
                <p className="text-[10px] text-muted mt-1">{new Date(n.time).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )

  return (
    <div className="screen">
      <div className="px-5 pt-safe pt-4 pb-2 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-bold text-txt">{t('profile.titolo')}</h2>
        <button onClick={() => setShowNotifs(true)} className="relative p-2">
          <span className="text-2xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 min-w-[18px] h-[18px] bg-red text-white text-[9px] rounded-full flex items-center justify-center font-bold px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
              
            </span>
            
          )}
        </button>
      </div>
      

      <div className="flex-1 scrollable px-4 pb-8 space-y-4">
{/* Banner caffè */}
<a href="https://ko-fi.com/lefaremosapere" target="_blank" rel="noopener noreferrer"
  className="block w-full rounded-2xl px-4 py-3 text-center active:opacity-80 transition-all"
  style={{ background: 'linear-gradient(135deg, rgba(123,47,255,0.25), rgba(255,45,139,0.25))', border: '1px solid rgba(123,47,255,0.4)' }}>
  <p className="text-sm font-semibold text-txt">{t('profile.caffe')}</p>
  <p className="text-xs text-muted mt-0.5">{t('profile.caffeDesc')}</p>
</a>

        {/* Avatar + nome */}
        <div className="card flex items-center gap-4">
          {foto
            ? <img src={foto} alt={nome} className="w-16 h-16 rounded-full ring-2 ring-purple object-cover" />
            : <div className="w-16 h-16 rounded-full bg-purple flex items-center justify-center text-white text-2xl font-bold">{nome.charAt(0).toUpperCase()}</div>
          }
          <div className="flex-1 min-w-0">
            {editNome ? (
              <div className="flex gap-2 mb-1">
                <input className="input-field text-sm py-1 flex-1" value={nomeEdit} onChange={e => setNomeEdit(e.target.value)} placeholder={t('profile.tuoNome')} />
                <button onClick={() => { updateProfile({ nome: nomeEdit }); setEditNome(false) }} className="text-purple-soft text-sm font-medium">✓</button>
              </div>
            ) : (
              <button onClick={() => { setEditNome(true); setNomeEdit(nome) }} className="text-left w-full">
                <p className="font-bold text-txt text-lg">{nome} <span className="text-xs text-muted">✏️</span></p>
              </button>
            )}
            <p className="text-xs text-muted truncate">{user?.email}</p>
            
            {editBio ? (
              <div className="mt-1 flex gap-2">
                <input className="input-field text-xs py-1 flex-1" value={bio} onChange={e => setBio(e.target.value)} placeholder="Es: UX Designer" />
                <button onClick={() => { updateProfile({ bio_lavoro: bio }); setEditBio(false) }} className="text-purple-soft text-xs font-medium">✓</button>
              </div>
            ) : (
              <button onClick={() => setEditBio(true)} className="text-left">
                <p className="text-sm text-purple-soft italic mt-0.5">{profile?.bio_lavoro || t('profile.aggiungiBio')}</p>
              </button>
            )}
          </div>
        </div>

        {/* INFO CARD - UNA SOLA E PULITA */}
        <div className="card space-y-3">
          <div className="flex items-center mb-1">
            {/* Se t('profile.leTueInfo') non va, scriviamo direttamente il testo */}
            <SectionLabel>{t('profile.leInfoTitolo')}</SectionLabel>
          </div>

          {/* Genere */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{t('profile.genereTitolo') || 'Genere'}</span>
            <span className="text-xs text-txt font-medium">
              {profile?.genere === 'f' ? (t('profile.genderOptions.Donna') || 'Donna') : 
               profile?.genere === 'm' ? (t('profile.genderOptions.Uomo') || 'Uomo') : 
               (t('profile.nonSpecificato') || 'Non specificato')}
            </span>
          </div>

          {/* Età */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{t('profile.etaTitolo') || 'Età'}</span>
            <span className="text-xs text-txt font-medium">
              {profile?.eta || (t('profile.nonSpecificato') || 'Non specificato')}
            </span>
          </div>

          {/* Settore */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{t('profile.settoreTitolo') || 'Settore'}</span>
            <span className="text-xs text-txt font-medium text-right ml-4">
              {profile?.settore || (t('profile.nonSpecificato') || 'Non specificato')}
            </span>
          </div>

          {/* Come ci hai trovato */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{t('profile.comeTrovatoTitolo') || 'Fonte'}</span>
            <span className="text-xs text-txt font-medium text-right ml-4">
              {profile?.come_conosciuto || (t('profile.nonSpecificato') || 'Non specificato')}
            </span>
          </div>

          {/* Tasto Modifica in fondo */}
          <div className="pt-2 border-t border-white/5 flex justify-end">
            <button onClick={() => setEditInfoBase(true)} className="flex items-center gap-1.5 text-purple-soft font-bold text-xs active:scale-95 transition-all">
  <Edit2 size={12} />
  {t('profile.modificaInfoTitolo')}
</button>
          </div>
        </div>

        
{/* IL TUO LIVELLO */}
        <div className="card">
          <SectionLabel>{t('profile.tuoLivello')}</SectionLabel>
          <XpBar xp={xp} genere={profile?.genere} />
          {xp === 0 && (
            <button onClick={async () => {
              setRecalcLoading(true)
              const tot = await recalcXP()
              setRecalcLoading(false)
              if (tot !== undefined) alert(`✅ ${t('profile.xpTotali')}: ${tot}`)
            }} disabled={recalcLoading}
              className="text-xs text-muted border border-border rounded-full px-3 py-1 mt-1 active:scale-95">
              {recalcLoading ? t('profile.calcoloInCorso') : t('profile.ricalcolaXP')}
            </button>
          )}
          <div className="flex items-center mt-3">
            {streak > 1 && (
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🔥</span>
                <p className="text-sm font-bold text-amber">
                  {streak} {t('profile.giorniDiFila')}
                </p>
              </div>
            )}
            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-gold">{xp}</p>
              <p className="text-[10px] text-muted">{t('profile.xpTotali')}</p>
            </div>
          </div>
        </div>

        {/* Badge */}
        <div className="card">
          <SectionLabel>{t('profile.tuoiBadge')}</SectionLabel>
          <p className="text-xs text-muted mb-3">
            {earned.length}/{BADGES.length} {t('profile.badgeSbloccati')}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {BADGES.map(badge => {
              const isEarned = earned.includes(badge.id)
              return (
                <button key={badge.id} onClick={() => isEarned && setSelectedBadge(badge)}
                  className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all active:scale-95 ${isEarned ? 'border-transparent' : 'bg-surface border-border opacity-35'}`}
                  style={isEarned ? { background: badge.bg, borderColor: badge.color + '55' } : {}}>
                  {isEarned
                    ? <div className="w-10 h-10 mb-1 rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: badge.svg }} />
                    : <span className="text-2xl mb-1">🔒</span>
                  }
                  <p className="text-[9px] leading-tight" style={{ color: isEarned ? badge.color : '#6B7280' }}>
                    {isEarned ? getBadgeName(badge, profile?.genere, t) : '???'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Motto / Condividi */}
        <div className="card border-l-[3px] border-l-purple">
          <SectionLabel>{t('profile.condividi')}</SectionLabel>
          <p className="text-xs text-muted mb-3">{t('profile.condividiDesc')}</p>
          <button onClick={handleShare} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
            {t('profile.condividiBtn')}
          </button>
        </div>

        {/* Importa */}
        <div className="card">
          <SectionLabel>{t('profile.importa')}</SectionLabel>
          <p className="text-xs text-muted mb-3 leading-relaxed">{t('profile.importaDesc')}</p>
          <button onClick={downloadTemplate} className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm mb-3">
            {t('profile.scaricaTemplate')}
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
            {importing ? <><Spinner size={16} /> {t('profile.importazione')}</> : t('profile.caricaExcel')}
          </button>
          {importError && <p className="text-xs text-red mt-2">{importError}</p>}
          <p className="text-[10px] text-muted mt-2 text-center">{t('profile.supportaFormati')}</p>
        </div>

        {/* Preferenze */}
        <div className="card">
         <SectionLabel>{t('add.notifiche')} 🔔</SectionLabel>
          <div className="flex items-center justify-between py-2.5 border-b border-border">
            <div>
              <p className="text-sm font-medium text-txt">🌍 {t('profile.linguaLabel')}</p>
              <p className="text-xs text-muted">{ t('profile.cambiaLingua')}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { i18n.changeLanguage('it'); localStorage.setItem('lingua', 'it'); window.location.reload() }} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: i18n.language === 'it' ? 'linear-gradient(135deg, #7B2FFF, #FF2D8B)' : 'rgba(255,255,255,0.07)', color: 'white', border: i18n.language === 'it' ? 'none' : '1px solid rgba(255,255,255,0.15)' }}>🇮🇹 IT</button>
             <button onClick={() => { i18n.changeLanguage('en'); localStorage.setItem('lingua', 'en'); window.location.reload() }} className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: i18n.language === 'en' ? 'linear-gradient(135deg, #7B2FFF, #FF2D8B)' : 'rgba(255,255,255,0.07)', color: 'white', border: i18n.language === 'en' ? 'none' : '1px solid rgba(255,255,255,0.15)' }}>🇬🇧 EN</button>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium text-txt">🔔 {t('profile.notifichePush')}</p>
              <p className="text-xs text-muted">{ t('profile.notifichePushDesc')}</p>
            </div>
            <button
              onClick={() => { const v = !(profile?.notifiche_push_globali ?? true); if (v) requestNotificationPermission(); updateProfile({ notifiche_push_globali: v }) }}
              className={`w-12 h-6 rounded-full transition-all duration-200 relative flex-shrink-0 ${(profile?.notifiche_push_globali ?? true) ? 'bg-purple' : 'bg-border'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${(profile?.notifiche_push_globali ?? true) ? 'left-[26px]' : 'left-0.5'}`} />
            </button>
          </div>
          {/* Stato permesso notifiche */}
          {typeof Notification !== 'undefined' && (() => {
            const perm = Notification.permission
            if (perm === 'granted') return (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-xs font-semibold text-green-400">{t('profile.notificheAttive')}</p>
                  <p className="text-[10px] text-muted">{t('profile.notificheAttiveDesc')}</p>
                </div>
              </div>
            )
            if (perm === 'denied') return (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <span className="text-lg">🔕</span>
                  <div>
                    <p className="text-xs font-semibold text-red-400">{t('profile.notificheBlocccate')}</p>
                    <p className="text-[10px] text-muted">{t('profile.notificheBloccateDesc')}</p>
                  </div>
                </div>
                <button onClick={() => {
                  if (/android/i.test(navigator.userAgent)) window.open('intent://settings#Intent;scheme=android-app;end', '_blank')
                  else alert('Vai in Impostazioni → App → Le faremo sapere → Notifiche → Abilita')
                }} className="w-full py-2.5 rounded-xl text-xs font-semibold border border-border text-muted active:scale-95 transition-all">
                  {t('profile.apriImpostazioni')}
                </button>
              </div>
            )
            return (
              <button onClick={async () => {
                const ok = await requestNotificationPermission()
                if (ok) updateProfile({ notifiche_push_globali: true })
              }} className="w-full mt-2 py-3 rounded-xl text-sm font-semibold active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)', color: 'white' }}>
                {t('profile.abilitaNotifiche')}
              </button>
            )
          })()}
          <p className="text-[10px] text-muted mt-1 leading-relaxed">{t('profile.avvisoPWA')}</p>
        </div>

        {/* Archivio */}
        {(() => {
          const archiviate = tutteLeCandidature.filter(c => c.archiviata)
          if (archiviate.length === 0) return null
          return (
            <div className="card space-y-2">
              <button onClick={() => setShowArchive(v => !v)}
                className="w-full flex items-center justify-between py-1">
                <SectionLabel>📦 ARCHIVIO ({archiviate.length})</SectionLabel>
                <span className="text-muted text-xs">{showArchive ? '▲ chiudi' : '▼ mostra'}</span>
              </button>
              {showArchive && (
                <div className="space-y-2 pt-1">
                  {archiviate.map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-2 py-2 border-t border-border/50">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-txt truncate">{c.azienda}</p>
                        <p className="text-xs text-muted truncate">{c.ruolo}</p>
                      </div>
                      <button
                        onClick={() => updateCandidatura(c.id, { archiviata: false })}
                        className="flex-shrink-0 text-xs text-purple-soft border border-purple/40 px-3 py-1.5 rounded-full active:scale-95 transition-all">
                        Ripristina
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Referral */}
        <div className="card">


          <SectionLabel>{t('profile.privacy')}</SectionLabel>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between py-2 text-sm text-txt active:opacity-70">
            <span>Privacy Policy</span><span className="text-muted">→</span>
          </a>
          <div className="border-t border-border" />
          <p className="text-[10px] text-muted mt-2 leading-relaxed">
            {t('profile.privacyDesc')}
          </p>
        </div>

        {/* Supporto */}
        <div className="card space-y-2">
          <SectionLabel>SUPPORTO</SectionLabel>
          <a href="mailto:lefaremosapereapp@gmail.com" className="flex items-center gap-2 py-2 text-sm text-txt">{t('profile.feedback')}</a>
          <div className="border-t border-border" />
          <p className="text-xs text-muted text-center pt-1">{t('profile.versione')}</p>
        </div>
{/* Account */}
        {isGuest ? (
          <div className="space-y-3 pb-4">
            <button onClick={() => setShowGuestModal(true)}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #7B2FFF, #FF2D8B)' }}>
              {t('profile.creaAccount')}
            </button>
            <button onClick={async () => { await signOut() }}
              className="w-full py-3 rounded-2xl border font-semibold text-sm active:scale-95 transition-all"
              style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
              {t('profile.esciOspite')}
            </button>
          </div>
        ) : user ? (
          <div className="space-y-3 pb-4">
            <button onClick={() => setConfirmSignOut(true)}
              className="w-full py-3 rounded-2xl border font-semibold text-sm active:scale-95 transition-all"
              style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
              {t('profile.esciAccount')}
            </button>
            <button onClick={() => setConfirmDelete(true)} className="btn-danger w-full py-3">
              {t('profile.eliminaAccount')}
            </button>
          </div>
        ) : null}
      </div> {/* CHIUSURA DEL DIV flex-1 CHE È INIZIATO SOPRA (probabilmente riga 278) */}

      {/* MODALS (Fuori dal flusso scrollabile, ma dentro il div principale screen) */}
      {editInfoBase && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setEditInfoBase(false)}>
          <div className="w-full bg-surface rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full bg-border mx-auto mb-4" />
            
            <p className="font-bold text-txt mb-4">{t('profile.modificaInfoTitolo')}</p>

            <p className="text-xs text-muted mb-2 font-semibold uppercase">{t('profile.genereTitolo')}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {GENERI.map(g => (
                <button key={g.value} onClick={() => setInfoGenere(g.value)}
                  className={`py-3 rounded-xl text-xs font-semibold border transition-all active:scale-95 flex items-center gap-2 px-3
                    ${infoGenere === g.value ? 'border-purple bg-purple/20 text-purple-soft' : 'border-border text-muted bg-surface/50'}`}>
                  <span>{g.emoji}</span>
                  <span>{t(`profile.genderOptions.${g.label}`)}</span>
                </button>
              ))}
            </div>

            <p className="text-xs text-muted mb-2 font-semibold uppercase">{t('profile.genereTitolo')}</p>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {GENERI.map(g => (
                <button key={g.value} onClick={() => setInfoGenere(g.value)}
                  className={`py-4 px-3 rounded-2xl border-2 transition-all flex items-center gap-3
                    ${infoGenere === g.value 
                      ? 'border-purple-main bg-purple-main/20 text-white' 
                      : 'border-white/10 text-muted bg-white/5'}`}>
                  <span className="text-xl">{g.emoji}</span>
                  <span className="font-bold">{t(`profile.genderOptions.${g.label}`)}</span>
                </button>
              ))}
            </div>

            {/* ETÀ */}
            <p className="text-xs text-muted mb-2 font-semibold uppercase">{t('profile.etaTitolo')}</p>
            <input className="input-field w-full mb-6 py-4 rounded-2xl" type="number" placeholder="26"
              value={infoEta} onChange={e => setInfoEta(e.target.value)} />

            {/* SETTORE */}
            <p className="text-xs text-muted mb-2 font-semibold uppercase">{t('profile.settoreTitolo')}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {SETTORI.map(s => (
                <button key={s} onClick={() => setInfoSettore(s)}
                  className={`py-3 px-5 rounded-3xl border-2 font-bold transition-all
                    ${infoSettore === s 
                      ? 'border-white bg-transparent text-white' 
                      : 'border-white/20 text-muted bg-white/5'}`}>
                  {t(`profile.sectorOptions.${s}`) || s}
                </button>
              ))}
            </div>

            {/* COME HAI TROVATO L'APP (FONTE) */}
            <p className="text-xs text-muted mb-2 font-semibold uppercase">{t('profile.comeTrovatoTitolo')}</p>
            <div className="grid grid-cols-2 gap-2 mb-8">
              {FONTI.map(f => {
                const translationKey = f === 'Amico/a' ? 'Amici' : f;
                return (
                  <button key={f} onClick={() => setInfoFonte(f)}
                    className={`py-4 px-3 rounded-2xl border-2 font-bold transition-all
                      ${infoFonte === f 
                        ? 'border-purple-main bg-purple-main/20 text-white' 
                        : 'border-white/10 text-muted bg-white/5'}`}>
                    {t(`profile.sourceAppOptions.${translationKey}`) || f}
                  </button>
                );
              })}
            </div>

            {/* BOTTONE SALVA VIOLA */}
            <button 
              onClick={async () => {
                const finalSettore = infoSettore === 'Altro' ? infoSettoreCustom : infoSettore;
                await updateProfile({
                  genere: infoGenere,
                  eta: infoEta ? parseInt(infoEta) : null,
                  settore: finalSettore,
                  come_conosciuto: infoFonte
                });
                setEditInfoBase(false);
              }} 
              className="btn-primary w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <span>💾</span>
              {t('profile.salva')}
            </button>
          </div>
        </div>
      )}

      {/* Altri dialog di conferma */}
      <ConfirmDialog isOpen={confirmSignOut} title={t('profile.confermaEsci')} onConfirm={() => signOut()} onCancel={() => setConfirmSignOut(false)} />
      <ConfirmDialog isOpen={confirmDelete} title={t('profile.confermaElimina')} onConfirm={handleDeleteAccount} onCancel={() => setConfirmDelete(false)} danger />

    </div> 
  );
}