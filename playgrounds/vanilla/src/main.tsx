import "./style.css"

import { computed, signal } from "@ailuros/core/reactivity"

const firstName = signal("First")
const lastName = signal("Last")
const fullName = computed(() => firstName.value + (firstName.value ? " " : "") + lastName.value)

const App = <>
  <h1>{fullName.value}</h1>
  <p>test</p>
  <div>
    Hello, Ailuros!
    <form action="">
      <input name="firstName" type="text" value={firstName.value} onInput={(e) => e.target?.value && firstName.set(e.target.value)} />
      <input name="lastName" type="text" value={lastName.value} onInput={(e) => e.target?.value && lastName.set(e.target.value)} />
    </form>

    <p>Your name is {fullName.value}</p>
  </div>
</>

document.getElementById("app")?.appendChild(App)
