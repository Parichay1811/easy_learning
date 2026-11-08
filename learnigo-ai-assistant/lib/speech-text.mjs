// Text a voice can read: symbols from the board said as words.
export function speakable(text) {
  return String(text).replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/²/g, ' squared').replace(/³/g, ' cubed')
    .replace(/π/g, ' pi ').replace(/≈/g, ' about ').replace(/°/g, ' degrees').replace(/→/g, ' to ').replace(/−/g, ' minus ')
    .replace(/½/g, 'half').replace(/\b(\d+)\/(\d+)\b/g, '$1 over $2').replace(/√/g, 'the square root of ').replace(/\s+/g, ' ').trim();
}
