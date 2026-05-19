const quizData = {
  // Pary wartości – każda para ma lewy i prawy biegun
  valuePairs: [
    { left: "collective_ownership", leftLabel: "Własność kolektywna",
      right: "private_ownership", rightLabel: "Własność prywatna" },
    { left: "planning", leftLabel: "Planowanie",
      right: "market", rightLabel: "Rynek" },
    { left: "institutional_regulation", leftLabel: "Regulacja instytucjonalna",
      right: "self_regulation", rightLabel: "Samoregulacja" },
    { left: "autonomy", leftLabel: "Autonomia",
      right: "heteronomy", rightLabel: "Heteronomia" },
    { left: "etatism", leftLabel: "Etatyzm",
      right: "anarchy", rightLabel: "Anarchia" }
  ],

  // Ideologie
  ideologies: [
    { id: "classical_liberalism", name: "Liberalizm klasyczny" },
    { id: "social_liberalism", name: "Socjalliberalizm" },
    { id: "liberal_conservatism", name: "Konserwatyzm liberalny" },
    { id: "democratic_socialism", name: "Socjalizm demokratyczny" },
    { id: "anarcho_communism", name: "Anarchokomunizm" }
  ],

  // Partie
  parties: [
    { id: "pis", name: "PiS" },
    { id: "ko", name: "KO" },
    { id: "psl", name: "PSL" },
    { id: "lewica", name: "Lewica" },
    { id: "polska2050", name: "Polska2050" },
    { id: "razem", name: "Razem" },
    { id: "kkp", name: "KKP" },
    { id: "ruch_narodowy", name: "Ruch Narodowy" },
    { id: "nowa_nadzieja", name: "Nowa Nadzieja" },
    { id: "pps", name: "PPS" },
    { id: "zieloni", name: "Zieloni" }
  ],

  // Pytania (kilka przykładów – rozbudujesz później)
  questions: [
    {
      id: 1,
      text: "Instytucja własności prywatnej powinna zostać zniesiona.",
      description: "Chodzi o całkowite zastąpienie własności prywatnej własnością kolektywną.",
      comment: "Pytanie kluczowe dla podziału ekonomicznego.",
      answers: {
        agree: {
          values: ["collective_ownership", "planning"],
          ideologies_support: ["democratic_socialism", "anarcho_communism"],
          ideologies_oppose: ["classical_liberalism", "social_liberalism", "liberal_conservatism"],
          parties_support: ["lewica", "razem", "pps"],
          parties_oppose: ["pis", "ko", "psl", "polska2050", "kkp", "ruch_narodowy", "nowa_nadzieja"]
        },
        disagree: {
          values: ["private_ownership", "market"],
          ideologies_support: ["classical_liberalism", "social_liberalism", "liberal_conservatism"],
          ideologies_oppose: ["democratic_socialism", "anarcho_communism"],
          parties_support: ["pis", "ko", "psl", "polska2050", "kkp", "ruch_narodowy", "nowa_nadzieja"],
          parties_oppose: ["lewica", "razem", "pps"]
        }
      }
    },
    {
      id: 2,
      text: "Państwo powinno prowadzić centralne planowanie gospodarcze.",
      description: "Planowanie odgórne zamiast mechanizmów rynkowych.",
      comment: "Czy wierzysz w dyrektywne sterowanie gospodarką?",
      answers: {
        agree: {
          values: ["planning", "institutional_regulation", "etatism"],
          ideologies_support: ["democratic_socialism"],
          ideologies_oppose: ["classical_liberalism", "anarcho_communism", "social_liberalism"],
          parties_support: ["lewica", "razem"],
          parties_oppose: ["ko", "nowa_nadzieja", "kkp"]
        },
        disagree: {
          values: ["market", "self_regulation", "autonomy"],
          ideologies_support: ["classical_liberalism", "anarcho_communism", "social_liberalism"],
          ideologies_oppose: ["democratic_socialism"],
          parties_support: ["ko", "nowa_nadzieja", "kkp", "polska2050"],
          parties_oppose: ["lewica", "razem"]
        }
      }
    },
    {
      id: 3,
      text: "Silne związki zawodowe i negocjacje zbiorowe są potrzebne dla ochrony pracowników.",
      description: "Rola związków w ustalaniu warunków pracy.",
      answers: {
        agree: {
          values: ["institutional_regulation", "collective_ownership"],
          ideologies_support: ["democratic_socialism", "social_liberalism"],
          ideologies_oppose: ["classical_liberalism", "liberal_conservatism", "anarcho_communism"],
          parties_support: ["lewica", "razem", "pps", "zieloni"],
          parties_oppose: ["kkp", "nowa_nadzieja", "ruch_narodowy"]
        },
        disagree: {
          values: ["self_regulation", "private_ownership"],
          ideologies_support: ["classical_liberalism", "liberal_conservatism", "anarcho_communism"],
          ideologies_oppose: ["democratic_socialism", "social_liberalism"],
          parties_support: ["kkp", "nowa_nadzieja", "ruch_narodowy"],
          parties_oppose: ["lewica", "razem", "zieloni"]
        }
      }
    }
  ]
};
