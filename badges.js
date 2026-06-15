window.BadgesRegistry = {
  labels: {
    title: {
      pl: "Odznaki",
      en: "Badges"
    },
    empty: {
      pl: "Nie zdobyto jeszcze żadnej odznaki.",
      en: "No badges earned yet."
    }
  },
  items: {
    philosophical: {
      id: "philosophical",
      name: {
        pl: "Wykonywany filozoficznie",
        en: "Taken philosophically"
      },
      description: {
        pl: "Pierwsza odpowiedź wskazuje, że traktujesz test przede wszystkim jako namysł nad pojęciami i założeniami.",
        en: "Your first answer suggests you are taking the test mainly as a reflection on concepts and assumptions."
      },
      requirements: {
        yes: [{ id: 0, min: 1.0 }],
        no: []
      }
    },
    political: {
      id: "political",
      name: {
        pl: "Wykonywany politycznie",
        en: "Taken politically"
      },
      description: {
        pl: "Pierwsza odpowiedź wskazuje, że traktujesz test przede wszystkim jako praktyczne stanowisko polityczne.",
        en: "Your first answer suggests you are taking the test mainly as a practical political position."
      },
      requirements: {
        yes: [{ id: 0, max: -1.0 }],
        no: []
      }
    },
    monarchism: {
      id: "monarchism",
      name: { pl: "Monarchizm", en: "Monarchism" },
      description: {
        pl: "Poparcie dla dziedzicznej władzy, często legitymizowanej boskim prawem lub tradycją. Kładzie nacisk na stabilność, ciągłość i hierarchię.",
        en: "Support for hereditary power, often legitimized by divine right or tradition. Emphasizes stability, continuity and hierarchy."
      },
      requirements: {
        yes: [
          { id: 41, min: 1.0 },
          { id: 296, min: 1.0 },
          { id: 37, min: 1.0 }
        ],
        no: []
      }
    },
    anarchism: {
      id: "anarchism",
      name: { pl: "Anarchizm", en: "Anarchism" },
      description: {
        pl: "Odrzucenie państwa i wszelkiej przymusowej władzy na rzecz dobrowolnych, zdecentralizowanych wspólnot i bezpośredniej demokracji.",
        en: "Rejection of the state and all coercive authority in favor of voluntary, decentralized communities and direct democracy."
      },
      requirements: {
        yes: [
          { id: 48, min: 1.0 },
          { id: 49, min: 1.0 },
          { id: 50, min: 1.0 },
          { id: 174, min: 1.0 }
        ],
        no: [
          { id: 52, max: -1.0 },
          { id: 57, max: -1.0 },
          { id: 338, max: -1.0 }
        ]
      }
    },
    technocracy: {
      id: "technocracy",
      name: { pl: "Technokracja", en: "Technocracy" },
      description: {
        pl: "Przekonanie, że rządzić powinni eksperci i specjaliści, a decyzje polityczne powinny być oparte na danych naukowych i efektywności.",
        en: "Belief that experts and specialists should govern, and political decisions should be based on scientific data and efficiency."
      },
      requirements: {
        yes: [
          { id: 42, min: 1.0 },
          { id: 283, min: 1.0 },
          { id: 284, min: 1.0 }
        ],
        no: [
          { id: 59, max: -1.0 }
        ]
      }
    },
    oligarchy: {
      id: "oligarchy",
      name: { pl: "Oligarchia", en: "Oligarchy" },
      description: {
        pl: "Akceptacja koncentracji władzy i bogactwa w rękach nielicznych, często usprawiedliwiana naturalnymi nierównościami lub efektywnością.",
        en: "Acceptance of concentration of power and wealth in the hands of a few, often justified by natural inequalities or efficiency."
      },
      requirements: {
        yes: [
          { id: 74, min: 1.0 },
          { id: 169, min: 1.0 },
          { id: 171, min: 1.0 },
          { id: 37, min: 1.0 }
        ],
        no: [
          { id: 38, max: -1.0 },
          { id: 61, max: -1.0 },
          { id: 65, max: -1.0 }
        ]
      }
    },
    minimalState: {
      id: "minimalState",
      name: { pl: "Państwo minimalne", en: "Minimal state" },
      description: {
        pl: "Postulat ograniczenia roli państwa wyłącznie do funkcji ochronnych (sądy, policja, wojsko), bez ingerencji w gospodarkę i życie prywatne.",
        en: "Postulate of limiting the state's role to protective functions (courts, police, military), without interference in the economy and private life."
      },
      requirements: {
        yes: [
          { id: 53, min: 1.0 },
          { id: 286, min: 1.0 },
          { id: 116, min: 1.0 },
          { id: 52, min: 1.0 }
        ],
        no: [
          { id: 55, max: -1.0 },
          { id: 57, max: -1.0 },
          { id: 58, max: -1.0 },
          { id: 102, max: -1.0 },
          { id: 50, max: -1.0 }
        ]
      }
    },
    welfareState: {
      id: "welfareState",
      name: { pl: "Państwo opiekuńcze", en: "Welfare state" },
      description: {
        pl: "Model, w którym państwo zapewnia obywatelom bezpieczeństwo socjalne, dostęp do edukacji, ochrony zdrowia i redystrybucję dochodów.",
        en: "A model in which the state provides citizens with social security, access to education, health care and income redistribution."
      },
      requirements: {
        yes: [
          { id: 55, min: 1.0 },
          { id: 137, min: 1.0 },
          { id: 318, min: 1.0 },
          { id: 321, min: 1.0 }
        ],
        no: [
          { id: 139, max: -1.0 },
          { id: 140, max: -1.0 },
          { id: 320, max: -1.0 }
        ]
      }
    },
    secessionism: {
      id: "secessionism",
      name: { pl: "Secesjonizm", en: "Secessionism" },
      description: {
        pl: "Prawo regionów lub grup etnicznych do pokojowego odłączenia się od istniejącego państwa i utworzenia własnej administracji.",
        en: "The right of regions or ethnic groups to peacefully secede from an existing state and form their own administration."
      },
      requirements: {
        yes: [{ id: 301, min: 1.0 }],
        no: [
          { id: 88, max: -1.0 },
          { id: 364, max: -1.0 }
        ]
      }
    },
    agrarianism: {
      id: "agrarianism",
      name: { pl: "Agraryzm", en: "Agrarianism" },
      description: {
        pl: "Uznanie rolnictwa i wsi za fundament społeczeństwa, promowanie rodzinnych gospodarstw oraz tradycyjnego stylu życia.",
        en: "Recognition of agriculture and the countryside as the foundation of society, promotion of family farms and traditional lifestyle."
      },
      requirements: {
        yes: [
          { id: 331, min: 1.0 },
          { id: 332, min: 1.0 },
          { id: 334, min: 1.0 },
          { id: 335, min: 1.0 }
        ],
        no: []
      }
    },
    religiousState: {
      id: "religiousState",
      name: { pl: "Państwo wyznaniowe", en: "Religious state" },
      description: {
        pl: "Religia powinna być podstawą wszystkich dziedzin życia, a teksty święte podstawą prawa i porządku społecznego.",
        en: "Religion should be the basis of all areas of life, and sacred texts the basis of law and social order."
      },
      requirements: {
        yes: [
          { id: 196, min: 1.0 },
          { id: 197, min: 1.0 },
          { id: 193, min: 1.0 },
          { id: 194, min: 1.0 }
        ],
        no: [
          { id: 270, max: -1.0 },
          { id: 201, max: -1.0 },
          { id: 355, max: -1.0 }
        ]
      }
    },
    stateAtheism: {
      id: "stateAtheism",
      name: { pl: "Ateizm państwowy", en: "State atheism" },
      description: {
        pl: "Państwo powinno zwalczać instytucje religijne, a życie publiczne być całkowicie świeckie.",
        en: "The state should combat religious institutions, and public life should be completely secular."
      },
      requirements: {
        yes: [{ id: 355, min: 1.0 }],
        no: [
          { id: 191, max: -1.0 },
          { id: 196, max: -1.0 },
          { id: 281, max: -1.0 },
          { id: 192, max: -1.0 }
        ]
      }
    },
    transhumanism: {
      id: "transhumanism",
      name: { pl: "Transhumanizm", en: "Transhumanism" },
      description: {
        pl: "Przekonanie o moralnej neutralności lub pozytywności świadomego przekraczania naturalnych ograniczeń organizmu za pomocą technologii.",
        en: "Belief in the moral neutrality or positivity of consciously transcending the natural limitations of the organism through technology."
      },
      requirements: {
        yes: [
          { id: 377, min: 1.0 },
          { id: 378, min: 1.0 }
        ],
        no: [
          { id: 245, max: -1.0 },
          { id: 373, max: -1.0 },
          { id: 247, max: -1.0 },
          { id: 250, max: -1.0 }
        ]
      }
    },
    peacetimeConscription: {
      id: "peacetimeConscription",
      name: { pl: "Pobór w czasie pokoju", en: "Peacetime conscription" },
      description: {
        pl: "Poparcie dla obowiązkowej służby wojskowej w czasie pokoju jako prawnego obowiązku obywateli.",
        en: "Support for compulsory military service in peacetime as a legal duty of citizens."
      },
      requirements: {
        yes: [
          { id: 254, min: 1.0 },
          { id: 253, min: 1.0 }
        ],
        no: [{ id: 252, max: -1.0 }]
      }
    },
    statolatry: {
      id: "statolatry",
      name: { pl: "Statolatria", en: "Statolatry" },
      description: {
        pl: "Państwo jest najwyższą wartością, której interesy są nadrzędne wobec interesów jednostki. Obywatel winien być posłuszny i gotowy do poświęceń.",
        en: "The state is the highest value, whose interests are superior to those of the individual. The citizen should be obedient and ready to make sacrifices."
      },
      requirements: {
        yes: [
          { id: 9, min: 1.0 },
          { id: 10, min: 1.0 },
          { id: 57, min: 1.0 },
          { id: 263, min: 1.0 },
          { id: 52, min: 1.0 }
        ],
        no: [
          { id: 48, max: -1.0 },
          { id: 56, max: -1.0 },
          { id: 4, max: -1.0 }
        ]
      }
    },
    reactionism: {
      id: "reactionism",
      name: { pl: "Reakcjonizm", en: "Reactionism" },
      description: {
        pl: "Przekonanie, że zasady społeczno-gospodarcze sprzed XX wieku były lepszym fundamentem ładu, a nowe idee należy wdrażać tylko w zgodzie z tradycją.",
        en: "Belief that pre-20th century socio-economic principles were a better foundation of order, and new ideas should be implemented only in accordance with tradition."
      },
      requirements: {
        yes: [
          { id: 176, min: 1.0 },
          { id: 300, min: 1.0 },
          { id: 177, min: 1.0 }
        ],
        no: [{ id: 344, max: -1.0 }]
      }
    },
    confederalism: {
      id: "confederalism",
      name: { pl: "Konfederalizm", en: "Confederalism" },
      description: {
        pl: "Kompetencje władzy centralnej powinny być ograniczone do funkcji koordynacyjnych, a władza szeroko rozproszona między jednostki regionalne.",
        en: "The competences of the central authority should be limited to coordination functions, and power widely dispersed among regional units."
      },
      requirements: {
        yes: [
          { id: 67, min: 1.0 },
          { id: 65, min: 1.0 },
          { id: 293, min: 1.0 },
          { id: 292, min: 1.0 }
        ],
        no: [
          { id: 73, max: -1.0 },
          { id: 74, max: -1.0 }
        ]
      }
    },
    federalism: {
      id: "federalism",
      name: { pl: "Federalizm", en: "Federalism" },
      description: {
        pl: "Władza powinna być szeroko rozproszona, a jednostki regionalne mieć szeroką autonomię, ale z zachowaniem silnej władzy centralnej w kluczowych obszarach.",
        en: "Power should be widely dispersed, and regional units have broad autonomy, while maintaining a strong central authority in key areas."
      },
      requirements: {
        yes: [
          { id: 65, min: 1.0 },
          { id: 70, min: 1.0 },
          { id: 69, min: 1.0 },
          { id: 292, min: 1.0 }
        ],
        no: [
          { id: 67, max: -1.0 },
          { id: 73, max: -1.0 }
        ]
      }
    },
    noTaxes: {
      id: "noTaxes",
      name: { pl: "Brak podatków", en: "No taxes" },
      description: {
        pl: "Przekonanie, że w uchylaniu się od płacenia podatków nie ma niczego moralnie złego, a podatki nie są niezbędne.",
        en: "Belief that there is nothing morally wrong with tax evasion, and taxes are not necessary."
      },
      requirements: {
        yes: [{ id: 314, min: 1.0 }],
        no: [
          { id: 130, max: -1.0 },
          { id: 55, max: -1.0 },
          { id: 137, max: -1.0 }
        ]
      }
    },
    absoluteMonarchy: {
      id: "absoluteMonarchy",
      name: { pl: "Monarchia absolutna", en: "Absolute monarchy" },
      description: {
        pl: "Władza dziedziczna, zwolnienie monarchy z odpowiedzialności prawnej, koncentracja władzy ustawodawczej, wykonawczej i sądowniczej.",
        en: "Hereditary power, exemption of the monarch from legal responsibility, concentration of legislative, executive and judicial power."
      },
      requirements: {
        yes: [
          { id: 41, min: 1.0 },
          { id: 72, min: 1.0 },
          { id: 295, min: 1.0 },
          { id: 297, min: 1.0 },
          { id: 71, min: 1.0 }
        ],
        no: [
          { id: 63, max: -1.0 },
          { id: 64, max: -1.0 },
          { id: 38, max: -1.0 }
        ]
      }
    },
    freeBanking: {
      id: "freeBanking",
      name: { pl: "Wolna bankowość", en: "Free banking" },
      description: {
        pl: "Państwo powinno zrezygnować z emitowania pieniędzy i pozwolić na swobodną konkurencję na rynku pieniężnym, bez interwencji fiskalnych i monetarnych.",
        en: "The state should give up issuing money and allow free competition in the money market, without fiscal or monetary interventions."
      },
      requirements: {
        yes: [
          { id: 133, min: 1.0 },
          { id: 132, min: 1.0 }
        ],
        no: [{ id: 58, max: -1.0 }]
      }
    },
    totalitarianism: {
      id: "totalitarianism",
      name: { pl: "Totalitaryzm", en: "Totalitarianism" },
      description: {
        pl: "Państwo powinno nadzorować wszystkie dziedziny życia, autorytet przywódcy niepodważalny, ograniczona opozycja i krytyka.",
        en: "The state should supervise all areas of life, the leader's authority indisputable, limited opposition and criticism."
      },
      requirements: {
        yes: [
          { id: 75, min: 1.0 },
          { id: 76, min: 1.0 },
          { id: 91, min: 1.0 },
          { id: 89, min: 1.0 },
          { id: 160, min: 1.0 }
        ],
        no: [
          { id: 153, max: -1.0 },
          { id: 302, max: -1.0 },
          { id: 157, max: -1.0 }
        ]
      }
    },
    communitarianism: {
      id: "communitarianism",
      name: { pl: "Komunitaryzm", en: "Communitarianism" },
      description: {
        pl: "Społeczeństwo jako spójna całość przewyższająca interesy jednostek, solidarność społeczna ważniejsza niż wolność indywidualna.",
        en: "Society as a cohesive whole surpassing individual interests, social solidarity more important than individual freedom."
      },
      requirements: {
        yes: [
          { id: 2, min: 1.0 },
          { id: 277, min: 1.0 },
          { id: 360, min: 1.0 }
        ],
        no: [
          { id: 1, max: -1.0 },
          { id: 4, max: -1.0 }
        ]
      }
    },
    vanguardParty: {
      id: "vanguardParty",
      name: { pl: "Partia awangardowa", en: "Vanguard party" },
      description: {
        pl: "Partia polityczna powinna kierować społeczeństwem jako ideologiczna awangarda, a decyzje podejmować elity, nie ogół obywateli.",
        en: "A political party should lead society as an ideological vanguard, with decisions made by elites, not the general public."
      },
      requirements: {
        yes: [
          { id: 86, min: 1.0 },
          { id: 87, min: 1.0 },
          { id: 42, min: 1.0 }
        ],
        no: [{ id: 59, max: -1.0 }]
      }
    },
    degrowth: {
      id: "degrowth",
      name: { pl: "Degrowth", en: "Degrowth" },
      description: {
        pl: "Wzrost produkcji materialnej nie powinien być celem gospodarki, a ochrona natury priorytetem, nawet kosztem ludzkich potrzeb.",
        en: "Growth of material production should not be the goal of the economy, and nature protection a priority, even at the expense of human needs."
      },
      requirements: {
        yes: [
          { id: 376, min: 1.0 },
          { id: 243, min: 1.0 },
          { id: 237, min: 1.0 }
        ],
        no: [
          { id: 114, max: -1.0 },
          { id: 244, max: -1.0 }
        ]
      }
    },
    militarism: {
      id: "militarism",
      name: { pl: "Militaryzm", en: "Militarism" },
      description: {
        pl: "Rozwój sektora wojskowego jako główny cel polityki, militaryzacja społeczeństwa, użycie siły militarnej jako zasadny instrument polityki.",
        en: "Development of the military sector as a main policy goal, militarization of society, use of military force as a legitimate instrument of policy."
      },
      requirements: {
        yes: [
          { id: 381, min: 1.0 },
          { id: 382, min: 1.0 },
          { id: 255, min: 1.0 },
          { id: 257, min: 1.0 },
          { id: 383, min: 1.0 }
        ],
        no: [{ id: 252, max: -1.0 }]
      }
    },
    multiParty: {
      id: "multiParty",
      name: { pl: "Wielopartyjność", en: "Multi-party system" },
      description: {
        pl: "System rządów powinien dopuszczać konkurencję między programami politycznymi, z demokratycznymi procedurami i ochroną opozycji.",
        en: "The system of government should allow competition between political programs, with democratic procedures and protection of opposition."
      },
      requirements: {
        yes: [
          { id: 302, min: 1.0 },
          { id: 38, min: 1.0 },
          { id: 64, min: 1.0 }
        ],
        no: [
          { id: 89, max: -1.0 },
          { id: 91, max: -1.0 },
          { id: 86, max: -1.0 }
        ]
      }
    },
    animalRights: {
      id: "animalRights",
      name: { pl: "Prawa zwierząt", en: "Animal rights" },
      description: {
        pl: "Państwo powinno nakładać prawne ograniczenia na sposób, w jaki ludzie mogą traktować zwierzęta.",
        en: "The state should impose legal restrictions on how humans may treat animals."
      },
      requirements: {
        yes: [{ id: 242, min: 1.0 }],
        no: []
      }
    },
    rightToBearArms: {
      id: "rightToBearArms",
      name: { pl: "Prawo do posiadania broni", en: "Right to bear arms" },
      description: {
        pl: "Broń palna powinna być dostępna dla ogółu społeczeństwa.",
        en: "Firearms should be available to the general public."
      },
      requirements: {
        yes: [{ id: 165, min: 1.0 }],
        no: []
      }
    },
    corporatism: {
      id: "corporatism",
      name: { pl: "Korporacjonizm", en: "Corporatism" },
      description: {
        pl: "Związki zawodowe i organizacje pracodawców współuczestniczą w kształtowaniu polityki, a klasy społeczne współpracują dla dobra narodu.",
        en: "Trade unions and employers' organizations participate in shaping policy, and social classes cooperate for the good of the nation."
      },
      requirements: {
        yes: [
          { id: 298, min: 1.0 },
          { id: 299, min: 1.0 },
          { id: 78, min: 1.0 },
          { id: 212, min: 1.0 }
        ],
        no: [
          { id: 261, max: -1.0 },
          { id: 112, max: -1.0 }
        ]
      }
    },
    autarky: {
      id: "autarky",
      name: { pl: "Autarkia", en: "Autarky" },
      description: {
        pl: "Gospodarka powinna być zorganizowana wokół zaspokajania potrzeb wewnętrznych, z kontrolowanym handlem zagranicznym i ograniczeniami importu.",
        en: "The economy should be organized around meeting domestic needs, with controlled foreign trade and import restrictions."
      },
      requirements: {
        yes: [
          { id: 316, min: 1.0 },
          { id: 317, min: 1.0 },
          { id: 222, min: 1.0 },
          { id: 224, min: 1.0 }
        ],
        no: [
          { id: 135, max: -1.0 },
          { id: 225, max: -1.0 }
        ]
      }
    },
    ethnicSeparatism: {
      id: "ethnicSeparatism",
      name: { pl: "Separatyzm etniczny", en: "Ethnic separatism" },
      description: {
        pl: "Naród określony przez pochodzenie etniczne, dążenie do jedności etnicznej i pokrywania się granic państwa z granicami narodowości.",
        en: "Nation defined by ethnic origin, striving for ethnic unity and alignment of state borders with national borders."
      },
      requirements: {
        yes: [
          { id: 216, min: 1.0 },
          { id: 215, min: 1.0 },
          { id: 363, min: 1.0 },
          { id: 233, min: 1.0 }
        ],
        no: [
          { id: 232, max: -1.0 },
          { id: 234, max: -1.0 },
          { id: 227, max: -1.0 }
        ]
      }
    },
    socializationOfProduction: {
      id: "socializationOfProduction",
      name: { pl: "Uspołecznienie środków produkcji", en: "Socialization of the means of production" },
      description: {
        pl: "Wszelkie środki produkcji powinny być społecznie posiadane, a bogactwo należeć do wspólnoty. Preferowane formy kolektywne.",
        en: "All means of production should be socially owned, and wealth belong to the community. Collective forms are preferred."
      },
      requirements: {
        yes: [
          { id: 101, min: 1.0 },
          { id: 109, min: 1.0 },
          { id: 259, min: 1.0 }
        ],
        no: [
          { id: 94, max: -1.0 },
          { id: 96, max: -1.0 },
          { id: 149, max: -1.0 }
        ]
      }
    }
  }
};
