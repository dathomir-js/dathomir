import { createCustomElement, Props } from "@dathomir/core";

export const {
  CeButton
} = createCustomElement({
  tagName: "ce-button",
  props: {
    label: Props.String(),
    variant: Props.Union(["primary", "secondary"], { optional: true })
  },
  emits: {
    "custom-click": (e: CustomEventInit<MouseEvent>) => e
  },
  render: ({ props , emit, defineShadow }) => {
    defineShadow(() => ({ mode: "open" }));

    return (
      <button onClick={(e) => emit("custom-click", { detail: e })} className={props.variant.value}>
        <slot />
      </button>
    );
  }
});