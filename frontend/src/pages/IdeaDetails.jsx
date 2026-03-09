import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import TopNav from "../components/TopNav.jsx";

function InsightList({ title, items }) {
  return (
    <article className="detail-card">
      <h3>{title}</h3>
      <ul className="insight-list">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </article>
  );
}

export default function IdeaDetails() {
  const { ideaId } = useParams();
  const [idea, setIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.get(`/ideas/${ideaId}`), api.get(`/comments/${ideaId}`)])
      .then(([ideaData, commentData]) => {
        if (isMounted) {
          setIdea(ideaData);
          setComments(commentData);
        }
      })
      .catch((requestError) => isMounted && setError(requestError.message))
      .finally(() => isMounted && setIsLoading(false));

    return () => {
      isMounted = false;
    };
  }, [ideaId]);

  async function submitComment(event) {
    event.preventDefault();
    setCommentError("");
    setIsSubmittingComment(true);

    try {
      const newComment = await api.post(`/comments/${ideaId}`, { text: commentText });
      setComments((current) => [...current, newComment]);
      setCommentText("");
    } catch (requestError) {
      setCommentError(requestError.message);
    } finally {
      setIsSubmittingComment(false);
    }
  }

  if (isLoading) return <main className="page-shell narrow-shell"><TopNav /><p className="muted-copy">Loading idea details...</p></main>;
  if (error || !idea) return <main className="page-shell narrow-shell"><TopNav /><p className="form-error">{error || "Idea not found"}</p></main>;

  const { analysis } = idea;

  return (
    <main className="page-shell">
      <TopNav />
      <div className="section-heading page-top-gap">
        <div>
          <p className="eyebrow">{analysis.industry}</p>
          <h1>{idea.title}</h1>
          <p className="lead">{idea.description}</p>
          {idea.author ? <p className="muted-copy">Created by <Link className="text-link" to={`/profile/${idea.author.id}`}>{idea.author.name}</Link></p> : null}
        </div>
        <Link className="text-link" to="/dashboard">Back to dashboard</Link>
      </div>

      <section className="detail-hero">
        <article className="score-panel"><span>Startup strength score</span><strong>{analysis.score}/100</strong><p>{analysis.verdict}</p></article>
        <article className="score-panel"><span>Risk level</span><strong>{analysis.riskLevel}</strong><p>{analysis.summary}</p></article>
        <article className="score-panel"><span>Estimated launch budget</span><strong>{analysis.budget.range}</strong><p>Based on build complexity, compliance, and go-to-market needs.</p></article>
      </section>

      <section className="details-grid">
        <article className="detail-card"><h3>Market snapshot</h3><p>{analysis.market.startupActivity}</p><p>{analysis.market.capitalSignal}</p><p>{analysis.market.hotspot}</p></article>
        <article className="detail-card"><h3>Budget breakdown</h3><ul className="insight-list">{analysis.budget.breakdown.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article className="detail-card full-width"><h3>Competitors</h3><div className="competitor-grid">{analysis.competitors.map((competitor) => <div className="competitor-card" key={competitor.name}><strong>{competitor.name}</strong><span>{competitor.industry}</span><p>{competitor.focus}</p><small>{competitor.fundingSignal}</small></div>)}{analysis.competitors.length === 0 ? <p className="muted-copy">No close matches found in the dataset.</p> : null}</div></article>
        <InsightList title="Key risks" items={analysis.risks} />
        <InsightList title="Initial problems" items={analysis.initialProblems} />
        <InsightList title="Founder advice" items={analysis.advice} />
        <article className="detail-card full-width">
          <h3>Community feedback</h3>
          <form className="comment-form" onSubmit={submitComment}>
            <textarea rows="4" placeholder="Share a suggestion, challenge an assumption, or recommend an early experiment." value={commentText} onChange={(event) => setCommentText(event.target.value)} required />
            {commentError ? <p className="form-error">{commentError}</p> : null}
            <button type="submit" disabled={isSubmittingComment}>{isSubmittingComment ? "Posting..." : "Post feedback"}</button>
          </form>
          <div className="comment-list">
            {comments.length === 0 ? <p className="muted-copy">No comments yet. Be the first person to add a useful founder note.</p> : comments.map((comment) => (
              <article className="comment-card" key={comment.id}>
                <div className="comment-head">
                  <strong><Link className="text-link" to={`/profile/${comment.user?.id}`}>{comment.user?.name || "Community member"}</Link></strong>
                  <span>{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p>{comment.text}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
