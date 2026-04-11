import { createSignal, onCleanup } from "solid-js";

/** Tridot loader */
export function Tridot() {
  const [count, setCount] = createSignal(0);

  const interval = setInterval(() => {
    setCount((c) => (c + 1) % 4);
  }, 800);

  onCleanup(() => clearInterval(interval));

  return <span>{".".repeat(count())}</span>;
}
