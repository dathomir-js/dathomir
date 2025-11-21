import { signal, computed } from "@dathomir/core/reactivity";

export const Component = (props: { message: string }) => {
  const count = signal(0);

  const handleClick = () => {
    count.set(prev => prev + 1);
  }

  return computed(() => (
    <div style={{
      border: "1px dashed green",
      padding: "8px",
      marginTop: "8px"
    }}>
      <div>{props.message}</div>
      <button onClick={handleClick}>
        Clicked {count.value} times
      </button>
    </div>
  ));
}
