import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import TopNav from "../components/TopNav.jsx";

export default function Messages() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function loadConversations(targetUserId) {
    api.get("/messages/conversations")
      .then((data) => {
        setConversations(data);
        const conversationTarget = targetUserId || data[0]?.otherUser?.id;
        if (conversationTarget) {
          return api.get(`/messages/with/${conversationTarget}`);
        }
        return null;
      })
      .then((conversationData) => {
        if (conversationData) {
          setActiveConversation(conversationData);
        }
      })
      .catch((requestError) => setError(requestError.message));
  }

  useEffect(() => {
    loadConversations(userId);
  }, [userId]);

  async function openConversation(targetUserId) {
    navigate(`/messages/${targetUserId}`);
    const conversationData = await api.get(`/messages/with/${targetUserId}`);
    setActiveConversation(conversationData);
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!activeConversation?.otherUser?.id) return;
    await api.post(`/messages/with/${activeConversation.otherUser.id}`, { text: draft });
    setDraft("");
    const refreshed = await api.get(`/messages/with/${activeConversation.otherUser.id}`);
    setActiveConversation(refreshed);
    loadConversations(activeConversation.otherUser.id);
  }

  return (
    <main className="page-shell">
      <TopNav />
      <div className="section-heading page-top-gap">
        <div>
          <p className="eyebrow">Founder inbox</p>
          <h1>Private conversations with accepted connections</h1>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="messaging-layout">
        <aside className="detail-card">
          <h3>Conversations</h3>
          <div className="founder-list">
            {conversations.length === 0 ? <p className="muted-copy">Accept a connection to start messaging.</p> : conversations.map((conversation) => (
              <button key={conversation.otherUser.id} className="founder-card founder-button" type="button" onClick={() => openConversation(conversation.otherUser.id)}>
                <strong>{conversation.otherUser.name}</strong>
                <span>{conversation.otherUser.headline}</span>
                <small>{conversation.lastMessage.text}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="detail-card full-height-card">
          {!activeConversation ? <p className="muted-copy">Pick a founder to open the conversation.</p> : (
            <>
              <div className="section-heading compact-heading">
                <div>
                  <p className="eyebrow">Chatting with</p>
                  <h3>{activeConversation.otherUser.name}</h3>
                </div>
              </div>

              <div className="chat-thread">
                {activeConversation.messages.map((message) => (
                  <div key={message.id} className={message.senderId === JSON.parse(localStorage.getItem("user") || "{}").id ? "chat-bubble own" : "chat-bubble"}>
                    {message.text}
                  </div>
                ))}
              </div>

              <form className="comment-form" onSubmit={sendMessage}>
                <textarea rows="3" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." required />
                <button type="submit">Send message</button>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
