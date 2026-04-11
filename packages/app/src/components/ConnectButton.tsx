import { Switch, Match, createSignal } from "solid-js";
import { QTClient } from "./client";

/** Camera connection button */
export function ConnectButton() {
  const [isConnecting, setIsConnecting] = createSignal(false);

  async function onCreateClient() {
    setIsConnecting(true);

    try {
      await QTClient.create();
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <div id="connect-button-wrapper">
      <button class="btn" onClick={onCreateClient} disabled={isConnecting()}>
        <Switch>
          <Match when={isConnecting()}>
            <span>Connecting...</span>
          </Match>
          <Match when={!isConnecting()}>
            <span>Choose camera</span>
          </Match>
        </Switch>
      </button>
    </div>
  );
}
