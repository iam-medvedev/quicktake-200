import type { Buffer } from "buffer";
import { For, Show, Switch, Match, createSignal } from "solid-js";
import prettyBytes from "pretty-bytes";
import { QTClient, type PictureData, ClientPhase } from "./client";

type PictureProps = {
  index: number;
  data: PictureData;
};

/** Returns base64 url for given thumbnail buffer */
function getThumbSrc(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

/** Picture card */
function Picture(props: PictureProps) {
  const [isDownloading, setIsDownloading] = createSignal(false);
  async function download() {
    setIsDownloading(true);
    try {
      await QTClient.instance?.download(props.index, props.data.name);
    } finally {
      setIsDownloading(false);
    }
  }
  return (
    <div class="picture-card">
      <div
        classList={{
          "picture-card-thumb": true,
          empty: !props.data.thumb,
        }}
      >
        <Show when={props.data.thumb}>
          {(thumb) => <img src={getThumbSrc(thumb(), "image/png")} />}
        </Show>
      </div>
      <div class="picture-card-footer">
        <small>
          {props.data.name}
          <br />
          {prettyBytes(props.data.size)}
        </small>
        <span>
          <button
            class="btn"
            disabled={QTClient.instance?.store.phase !== ClientPhase.Ready}
            onClick={download}
          >
            <Switch>
              <Match when={isDownloading()}>
                <span>...</span>
              </Match>
              <Match when={!isDownloading()}>
                <span>Download</span>
              </Match>
            </Switch>
          </button>
        </span>
      </div>
    </div>
  );
}

/** Pictures grid */
export function Pictures() {
  const titleClass = () =>
    QTClient.instance?.store.isConnected ? "title-bar" : "inactive-title-bar";

  return (
    <Show when={QTClient.instance?.store.isConnected && QTClient.instance}>
      {(client) => (
        <div id="pictures" class="window">
          <div class={titleClass()}>
            <h1 class="title">Pictures</h1>
          </div>
          <div class="separator"></div>

          <div class="window-pane">
            <div id="pictures-grid">
              <For each={client().store.pictures}>
                {(data, i) => <Picture index={i() + 1} data={data} />}
              </For>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
