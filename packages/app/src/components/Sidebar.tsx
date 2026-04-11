import { Switch, Match, Show } from "solid-js";
import { QTClient, ClientPhase } from "./client";
import { MetaList } from "./MetaList";
import { ConnectButton } from "./ConnectButton";
import { Tridot } from "./Tridot";

/** Apps sidebar */
export function Sidebar() {
  return (
    <div id="sidebar" class="window">
      <div class="title-bar">
        <h1 class="title">Apple QuickTake 200</h1>
      </div>
      <div class="separator"></div>

      <div class="window-pane" style={{ overflow: "initial" }}>
        <Switch>
          <Match when={QTClient.instance?.store.isConnected}>
            <MetaList />
          </Match>
          <Match when={!QTClient.instance?.store.isConnected}>
            <ConnectButton />
          </Match>
        </Switch>
      </div>

      <Show when={QTClient.instance}>
        {(client) => (
          <div class="details-bar details-bar-status">
            <small>
              <span>
                {client().store.phase}
                <Show
                  when={
                    ![ClientPhase.Ready, ClientPhase.Idle].includes(
                      client().store.phase,
                    )
                  }
                >
                  <Tridot />
                </Show>
              </span>
            </small>
          </div>
        )}
      </Show>
      <div class="details-bar">
        <small>
          <a href="/">Source code</a>
        </small>
      </div>
    </div>
  );
}
