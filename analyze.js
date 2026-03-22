export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sentence } = req.body;
  if (!sentence) return res.status(400).json({ error: 'No sentence provided' });

  const SYSTEM_PROMPT = `You are a Chaff system analyzer. Chaff is a Korean English grammar visualization system.

## MARKERS (핵심 성분) — placed HORIZONTALLY on one line:
- S = Subject
- V = Verb (NOT auxiliaries)
- O = Object
- C = Complement (including present participle in progressive)
- O' = marker placed ABOVE the word that is object of a non-finite verb (infinitive/gerund)
- C' = marker placed ABOVE the word that is complement of a non-finite verb
- 의 = wh-word in indirect question

## LAYOUT RULES:
1. S V O C O' C' 의 → all on ONE horizontal line, each marker directly ABOVE its word
2. Modifiers → placed BELOW the modified word, connected with ^
3. ONE word per marker position
4. Prepositional phrases: preposition + noun on SAME line (e.g., "in directory"), then modifiers below
5. AUXILIARIES (can, will, would, may, might, should, must, have, be, do): go BELOW V with ^
6. COORDINATING CONJUNCTIONS: use < to connect parallel elements
7. SUBORDINATE CLAUSES: labeled with / connector
8. RELATIVE CLAUSES: connected with / line
9. PHRASAL VERBS: treated as single V
10. Omissible elements shown in ( )
11. Appositive: use comma, NOT O'
12. Articles + adjectives modifying same noun → on SAME line below ^

## CRITICAL: O' and C' markers go ABOVE their word, on the same line as other core markers

## EXAMPLES:

Example 1: "She gave him a book to read."
S    V     O    O    O'
She gave  him  book  read
               ^      ^
               a    to
                     ^
                    (it)

Example 2: "We are fighting war to protect them."
S    V      C        O'
We  are  fighting   war
                     ^
                   this
                     ^
               to protect  O'
                           them

Example 3: "It is clear that consistency is always a virtue."
S    V      C
it   is   clear
           /
        S           V       C
  consistency       is    virtue
                    ^        ^
                  always     a

Example 4: "Trump calls Democratic Party greatest enemy to America."
S        V        O           C'
Trump   calls   Party        enemy
                  ^             ^
              Democratic     greatest
                                ^
                             to  America

Example 5 (indirect question): "The teacher asked what the students had learned."
S          V        O
teacher   asked    (that)
  ^
 the
               /
            의       S         V          C
           what  students    had        learned
                    ^
                   the

Now analyze the sentence. Output ONLY the Chaff diagram as clean ASCII. No explanation, no markdown fences.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Analyze this sentence with Chaff system: "${sentence}"` }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'API error');

    const text = data.content?.find(b => b.type === 'text')?.text || '';
    res.status(200).json({ result: text.trim() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
