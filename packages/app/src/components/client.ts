import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import save from "save-file";
import { Client, Transport } from "@quicktake-200/client";

type ThumbData = Awaited<ReturnType<Client["downloadThumbnail"]>>;
type Version = Awaited<ReturnType<Client["getSoftwareVersion"]>>;

export type PictureData = Partial<ThumbData> & {
  name: string;
  size: number;
};

export enum ClientPhase {
  Idle = "Idle",
  Connect = "Connecting to the camera",
  GetVersion = "Getting software version",
  GetPicturesNumber = "Getting pictures metadata",
  GetPicturesThumbs = "Getting thumbnails",
  Ready = "Ready",
  Downloading = "Downloading",
}

type Store = {
  isConnected: boolean;
  version: Version | null;
  pictures: PictureData[];
  phase: ClientPhase;
};

/** QuickTake Client Wrapper for web app */
export class QTClient {
  constructor(private client: Client) {}

  private _store = createStore<Store>({
    isConnected: false,
    version: null,
    pictures: [],
    phase: ClientPhase.Idle,
  });

  public get store(): Store {
    const [getter] = this._store;
    return getter;
  }

  private getStoreSetter() {
    const [, setter] = this._store;
    return setter;
  }

  /** Initializes camera connection and obtains initial data */
  public async init() {
    const setStore = this.getStoreSetter();
    try {
      setStore("phase", ClientPhase.Connect);
      await this.client.connect();
      setStore("isConnected", true);

      setStore("phase", ClientPhase.GetVersion);
      const version = await this.client.getSoftwareVersion();
      setStore("version", version);
    } catch (error) {
      setStore("phase", ClientPhase.Idle);
      setStore("isConnected", false);
      console.error(error);
      alert("Cannot initialize camera connection");
    }

    if (this.store.isConnected) {
      try {
        await this.populatePictures();
      } catch (error) {
        console.error(error);
        setStore("phase", ClientPhase.Idle);
        setStore("isConnected", false);
        alert("Cannot get pictures");
      }
    }
  }

  /** Downloads image */
  public async download(index: number, name: string) {
    const setStore = this.getStoreSetter();
    try {
      setStore("phase", ClientPhase.Downloading);
      const image = await this.client.downloadImage(index);

      await save(image, name);

      setStore("phase", ClientPhase.Ready);
    } catch (error) {
      console.error(error);
      alert("Cannot download image");
    }
  }

  /** Creates list of images and downloads thumbs */
  private async populatePictures() {
    const setStore = this.getStoreSetter();
    setStore("phase", ClientPhase.GetPicturesNumber);
    const picturesNumber = await this.client.getPicturesNumber();

    // Get initial pictures data
    for (let i = 1; i <= picturesNumber; i++) {
      const name = await this.client.getPictureName(i);
      const size = await this.client.getPictureSize(i);
      const initialData: PictureData = {
        name,
        size,
      };

      setStore("pictures", i - 1, initialData);
    }

    // Populate with thumbs data
    setStore("phase", ClientPhase.GetPicturesThumbs);
    for (let i = 1; i <= picturesNumber; i++) {
      const thumb = await this.client.downloadThumbnail(i);
      setStore("pictures", i - 1, thumb);
    }

    setStore("phase", ClientPhase.Ready);
  }

  /** Singleton instance */
  static _instance = createSignal<QTClient | null>(null);

  static get instance() {
    const [getter] = this._instance;
    return getter();
  }

  static set instance(instance: QTClient | null) {
    const [, setter] = this._instance;
    setter(instance);
  }

  /** Creates store with camera connection */
  static async create() {
    let port: SerialPort | null = null;
    try {
      port = await Transport.getPort();
      const transport = new Transport(port);
      const client = new Client(transport);
      this.instance = new QTClient(client);
      await this.instance.init();
    } catch (error) {
      await port?.close();
      throw error;
    }
  }
}
