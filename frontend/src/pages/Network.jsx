import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import TopNav from "../components/TopNav.jsx";

export default function Network() {
  const [data, setData] = useState({ pendingIncoming: [], pendingOutgoing: [], connections: [], suggestions: [] });
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  function loadNetwork() {
    return api.get("/connections")
      .then((payload) => {
        setData(payload);
        setError("");
      })
      .catch((requestError) => setError(requestError.message));
  }

  useEffect(() => {
    loadNetwork();
  }, []);

  async function sendRequest(userId) {
    try {
      setBusyId(userId);
      await api.post(`/connections/request/${userId}`, {});
      setData((current) => ({
        ...current,
        suggestions: current.suggestions.filter((founder) => founder.id !== userId),
        pendingOutgoing: [
          ...current.pendingOutgoing,
          {
            id: `pending-${userId}`,
            receiver: current.suggestions.find((founder) => founder.id === userId)
          }
        ]
      }));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function acceptRequest(connectionId) {
    try {
      setBusyId(connectionId);
      await api.post(`/connections/accept/${connectionId}`, {});
      setData((current) => {
        const acceptedRequest = current.pendingIncoming.find((request) => request.id === connectionId);
        return {
          ...current,
          pendingIncoming: current.pendingIncoming.filter((request) => request.id !== connectionId),
          connections: acceptedRequest
            ? [...current.connections, { id: connectionId, user: acceptedRequest.requester }]
            : current.connections
        };
      });
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function declineRequest(connectionId) {
    try {
      setBusyId(connectionId);
      await api.post(`/connections/decline/${connectionId}`, {});
      setData((current) => ({
        ...current,
        pendingIncoming: current.pendingIncoming.filter((request) => request.id !== connectionId)
      }));
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="page-shell">
      <TopNav />
      <div className="section-heading page-top-gap">
        <div>
          <p className="eyebrow">Founder network</p>
          <h1>Connect with founders, builders, and future collaborators</h1>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <section className="details-grid network-grid">
        <article className="detail-card full-width">
          <h3>Incoming requests</h3>
          <div className="founder-list">
            {data.pendingIncoming.length === 0 ? <p className="muted-copy">No incoming requests.</p> : data.pendingIncoming.map((request) => (
              <div key={request.id} className="founder-card action-card">
                <strong>{request.requester?.name}</strong>
                <span>{request.requester?.headline}</span>
                <div className="action-row">
                  <Link className="text-link" to={`/profile/${request.requester?.id}`}>View profile</Link>
                  <button type="button" disabled={busyId === request.id} onClick={() => acceptRequest(request.id)}>{busyId === request.id ? "Accepting..." : "Accept"}</button>
                  <button className="ghost-button" type="button" disabled={busyId === request.id} onClick={() => declineRequest(request.id)}>{busyId === request.id ? "Working..." : "Decline"}</button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="detail-card">
          <h3>Your connections</h3>
          <div className="founder-list">
            {data.connections.length === 0 ? <p className="muted-copy">No accepted connections yet.</p> : data.connections.map((connection) => (
              <Link key={connection.id} className="founder-card" to={`/messages/${connection.user?.id}`}>
                <strong>{connection.user?.name}</strong>
                <span>{connection.user?.headline}</span>
                <small>Open conversation</small>
              </Link>
            ))}
          </div>
        </article>

        <article className="detail-card">
          <h3>Pending sent requests</h3>
          <div className="founder-list">
            {data.pendingOutgoing.length === 0 ? <p className="muted-copy">No outgoing requests.</p> : data.pendingOutgoing.map((request) => (
              <div key={request.id} className="founder-card">
                <strong>{request.receiver?.name}</strong>
                <span>{request.receiver?.headline}</span>
                <small>Awaiting response</small>
              </div>
            ))}
          </div>
        </article>

        <article className="detail-card full-width">
          <h3>Suggested founders</h3>
          <div className="founder-grid">
            {data.suggestions.map((founder) => (
              <div key={founder.id} className="founder-card action-card">
                <strong>{founder.name}</strong>
                <span>{founder.headline}</span>
                <small>{founder.location}</small>
                <p>{founder.bio}</p>
                <div className="tag-row">
                  {founder.interests?.slice(0, 4).map((interest) => <span className="tag-chip" key={interest}>{interest}</span>)}
                </div>
                <div className="action-row">
                  <Link className="text-link" to={`/profile/${founder.id}`}>View profile</Link>
                  <button type="button" disabled={busyId === founder.id} onClick={() => sendRequest(founder.id)}>{busyId === founder.id ? "Sending..." : "Connect"}</button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
