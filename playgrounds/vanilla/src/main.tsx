import { computed, effect, signal } from "@ailuros/core/reactivity"

const count = signal(0)
const doubleCount = computed(() => count.value * 2)
const oddElm = computed(() => {
  return count.value % 2 === 1 ? <span>odd</span> : <span>even</span>
})

// setInterval(() => {
//   count.update((prev) => prev + 1)
// }, 1000)

// effect(() => {
//   console.log("count", count.value)
// })

const increment = () => {
  count.update((prev) => prev + 1)
}

const App = <div>
  Hello, Ailuros!<br/>
  {count.value}
  <p data-count={doubleCount.value}>double count is {doubleCount.value}</p>
  <button onClick={increment}>inc</button>
  {oddElm.value}
</div>

document.getElementById("app")?.appendChild(App)
