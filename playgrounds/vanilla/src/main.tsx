import "./style.css"
import { computed, signal } from "@dathomir/core/reactivity"
import { mount } from "@dathomir/core/runtime"

const todo = signal<{
  userId: number
  id: number
  title: string
  body?: string
} | undefined>(undefined)

const postStatus = signal<"idle" | "loading" | "error" | "success">("idle")

const postStatusText = computed(() => {
  switch (postStatus.value) {
    case "idle":
      return "Idle"
    case "loading":
      return "Loading..."
    case "error":
      return <span style={{ color: "red" }}>Error!</span>
    case "success":
      return <span style={{ color: "green" }}>Success!</span>
    default:
      return ""
  }
})

const updateTodo = async (arg: number) => {
  postStatus.set("loading")

  await fetch(`https://jsonplaceholder.typicode.com/posts/${arg}`, {
    method: "PUT",
    body: JSON.stringify({
      userId: 1,
      id: arg,
      title: todo.value?.title,
      body: todo.value?.body,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  }).then(res => res.json()).then(json => {
    postStatus.set("success")
    console.log(json)
    todo.set(json)

    setTimeout(() => {
      postStatus.set("idle")
    }, 2000)
  }).catch(() => {
    postStatus.set("error")
  })

  return;
}

const getTodo = async () => {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts/1").then(res => res.json())
  todo.set(res)
  return 0
}
await getTodo()

const App = <>
  <h1>@dathomir/core</h1>
  <div>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateTodo(todo.value?.id || 1)
      }}
    >
      <span>User ID : {todo.value?.userId}</span>
      <span>ID : {todo.value?.id}</span>
      <span>Title : {todo.value?.title}</span>
      <label for="title">
        <span style={{ marginRight: "0.5rem" }}>
          Body :
        </span>
        <input
          name="body"
          type="text"
          value={todo.value?.body || ""}
          onInput={(e) => {
            if (e.target?.value === undefined || todo.value === undefined) {
              return;
            }
            todo.set({ ...todo.value, body: e.target.value})
          }}
        />
      </label>
      <button type="submit">Submit</button>
    </form>
    <p>
      {postStatusText.value}
    </p>
  </div>
</>

const appElement = document.getElementById("app")
if (appElement) {
  mount(App, appElement)
}
