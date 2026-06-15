window.BadgesRegistry = {
  labels: {
    title: {
      pl: "Odznaki",
      en: "Badges"
    },
    empty: {
      pl: "Nie zdobyto jeszcze zadnej odznaki.",
      en: "No badges earned yet."
    }
  },
  items: {
    philosophical: {
      id: "philosophical",
      questionId: 0,
      answerValue: 1.0,
      name: {
        pl: "Wykonywany filozoficznie",
        en: "Taken philosophically"
      },
      description: {
        pl: "Pierwsza odpowiedz wskazuje, ze traktujesz test przede wszystkim jako namysl nad pojeciami i zalozeniami.",
        en: "Your first answer suggests you are taking the test mainly as a reflection on concepts and assumptions."
      }
    },
    political: {
      id: "political",
      questionId: 0,
      answerValue: -1.0,
      name: {
        pl: "Wykonywany politycznie",
        en: "Taken politically"
      },
      description: {
        pl: "Pierwsza odpowiedz wskazuje, ze traktujesz test przede wszystkim jako praktyczne stanowisko polityczne.",
        en: "Your first answer suggests you are taking the test mainly as a practical political position."
      }
    },

    monarchism: {
      id: "monarchism",
      name: { pl: "Monarchizm", en: "Monarchism" },
      description: {
        pl: "Poparcie dla dziedzicznej władzy, często legitymizowanej boskim prawem lub tradycją. Kładzie nacisk na stabilność, ciągłość i hierarchię.",
        en: "Support for hereditary rule, often legitimized by divine right or tradition. Emphasizes stability, continuity, and hierarchy."
      },
      requiredYes: [42, 297, 38],
      requiredNo: []
    },

    anarchism: {
      id: "anarchism",
      name: { pl: "Anarchizm", en: "Anarchism" },
      description: {
        pl: "Odrzucenie państwa i wszelkiej przymusowej władzy na rzecz dobrowolnych, zdecentralizowanych wspólnot i bezpośredniej demokracji.",
        en: "Rejection of the state and all coercive authority in favor of voluntary, decentralized communities and direct democracy."
      },
      requiredYes: [49, 50, 51, 175],
      requiredNo: [53, 58, 339]
    },

    technocracy: {
      id: "technocracy",
      name: { pl: "Technokracja", en: "Technocracy" },
      description: {
        pl: "Przekonanie, że rządzić powinni eksperci i specjaliści, a decyzje polityczne powinny być oparte na danych naukowych i efektywności.",
        en: "The belief that experts and specialists should govern, and that political decisions should be based on scientific data and efficiency."
      },
      requiredYes: [43, 284, 285],
      requiredNo: [60]
    },

    oligarchy: {
      id: "oligarchy",
      name: { pl: "Oligarchia", en: "Oligarchy" },
      description: {
        pl: "Akceptacja koncentracji władzy i bogactwa w rękach nielicznych, często usprawiedliwiana naturalnymi nierównościami lub efektywnością.",
        en: "Acceptance of the concentration of power and wealth in the hands of a few, often justified by natural inequalities or efficiency."
      },
      requiredYes: [75, 170, 172, 38],
      requiredNo: [39, 62, 66]
    },

    minimalState: {
      id: "minimalState",
      name: { pl: "Państwo minimalne", en: "Minimal state" },
      description: {
        pl: "Postulat ograniczenia roli państwa wyłącznie do minimum ingerencji w gospodarkę i życie prywatne.",
        en: "The postulate of limiting the state's role solely to protective functions (courts, police, military), without interference in the economy and private life."
      },
      requiredYes: [54, 287, 117, 53],
      requiredNo: [56, 58, 59, 103, 51]
    },

    welfareState: {
      id: "welfareState",
      name: { pl: "Państwo opiekuńcze", en: "Welfare state" },
      description: {
        pl: "Model, w którym państwo zapewnia obywatelom bezpieczeństwo socjalne, dostęp do edukacji, ochrony zdrowia i redystrybucję dochodów.",
        en: "A model in which the state provides citizens with social security, access to education, healthcare, and income redistribution."
      },
      requiredYes: [56, 138, 319, 322],
      requiredNo: [140, 141, 321]
    },

    secessionism: {
      id: "secessionism",
      name: { pl: "Secesjonizm", en: "Secessionism" },
      description: {
        pl: "Prawo wybranych grup społecznych do pokojowego odłączenia się od istniejącego państwa i utworzenia własnej administracji.",
        en: "The right of regions or ethnic groups to peacefully separate from an existing state and form their own administration."
      },
      requiredYes: [302],
      requiredNo: [89, 365]
    },

    agrarianism: {
      id: "agrarianism",
      name: { pl: "Agraryzm", en: "Agrarianism" },
      description: {
        pl: "Uznanie rolnictwa i wsi za fundament społeczeństwa, promowanie rodzinnych gospodarstw oraz tradycyjnego stylu życia.",
        en: "Recognition of agriculture and rural life as the foundation of society, promoting family farms and traditional ways of life."
      },
      requiredYes: [332, 333, 335, 336],
      requiredNo: []
    },

    religiousState: {
      id: "religiousState",
      name: { pl: "Państwo wyznaniowe", en: "Confessional state" },
      description: {
        pl: "Model państwa, w którym religia stanowi podstawę prawa, polityki i życia publicznego, a władza kieruje się zasadami religijnymi.",
        en: "A model of state in which religion forms the basis of law, politics, and public life, and authority is guided by religious principles."
      },
      requiredYes: [197, 198, 194, 195],
      requiredNo: [271, 202, 356]
    },

    stateAtheism: {
      id: "stateAtheism",
      name: { pl: "Ateizm państwowy", en: "State atheism" },
      description: {
        pl: "Postawa odrzucająca wpływ religii na państwo i dążąca do ograniczenia lub zwalczania instytucji religijnych w sferze publicznej.",
        en: "A stance rejecting religion's influence on the state and seeking to limit or combat religious institutions in the public sphere."
      },
      requiredYes: [357],
      requiredNo: [192, 197, 282, 193]
    },

    transhumanism: {
      id: "transhumanism",
      name: { pl: "Transhumanizm", en: "Transhumanism" },
      description: {
        pl: "Przekonanie, że jednostka ma prawo do modyfikowania własnego ciała i umysłu za pomocą technologii w celu przekraczania naturalnych ograniczeń człowieka.",
        en: "The belief that individuals have the right to modify their own body and mind through technology in order to transcend natural human limitations."
      },
      requiredYes: [378, 379],
      requiredNo: [246, 374, 248, 251]
    },

    peacetimeConscription: {
      id: "peacetimeConscription",
      name: { pl: "Pobór w czasie pokoju", en: "Peacetime conscription" },
      description: {
        pl: "Poparcie dla obowiązkowej służby wojskowej obejmującej wszystkich lub prawie wszystkich obywateli, nawet w czasie pokoju.",
        en: "Support for mandatory military service covering all or nearly all citizens, even during peacetime."
      },
      requiredYes: [255, 254],
      requiredNo: [253]
    },

    statolatry: {
      id: "statolatry",
      name: { pl: "Statolatria", en: "Statolatry" },
      description: {
        pl: "Uznanie państwa za najwyższą wartość, której interesy są nadrzędne wobec interesów jednostki, wymagające pełnego posłuszeństwa obywateli.",
        en: "Recognition of the state as the highest value, whose interests take precedence over individual interests, demanding full obedience from citizens."
      },
      requiredYes: [10, 11, 58, 264, 53],
      requiredNo: [49, 57, 5]
    },

    reactionism: {
      id: "reactionism",
      name: { pl: "Reakcjonizm", en: "Reactionism" },
      description: {
        pl: "Przekonanie, że dawne porządki społeczno-gospodarcze i tradycje były lepszym fundamentem ładu, a zmiany powinny być oceniane przez ich zgodność z tradycją.",
        en: "The belief that past socio-economic orders and traditions were a better foundation for order, and that changes should be judged by their conformity with tradition."
      },
      requiredYes: [177, 301, 178],
      requiredNo: [345]
    },

    confederalism: {
      id: "confederalism",
      name: { pl: "Konfederalizm", en: "Confederalism" },
      description: {
        pl: "Model ustrojowy, w którym władza centralna ogranicza się do funkcji koordynacyjnych, a realna władza pozostaje w rękach jednostek regionalnych.",
        en: "A constitutional model in which central authority is limited to coordinating functions, while real power remains with regional units."
      },
      requiredYes: [68, 66, 294, 293],
      requiredNo: [74, 75]
    },

    federalism: {
      id: "federalism",
      name: { pl: "Federalizm", en: "Federalism" },
      description: {
        pl: "Model ustrojowy oparty na podziale władzy między rząd centralny a jednostki regionalne, posiadające szeroką autonomię w wielu dziedzinach.",
        en: "A constitutional model based on the division of power between a central government and regional units possessing broad autonomy in many areas."
      },
      requiredYes: [66, 71, 70, 293],
      requiredNo: [68, 74]
    },

    noTaxes: {
      id: "noTaxes",
      name: { pl: "Brak podatków", en: "No taxes" },
      description: {
        pl: "Przekonanie, że unikanie płacenia podatków jest moralnie usprawiedliwione, a podatki nie są niezbędnym elementem funkcjonowania społeczeństwa.",
        en: "The belief that avoiding taxes is morally justified, and that taxes are not a necessary element of a functioning society."
      },
      requiredYes: [315],
      requiredNo: [131, 56, 138]
    },

    absoluteMonarchy: {
      id: "absoluteMonarchy",
      name: { pl: "Monarchia absolutna", en: "Absolute monarchy" },
      description: {
        pl: "Forma monarchii, w której władca skupia w swoich rękach władzę ustawodawczą, wykonawczą i sądowniczą, bez ograniczeń instytucjonalnych ani odpowiedzialności prawnej.",
        en: "A form of monarchy in which the ruler concentrates legislative, executive, and judicial power, without institutional limits or legal accountability."
      },
      requiredYes: [42, 73, 296, 298, 72],
      requiredNo: [64, 65, 39]
    },

    freeBanking: {
      id: "freeBanking",
      name: { pl: "Wolna bankowość", en: "Free banking" },
      description: {
        pl: "Postulat zniesienia państwowego monopolu emisji pieniądza i pozwolenia na swobodną konkurencję walut oraz brak interwencji fiskalnej i monetarnej państwa.",
        en: "The call to abolish the state monopoly on currency issuance and allow free competition between currencies, with no fiscal or monetary intervention by the state."
      },
      requiredYes: [134, 133],
      requiredNo: [59]
    },

    totalitarianism: {
      id: "totalitarianism",
      name: { pl: "Totalitaryzm", en: "Totalitarianism" },
      description: {
        pl: "System, w którym państwo kontroluje wszystkie dziedziny życia, opozycja i krytyka są zakazane, a władza jednej partii lub przywódcy jest niepodważalna.",
        en: "A system in which the state controls all areas of life, opposition and criticism are banned, and the authority of a single party or leader is unquestionable."
      },
      requiredYes: [76, 77, 92, 90, 161],
      requiredNo: [154, 301, 158]
    },

    communitarianism: {
      id: "communitarianism",
      name: { pl: "Komunitaryzm", en: "Communitarianism" },
      description: {
        pl: "Przekonanie, że społeczeństwo stanowi spójną całość ważniejszą niż suma indywidualnych interesów, a jednostka ma zobowiązania wobec wspólnoty.",
        en: "The belief that society constitutes a coherent whole more important than the sum of individual interests, and that the individual has obligations toward the community."
      },
      requiredYes: [3, 278, 361],
      requiredNo: [2, 5]
    },

    vanguardParty: {
      id: "vanguardParty",
      name: { pl: "Partia awangardowa", en: "Vanguard party" },
      description: {
        pl: "Koncepcja, według której zorganizowana, ideologiczna partia powinna kierować społeczeństwem i prowadzić je w stronę rewolucyjnych zmian.",
        en: "The concept that an organized, ideological party should lead society and guide it toward revolutionary change."
      },
      requiredYes: [87, 88, 43],
      requiredNo: [60]
    },

    degrowth: {
      id: "degrowth",
      name: { pl: "Degrowth", en: "Degrowth" },
      description: {
        pl: "Pogląd, że wzrost gospodarczy nie powinien być celem polityki, a społeczeństwo powinno priorytetowo traktować stabilność ekologiczną nad dynamiczny rozwój.",
        en: "The view that economic growth should not be a policy goal, and that society should prioritize ecological stability over dynamic development."
      },
      requiredYes: [377, 244, 238],
      requiredNo: [115, 245]
    },

    militarism: {
      id: "militarism",
      name: { pl: "Militaryzm", en: "Militarism" },
      description: {
        pl: "Przekonanie, że rozwój i rozbudowa sił wojskowych powinny być priorytetem polityki państwa, a siła militarna jest uprawnionym narzędziem polityki.",
        en: "The belief that the development and expansion of military forces should be a priority of state policy, and that military force is a legitimate political tool."
      },
      requiredYes: [383, 381, 256, 258, 384],
      requiredNo: [253]
    },

    multiPartySystem: {
      id: "multiPartySystem",
      name: { pl: "Wielopartyjność", en: "Multi-party system" },
      description: {
        pl: "Poparcie dla systemu politycznego dopuszczającego swobodną konkurencję między różnymi partiami i programami politycznymi.",
        en: "Support for a political system that allows free competition between different parties and political programs."
      },
      requiredYes: [303, 39, 65],
      requiredNo: [90, 92, 87]
    },

    animalRights: {
      id: "animalRights",
      name: { pl: "Prawa zwierząt", en: "Animal rights" },
      description: {
        pl: "Poparcie dla prawnych ograniczeń nakładanych przez państwo na sposób traktowania zwierząt przez ludzi.",
        en: "Support for legal restrictions imposed by the state on how humans may treat animals."
      },
      requiredYes: [243],
      requiredNo: []
    },

    rightToBearArms: {
      id: "rightToBearArms",
      name: { pl: "Prawo do posiadania broni", en: "Right to bear arms" },
      description: {
        pl: "Poparcie dla powszechnej dostępności broni palnej dla obywateli.",
        en: "Support for the widespread availability of firearms to citizens."
      },
      requiredYes: [166],
      requiredNo: []
    },

    corporatism: {
      id: "corporatism",
      name: { pl: "Korporacjonizm", en: "Corporatism" },
      description: {
        pl: "Model, w którym związki zawodowe, organizacje pracodawców i państwo współdziałają w ramach zintegrowanej struktury, a klasy społeczne współpracują dla dobra narodu.",
        en: "A model in which trade unions, employer organizations, and the state cooperate within an integrated structure, and social classes work together for the good of the nation."
      },
      requiredYes: [299, 300, 79, 213],
      requiredNo: [262, 113]
    },

    autarky: {
      id: "autarky",
      name: { pl: "Autarkia", en: "Autarky" },
      description: {
        pl: "Model gospodarczy zorientowany na samowystarczalność, ograniczanie handlu zagranicznego i ochronę krajowych producentów przed konkurencją z zewnątrz.",
        en: "An economic model oriented toward self-sufficiency, limiting foreign trade, and protecting domestic producers from outside competition."
      },
      requiredYes: [317, 318, 223, 225],
      requiredNo: [136, 226]
    },

    ethnicSeparatism: {
      id: "ethnicSeparatism",
      name: { pl: "Separatyzm etniczny", en: "Ethnic separatism" },
      description: {
        pl: "Przekonanie, że przynależność narodowa powinna być oparta na pochodzeniu etnicznym, a granice państw powinny odpowiadać granicom narodowości.",
        en: "The belief that national identity should be based on ethnic origin, and that state borders should correspond to the boundaries of nationalities."
      },
      requiredYes: [217, 216, 364, 234],
      requiredNo: [233, 235, 228]
    },

    socializedProduction: {
      id: "socializedProduction",
      name: { pl: "Uspołecznienie środków produkcji", en: "Socialization of the means of production" },
      description: {
        pl: "Pogląd, że środki produkcji powinny być własnością społeczną lub wspólnotową, a nie prywatną, a spółdzielcze formy organizacji produkcji powinny być preferowane.",
        en: "The view that the means of production should be socially or collectively owned rather than private, with cooperative forms of production organization being preferred."
      },
      requiredYes: [102, 110, 260],
      requiredNo: [95, 97, 150]
    }
  }
};
