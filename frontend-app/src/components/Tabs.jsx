
import { useState } from "react";

export default function Tabs({ tabs }) {
  const [active, setActive] = useState(Object.keys(tabs)[0]);
  return (
    <div>
      <div style={{ display: "flex", gap: "1rem" }}>
        {Object.keys(tabs).map((tab) => (
          <button key={tab} onClick={() => setActive(tab)}>
            {tab}
          </button>
        ))}
      </div>
      <div style={{ marginTop: "1rem" }}>{tabs[active]}</div>
    </div>
  );
}