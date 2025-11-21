import { createCustomElement, Props } from "@dathomir/core";
import { signal } from "@dathomir/core/reactivity";

export const {
  MyTimerElement,
  MyTimer
} = createCustomElement({
  tagName: "my-timer",
  props: {
    location: Props.Union(["JST", "UTC"]),
    unit: Props.Union(["seconds", "minutes"]),
    initValue: Props.Number()
  },
  emits: {
    "another-event": (event: CustomEventInit<{ info: string }>) => event
  },
  render: ({ onConnected, defineShadow, props, emit }) => {
    const count = signal(new Date().toLocaleString());
    const connectedState = signal("disconnected");
    const constantText = "Hello, World!";
    const { location } = props;

    const clickCount = signal(0);

    const handleClick = () => {
      clickCount.set(prev => prev + 1);
    }

    defineShadow(() => ({
      mode: "open"
    }));

    setInterval(() => {
      count.set(() => new Date().toLocaleString());
    }, 1000);

    onConnected(async () => {
      const asyncTest = async () => {
        await new Promise((resolve) => {
          setTimeout(() => {
            console.log("Async operation completed");
            emit("another-event", { detail: { info: count.value } });
            connectedState.set("connected");
            resolve(0);
          }, 2000);
        })
      }

      await asyncTest();
    });

    onConnected(() => {
      console.log("Second onConnected callback");
    });

    return (
      <div style={{
        border: "1px dashed green",
        padding: "8px",
        marginTop: "8px"
      }}>
        <style>
          {"p { margin: 4px; }"}
        </style>
        <p>{count.value}</p>
        <p>{connectedState.value}</p>
        <p>{constantText}</p>
        <p>{location.value}</p>
        <button onClick={handleClick}>{clickCount.value}</button>
      </div>
    )
  }
})