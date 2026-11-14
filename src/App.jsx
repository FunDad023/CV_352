import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowUpRight, Check, CheckCheck, ChevronDown, CircleHelp,
  MessageCircle, MoreHorizontal, Plus, Search, Send, ShieldCheck, Smile,
  UserPlus, Users, X,
} from 'lucide-react'
import { supabase } from './lib/supabase.js'

const initials = (person) => (person?.display_name || person?.username || 'NC')
  .split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
const displayName = (person) => person?.display_name || person?.username || 'Người dùng'
const formatClock = (date) => date ? new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(date)) : ''
const formatDay = (date) => {
  if (!date) return ''
  const value = new Date(date)
  return value.toDateString() === new Date().toDateString()
    ? formatClock(value)
    : new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(value)
}

function Avatar({ person, size = 'normal', online = false }) {
  return <span className={`avatar avatar-${size}`} aria-label={displayName(person)}>
    {person?.avatar_url ? <img src={person.avatar_url} alt="" /> : initials(person)}
    {online && <i className="online-dot" />}
  </span>
}

function Brand({ light = false }) {
  return <a className={`brand ${light ? 'brand-light' : ''}`} href="#home" aria-label="Nhịp Cầu">
    <span className="brand-mark"><MessageCircle size={21} fill="currentColor" /></span>
    <span>nhịp cầu<span className="brand-period">.</span></span>
  </a>
}

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true); setNotice(''); setError('')
    try {
      if (mode === 'signup') {
        const cleanUsername = username.trim().toLowerCase()
        if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
          throw new Error('Tên người dùng cần có 3–24 ký tự: chữ thường, số hoặc dấu gạch dưới.')
        }
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { username: cleanUsername, display_name: name.trim() || cleanUsername } },
        })
        if (signupError) throw signupError
        if (!data.session) setNotice('Tài khoản đã được tạo. Hãy kiểm tra email để xác nhận rồi đăng nhập nhé.')
        else setNotice('Tạo tài khoản thành công. Chào mừng bạn đến với Nhịp Cầu!')
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (loginError) throw loginError
      }
    } catch (err) { setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.') }
    finally { setBusy(false) }
  }

  return <main className="auth-page">
    <div className="auth-orb orb-one" /><div className="auth-orb orb-two" />
    <div className="auth-layout">
      <section className="auth-intro">
        <Brand light />
        <div className="intro-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> KHÔNG GIAN CỦA BẠN</span>
          <h1>Gần nhau hơn,<br /><span>qua từng câu chuyện.</span></h1>
          <p>Một góc nhỏ để bạn giữ liên lạc, chia sẻ những điều thường ngày và luôn tìm thấy nhau.</p>
        </div>
        <div className="intro-footer"><div className="avatar-stack"><span>MA</span><span>LT</span><span>HQ</span><span>+</span></div><span>Những cuộc trò chuyện<br />bắt đầu từ đây.</span></div>
        <span className="intro-watermark">NC.</span>
      </section>
      <section className="auth-card-wrap">
        <div className="auth-card">
          <div className="auth-mobile-brand"><span className="brand-mark"><MessageCircle size={20} fill="currentColor" /></span> nhịp cầu<span className="brand-period">.</span></div>
          <div className="auth-heading"><span className="auth-kicker">{mode === 'login' ? 'CHÀO MỪNG TRỞ LẠI' : 'BẮT ĐẦU KẾT NỐI'}</span><h2>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2><p>{mode === 'login' ? 'Đăng nhập để tiếp tục câu chuyện của bạn.' : 'Tạo một tài khoản nhỏ, mở ra thật nhiều kết nối.'}</p></div>
          <div className="auth-toggle" role="tablist" aria-label="Chọn hình thức">
            <button className={mode === 'login' ? 'selected' : ''} onClick={() => { setMode('login'); setError(''); setNotice('') }}>Đăng nhập</button>
            <button className={mode === 'signup' ? 'selected' : ''} onClick={() => { setMode('signup'); setError(''); setNotice('') }}>Đăng ký</button>
          </div>
          <form onSubmit={submit} className="auth-form">
            {mode === 'signup' && <>
              <label>Tên hiển thị<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên bạn bè sẽ nhìn thấy" maxLength={48} /></label>
              <label>Tên người dùng<div className="input-prefix"><span>@</span><input required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ten_cua_ban" maxLength={24} autoComplete="username" /></div></label>
            </>}
            <label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@email.com" autoComplete="email" /></label>
            <label>Mật khẩu<input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ít nhất 6 ký tự" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
            {error && <div className="form-message error-message">{error}</div>}{notice && <div className="form-message success-message">{notice}</div>}
            <button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}<ArrowUpRight size={17} /></button>
          </form>
          <div className="auth-assurance"><ShieldCheck size={15} /> Cuộc trò chuyện của bạn được bảo vệ riêng tư</div>
        </div>
        <div className="auth-footnote">Bằng việc tiếp tục, bạn đồng ý sử dụng Nhịp Cầu một cách văn minh và an toàn.</div>
      </section>
    </div>
  </main>
}

