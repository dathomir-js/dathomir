import { computed } from "@dathomir/core/reactivity";
import type { dathomirNode } from "@dathomir/core/runtime/jsx-runtime";

export const WrapperComponent = (props: { children: dathomirNode }) => {
  return computed(() => (
    <div style={{
      border: "2px solid blue",
      padding: "12px"
    }}>
      {props.children}
    </div>
  ));
}