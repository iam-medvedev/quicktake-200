import { Show } from "solid-js";
import { QTClient } from "./client";

/** Camera's metadata */
export function MetaList() {
  return (
    <Show when={QTClient.instance?.store.isConnected && QTClient.instance}>
      {(client) => (
        <ul id="meta-list">
          <li>
            <small>
              <b>Status</b> <span>Connected</span>
            </small>
          </li>
          <li>
            <small>
              <b>Version</b>{" "}
              <span>
                {client().store.version?.version},{" "}
                {client().store.version?.camera}
              </span>
            </small>
          </li>
          <li>
            <small>
              <b>Pictures</b> <span>{client().store.pictures.length}</span>
            </small>
          </li>
        </ul>
      )}
    </Show>
  );
}