function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [outgoingIds, setOutgoingIds] = useState([])
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [tab, setTab] = useState('chats')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchNotice, setSearchNotice] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [pageError, setPageError] = useState('')
  const [showDetails, setShowDetails] = useState(true)
  const messageEndRef = useRef(null)
  const user = session?.user

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthReady(true) })
    return () => listener.subscription.unsubscribe()
  }, [])

  const loadDashboard = useCallback(async (userId) => {
    const [myProfile, friendshipRows, incomingRows, outgoingRows, conversationRows] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('friendships').select('user_low,user_high').or(`user_low.eq.${userId},user_high.eq.${userId}`),
      supabase.from('friend_requests').select('id,sender_id,created_at').eq('receiver_id', userId).eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('friend_requests').select('receiver_id').eq('sender_id', userId).eq('status', 'pending'),
      supabase.from('conversations').select('id,participant_low,participant_high,created_at').or(`participant_low.eq.${userId},participant_high.eq.${userId}`).order('created_at', { ascending: false }),
    ])
    for (const result of [myProfile, friendshipRows, incomingRows, outgoingRows, conversationRows]) if (result.error) throw result.error
    const friendIds = (friendshipRows.data || []).map((row) => row.user_low === userId ? row.user_high : row.user_low)
    const requestIds = (incomingRows.data || []).map((row) => row.sender_id)
    const conversationPeerIds = (conversationRows.data || []).map((row) => row.participant_low === userId ? row.participant_high : row.participant_low)
    const ids = [...new Set([...friendIds, ...requestIds, ...conversationPeerIds])]
    let peerRows = []
    if (ids.length) {
      const { data, error } = await supabase.from('profiles').select('id,username,display_name,avatar_url,bio').in('id', ids)
      if (error) throw error
      peerRows = data || []
    }
    const peerMap = Object.fromEntries(peerRows.map((person) => [person.id, person]))
    setProfile(myProfile.data)
    setFriends(friendIds.map((id) => peerMap[id]).filter(Boolean))
    setRequests((incomingRows.data || []).map((row) => ({ ...row, sender: peerMap[row.sender_id] })).filter((row) => row.sender))
    setOutgoingIds((outgoingRows.data || []).map((row) => row.receiver_id))
    let latestMessages = {}
    const conversationIds = (conversationRows.data || []).map((row) => row.id)
    if (conversationIds.length) {
      const { data, error } = await supabase.from('messages').select('conversation_id,content,created_at,sender_id').in('conversation_id', conversationIds).order('created_at', { ascending: false })
      if (error) throw error
      for (const message of data || []) if (!latestMessages[message.conversation_id]) latestMessages[message.conversation_id] = message
    }
    setConversations((conversationRows.data || []).map((row) => {
      const peerId = row.participant_low === userId ? row.participant_high : row.participant_low
      return { ...row, peer: peerMap[peerId], lastMessage: latestMessages[row.id] }
    }).filter((row) => row.peer))
  }, [])

  useEffect(() => {
    if (!user) {
      setProfile(null); setFriends([]); setRequests([]); setOutgoingIds([]); setConversations([]); setMessages([]); setActiveConversation(null)
      return
    }
    let cancelled = false
    setPageError('')
    loadDashboard(user.id).catch((error) => { if (!cancelled) setPageError(error.message || 'Không thể tải dữ liệu tài khoản.') })
    return () => { cancelled = true }
  }, [user?.id, loadDashboard])

  useEffect(() => {
    if (!activeConversation) return undefined
    let alive = true
    setLoadingMessages(true)
    supabase.from('messages').select('*').eq('conversation_id', activeConversation.id).order('created_at', { ascending: true }).limit(200)
      .then(({ data, error }) => {
        if (!alive) return
        if (error) setPageError(error.message); else setMessages(data || [])
        setLoadingMessages(false)
      })
    const channel = supabase.channel(`messages-${activeConversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConversation.id}` }, (payload) => {
        setMessages((current) => current.some((message) => message.id === payload.new.id) ? current : [...current, payload.new])
        setConversations((current) => current.map((conversation) => conversation.id === activeConversation.id ? { ...conversation, lastMessage: payload.new } : conversation))
      }).subscribe()
    return () => { alive = false; supabase.removeChannel(channel) }
  }, [activeConversation?.id])

  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages])

  const title = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'Nhịp Cầu'
  const selectedPeer = activeConversation?.peer

  const doSearch = async (event) => {
    event?.preventDefault()
    const term = query.trim()
    setSearchNotice('')
    if (!term) { setSearchResults([]); return }
    setSearching(true)
    try {
      const [byUsername, byName] = await Promise.all([
        supabase.from('profiles').select('id,username,display_name,avatar_url,bio').ilike('username', `%${term}%`).neq('id', user.id).limit(10),
        supabase.from('profiles').select('id,username,display_name,avatar_url,bio').ilike('display_name', `%${term}%`).neq('id', user.id).limit(10),
      ])
      if (byUsername.error) throw byUsername.error
      if (byName.error) throw byName.error
      const results = new Map([...(byUsername.data || []), ...(byName.data || [])].map((person) => [person.id, person]))
      setSearchResults([...results.values()])
      if (!results.size) setSearchNotice('Chưa tìm thấy ai phù hợp. Thử tên người dùng hoặc tên hiển thị nhé.')
    } catch (error) { setSearchNotice(error.message || 'Không thể tìm kiếm lúc này.') }
    finally { setSearching(false) }
  }

  const sendFriendRequest = async (person) => {
    setSearchNotice('')
    if (friends.some((friend) => friend.id === person.id)) { setSearchNotice('Hai bạn đã là bạn bè rồi.'); return }
    const { error } = await supabase.from('friend_requests').insert({ sender_id: user.id, receiver_id: person.id })
    if (error) setSearchNotice(error.code === '23505' ? 'Đã có lời mời đang chờ giữa hai bạn.' : error.message)
    else {
      setOutgoingIds((current) => current.includes(person.id) ? current : [...current, person.id])
      setSearchNotice(`Đã gửi lời mời kết bạn đến ${displayName(person)}.`)
    }
  }

  const respondRequest = async (requestId, status) => {
    const { error } = await supabase.from('friend_requests').update({ status }).eq('id', requestId)
    if (error) { setPageError(error.message); return }
    await loadDashboard(user.id)
  }

  const openChat = async (peer) => {
    if (!peer || !user) return
    setPageError(''); setTab('chats'); setMessages([])
    const [participant_low, participant_high] = [user.id, peer.id].sort()
    const { error: createError } = await supabase.from('conversations').upsert(
      { participant_low, participant_high }, { onConflict: 'participant_low,participant_high', ignoreDuplicates: true },
    )
    if (createError) { setPageError(createError.message); return }
    const { data, error } = await supabase.from('conversations').select('*').eq('participant_low', participant_low).eq('participant_high', participant_high).single()
    if (error) { setPageError(error.message); return }
    setActiveConversation({ ...data, peer }); setShowDetails(false)
    setConversations((current) => current.some((item) => item.id === data.id) ? current : [{ ...data, peer }, ...current])
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !activeConversation || sending) return
    setSending(true); setDraft('')
    const { data, error } = await supabase.from('messages').insert({ conversation_id: activeConversation.id, sender_id: user.id, content }).select().single()
    if (error) { setDraft(content); setPageError(error.message) }
    else {
      setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data])
      setConversations((current) => current.map((item) => item.id === data.conversation_id ? { ...item, lastMessage: data } : item))
    }
    setSending(false)
  }

  const shownConversations = useMemo(() => [...conversations].sort((a, b) => new Date(b.lastMessage?.created_at || b.created_at) - new Date(a.lastMessage?.created_at || a.created_at)), [conversations])
  const friendIds = useMemo(() => new Set(friends.map((friend) => friend.id)), [friends])

  if (!authReady) return <div className="loading-screen"><span className="loader-mark"><MessageCircle size={22} fill="currentColor" /></span><span>Đang mở Nhịp Cầu…</span></div>
  if (!session) return <AuthScreen />

  return <main className="app-shell">
    <header className="topbar">
      <Brand />
      <div className="topbar-center"><span className="topbar-greeting">Chào bạn, <strong>{title}</strong></span><span className="topbar-divider" /><span className="topbar-date">Một ngày dễ thương để kết nối</span></div>
      <div className="topbar-actions"><button className="icon-button quiet-button" title="Trợ giúp" aria-label="Trợ giúp"><CircleHelp size={18} /></button><span className="topbar-separator" /><button className="profile-menu" onClick={() => supabase.auth.signOut()} title="Đăng xuất"><Avatar person={profile || { display_name: title }} size="small" /><span className="profile-name">{title}</span><ChevronDown size={15} /></button></div>
    </header>

    <div className="workspace">
      <aside className="sidebar">
        <div className="sidebar-heading"><div><span className="eyebrow muted-eyebrow">KHÔNG GIAN CỦA BẠN</span><h1>Kết nối</h1></div><button className="icon-button aqua-icon" onClick={() => { setTab('people'); setQuery(''); setSearchResults([]) }} aria-label="Thêm bạn" title="Thêm bạn"><Plus size={19} /></button></div>
        <div className="sidebar-tabs" role="tablist"><button className={tab === 'chats' ? 'active' : ''} onClick={() => setTab('chats')}><MessageCircle size={16} />Tin nhắn<span>{conversations.length || ''}</span></button><button className={tab === 'people' ? 'active' : ''} onClick={() => setTab('people')}><Users size={16} />Bạn bè<span>{friends.length || ''}</span></button></div>
        {tab === 'people' && <form className="people-search" onSubmit={doSearch}><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm bạn bằng tên…" /><button type="submit" aria-label="Tìm kiếm" disabled={searching}>{searching ? '…' : <ArrowUpRight size={16} />}</button></form>}
        {pageError && <div className="inline-alert"><span>{pageError}</span><button onClick={() => setPageError('')} aria-label="Đóng"><X size={14} /></button></div>}
        {tab === 'chats' ? <div className="sidebar-content">
          {requests.length > 0 && <section className="request-section"><div className="section-title"><span>LỜI MỜI KẾT BẠN</span><span className="count-badge">{requests.length}</span></div>{requests.slice(0, 3).map((request) => <div className="request-card" key={request.id}><Avatar person={request.sender} size="small" /><div className="request-copy"><strong>{displayName(request.sender)}</strong><span>@{request.sender.username} muốn kết bạn</span></div><button className="request-accept" onClick={() => respondRequest(request.id, 'accepted')} title="Chấp nhận"><Check size={15} /></button><button className="request-decline" onClick={() => respondRequest(request.id, 'declined')} title="Từ chối"><X size={14} /></button></div>)}</section>}
          <div className="section-title chat-section-title"><span>GẦN ĐÂY</span><button onClick={() => { setTab('people'); setQuery(''); setSearchResults([]) }}><Plus size={14} /> Tạo mới</button></div>
          {shownConversations.length ? <div className="conversation-list">{shownConversations.map((conversation) => <button className={`conversation-item ${activeConversation?.id === conversation.id ? 'selected' : ''}`} key={conversation.id} onClick={() => { setActiveConversation(conversation); setShowDetails(false) }}><Avatar person={conversation.peer} /><span className="conversation-info"><span className="conversation-title"><strong>{displayName(conversation.peer)}</strong><time>{formatDay(conversation.lastMessage?.created_at || conversation.created_at)}</time></span><span className="conversation-preview">{conversation.lastMessage?.sender_id === user.id ? 'Bạn: ' : ''}{conversation.lastMessage?.content || 'Bắt đầu cuộc trò chuyện'}</span></span></button>)}</div> : <div className="sidebar-empty"><span className="empty-chat-icon"><MessageCircle size={20} /></span><strong>Chưa có cuộc trò chuyện</strong><p>Kết nối với bạn bè để bắt đầu nhắn tin.</p><button onClick={() => setTab('people')}>Tìm bạn <ArrowUpRight size={14} /></button></div>}
        </div> : <div className="sidebar-content people-content">
          {searchResults.length > 0 ? <><div className="section-title"><span>KẾT QUẢ TÌM KIẾM</span><span>{searchResults.length}</span></div>{searchNotice && <p className="search-notice">{searchNotice}</p>}{searchResults.map((person) => <div className="person-row" key={person.id}><Avatar person={person} /><div className="person-copy"><strong>{displayName(person)}</strong><span>@{person.username}</span></div>{friendIds.has(person.id) ? <button className="friend-status" title="Đã là bạn"><Check size={16} /></button> : outgoingIds.includes(person.id) ? <button className="friend-status" title="Đang chờ phản hồi"><CheckCheck size={16} /></button> : <button className="add-friend-button" onClick={() => sendFriendRequest(person)} title="Gửi lời mời kết bạn"><UserPlus size={17} /></button>}</div>)}</> : query.trim() ? <div className="search-empty"><Search size={21} /><p>{searching ? 'Đang tìm kiếm…' : searchNotice || 'Nhấn Enter để tìm kiếm mọi người.'}</p></div> : <>
            {requests.length > 0 && <section className="request-section people-requests"><div className="section-title"><span>LỜI MỜI ĐANG CHỜ</span><span className="count-badge">{requests.length}</span></div>{requests.map((request) => <div className="request-card" key={request.id}><Avatar person={request.sender} size="small" /><div className="request-copy"><strong>{displayName(request.sender)}</strong><span>@{request.sender.username}</span></div><button className="request-accept" onClick={() => respondRequest(request.id, 'accepted')} title="Chấp nhận"><Check size={15} /></button><button className="request-decline" onClick={() => respondRequest(request.id, 'declined')} title="Từ chối"><X size={14} /></button></div>)}</section>}
            <div className="section-title"><span>BẠN BÈ</span><span>{friends.length}</span></div>
            {friends.length ? friends.map((friend) => <button className="person-row person-clickable" key={friend.id} onClick={() => openChat(friend)}><Avatar person={friend} /><div className="person-copy"><strong>{displayName(friend)}</strong><span>@{friend.username}</span></div><MessageCircle className="person-message-icon" size={17} /></button>) : <div className="sidebar-empty compact-empty"><span className="empty-chat-icon"><Users size={20} /></span><strong>Chưa có bạn bè</strong><p>Tìm người quen qua tên hiển thị hoặc username.</p></div>}
          </>}
        </div>}
        <div className="sidebar-bottom"><div className="privacy-note"><span><ShieldCheck size={15} /></span><div><strong>Không gian riêng tư</strong><small>Chỉ bạn và bạn bè xem được tin nhắn.</small></div></div><div className="sidebar-bottom-brand"><span>NHỊP CẦU</span><span>v1.0 · Kết nối thật gần</span></div></div>
      </aside>

      <section className={`chat-panel ${activeConversation ? 'has-chat' : ''}`}>
        {activeConversation ? <>
          <header className="chat-header"><button className="mobile-back icon-button" onClick={() => setActiveConversation(null)} aria-label="Quay lại"><ArrowLeft size={18} /></button><Avatar person={selectedPeer} /><div className="chat-peer"><strong>{displayName(selectedPeer)}</strong><span><i className="status-dot" /> Bạn bè · @{selectedPeer?.username}</span></div><div className="chat-header-actions"><span className="chat-encrypted"><ShieldCheck size={14} /> Riêng tư</span><button className="icon-button" onClick={() => setShowDetails((value) => !value)} aria-label="Thông tin bạn bè"><MoreHorizontal size={20} /></button></div></header>
          <div className="message-area"><div className="date-divider"><span>HÔM NAY</span></div>
            {loadingMessages ? <div className="messages-loading"><span className="mini-loader" />Đang tải tin nhắn…</div> : messages.length ? <div className="message-list">{messages.map((message, index) => {
              const mine = message.sender_id === user.id
              const previous = messages[index - 1]
              const grouped = previous?.sender_id === message.sender_id && new Date(message.created_at) - new Date(previous.created_at) < 5 * 60 * 1000
              return <div key={message.id} className={`message-row ${mine ? 'mine' : 'theirs'} ${grouped ? 'grouped' : ''}`}>
                {!mine && !grouped && <Avatar person={selectedPeer} size="tiny" />}{!mine && grouped && <span className="message-avatar-spacer" />}
                <div className="message-bubble-wrap"><div className="message-bubble">{message.content}</div><div className="message-meta"><time>{formatClock(message.created_at)}</time>{mine && <CheckCheck size={13} />}</div></div>
              </div>
            })}<div ref={messageEndRef} /></div> : <div className="first-message"><span className="first-message-spark">✳</span><span className="eyebrow muted-eyebrow">MỌI CUỘC TRÒ CHUYỆN ĐỀU CÓ ĐIỂM BẮT ĐẦU</span><h2>Gửi lời chào đến<br /><span>{displayName(selectedPeer)} nhé.</span></h2><p>Một tin nhắn nhỏ có thể mở đầu cho một câu chuyện thật vui.</p><div className="suggested-messages"><button onClick={() => setDraft('Chào bạn! Dạo này bạn thế nào?')}>Chào bạn! <span>↗</span></button><button onClick={() => setDraft('Rất vui được kết nối với bạn 😊')}>Rất vui được kết nối! <span>↗</span></button></div></div>}
          </div>
          <form className="composer" onSubmit={sendMessage}><div className="composer-box"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(event) } }} placeholder={`Nhắn tin cho ${displayName(selectedPeer)}…`} rows={1} maxLength={4000} /><div className="composer-tools"><span className="composer-hint">Enter để gửi · Shift + Enter xuống dòng</span><div><button type="button" className="icon-button composer-icon" title="Biểu tượng cảm xúc" onClick={() => setDraft((value) => `${value}${value ? ' ' : ''}😊`)}><Smile size={18} /></button><button className="send-button" type="submit" disabled={!draft.trim() || sending}><Send size={16} /><span>Gửi</span></button></div></div></div><p className="composer-disclaimer">Hãy tử tế với nhau — những cuộc trò chuyện đẹp bắt đầu từ đó.</p></form>
        </> : <div className="welcome-panel"><div className="welcome-decoration decoration-a" /><div className="welcome-decoration decoration-b" /><div className="welcome-content"><div className="welcome-art"><span className="welcome-ring ring-1" /><span className="welcome-ring ring-2" /><span className="welcome-chat-bubble"><MessageCircle size={43} fill="currentColor" /></span><span className="welcome-spark spark-a">✳</span><span className="welcome-spark spark-b">✦</span><span className="welcome-leaf">〰</span></div><span className="eyebrow muted-eyebrow">MỘT GÓC NHỎ CỦA BẠN</span><h2>Những câu chuyện<br />đẹp bắt đầu <span>từ đây.</span></h2><p>Chọn một cuộc trò chuyện bên trái hoặc tìm bạn mới để kết nối nhé.</p><button className="primary-button welcome-action" onClick={() => { setTab('people'); setQuery(''); setSearchResults([]) }}><UserPlus size={16} />Tìm và kết bạn</button><div className="welcome-caption"><span>✦</span> Kết nối thật gần, dù ở bất cứ đâu.</div></div><div className="welcome-footer"><span>NHỊP CẦU · KHÔNG GIAN KẾT NỐI CỦA BẠN</span><span>BUILT FOR CONVERSATIONS</span></div></div>}
      </section>

      {activeConversation && showDetails && <aside className="details-panel"><div className="details-heading"><span>THÔNG TIN</span><button className="icon-button" onClick={() => setShowDetails(false)} aria-label="Đóng thông tin"><X size={17} /></button></div><div className="detail-profile"><Avatar person={selectedPeer} size="large" /><h2>{displayName(selectedPeer)}</h2><span>@{selectedPeer?.username}</span><p>{selectedPeer?.bio || 'Thành viên Nhịp Cầu'}</p></div><div className="detail-rule" /><div className="detail-card"><div className="detail-card-icon"><ShieldCheck size={17} /></div><div><strong>Cuộc trò chuyện riêng tư</strong><p>Chỉ hai bạn có thể xem nội dung tin nhắn này.</p></div></div><div className="detail-card"><div className="detail-card-icon soft-icon"><MessageCircle size={17} /></div><div><strong>Đã kết nối</strong><p>Hai bạn đã là bạn bè trên Nhịp Cầu.</p></div></div><div className="details-bottom"><ShieldCheck size={15} /> Cài đặt cuộc trò chuyện <ChevronDown size={15} /></div></aside>}
    </div>
  </main>
}

export default App
