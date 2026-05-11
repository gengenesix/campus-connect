import Link from "next/link"

export default function AboutPage() {
  return (
    <main style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 20px" }}>
      <h1 style={{ fontSize: "56px", fontFamily: '"Archivo Black"', marginBottom: "24px", color: "#111", lineHeight: "1.1" }}>
        About Campus <span style={{ color: "#1B5E20" }}>Connect</span>
      </h1>

      <p style={{ fontSize: "20px", color: "#666", marginBottom: "40px", lineHeight: "1.6" }}>
        Campus Connect is a free, student-to-student peer-to-peer marketplace for students across all 43 Ghanaian universities. Buy and sell goods or book services from fellow students — no commission, no hidden fees, just pure community support.
      </p>

      {/* How It Works */}
      <section style={{ marginBottom: "60px" }}>
        <h2 style={{ fontSize: "36px", fontFamily: '"Archivo Black"', marginBottom: "32px", color: "#111" }}>How It Works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {[
            { num: "1", title: "Browse", desc: "Explore goods and services listed by fellow campus students. Filter by category, condition, and price." },
            { num: "2", title: "Connect", desc: "Message sellers or service providers directly. No intermediaries. Direct peer-to-peer communication." },
            { num: "3", title: "Exchange", desc: "Arrange a meetup on campus. Inspect, negotiate, and complete the deal — safely and fairly." },
          ].map((step) => (
            <div key={step.num} style={{ border: "2px solid #111", padding: "24px", boxShadow: "4px 4px 0 #111" }}>
              <div style={{ fontFamily: '"Archivo Black"', fontSize: "48px", color: "#1B5E20", marginBottom: "16px" }}>{step.num}</div>
              <h3 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" }}>{step.title}</h3>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Campus Connect */}
      <section style={{ marginBottom: "60px", background: "#f9f9f9", padding: "40px", border: "2px solid #111" }}>
        <h2 style={{ fontSize: "36px", fontFamily: '"Archivo Black"', marginBottom: "32px", color: "#111" }}>Why Campus Connect?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {[
            "100% Free — No commission, no hidden fees, no subscription",
            "Community First — Built by students, for students across Ghana",
            "Safe Trading — Rate and review sellers after transactions",
            "Direct Messaging — Real-time chat with buyers and providers",
            "Easy Listing — Post goods or services in under 2 minutes",
            "43 Universities — Every accredited university in Ghana on one platform",
          ].map((feature) => (
            <div key={feature} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <span style={{ fontFamily: '"Archivo Black"', fontSize: "18px", color: "#1B5E20", flexShrink: 0 }}>✓</span>
              <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.6 }}>{feature}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: "60px" }}>
        <h2 style={{ fontSize: "36px", fontFamily: '"Archivo Black"', marginBottom: "32px", color: "#111" }}>Frequently Asked Questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { q: "Is Campus Connect really free?", a: "Yes — 100% free. No commission, no hidden fees. We believe students should help each other without profit in between." },
            { q: "How do I know I'm trading with a real student?", a: "All users must sign up with a valid email. The community rating system helps build trust — always meet in safe, public campus locations." },
            { q: "What if something goes wrong with a transaction?", a: "Check the Safety Tips section below. For serious issues, contact us. We're building a dispute resolution system soon." },
            { q: "Can I sell anything?", a: "No. Illegal items, weapons, and counterfeit goods are not allowed. Check our community guidelines before posting." },
            { q: "How do I price my item?", a: "Browse similar listings to understand market value. Be realistic and fair — good pricing means faster sales." },
          ].map((faq, idx) => (
            <details key={idx} style={{ border: "2px solid #111", padding: "16px" }}>
              <summary style={{ fontWeight: "bold", fontSize: "16px", cursor: "pointer", color: "#111" }}>
                {faq.q}
              </summary>
              <p style={{ fontSize: "14px", color: "#666", marginTop: "12px", lineHeight: "1.6" }}>{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Safety Tips */}
      <section style={{ background: "#1B5E20", color: "#fff", padding: "40px", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "36px", fontFamily: '"Archivo Black"', marginBottom: "24px", color: "#fff" }}>Safety Tips</h2>
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", listStyle: "none", padding: 0 }}>
          {[
            "Always meet in public campus locations — library, plaza, or student center",
            "Inspect items thoroughly before payment. Photos can be deceiving.",
            "Use in-app messaging for negotiations rather than sharing phone numbers upfront.",
            "Trust your gut. If something feels off, walk away.",
            "Negotiate fairly. Remember they are also a student like you.",
            "Rate honestly after each transaction — your feedback protects the community.",
          ].map((tip) => (
            <li key={tip} style={{ fontSize: "14px", paddingLeft: "24px", position: "relative", lineHeight: "1.6" }}>
              <span style={{ position: "absolute", left: 0 }}>✓</span>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "36px", fontFamily: '"Archivo Black"', marginBottom: "24px", color: "#111" }}>Ready to Join?</h2>
        <p style={{ fontSize: "16px", color: "#666", marginBottom: "32px" }}>
          Start buying, selling, or offering services across Ghana's campus community today. 100% free.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/goods" style={{ padding: "16px 40px", background: "#111", color: "#fff", fontFamily: '"Archivo Black"', fontSize: "14px", textDecoration: "none", border: "2px solid #111", boxShadow: "4px 4px 0 #888" }}>
            BROWSE GOODS
          </Link>
          <Link href="/services" style={{ padding: "16px 40px", background: "#1B5E20", color: "#fff", fontFamily: '"Archivo Black"', fontSize: "14px", textDecoration: "none", border: "2px solid #1B5E20", boxShadow: "4px 4px 0 #888" }}>
            FIND SERVICES
          </Link>
          <Link href="/auth/register" style={{ padding: "16px 40px", background: "#5d3fd3", color: "#fff", fontFamily: '"Archivo Black"', fontSize: "14px", textDecoration: "none", border: "2px solid #5d3fd3", boxShadow: "4px 4px 0 #888" }}>
            JOIN FREE →
          </Link>
        </div>
      </section>
    </main>
  )
}
