"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ChevronLeft, Clipboard, Mail, MessageSquareText, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import feedbackCategories from "./categories.json";

const categories = feedbackCategories as readonly string[];
const feedbackEmail = process.env.NEXT_PUBLIC_FEEDBACK_EMAIL?.trim() || "hello@fathersbusinessmasteryresources.com";

export default function FeedbackPage() {
  const [passageOrResource, setPassageOrResource] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [message, setMessage] = useState("");
  const [optionalEmail, setOptionalEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get("category");
    const requestedContext = params.get("context")?.trim();
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      if (requestedCategory && categories.includes(requestedCategory)) {
        setCategory(requestedCategory);
      }
      if (requestedContext) {
        setPassageOrResource(requestedContext.slice(0, 500));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const feedbackText = useMemo(
    () => [
      `Passage/resource: ${passageOrResource.trim() || "(not provided)"}`,
      `Category: ${category}`,
      `Message: ${message.trim() || "(no message yet)"}`,
      `Email: ${optionalEmail.trim() || "(not provided)"}`,
    ].join("\n"),
    [category, message, optionalEmail, passageOrResource],
  );
  const feedbackMailto = useMemo(() => {
    const subjectContext = passageOrResource.trim() || "Bible study app";
    return `mailto:${feedbackEmail}?subject=${encodeURIComponent(`[${category}] ${subjectContext}`)}&body=${encodeURIComponent(feedbackText)}`;
  }, [category, feedbackText, passageOrResource]);

  async function copyFeedback() {
    try {
      await navigator.clipboard.writeText(feedbackText);
      setCopied(true);
      return true;
    } catch {
      setCopied(false);
      return false;
    }
  }

  async function submitFeedback() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setSubmitMessage("Please write a short message before sending feedback.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        const didCopy = await copyFeedback();
        setSubmitMessage(didCopy
          ? "Direct delivery is not configured in this build. Your report was copied; use Email Feedback to send it."
          : "Direct delivery is not configured in this build. Use Email Feedback to send your report.");
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error } = await supabase.from("beta_feedback").insert({
        passage_or_resource: passageOrResource.trim() || null,
        category,
        message: trimmedMessage,
        optional_email: optionalEmail.trim() || null,
      });

      if (error) {
        throw error;
      }

      setSubmitMessage("Feedback sent to the private beta queue. Thank you for helping make the app better.");
      setMessage("");
      setCopied(false);
    } catch {
      const didCopy = await copyFeedback();
      setSubmitMessage(didCopy
        ? "Direct delivery failed. Your report was copied; use Email Feedback to send it."
        : "Direct delivery failed. Use Email Feedback to send your report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--page)] text-[var(--ink)]">
      <div className="mx-auto min-h-screen w-full max-w-3xl bg-[var(--paper)] px-4 pb-12 pt-5 shadow-2xl shadow-stone-950/10 md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-[1.75rem] md:border md:border-stone-200 md:p-8">
        <div className="sticky top-0 z-10 -mx-4 border-b border-[var(--line)] bg-[var(--paper)]/95 px-4 pb-4 pt-2 backdrop-blur md:static md:mx-0 md:border-0 md:p-0">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--green)] shadow-sm"
            href="/"
          >
            <ChevronLeft size={17} />
            Back to Bible
          </Link>
        </div>

        <section className="mt-5 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-[var(--green)]">
            <MessageSquareText size={24} />
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">Beta Feedback &amp; Resource Partnerships</h1>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Report a problem, suggest an improvement, or begin a conversation about an author, ministry, or publisher resource.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {["Bug report", "Resource issue", "Audio issue", "Author / publisher partnership"].map((item) => (
              <button
                key={`feedback-shortcut-${item}`}
                className={`rounded-2xl border px-3 py-2 text-left text-xs font-semibold ${
                  category === item
                    ? "border-[var(--green)] bg-[var(--green)] text-white"
                    : "border-[var(--line)] bg-[var(--paper)] text-[var(--green)]"
                }`}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <form className="mt-4 space-y-4" onSubmit={(event) => event.preventDefault()}>
          <label className="block rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <span className="text-sm font-semibold text-[var(--green)]">Passage or resource being viewed</span>
            <input
              className="mt-3 h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-base outline-none"
              placeholder="John 3:16, Amos 1-4, Pilgrim's Progress..."
              maxLength={500}
              value={passageOrResource}
              onChange={(event) => setPassageOrResource(event.target.value)}
            />
          </label>

          <label className="block rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <span className="text-sm font-semibold text-[var(--green)]">Category</span>
            <select
              className="mt-3 h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-base outline-none"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <span className="text-sm font-semibold text-[var(--green)]">Message</span>
            <textarea
              className="mt-3 min-h-36 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-base leading-6 outline-none"
              placeholder="What worked, what confused you, or what should be improved?"
              maxLength={5000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>

          <label className="block rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <span className="text-sm font-semibold text-[var(--green)]">Optional email</span>
            <input
              className="mt-3 h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-base outline-none"
              placeholder="Only if you want a follow-up"
              maxLength={320}
              type="email"
              value={optionalEmail}
              onChange={(event) => setOptionalEmail(event.target.value)}
            />
          </label>
        </form>

        <section className="mt-4 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <button
            className="mr-2 inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
            disabled={isSubmitting}
            onClick={submitFeedback}
            type="button"
          >
            <Send size={16} />
            {isSubmitting ? "Sending..." : "Send Feedback"}
          </button>
          <button
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold text-[var(--ink)] sm:mt-0"
            onClick={copyFeedback}
            type="button"
          >
            <Clipboard size={16} />
            Copy Feedback
          </button>
          <a
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold text-[var(--ink)] sm:ml-2"
            href={feedbackMailto}
          >
            <Mail size={16} />
            Email Feedback
          </a>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {submitMessage || (copied ? `Feedback copied. Email it to ${feedbackEmail}.` : `Send to the private beta queue or email ${feedbackEmail}.`)}
          </p>
        </section>

        <nav className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--line)] pt-5 text-sm font-semibold text-[var(--green)]" aria-label="Legal and support pages">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/rights">Content rights</Link>
          <Link href="/support">Support</Link>
        </nav>
      </div>
    </main>
  );
}
