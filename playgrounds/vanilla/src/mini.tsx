import { computed, effect, signal } from "@ailuros/core/reactivity";
import { Fragment } from "@ailuros/core/runtime";
import { createCustomElement, Props } from "@ailuros/core";

const {
  MyTimerElement,
  MyTimer
} = createCustomElement({
  tagName: "my-timer",
  props: {
    location: Props.Union(["JST", "UTC"]),
    unit: Props.Union(["seconds", "minutes"]),
    initValue: Props.Number()
  },
  render: ({ onConnected, defineShadow, props }) => {
    const count = signal(new Date().toLocaleString());
    const connectedState = signal("disconnected");
    const constantText = "Hello, World!";

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
      <Fragment>
        <div>{count.value}</div>
        <div>{connectedState.value}</div>
        <div>{constantText}</div>
        <div>{props.location.value}</div>
      </Fragment>
    )
  }
})

customElements.define("my-timer", MyTimerElement);

const MyButton = computed(() => () => {
    const count = signal(0);

    const handleClick = () => {
      count.set(prev => prev + 1);
    }

    return (
      <button onClick={handleClick}>
        Clicked {count.value} times
      </button>
    );
})

const count = signal(0);

setInterval(() => {
  count.set(prev => prev + 1);
}, 1000);

const location = signal<"JST" | "UTC">("JST");

setInterval(() => {
  location.set(prev => prev === "JST" ? "UTC" : "JST");
}, 1000);

const MyApp = (
  <Fragment>
    {count.value}
    {location.value}
    <my-timer location={location.value} unit="seconds" initValue={0} />
    {/* {MyTimer.value({
      location: location,
      unit: "seconds",
      initValue: 0
    })} */}
    <div>
      <h1>Counters that update separately</h1>
      {MyButton.value()}
      {MyButton.value()}
    </div>
  </Fragment>
)

document.getElementById("app")?.appendChild(MyApp)

declare module "@ailuros/core/runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "my-timer": (typeof MyTimerElement)["__props_type__"];
    }
  }
}