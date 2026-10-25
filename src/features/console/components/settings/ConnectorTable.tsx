"use client";

import { ConnectorLogo } from "@/features/console/components/settings/ConnectorLogo";
import { ConnectorStatus } from "@/features/console/components/settings/ConnectorStatus";
import { ActionGroup } from "@/features/console/components/ui/ActionGroup";
import { Chip } from "@/features/console/components/ui/Chip";
import { Table } from "@/features/console/components/ui/Table";
import type { Connector } from "@/features/console/content/connectors";
import { useConnected } from "@/features/console/hooks/use-connected";
import { useToast } from "@/features/console/hooks/use-toast";
import { connectorsStore } from "@/features/console/lib/connectors-store";
import { cx } from "@/lib/cx";

type ConnectorTableProps = { items: readonly Connector[]; onOpen: (c: Connector) => void; compact?: boolean };

/** Integrations as a table: name, description, category, status and actions. */
export function ConnectorTable({ items, onOpen, compact }: ConnectorTableProps) {
  const say = useToast();
  const connected = useConnected();
  return (
    <Table fit label={compact ? "Payment providers" : "Integrations"} className={cx(!compact && "x-ctbl")}>
      <thead>
        <tr>
          <th scope="col">Integration</th>
          <th scope="col">Description</th>
          <th scope="col">Category</th>
          <th scope="col" className="r">
            <span className="sr-only">Action</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((c) => {
          const on = connected.has(c.key);
          return (
            <tr key={c.key} className="is-link" onClick={() => onOpen(c)}>
              <td>
                <button
                  type="button"
                  className="x-in"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(c);
                  }}
                >
                  <ConnectorLogo connector={c} size="s" />
                  <span className="x-ink">{c.name}</span>
                  {on && <span className="x-on" title="Connected"></span>}
                </button>
              </td>
              <td>{c.description}</td>
              <td>
                <Chip>{c.category}</Chip>
              </td>
              <td className="r">
                <span className="x-in">
                  {on && <ConnectorStatus />}
                  <ActionGroup
                    row
                    label={`More for ${c.name}`}
                    actions={on ? ["Manage", "Disconnect"] : ["Connect"]}
                    onAction={(a) => {
                      if (a === "Disconnect") {
                        connectorsStore.set(c.key, false);
                        say(`${c.name} disconnected`);
                      } else if (a === "Manage") say(`Opening ${c.name} settings`);
                      else onOpen(c);
                    }}
                  />
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
