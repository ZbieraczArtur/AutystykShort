window.BadgesRegistry = {
  imageBase: "images/Odznaki/",
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
        pl: "Doktryna polityczna uznająca monarchę (króla, cesarza, księcia itp.) za prawowitą głowę państwa. Może występować w różnych formach - od monarchii ceremonialnej po absolutną.",
        en: "A political doctrine that recognises a monarch (king, emperor, prince, etc.) as the legitimate head of state. It can take various forms – ranging from a ceremonial monarchy to an absolute monarchy."
      },
      requiredYes: [41, 296, 37],
      requiredNo: []
    },

    anarchism: {
      id: "anarchism",
      name: { pl: "Anarchizm", en: "Anarchism" },
      description: {
        pl: "Nurt polityczny postulujący zniesienie państwa oraz innych hierarchicznych struktur władzy opartych na przymusie i zastąpienie ich dobrowolnymi formami organizacji społecznej.",
        en: "A political ideology that advocates the abolition of the state and other hierarchical power structures based on coercion, and their replacement with voluntary forms of social organisation."
      },
      requiredYes: [48, 49, 50],
      requiredNo: [52, 57, 338]
    },

    technocracy: {
      id: "technocracy",
      name: { pl: "Technokracja", en: "Technocracy" },
      description: {
        pl: "Koncepcja, według której decyzje publiczne powinny być podejmowane głównie przez ekspertów i specjalistów posiadających specjalistyczną wiedzę techniczną lub naukową.",
        en: "The concept that public decisions should be taken primarily by experts and specialists with specialist technical or scientific knowledge."
      },
      requiredYes: [42, 283, 284],
      requiredNo: [59]
    },

    oligarchy: {
      id: "oligarchy",
      name: { pl: "Oligarchia", en: "Oligarchy" },
      description: {
        pl: "System rządów, w którym władza polityczna jest skoncentrowana w rękach niewielkiej grupy ludzi, organizacji lub elit.",
        en: "A system of governance where political power is concentrated in the control of a small group of people, an organisation or an elite."
      },
      requiredYes: [74, 169, 171, 37],
      requiredNo: [38, 61, 65]
    },

    minimalState: {
      id: "minimalState",
      name: { pl: "Państwo minimalne", en: "Minimal state" },
      description: {
        pl: "Model państwa ograniczający swoje funkcje głównie do ochrony podstawowych praw jednostki, takich jak życie, wolność i własność, realizująca jedynie funkcje wojskowe, policyjne i sądownicze. Jego celem jest zapewnienie maksymalnej dostępnej wolności w ramach jasno określonej praworządności.",
        en: "A model of the state that limits its functions primarily to the protection of fundamental individual rights, such as life, liberty and property, and which performs only military, police and judicial functions. Its aim is to ensure the maximum possible freedom within the framework of a clearly defined rule of law."
      },
      requiredYes: [53, 286, 116, 52],
      requiredNo: [55, 57, 58, 102, 50]
    },

    welfareState: {
      id: "welfareState",
      name: { pl: "Państwo opiekuńcze", en: "Welfare state" },
      description: {
        pl: "Model państwa, które przyjmuje na siebie odpowiedzialność za zapewnienie dobrobytu socjalnego swoim obywatelom. Działa jako mechanizm redystrybucji, oferując wsparcie w zakresie ochrony zdrowia, edukacji, mieszkalnictwa i zasiłków, dążąc do realizacji zasady równości szans.",
        en: "A model of the state that takes responsibility for ensuring the social welfare of its citizens. It acts as a mechanism for redistribution, providing support in the areas of healthcare, education, housing and benefits, with the aim of realising the principle of equal opportunities."
      },
      requiredYes: [55, 137],
      requiredNo: [139, 140, 320]
    },

    secessionism: {
      id: "secessionism",
      name: { pl: "Secesjonizm", en: "Secessionism" },
      description: {
        pl: "Dążenie konkretnej grupy lub regionu do formalnego odłączenia się od istniejącej formacji politycznej (państwa) w celu utworzenia własnego, niepodległego podmiotu.",
        en: "The aspiration of a specific group or region to formally secede from an existing political entity (a state) in order to establish its own independent entity."
      },
      requiredYes: [301],
      requiredNo: [88, 364]
    },

    agrarianism: {
      id: "agrarianism",
      name: { pl: "Agraryzm", en: "Agrarianism" },
      description: {
        pl: "Nurt podkreślający znaczenie rolnictwa, społeczności wiejskich i własności rolnej jako fundamentów życia społecznego i gospodarczego.",
        en: "A movement emphasising the importance of agriculture, rural communities and agricultural ownership as the foundations of social and economic life."
      },
      requiredYes: [331, 332, 334, 335],
      requiredNo: []
    },

    religiousState: {
      id: "religiousState",
      name: { pl: "Państwo wyznaniowe", en: "Confessional state" },
      description: {
        pl: "System organizacji państwowej, w którym religia dyktuje zasady życia społecznego, gospodarczego i politycznego. W takim modelu prawo państwowe jest często zastępowane lub w pełni oparte na prawie objawionym, a religia nie jest ograniczona do sfery prywatnej.",
        en: "A system of state organisation in which religion dictates the rules governing social, economic and political life. In such a model, state law is often superseded by, or based entirely on, revealed law, and religion is not confined to the private sphere."
      },
      requiredYes: [196, 197, 193, 194],
      requiredNo: [270, 201, 355]
    },

    stateAtheism: {
      id: "stateAtheism",
      name: { pl: "Ateizm państwowy", en: "State atheism" },
      description: {
        pl: "Polityka państwa polegająca na odrzuceniu i zwalczaniu instytucji religijnych, postrzegając religię jako źródło ucisku lub fałszywej świadomości",
        en: "A state policy of rejecting and combating religious institutions, viewing religion as a source of oppression or false consciousness"
      },
      requiredYes: [356],
      requiredNo: [191, 196, 281, 192]
    },

    transhumanism: {
      id: "transhumanism",
      name: { pl: "Transhumanizm", en: "Transhumanism" },
      description: {
        pl: "Przekonanie, że jednostka ma prawo do modyfikowania własnego ciała i umysłu za pomocą technologii w celu przekraczania naturalnych ograniczeń człowieka.",
        en: "The belief that individuals have the right to modify their own body and mind through technology in order to transcend natural human limitations."
      },
      requiredYes: [377, 378],
      requiredNo: [245, 373, 247, 250]
    },

    peacetimeConscription: {
      id: "peacetimeConscription",
      name: { pl: "Pobór w czasie pokoju", en: "Peacetime conscription" },
      description: {
        pl: "Poparcie dla obowiązkowej służby wojskowej obejmującej wszystkich lub prawie wszystkich obywateli, nawet w czasie pokoju.",
        en: "Support for mandatory military service covering all or nearly all citizens, even during peacetime."
      },
      requiredYes: [254, 253],
      requiredNo: [252]
    },

    statolatry: {
      id: "statolatry",
      name: { pl: "Statolatria", en: "Statolatry" },
      description: {
        pl: "Uznanie państwa za najwyższą wartość, której interesy są nadrzędne wobec interesów jednostki, wymagające pełnego posłuszeństwa obywateli.",
        en: "Recognition of the state as the highest value, whose interests take precedence over individual interests, demanding full obedience from citizens."
      },
      requiredYes: [9, 10, 57, 263, 52],
      requiredNo: [48, 56, 4]
    },

    reactionism: {
      id: "reactionism",
      name: { pl: "Reakcjonizm", en: "Reactionism" },
      description: {
        pl: "Postawa polityczna polegająca na gwałtownym oporze wobec zmian i pragnieniu powrotu do poprzedniego systemu (ancien régime)Opiera się na pesymistycznym przekonaniu, że historia ludzkości jest procesem upadku i degeneracji dawnego „złotego wieku”.",
        en: "A political stance characterised by fierce resistance to change and a desire to return to the previous system (ancien régime). It is based on the pessimistic belief that the history of humanity is a process of decline and degeneration from a bygone ‘golden age’."
      },
      requiredYes: [176, 300, 177],
      requiredNo: [344]
    },

    confederalism: {
      id: "confederalism",
      name: { pl: "Konfederalizm", en: "Confederalism" },
      description: {
        pl: "Model organizacji politycznej, w którym suwerenne jednostki polityczne współpracują w ramach luźnego związku zachowując szeroką niezależność.",
        en: "A constitutional model in which central authority is limited to coordinating functions, while real power remains with regional units."
      },
      requiredYes: [67, 65, 293, 292],
      requiredNo: [73, 74]
    },

    federalism: {
      id: "federalism",
      name: { pl: "Federalizm", en: "Federalism" },
      description: {
        pl: "System organizacji państwa, w którym kompetencje są podzielone pomiędzy ośrodek centralny a jednostki składowe (stany, kantony), posiadające własne budżety i systemy prawne.",
        en: "A system of state organisation in which powers are divided between the central government and constituent units (states, cantons), each of which has its own budget and legal system."
      },
      requiredYes: [65, 70, 69, 292],
      requiredNo: [67, 73]
    },

    noTaxes: {
      id: "noTaxes",
      name: { pl: "Brak podatków", en: "No taxes" },
      description: {
        pl: "Koncepcja postrzegająca opodatkowanie jako formę kradzieży lub wyzysku dokonywanego przez państwo, której nie można uzasadnić.",
        en: "The view that taxation is a form of theft or exploitation by the state that cannot be justified."
      },
      requiredYes: [314],
      requiredNo: [130, 55, 137]
    },

    absoluteMonarchy: {
      id: "absoluteMonarchy",
      name: { pl: "Monarchia absolutna", en: "Absolute monarchy" },
      description: {
        pl: "Forma monarchii, w której władca skupia w swoich rękach władzę ustawodawczą, wykonawczą i sądowniczą, bez ograniczeń instytucjonalnych ani odpowiedzialności prawnej.",
        en: "A form of monarchy in which the ruler concentrates legislative, executive, and judicial power, without institutional limits or legal accountability."
      },
      requiredYes: [41, 72, 295, 297, 71],
      requiredNo: [63, 64, 38]
    },

    freeBanking: {
      id: "freeBanking",
      name: { pl: "Wolna bankowość", en: "Free banking" },
      description: {
        pl: "System finansowy pozbawiony centralnego nadzoru banku państwowego, w którym produkcja pieniądza i polityka kredytowa podlegają wyłącznie mechanizmom rynkowym.",
        en: "A financial system without central supervision by a state-owned bank, in which money creation and credit policy are governed solely by market mechanisms."
      },
      requiredYes: [133, 132],
      requiredNo: [58]
    },

    totalitarianism: {
      id: "totalitarianism",
      name: { pl: "Totalitaryzm", en: "Totalitarianism" },
      description: {
        pl: "Wszechogarniający system władzy, który dąży do całkowitej kontroli nad każdym aspektem życia społecznego i prywatnego. Likwiduje społeczeństwo obywatelskie i sferę prywatną, narzucając obywatelom jednolitą ideologię i wymagając bezwzględnego posłuszeństwa.",
        en: "An all-encompassing system of power that seeks total control over every aspect of public and private life. It dismantles civil society and the private sphere, imposing a single ideology on citizens and demanding absolute obedience."
      },
      requiredYes: [75, 76, 91, 89, 160],
      requiredNo: [153, 302, 157]
    },

    communitarianism: {
      id: "communitarianism",
      name: { pl: "Komunitaryzm", en: "Communitarianism" },
      description: {
        pl: "Przekonanie, że jednostka nie jest bytem autonomicznym, lecz jest kształtowana przez wspólnotę, do której należy. W związku z tym jednostki są winne wspólnocie szacunek, a ich tożsamość jest nierozerwalnie związana z kontekstem społecznym i kulturowym.",
        en: "The belief that the individual is not an autonomous being, but is shaped by the community to which they belong. Consequently, individuals owe respect to the community, and their identity is inextricably linked to their social and cultural context."
      },
      requiredYes: [2, 277, 360],
      requiredNo: [1, 4]
    },

    vanguardParty: {
      id: "vanguardParty",
      name: { pl: "Partia awangardowa", en: "Vanguard party" },
      description: {
        pl: "Koncepcja, według której zorganizowana, ideologiczna partia powinna kierować społeczeństwem i prowadzić je w stronę rewolucyjnych zmian.",
        en: "The concept that an organized, ideological party should lead society and guide it toward revolutionary change."
      },
      requiredYes: [86, 87, 42],
      requiredNo: [59]
    },

    degrowth: {
      id: "degrowth",
      name: { pl: "Degrowth", en: "Degrowth" },
      description: {
        pl: "Przekonanie o konieczności ograniczenia konsumpcji i wzrostu gospodarczego, postrzegane jako warunek ochrony klimatu i zasobów planety",
        en: "The belief that consumption and economic growth must be curbed, seen as a prerequisite for protecting the climate and the planet’s resources."
      },
      requiredYes: [376, 243, 237],
      requiredNo: [114, 244]
    },

    militarism: {
      id: "militarism",
      name: { pl: "Militaryzm", en: "Militarism" },
      description: {
        pl: "Dążenie do osiągania celów politycznych za pomocą środków zbrojnych oraz przenoszenie wzorców wojskowych (dyscypliny, hierarchii, lojalności) do życia cywilnego. Wojsko jest tu postrzegane jako wzorzec organizacji społecznej.",
        en: "The pursuit of political objectives through military means and the transfer of military models (discipline, hierarchy, loyalty) to civilian life. The military is seen here as a model for social organisation."
      },
      requiredYes: [381, 382, 255, 257, 383],
      requiredNo: [252]
    },

    multiPartySystem: {
      id: "multiPartySystem",
      name: { pl: "Wielopartyjność", en: "Multi-party system" },
      description: {
        pl: "Pluralizm polityczny umożliwiający swobodne tworzenie i funkcjonowanie wielu ugrupowań konkurujących o wpływ na państwo w procesie wyborczym.",
        en: "Political pluralism, which enables the free formation and operation of multiple groups competing for influence over the state through the electoral process."
      },
      requiredYes: [302, 38, 64],
      requiredNo: [89, 91, 86]
    },

    animalRights: {
      id: "animalRights",
      name: { pl: "Prawa zwierząt", en: "Animal rights" },
      description: {
        pl: "Poparcie dla prawnych ograniczeń nakładanych przez państwo na sposób traktowania zwierząt przez ludzi.",
        en: "Support for legal restrictions imposed by the state on how humans may treat animals."
      },
      requiredYes: [242],
      requiredNo: []
    },

    rightToBearArms: {
      id: "rightToBearArms",
      name: { pl: "Prawo do posiadania broni", en: "Right to bear arms" },
      description: {
        pl: "Poparcie dla powszechnej dostępności broni palnej dla obywateli.",
        en: "Support for the widespread availability of firearms to citizens."
      },
      requiredYes: [165],
      requiredNo: []
    },

    corporatism: {
      id: "corporatism",
      name: { pl: "Korporacjonizm", en: "Corporatism" },
      description: {
        pl: "Model organizacji społeczeństwa i gospodarki oparty na współpracy zinstytucjonalizowanych grup zawodowych, gospodarczych lub społecznych uczestniczących w procesie decyzyjnym.",
        en: "A model of social and economic organisation based on cooperation between institutionalised professional, economic or social groups involved in the decision-making process."
      },
      requiredYes: [298, 299, 78, 212],
      requiredNo: [261, 112]
    },

    autarky: {
      id: "autarky",
      name: { pl: "Autarkia", en: "Autarky" },
      description: {
        pl: "Model gospodarczy zorientowany na dążenie do całkowitej samowystarczalności gospodarczej. . Oznacza to poleganie wyłącznie na własnych zasobach i energii oraz uniezależnienie się od handlu międzynarodowego i rynków światowych.",
        en: "An economic model geared towards achieving complete economic self-sufficiency. This means relying solely on one’s own resources and energy, and becoming independent of international trade and global markets."
      },
      requiredYes: [316, 317, 222, 224],
      requiredNo: [135, 225]
    },

    ethnicSeparatism: {
      id: "ethnicSeparatism",
      name: { pl: "Separatyzm etniczny", en: "Ethnic separatism" },
      description: {
        pl: "Przekonanie, że przynależność narodowa powinna być oparta na pochodzeniu etnicznym, a granice państw powinny odpowiadać granicom narodowości.",
        en: "The belief that national identity should be based on ethnic origin, and that state borders should correspond to the boundaries of nationalities."
      },
      requiredYes: [216, 215, 363, 233],
      requiredNo: [232, 234, 227]
    },

    socializedProduction: {
      id: "socializedProduction",
      name: { pl: "Uspołecznienie środków produkcji", en: "Socialization of the means of production" },
      description: {
        pl: "Pogląd, że środki produkcji powinny być własnością społeczną lub wspólnotową, a nie prywatną, a kolektywne formy organizacji produkcji powinny być preferowane.",
        en: "The view that the means of production should be socially or collectively owned rather than private, with cooperative forms of production organization being preferred."
      },
      requiredYes: [101, 109, 259],
      requiredNo: [94, 96, 149]
    }
  }
};
