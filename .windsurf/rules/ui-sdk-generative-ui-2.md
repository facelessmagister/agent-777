---
trigger: model_decision
description: how to implement generative user interface with vercel ui sdk
---



## Expanding Your Generative UI Application

You can enhance your chat application by adding more tools and components, creating a richer and more versatile user experience. Here's how you can expand your application:

### Adding More Tools

To add more tools, simply define them in your `ai/tools.ts` file:

```ts
// Add a new stock tool
export const stockTool = createTool({
  description: 'Get price for a stock',
  inputSchema: z.object({
    symbol: z.string().describe('The stock symbol to get the price for'),
  }),
  execute: async function ({ symbol }) {
    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { symbol, price: 100 };
  },
});

// Update the tools object
export const tools = {
  displayWeather: weatherTool,
  getStockPrice: stockTool,
};
```

Now, create a new file called `components/stock.tsx`:

```tsx
type StockProps = {
  price: number;
  symbol: string;
};

export const Stock = ({ price, symbol }: StockProps) => {
  return (
    <div>
      <h2>Stock Information</h2>
      <p>Symbol: {symbol}</p>
      <p>Price: ${price}</p>
    </div>
  );
};
```

Finally, update your `page.tsx` file to include the new Stock component:

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Weather } from '@/components/weather';
import { Stock } from '@/components/stock';

export default function Page() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <div>{message.role}</div>
          <div>
            {message.parts.map((part, index) => {
              if (part.type === 'text') {
                return <span key={index}>{part.text}</span>;
              }

              if (part.type === 'tool-displayWeather') {
                switch (part.state) {
                  case 'input-available':
                    return <div key={index}>Loading weather...</div>;
                  case 'output-available':
                    return (
                      <div key={index}>
                        <Weather {...part.output} />
                      </div>
                    );
                  case 'output-error':
                    return <div key={index}>Error: {part.errorText}</div>;
                  default:
                    return null;
                }
              }

              if (part.type === 'tool-getStockPrice') {
                switch (part.state) {
                  case 'input-available':
                    return <div key={index}>Loading stock price...</div>;
                  case 'output-available':
                    return (
                      <div key={index}>
                        <Stock {...part.output} />
                      </div>
                    );
                  case 'output-error':
                    return <div key={index}>Error: {part.errorText}</div>;
                  default:
                    return null;
                }
              }

              return null;
            })}
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

By following this pattern, you can continue to add more tools and components, expanding the capabilities of your Generative UI application.
