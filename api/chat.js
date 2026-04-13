import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { messages } = req.body;
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.85,
    max_tokens: 1100,
  });
  res.status(200).json({ content: response.choices[0].message.content });
}
