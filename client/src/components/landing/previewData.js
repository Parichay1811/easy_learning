// The multilingual preview: the sample journey's first question (stage 0,
// melting) written for four of the site's 14 languages. This is sample text in
// those languages on purpose, so it is not routed through i18n: each entry is
// shown and spoken in its own language, whatever the site language is.
// Scripts follow the narration rules (options read in order, no answer given).

export const PREVIEW_LANGS = [
  {
    code: "en",
    native: "English",
    instruction: "Think about it",
    prompt: "You leave an ice cube on a plate in a warm kitchen. What will you find on the plate an hour later?",
    options: ["A bigger ice cube", "A puddle of water", "The same ice cube, just as big"],
    script: "Picture this: you leave an ice cube on a plate in a warm kitchen, and come back an hour later. What do you think is on the plate? A bigger ice cube, a puddle of water, or the same ice cube, just as big?",
  },
  {
    code: "es",
    native: "Español",
    instruction: "Piénsalo",
    prompt: "Dejas un cubito de hielo en un plato, en una cocina cálida. ¿Qué habrá en el plato una hora después?",
    options: ["Un cubito de hielo más grande", "Un charco de agua", "El mismo cubito, igual de grande"],
    script: "Imagina esto: dejas un cubito de hielo en un plato, en una cocina cálida, y vuelves una hora después. ¿Qué crees que hay en el plato? ¿Un cubito de hielo más grande, un charco de agua, o el mismo cubito, igual de grande?",
  },
  {
    code: "fr",
    native: "Français",
    instruction: "Réfléchis",
    prompt: "Tu laisses un glaçon sur une assiette, dans une cuisine chaude. Que trouveras-tu sur l’assiette une heure plus tard ?",
    options: ["Un glaçon plus gros", "Une flaque d’eau", "Le même glaçon, aussi gros"],
    script: "Imagine : tu laisses un glaçon sur une assiette, dans une cuisine chaude, et tu reviens une heure plus tard. À ton avis, qu’y a-t-il sur l’assiette ? Un glaçon plus gros, une flaque d’eau, ou le même glaçon, aussi gros ?",
  },
  {
    code: "ja",
    native: "日本語",
    instruction: "考えてみよう",
    prompt: "あたたかい台所で、氷をお皿の上に置いておきます。1時間後、お皿の上には何があるでしょう？",
    options: ["もっと大きな氷", "水たまり", "同じ大きさの氷"],
    script: "想像してみてね。あたたかい台所で、氷をお皿の上に置いて、1時間後にもどってきます。お皿の上には何があると思う？もっと大きな氷、水たまり、それとも同じ大きさの氷？",
  },
];
