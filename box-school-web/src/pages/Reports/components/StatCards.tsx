import React from "react";
import type { StatCard } from "../types";

export default function StatCards(props: { items: StatCard[] }) {
  const { items } = props;
  if (!items?.length) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
      {items.map((c, i) => (
        <div key={i} className="card" style={{ padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "rgba(0,0,0,.55)" }}>{c.label}</div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900 }}>{c.value}</div>
          {c.hint ? <div style={{ marginTop: 6, fontSize: 12, color: "rgba(0,0,0,.55)" }}>{c.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
