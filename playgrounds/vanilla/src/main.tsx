import { computed, signal } from "@dathomir/core/reactivity";
import { mount } from "@dathomir/core/runtime";
import { CeButton } from "./components/CeButton";
import  { WrapperComponent } from "./components/WrapperComponent";
import { Fragment } from "@dathomir/core/runtime/jsx-runtime";

const count = signal(0);

setInterval(() => {
  count.set(prev => prev + 1);
}, 1000);

const oddEven = computed(() => {
  return count.value % 2 === 0 ? "even" : "odd";
});

const MyApp = (
  <Fragment>
    <p>
      {count.value}
    </p>
    <p>
      Odd or Even : {oddEven.value}
    </p>
    <CeButton label="label" variant={oddEven.value === "even" ? "primary" : "secondary"} onCustomClick={(e) => {
      console.log(`Button clicked! Count is ${count.value}`)
      count.set(prev => prev + 1);
    }}>
      slot contents<br />
      <span>span contents</span>
    </CeButton>
    <WrapperComponent>
      <p>This is inside the wrapper component.</p>
      {count.value}
    </WrapperComponent>
  </Fragment>
)

mount(MyApp, document.getElementById("app")!);