import { createCustomElement, Props } from "@dathomir/core";
import { computed } from "@dathomir/core/reactivity";

export const {
  AppButton
} = createCustomElement({
  tagName: "app-button",
  props: {
    label: Props.String()
  },
  render: ({ props }) => {
    return (
      <div style={{
        border: "1px dashed green",
        padding: "8px",
        marginTop: "8px"
      }}>
        <button>
          {computed(() => props.label.value)}
        </button>
      </div>
    );
  }
});