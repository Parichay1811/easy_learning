// Lines the teacher says often. The server makes their audio when it starts,
// so they play at once.
export const GREETING = "Hi, I'm your Learnigo teacher. Ask me about any topic you're curious about, from space and art to money and coding, or say test me for some questions. You can interrupt me any time.";
export const FILLERS = ['Okay, let me show you.', 'Good question.', 'Let me draw that.', 'Sure, look at this.'];
export const NOT_HEARD = "Sorry, I didn't catch that. Could you say it again?";
export const STOPPED = "Okay, I'll wait. Ask me anything.";
export const GO_AHEAD = 'Go ahead, ask me anything.';
export const MISS = "I don't have a lesson on that yet, so I've added it to my list for the team. Try asking me about another topic.";
export const ANOTHER = 'Ask me anything else, or say test me.';
export const OFFER = 'Say test me if you want some practice questions.';
export const FRAGMENT = 'Mm-hm?';

// Said the moment a question needs thinking, before the answer is ready.
// {topic} comes from the fast model; GENERIC_ACKS when it has none.
export const ACKS = ['Ooh, {topic}. Let me think.', 'Good question about {topic}.', '{Topic}? Let me think about that.'];
export const GENERIC_ACKS = ['Good question. Let me think.', 'Hmm, let me think about that.'];

// Small talk, answered at once by rules.
export const TALK = {
  hello: 'Hi! What would you like to learn today?',
  howAreYou: "I'm great, thanks for asking! What shall we learn today?",
  thanks: "You're welcome! Ask me anything else.",
  who: "I'm your Learnigo teacher. I explain things with pictures, and when you want practice, say test me.",
  help: "Ask me about a topic, like circles or the water cycle, and I'll explain it with pictures. Give me numbers, like a garden 12 by 7 metres, and we'll work it out. Say test me for practice questions.",
  noThanks: 'No problem! Ask me anything else.',
  okay: 'Okay! What would you like to learn?',
  stuck: "That's okay. Tell me what you're stuck on, or say teach me and a topic.",
};
