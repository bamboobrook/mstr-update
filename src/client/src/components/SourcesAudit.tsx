import { Database } from "lucide-react";
import type { SourceStatus } from "../../../shared/types";
import { dateTime } from "../format";
import { Panel } from "./Panel";

interface SourcesAuditProps {
  sources: SourceStatus[];
}

/** Source-audit grid: each data source with a status dot, confidence label, and retrieval time. */
export function SourcesAudit({ sources }: SourcesAuditProps) {
  return (
    <Panel title="来源审计" subtitle="Sources Audit" icon={<Database size={16} />}>
      <div className="source-grid">
        {sources.slice(0, 12).map((item) => (
          <a
            href={item.sourceUrl.startsWith("http") ? item.sourceUrl : undefined}
            key={item.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            <span className={`status-dot status-${item.status}`} />
            <strong>{item.label}</strong>
            <span className="source-meta">
              <em>{item.confidence}</em>
              <span>{dateTime(item.retrievedAt)}</span>
            </span>
          </a>
        ))}
      </div>
    </Panel>
  );
}
