import { useState } from 'react';
import { createRoot } from 'react-dom/client';

const MyButton = () => {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <button onClick={handleClick}>
      Clicked {count} times
    </button>
  );
}

const MyApp = () => {
  return (
    <div>
      <h1>Counters that update separately</h1>
      <MyButton />
      <MyButton />
    </div>
  );
}

createRoot(
  document.getElementById('app')
).render(<MyApp />)