import { ShieldCheck } from "lucide-react";
import { Panel } from "./Panel";

const items = [
  "MSTR 普通股 ATM 能不能继续卖",
  "优先股 ATM 能不能继续卖",
  "可转债能不能续再融资",
  "BTC 下跌时市场还愿不愿意提供资金"
];

/** The four key variables to monitor — preserved from the original design. */
export function WatchList() {
  return (
    <Panel title="真正要盯的 4 个变量" subtitle="Key Variables to Watch" icon={<ShieldCheck size={16} />}>
      <div className="watch-list">
        {items.map((text, index) => (
          <div className="watch-item" key={text}>
            <strong>{index + 1}</strong>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
