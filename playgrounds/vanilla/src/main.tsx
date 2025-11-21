import { signal } from "@dathomir/core/reactivity";
import { mount } from "@dathomir/core/runtime";
import { MyTimer } from "./components/MyTimer";
import { Component } from "./components/Component";
import { AppButton } from "./components/Button";

const count = signal(0);

setInterval(() => {
  count.set(prev => prev + 1);
}, 1000);

const location = signal<"JST" | "UTC">("JST");

setInterval(() => {
  location.set(prev => prev === "JST" ? "UTC" : "JST");
}, 1000);

const MyApp = (
  <div>
    <p>
      {count.value}
    </p>
    <p>
      {location.value}
    </p>
    <MyTimer location={location.value} unit="minutes" initValue={count.value} onAnotherEvent={(e) => console.log(e.detail?.info)} />
    <Component message={location.value} />
    <Component message={location.value} />
    {/* <Button onClick={() => alert(`Button clicked! Count is ${count.value}`)} label="Click Me" /> */}
    <AppButton label={location.value} />
  </div>
)

mount(MyApp, document.getElementById("app")!);

// declare module "@dathomir/core/runtime" {
//   namespace JSX {
//     interface IntrinsicElements {
//       "my-timer": (typeof MyTimerElement)["__props_type__"];
//     }
//   }
// }