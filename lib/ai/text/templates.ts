/**
 * BALU AI STUDIO — offline template engine.
 *
 * Deterministic, rule-based generators that ALWAYS work (no API key):
 * structured lyrics, captions, YouTube packages, scripts, SEO, video
 * prompts, Bible content and thumbnail concepts.
 *
 * Output is honest: pages show a "Free template" badge when this engine
 * produced the content (vs "AI provider" when a configured model did).
 */

export type TemplateInput = Record<string, string | number | undefined>;

/* ------------------------------------------------------------------ utils */

const rnd = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const rndN = <T,>(arr: readonly T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  const count = Math.max(1, Math.min(n, copy.length));
  for (let i = 0; i < count; i++) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const str = (v: string | number | undefined, fallback = ""): string =>
  String(v ?? "").trim() || fallback;

export interface OutputBlock {
  title: string;
  text: string;
}

export const LANG_NAMES: Record<string, string> = {
  te: "Telugu",
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  kn: "Kannada",
  ml: "Malayalam",
};

export type SongType =
  | "worship"
  | "devotional"
  | "love"
  | "sad"
  | "motivational"
  | "folk"
  | "tribal"
  | "cinematic"
  | "pop"
  | "melody";

type Bank = {
  intro: string[];
  verse: string[];
  pre: string[];
  chorus: string[];
  bridge: string[];
  outro: string[];
};

/* ------------------------------------------------------------- Telugu banks */

const TE: Record<SongType, Bank> = {
  worship: {
    intro: [
      "నా హృదయం నీ కోసం తెరిచాను",
      "స్తుతి గానం ఆరంభించాను నీ నామంతో",
      "పరిశుద్ధ నీ సన్నిధిలో నిలిచాను",
    ],
    verse: [
      "నీ ప్రేమను మాటల్లో చెప్పలేను ప్రభూ",
      "నీ కృప నన్ను ఆవరించినా సర్దుకోలేను",
      "ఎడారిలో నీరు పుట్టించిన నీవే",
      "చీకట్లో వెలుగు చూపించిన నీవే",
      "నీ నామమే నా శ్వాస నా ప్రాణం",
    ],
    pre: [
      "ప్రభువా నీ సన్నిధిలో నిలిచాను",
      "స్తుతులు సమర్పించెదను నీకే",
      "హల్లెలూయా నీవే మహిమగలవాడవు",
    ],
    chorus: [
      "యేసు నా రాజా నీకే స్తోత్రం",
      "పరిశుద్ధుడవు నీవే ప్రభూ నీవే",
      "నీ నామం ఎత్తబడును భూమ్యాకాశాలలో",
      "ప్రపంచమంతా నిన్ను స్తుతించును",
    ],
    bridge: [
      "నా జీవితమే నీ బలిపీఠం ప్రభూ",
      "నీ చిత్తమే నాలో నెరవేరును గాక",
    ],
    outro: [
      "ఆమేన్ ఆమేన్ నీవే రాజు",
      "యుగయుగాలకు నీవే స్తుతింపబడుదువు",
    ],
  },
  devotional: {
    intro: [
      "కాలములన్నిటిలో నీ దయ చాలు",
      "నీ పాదం చెంత కూర్చుంటిని",
      "ప్రభూ నీ మార్గమే నాకు క్షేమం",
    ],
    verse: [
      "నీ దయ చూపు నాపై ప్రభూ",
      "కన్నీళ్లను తుడిచే నీ చేయి చూపు",
      "అలసిన నాకు నీవే విశ్రాంతి",
      "నీ మాటే నా కాపు నా కోట",
      "ప్రతి ఉదయమూ నీ కృప కొత్తది",
    ],
    pre: [
      "నీ సన్నిధి శాంతినిస్తుంది",
      "నీ చూపే నన్ను నడిపిస్తుంది",
      "భయము విడిచి నీ వైపు చూస్తున్నా",
    ],
    chorus: [
      "దయామయుడా నీవే నా ఆశ్రయం",
      "నీ నామమే నాకు బలము",
      "నీ దయ నిత్యము నాతో ఉండు",
      "నీ మార్గమే నాకు జీవం",
    ],
    bridge: [
      "నా ప్రార్థన వినుము ప్రభూ",
      "నీ చిత్తం నాలో నిలుపుము",
    ],
    outro: [
      "రక్షకుడా నీకే స్తోత్రం",
      "నీవు నాతో ఉంటే చాలు నాకు",
    ],
  },
  love: {
    intro: [
      "నీ చిరునవ్వు చూసిన నాటి నుండి",
      "గుండెలో ఏదో తీయని భావం",
      "ప్రేమ జ్ఞాపకాలు మనసులో నాటుకున్నాయి",
    ],
    verse: [
      "నీ చూపుల్లో నేను కరిగిపోతున్నా",
      "నీ మాటలే నాకు మధుర గీతాలు",
      "రాత్రులన్నీ నీ కలలే నాలో",
      "నీ చేయి పట్టుకున్న అప్పటి నుండి భయం లేదు",
      "నీవే నా ప్రేమ నీవే నా కల",
    ],
    pre: [
      "ఆకాశమంతా నీ పేరే రాసుకున్నా",
      "నీవు లేని ప్రతి క్షణం ఎడారిలా",
    ],
    chorus: [
      "నీవే నా ప్రేమ నీవే నా జీవితం",
      "నీతో నా ప్రతి రోజు పండుగ",
      "స్నేహమా నీ అనుబంధం అమూల్యం",
      "నీ హృదయం నాది నా హృదయం నీది",
    ],
    bridge: [
      "చెప్పలేని అనుభూతి ఈ ప్రేమ",
      "నీ కోసమే నా గుండె స్పందించేది",
    ],
    outro: [
      "నీవు నాతో ఉంటే చాలు నాకు",
      "ప్రేమే మన జీవిత కథ",
    ],
  },
  sad: {
    intro: [
      "మళ్లీ వచ్చింది రాత్రి ఒంటరిగా",
      "కన్నీళ్ల లోయలో నా మనసు",
      "నిశ్శబ్దం నా తోడుగా నిలిచింది",
    ],
    verse: [
      "వీడ్కోలు చెప్పిన ఆ క్షణం ఇంకా గుర్తుంది",
      "నీ స్వరం వినిపించని రోజులివి",
      "జ్ఞాపకాల మధ్య దారి తప్పిన నేను",
      "నిరీక్షణే మిగిలింది నాకు",
      "నీడలా నీవు దూరమయ్యావు",
    ],
    pre: [
      "ఎందుకు ఇలా జరిగిందో నీకే తెలుసు",
      "మౌనమే నా సమాధానమైంది",
    ],
    chorus: [
      "నా నొప్పి ఎవరికీ కనపడదు",
      "గాయపడిన గుండె భరించలేను",
      "నీవు లేని బ్రతుకు ఎంతో శూన్యం",
      "తిరిగొస్తావని ఆశతో నిలబడ్డా",
    ],
    bridge: [
      "కన్నీటి ప్రార్థనలు నేస్తున్నా",
      "విరహం అనే అగ్నిలో కాలుతున్నా",
    ],
    outro: [
      "నీ జ్ఞాపకమే నన్ను నడిపిస్తుంది",
      "తెల్లవారింది కానీ ఇంకా చీకటే",
    ],
  },
  motivational: {
    intro: [
      "కష్టాలు వచ్చినా వెనక్కి తగ్గను",
      "లక్ష్యం నాకు స్పష్టమై ఉంది",
      "ప్రతి ఉదయం ఓ కొత్త ఆశతో లేస్తా",
    ],
    verse: [
      "ఎన్ని అడ్డంకులొచ్చినా ముందుకే నడుస్తా",
      "నా కలలు నాకే నమ్మకం",
      "ఓటమి అనేదే లేదు ఇంకా నేర్చుకోవడం ఉంది",
      "బలంగా నిలబడ్డాను పట్టుదలతో",
      "కష్టం పరిమితం కల మాత్రం అనంతం",
    ],
    pre: [
      "గట్టిగా నమ్ముకున్నా నన్ను నేను",
      "రేపటి విజయం నేటి శ్రమలో ఉంది",
    ],
    chorus: [
      "ఎగిరెదను పైకి పైకి కలలను చేరువరకు",
      "నేనే నా విజయం నేనే నా బలం",
      "వదలను వెనక్కి రాను లక్ష్యం చేరే వరకు",
      "నమ్మిన నా నమ్మకం నన్ను గెలిపిస్తుంది",
    ],
    bridge: [
      "అలసిన నాకు కొత్త శక్తి నిండుతుంది",
      "ప్రతి ఉదయం ఓ కొత్త అవకాశం",
    ],
    outro: [
      "జర్నీ సాగుతుంది విజయం వైపుకి",
      "నేను చేయగలను అనే నమ్మకమే శక్తి",
    ],
  },
  folk: {
    intro: [
      "ఊరు చుట్టూ పచ్చని పొలాలు",
      "ఎండలో పంట కాపాడే మనుషులు",
      "జానపద గానం మా ఊరి నుండి ప్రారంభం",
    ],
    verse: [
      "తమ్ముడమ్మా దయ్యాల బండి వచ్చింది... (జానపదం)",
      "కొండల్లో వాసి కుటుంబం మాది",
      "నాగలి పట్టిన చేతులే మాకు గర్వం",
      "జర జర డప్పులు వాయించి పాడతాం",
      "పంట పండితే ఊరంతా పండుగ",
    ],
    pre: [
      "మా జానపదమే మాకు జీవం",
      "తరతరాల నుండి వస్తున్నది ఈ లయ",
    ],
    chorus: [
      "జో జో జో పాడుదాం జానపదం",
      "మా ఊరు మా గీతం మా గర్వం",
      "డప్పు మోతకు గుండె లయగానే ఉంది",
      "పని మాని పాట పాడుదాం స్నేహితుల్లారా",
    ],
    bridge: [
      "చీకటి మూస్తే దీపాల వెలుగులు",
      "కథలు చెప్పే గార్డు సంప్రదాయం",
    ],
    outro: [
      "జానపదం మా గుండెల్లో నిలిచిపోతుంది",
      "మళ్లీ కలుద్దాం పాటతో పాటు",
    ],
  },
  tribal: {
    intro: [
      "కొండ నుండి లోయ దాకా మా పాటలు",
      "గుడి మందిరం ముందు డప్పు మోగింది",
      "గిరిజన గీతం వినిపించు తల్లి",
    ],
    verse: [
      "అడవి పచ్చదనం మా ఆలయం",
      "కొండ దేవత కృప చూపించు",
      "మా పండుగల్లో రక్తికట్టే డప్పులు",
      "తరతరాల మా గుర్తులను నిలుపుదాం",
      "నేలతల్లి పిలిస్తే నాట్యం మొదలు",
    ],
    pre: [
      "కళ్లెదురుగా కొండలు కాపురం",
      "సంబరం సంబరం మా జీవితే సంబరం",
    ],
    chorus: [
      "డప్పు డప్పు మోగింది దడ దడ గుండెలు",
      "మా సంస్కృతి మా గర్వం మా గానం",
      "కొండకు కొండ కలిసే పాట పాడుదాం",
      "అమ్మవారికి మా నమస్కారం",
    ],
    bridge: [
      "ఆకులు పూలు విసిరి ఆనందింతుదాం",
      "ఘోంగలి వేడిమి ఎంతో గొప్పది",
    ],
    outro: [
      "గిరిజన గీతం గుండెల్లో నిలుస్తుంది",
      "మళ్లీ వస్తాం వెన్నెల వెలుగులో",
    ],
  },
  cinematic: {
    intro: [
      "స్టార్ట్ అయింది కథ మా హీరో ప్రవేశంతో",
      "పెద్ద తెర మీద మెరిసే నా కలలు",
      "డైలాగులు మాని ప్రేమ చెబుదాం",
    ],
    verse: [
      "మెరిసి మెరిసి వచ్చే నీ చూపు",
      "తుఫాన్లో పన్నాగం సాగుతుంది",
      "పంచ్ డైలాగులు మా సొంతం",
      "టెన్షన్ పెరిగే సన్నివేశాల్లో నీవే",
      "విలన్ లాగా వచ్చి హీరో లాగా నిలబడతా",
    ],
    pre: [
      "మాస్ మూమెంట్ మా ముందే నడుస్తుంది",
      "క్లైమాక్స్ వైపు కథ వెళ్తుంది",
    ],
    chorus: [
      "సినిమా హైలైటే నీతో నా ప్రేమ",
      "లవ్ స్టోరీ హీరో నేనే నీవే హీరోయిన్",
      "వందకోట్ల మనస్సుల్లో మా కథ",
      "రచ్చ చేస్తాం రంజింతుదాం",
    ],
    bridge: [
      "విజయం మా వెనుకే ఉంటుంది",
      "మాస్ లో మాత్రం బండి రివర్స్ అవదు",
    ],
    outro: [
      "థియేటర్ లో అరిచి అరిచి చప్పట్లు",
      "సినిమా ముగిసింది కథ నిలిచిపోతుంది",
    ],
  },
  pop: {
    intro: [
      "లైట్లు వెలిగాయి నైట్ రెడీ",
      "బీట్ మొదలైంది గుండె లయతో",
      "ఈ పార్టీ మా పాటతో స్టార్ట్",
    ],
    verse: [
      "ఫ్లోర్ మీద మా స్టైల్ మాకే",
      "నగరం మొత్తం మా స్టేజ్",
      "ట్రెండింగ్ లో మన గురించే ఉంది",
      "మ్యూజిక్ లౌడ్ మైండ్ క్లీన్",
      "మైక్రోఫోన్ పట్టిన ప్రతి చేతికి మ్యాజిక్",
    ],
    pre: [
      "అందరూ లెండ్ మాతో చేరండి",
      "హ్యాండ్స్ అప్ హ్యాండ్స్ అప్",
    ],
    chorus: [
      "స్టే స్టే స్టే విత్ మీ టు నైట్",
      "డాన్స్ చేద్దాం జరా జరా",
      "బీట్ బాక్స్ గుండె బీట్ ఒక్కటే",
      "స్వాగ్ తో స్వాగ్ కొడితే సూర్యుడే సాక్షి",
    ],
    bridge: [
      "డ్రాప్ దగ్గర సైలెంట్ డ్రాప్ తర్వాత మ్యాజిక్",
      "పార్టీ పోయినా మెమరీస్ ఉంటాయి",
    ],
    outro: [
      "వన్ మోర్ టైమ్ వన్ మోర్ సాంగ్",
      "లైట్లు ఆరిపోయినా పాట నిలుస్తుంది",
    ],
  },
  melody: {
    intro: [
      "మెల్లగా వచ్చిన మధుర గాలి లా",
      "కుహు కుహు పాడే కోయిలలా నీ గానం",
      "శాంతమైన సాయంత్రం తీయని పాటతో",
    ],
    verse: [
      "నది ప్రవాహం లా నీ స్వరం",
      "చంద్రిక వెలుతురులో జ్ఞాపకాల సవ్వడి",
      "మేఘాల మధ్య దాగిన వెన్నెలలా నీవు",
      "ప్రేమ సుమాలు పూయించే సమయమిది",
      "నిశ్శబ్దమైనా నీ పేరే గుసగుసలాడుతుంది",
    ],
    pre: [
      "మృదు మధుర తీగలపై వీణ స్వరాలా",
      "మనసు హాయిగా లయలో తేలియాడుతుంది",
    ],
    chorus: [
      "ఓ తీయని మధుర గీతమా నీవే",
      "స్వర్గీయ శాంతిని పంచే పాట నీది",
      "గుండె లోతుల్లో నిలిచిన స్వరం",
      "కాలం నిలిచిన క్షణాల శ్రేయస్సు",
    ],
    bridge: [
      "ఆవిర్భవించే భావానికి సరిగమలు",
      "మౌనంతో మాట్లాడే సంగీతం",
    ],
    outro: [
      "గీతం ముగిసింది భావం మిగిలింది",
      "తిరిగీ వినిపించు మధుర ఝణఝణా",
    ],
  },
};

/* ------------------------------------------------------------ English banks */

const EN: Record<SongType, Bank> = {
  worship: {
    intro: ["I open my heart before your throne", "My lips begin with praise to you", "In your presence I stand still"],
    verse: ["Your love is beyond all my words", "Your mercy covers every failure of mine", "In the desert you opened springs", "In darkness you showed me the light", "Your name is my breath and my life"],
    pre: ["Lord, I rest here in your courts", "I bring my thanks before your face", "Hallelujah, glory to your name"],
    chorus: ["Jesus my King, all praise to you", "Holy are you, Lord, you alone", "Your name is lifted over all the earth", "The whole world joins to worship you"],
    bridge: ["My life becomes your altar, Lord", "Let your will be done in me"],
    outro: ["Amen and amen, you reign", "Forever you are praised"],
  },
  devotional: {
    intro: ["Through every season your grace is enough", "I sit at your feet again", "Your way is my safety, Lord"],
    verse: ["Show me your favor, O Lord", "Wipe my tears with your hand", "You are my rest when I am tired", "Your word is my shield and my fortress", "Every morning your mercy is new"],
    pre: ["Your presence brings me peace", "Your gaze guides my steps", "Looking to you, I let go of fear"],
    chorus: ["Merciful One, you are my refuge", "Your name alone is my strength", "May your grace abide with me always", "Your path is my life"],
    bridge: ["Hear my prayer, O Lord", "Set your will within me"],
    outro: ["Savior, to you be the glory", "If you are with me, that is enough"],
  },
  love: {
    intro: ["Ever since I saw you smile", "A sweet feeling stirs inside", "Love's memories planted deep in my heart"],
    verse: ["I melt in your gentle gaze", "Your words are honey to my soul", "Nights are full of your dreams", "Since I held your hand, fear is gone", "You are my love, you are my dream"],
    pre: ["I write your name across the sky", "Every moment without you is a desert"],
    chorus: ["You are my love, you are my life", "Every day with you is a festival", "Priceless is your friendship", "My heart is yours, yours is mine"],
    bridge: ["This love is beyond words", "My heart beats only for you"],
    outro: ["As long as you are with me, all is well", "Love is the story of our lives"],
  },
  sad: {
    intro: ["The night returns alone again", "My heart wanders in a valley of tears", "Silence stands beside me"],
    verse: ["I still recall the moment you left", "Days pass without your voice", "I lost my way among memories", "Only waiting remains for me", "Like a shadow you drifted away"],
    pre: ["Only you know why it happened this way", "Silence became my only answer"],
    chorus: ["No one can see how much I hurt", "My wounded heart cannot bear it", "Life without you is so empty", "I stand here hoping you return"],
    bridge: ["I am weaving prayers from my tears", "Burning in the fire of separation"],
    outro: ["Your memory keeps me going", "Dawn came, but it is still dark"],
  },
  motivational: {
    intro: ["Even when hardship comes, I will not retreat", "My goal stands clear before me", "Each morning I rise with a new hope"],
    verse: ["No matter the obstacles, I keep moving forward", "My dreams are my own belief", "There is no defeat, only lessons", "I stand strong with determination", "Hardship is limited; my dream is endless"],
    pre: ["I believe in myself, firmly", "Tomorrow's victory is in today's effort"],
    chorus: ["I rise higher and higher toward my dreams", "I am my own victory, my own strength", "I will not stop until I reach the goal", "My belief will make me win"],
    bridge: ["Fresh strength fills my tired soul", "Every morning is a new chance"],
    outro: ["The journey continues toward victory", "Believing 'I can' is the power"],
  },
  folk: {
    intro: ["Green fields all around our village", "People who guard the harvest under the sun", "Our folk song begins from our land"],
    verse: ["The harvest cart is rolling, my friend", "Our clan lives in the hills", "Hands that hold the plow are our pride", "We beat the drums and sing along", "When the crop ripens, the whole village celebrates"],
    pre: ["Our folk music is our life", "This rhythm has flowed for generations"],
    chorus: ["Sing along, sing the folk song", "Our village, our song, our pride", "Our hearts beat to the drum", "Leave work and sing with us, friends"],
    bridge: ["When darkness falls, lamps glow", "Our storytelling tradition lives on"],
    outro: ["The folk song stays in our hearts", "We will meet again with our songs"],
  },
  tribal: {
    intro: ["Our songs echo from hill to valley", "The drum beats before the shrine", "Sing us the tribal song, mother"],
    verse: ["The green forest is our temple", "Bless us, goddess of the hills", "Drums blaze during our festivals", "We keep our heritage alive", "When mother earth calls, the dance begins"],
    pre: ["The hills hold our dwelling", "Celebration is our way of life"],
    chorus: ["Beat the drum, hearts beat faster", "Our culture, our pride, our song", "Let hill join hill in song", "We bow to the goddess"],
    bridge: ["We scatter flowers in joy", "The festive fire is glorious"],
    outro: ["The tribal song remains in our hearts", "We'll return in the moonlight"],
  },
  cinematic: {
    intro: ["The story begins with our hero's entry", "My dreams shine on the big screen", "No dialogues; let love speak"],
    verse: ["Your glance comes flashing by", "A plot unfolds in the storm", "Punch dialogues are our own", "You appear in the tense scenes", "You come like a villain, stand like a hero"],
    pre: ["The mass movement leads the way", "The story races to its climax"],
    chorus: ["You and my love is cinema's highlight", "I am the love story's hero, you its heroine", "Our story lives in a million hearts", "We create chaos and joy"],
    bridge: ["Victory stays behind us", "The mass vehicle never reverses"],
    outro: ["The theatre erupts in applause", "The film ends; the story remains"],
  },
  pop: {
    intro: ["Lights on, the night is ready", "The beat begins with the heart's rhythm", "This party starts with our song"],
    verse: ["On the floor, our style is our own", "The whole city is our stage", "The trend is all about us", "Music loud, mind clear", "Magic in every hand that holds the mic"],
    pre: ["Everyone, come join us", "Hands up, hands up"],
    chorus: ["Stay, stay, stay with me tonight", "Dance a little more", "The beatbox and heartbeat are one", "Swing with swagger, the sun is witness"],
    bridge: ["Silent at the drop, magic after", "The party ends, memories remain"],
    outro: ["One more time, one more song", "Lights off, the song stays"],
  },
  melody: {
    intro: ["Like a soft breeze arriving gently", "Your song like a singing cuckoo", "A peaceful evening with a sweet song"],
    verse: ["Your voice like a flowing river", "Memories whisper in the moonlight", "You are the moonbeam hidden in clouds", "This is the season for flowers of love", "Even silence whispers your name"],
    pre: ["Like veena strings, soft and sweet", "The heart floats gently in the rhythm"],
    chorus: ["You are the sweetest melody", "Your song pours heavenly peace", "A note that lives in the deep heart", "Blessed moments when time stands still"],
    bridge: ["The sa-re-ga-ma of a rising feeling", "Music that speaks in silence"],
    outro: ["The song ends; the feeling remains", "Play that gentle strum again"],
  },
};

/* ------------------------------------------- generic banks (hi, ta, kn, ml) */

const GENERIC: Record<string, Bank> = {
  hi: {
    intro: ["मेरे दिल का द्वार खोला है", "तेरे नाम से गाना शुरू करता हूँ", "तेरी महिमा की कहानी से"],
    verse: ["तेरी महिमा गाऊँ मैं हर दिन", "तेरी कृपा मुझ पर बनी रहे", "आँखों में उम्मीद की रोशनी", "हर मुश्किल में तू ही संग है", "तेरा नाम ही मेरी शक्ति है"],
    pre: ["तेरे दर पर झुकता हूँ", "दिल से कहता हूँ हालेलूजाह"],
    chorus: ["यीशु तू ही मेरा राजा है", "तेरी ही महिमा सदा रहे", "दुनिया भर में तेरा नाम हो", "आओ मिलकर गाएँ हम"],
    bridge: ["मेरा जीवन तेरी सेवा में", "तेरी इच्छा मुझ में पूरी हो"],
    outro: ["आमीन आमीन तू राज करे", "युगों युगों तक तेरी स्तुति"],
  },
  ta: {
    intro: ["என் இதயம் உனக்காய் திறந்தேன்", "உன் நாமம் பாடி தொடங்குகிறேன்", "உம்முடைய சந்நிதியில் நிற்கிறேன்"],
    verse: ["உம் அன்பை வார்த்தையில் சொல்ல முடியாது", "உம் கிருபை என்னை மூடுகிறது", "வனாந்தரத்தில் நீர் ஊற்றினீர்", "இருளில் ஒளி காட்டினீர்", "உம் நாமமே என் சுவாசம்"],
    pre: ["ஆண்டவரே உம் திருமுன் வந்தேன்", "ஸ்தோத்திரம் செலுத்துகிறேன்"],
    chorus: ["இயேசுவே என் அரசரே உமக்கே மகிமை", "பரிசுத்தர் நீரே ஆண்டவரே", "உம் நாமம் உயர்த்தப்படும்", "உலகமெல்லாம் உம்மைத் துதிக்கும்"],
    bridge: ["என் வாழ்வே உம் பலிபீடம்", "உம் சித்தம் என்னில் நிறைவேறும்"],
    outro: ["ஆமென் ஆமென் நீரே மன்னர்", "என்றென்றும் உமக்கே துதி"],
  },
  kn: {
    intro: ["ನನ್ನ ಹೃದಯ ನಿನಗಾಗಿ ತೆರೆದೆ", "ನಿನ್ನ ನಾಮದಿಂದ ಗಾನ ಆರಂಭಿಸಿದೆ", "ನಿನ್ನ ಸನ್ನಿಧಿಯಲ್ಲಿ ನಿಂತೆ"],
    verse: ["ನಿನ್ನ ಪ್ರೀತಿ ಮಾತುಗಳಿಗೆ ಮೀರಿದ್ದು", "ನಿನ್ನ ಕೃಪೆ ನನ್ನನ್ನು ಆವರಿಸಿದೆ", "ಅರಣ್ಯದಲ್ಲಿ ನೀರು ಹುಟ್ಟಿಸಿದೆ", "ಕತ್ತಲಲ್ಲಿ ಬೆಳಕು ತೋರಿಸಿದೆ", "ನಿನ್ನ ನಾಮವೇ ನನ್ನ ಉಸಿರು"],
    pre: ["ದೇವರೇ ನಿನ್ನ ಸನ್ನಿಧಿಯಲ್ಲಿ", "ಸ್ತುತಿಯನ್ನು ಸಲ್ಲಿಸುವೆನು"],
    chorus: ["ಯೇಸು ನನ್ನ ರಾಜ ನಿನಗೇ ಸ್ತೋತ್ರ", "ಪರಿಶುದ್ಧನು ನೀನೇ ಪ್ರಭುವೇ", "ನಿನ್ನ ನಾಮ ಉನ್ನತವಾಗಲಿ", "ಲೋಕವೆಲ್ಲಾ ನಿನ್ನನ್ನು ಸ್ತುತಿಸಲಿ"],
    bridge: ["ನನ್ನ ಜೀವನವೇ ನಿನ್ನ ಯಜ್ಞವೇದಿಕೆ", "ನಿನ್ನ ಚಿತ್ತ ನನ್ನಲ್ಲಿ ನೆರವೇರಲಿ"],
    outro: ["ಆಮೆನ್ ಆಮೆನ್ ನೀನೇ ರಾಜ", "ಯುಗಯುಗಕೂ ನಿನ್ನ ಸ್ತುತಿ"],
  },
  ml: {
    intro: ["എൻ്റെ ഹൃദയം നിനക്കായി തുറന്നു", "നിൻ നാമത്തിൽ ഗാനം തുടങ്ങുന്നു", "നിൻ്റെ സന്നിധിയിൽ ഞാൻ നിൽക്കുന്നു"],
    verse: ["നിൻ സ്നേഹം വാക്കുകൾക്കതീതം", "നിൻ കൃപ എന്നെ പൊതിയുന്നു", "മരുഭൂമിയിൽ വെള്ളം കണ്ടു", "ഇരുട്ടിൽ വെളിച്ചം കാട്ടി", "നിൻ നാമമേ എൻ്റെ ശ്വാസം"],
    pre: ["കർത്താവേ നിൻ മുമ്പിൽ വന്നു", "സ്തുതി സമർപ്പിക്കുന്നു"],
    chorus: ["യേശുവേ എൻ രാജാവേ നിനക്ക് സ്തുതി", "പരിശുദ്ധൻ നീ മാത്രം കർത്താവേ", "നിൻ നാമം ഉയർത്തപ്പെടും", "ലോകം മുഴുവൻ നിന്നെ സ്തുതിക്കും"],
    bridge: ["എൻ ജീവിതം നിൻ യാഗപീഠം", "നിൻ ഹിതം എന്നിൽ നിറവേറട്ടെ"],
    outro: ["ആമേൻ ആമേൻ നീ രാജാവ്", "യുഗയുഗങ്ങൾക്കും നിനക്ക് സ്തുതി"],
  },
};

/* --------------------------------------------------------------- lyrics */

export function buildLyrics(input: TemplateInput): OutputBlock[] {
  const lang = str(input.language, "te");
  const songType = (str(input.songType, "worship") || "worship") as SongType;
  const topic = str(input.topic, songType === "love" ? "ప్రేమ" : "ఆరాధన");
  const mood = str(input.mood, "hopeful");
  const singer = str(input.singerType, "male");
  const length = Number(input.length ?? 4);

  const bank: Bank =
    lang === "te" ? TE[songType] : lang === "en" ? EN[songType] : GENERIC[lang] ?? EN[songType];

  const linesFor = (arr: string[], base: number, max: number) =>
    Math.max(1, Math.min(base + Math.floor(length / 4), max));
  const vs = rndN(bank.verse, linesFor(bank.verse, 3, 4));
  const v2 = rndN(bank.verse, linesFor(bank.verse, 3, 4));
  const ch = rndN(bank.chorus, linesFor(bank.chorus, 3, 4));
  const jin = rndN(bank.intro, 1);
  const jpre = rndN(bank.pre, 1)[0];
  const jbr = rndN(bank.bridge, 1)[0];
  const jou = rndN(bank.outro, 1)[0];

  const langName = LANG_NAMES[lang] ?? "Telugu";
  const moodNote =
    lang === "te"
      ? `${mood === "peaceful" ? "శాంతమైన" : mood === "joyful" ? "ఆనందకరమైన" : mood === "powerful" ? "శక్తివంతమైన" : "భావోద్వేగమైన"} భావనతో`
      : `mood: ${mood}`;

  const render = (lines: string[]) => lines.map((l) => `${l}`).join("\n");

  const chorusNote =
    lang === "te" ? "(పల్లవి ప్రతి పద్యం తర్వాత రెండుసార్లు పాడండి)" : "(Repeat chorus after every verse)";

  return [
    {
      title: "Title Suggestions",
      text: [
        cap(topic),
        `${cap(topic)} — ${cap(mood)}`,
        lang === "te" ? `${cap(topic)} | ${cap(topic)} లోకి` : `${cap(topic)} — Song`,
      ].join("\n"),
    },
    { title: "Intro", text: `${jin}\n\n${moodNote}` },
    { title: "Verse 1", text: render(vs) },
    { title: "Pre-Chorus", text: jpre },
    { title: "Chorus", text: `${render(ch)}\n\n${chorusNote} (Verse 1 → Chorus repeat)` },
    { title: "Verse 2", text: render(v2) },
    { title: "Bridge", text: jbr },
    { title: "Final Chorus", text: `${render(ch)}\n\n${jou}` },
    {
      title: "Outro",
      text: `${jou}\n\n(singer: ${singer} · language: ${langName} · length ~ ${length} min)`,
    },
  ];
}

export function buildChristianSong(input: TemplateInput): OutputBlock[] {
  return buildLyrics({ ...input, songType: "worship" });
}

/* -------------------------------------------------------------- captions */

const HOOKS: Record<string, string[]> = {
  professional: [
    "Sharing something valuable today.",
    "A quick update worth your time.",
    "Here's what you need to know.",
  ],
  emotional: [
    "This one touched my heart deeply.",
    "Some stories stay with you forever.",
    "I wasn't ready for this feeling.",
  ],
  funny: [
    "Buckle up — this is going to be fun.",
    "You'll laugh, I promise.",
    "Warning: mild chaos ahead.",
  ],
  inspirational: [
    "Small steps. Big changes.",
    "Keep going. You're closer than you think.",
    "Your comeback is stronger than your setback.",
  ],
  christian: [
    "Grace in every season.",
    "Faith moves mountains — and hearts.",
    "You are never beyond His reach.",
  ],
  cinematic: [
    "Every frame tells a story.",
    "Shot on a journey worth remembering.",
    "Behind every scene is a story.",
  ],
  casual: [
    "Just a glimpse of today.",
    "Casual post, real vibes.",
    "Nothing fancy — just real life.",
  ],
};

const CTAS = [
  "Like & share if this resonated with you.",
  "Comment below — I'd love your thoughts.",
  "Follow for more content like this.",
  "Save this for later when you need it.",
  "Tag someone who needs to see this.",
];

const PLATFORM_TAGS: Record<string, string[]> = {
  instagram: ["#instagram", "#reels", "#instadaily"],
  facebook: ["#facebook", "#facebookreels"],
  tiktok: ["#tiktok", "#fyp", "#viral"],
  threads: ["#threads"],
  youtube: ["#youtube", "#shorts", "#subscribe"],
};

export function buildCaption(input: TemplateInput): OutputBlock[] {
  const topic = str(input.topic, "this moment");
  const tone = str(input.tone, "casual");
  const platform = str(input.platform, "instagram");
  const lang = str(input.language, "en");
  const audience = str(input.audience, "everyone");
  const hook = rnd(HOOKS[tone] ?? HOOKS.casual);
  const cta = rnd(CTAS);
  const tags = [...(PLATFORM_TAGS[platform] ?? []), "#" + topic.replace(/\s+/g, "")];

  const head = lang === "te" ? "🖋️" : "✍️";
  const short =
    lang === "te"
      ? `${topic} గురించి ఇది ప్రత్యేకం. ${cta}`
      : `${hook} ${topic}. ${cta}`;
  const medium =
    lang === "te"
      ? `${hook}\n\n${topic} — ఇది చాలా మందికి ఉపయోగమవుతుంది. మీ స్నేహితులకు షేర్ చేయండి. ${cta}`
      : `${hook}\n\n${topic}. Made for ${audience}. ${cta}`;
  const long =
    lang === "te"
      ? `${head} ${hook}\n\n${topic} గురించి మాట్లాడాలని ఉంది. ఈ సమయంలో ఈ విషయం చాలా ముఖ్యం. ${audience} అందరికీ ఇది ఉపయోగకరం.\n\nమీ అనుభవాలు కామెంట్ లో పంచుకోండి. ${cta}`
      : `${head} ${hook}\n\nI wanted to talk about ${topic} today. It's a subject that matters to ${audience}, and in a world of noise, this deserves a moment.\n\nShare your experience in the comments. ${cta}`;

  return [
    { title: "Short Caption", text: short },
    { title: "Medium Caption", text: medium },
    { title: "Long Caption", text: long },
    { title: "Hashtags", text: tags.slice(0, 8).join(" ") },
    { title: "Call To Action", text: cta },
  ];
}

/* -------------------------------------------------------------- youtube */

export function buildYoutube(input: TemplateInput): OutputBlock[] {
  const topic = str(input.topic, "your topic");
  const lang = str(input.language, "en");
  const audience = str(input.audience, "everyone");
  const type = str(input.videoType, "vlog");

  const t1 = `${cap(topic)} — Everything You Need to Know`;
  const t2 = `${cap(topic)}: The Truth Nobody Talks About`;
  const t3 = `I Tried ${cap(topic)} for 30 Days`;
  const t4 = `${cap(topic)} Explained in 5 Minutes`;
  const t5 = `Why ${cap(topic)} Matters More Than You Think`;
  const t6 = `A Beginner's Guide to ${cap(topic)}`;
  const t7 = `${cap(topic)} — 7 Things I Wish I Knew`;
  const t8 = `The Real Story Behind ${cap(topic)}`;
  const t9 = `${cap(topic)} That Will Change Your Perspective`;
  const t10 = `Master ${cap(topic)} | Step by Step`;

  const te = lang === "te";
  const desc = te
    ? `${cap(topic)} గురించి ఈ వీడియోలో పూర్తి వివరాలు చెప్పబోతున్నాము.\n\nఈ వీడియో ${audience} కోసం. మంచిగా అనిపిస్తే లైక్ చేయండి, షేర్ చేయండి, సబ్స్క్రైబ్ చేయండి!\n\n#${topic.replace(/\s+/g, "")} #subscribe`
    : `In this video we break down everything about ${topic}.\n\nMade for ${audience}. If you find it useful, like, share and subscribe!\n\n#${topic.replace(/\s+/g, "")} #subscribe`;

  return [
    { title: "10 YouTube Titles", text: [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10].join("\n") },
    { title: "Description", text: desc },
    {
      title: "Tags",
      text: [
        topic,
        `${topic} tutorial`,
        `${type} ${topic}`,
        `how to ${topic}`,
        `${topic} for beginners`,
        topic.replace(/\s+/g, ""),
      ].join(", "),
    },
    { title: "Hashtags", text: `#${topic.replace(/\s+/g, "")} #${type} #youtube` },
    {
      title: "Pinned Comment",
      text: te
        ? `మీరు ఏ అంశం గురించి వీడియో చేయాలనుకుంటున్నారు? కామెంట్ లో చెప్పండి! లైక్ & సబ్స్క్రైబ్ చేయడం మర్చిపోవద్దు. ❤️`
        : `What should we cover next? Drop your ideas below! Don't forget to like & subscribe. ❤️`,
    },
    { title: "Thumbnail Text", text: te ? `${cap(topic)} | 100% GUIDE` : `${cap(topic)} | FULL GUIDE` },
    { title: "Hook", text: te ? `ఈ ${topic} గురించి మీకు తెలిసిందంతా తప్పు కావచ్చు...` : `Everything you know about ${topic} might be wrong...` },
    { title: "Call To Action", text: te ? `వీడియో నచ్చితే లైక్ చేయండి, సబ్స్క్రైబ్ చేయండి.` : `If this helped, like and subscribe — it costs nothing and helps a lot.` },
    { title: "SEO Note", text: "Search ranking depends on watch time, engagement and relevance. These suggestions are estimates — they do not guarantee rankings." },
  ];
}

/* --------------------------------------------------------------- script */

const DURATION_BUDGET: Record<string, { words: number; scenes: number }> = {
  "30": { words: 90, scenes: 2 },
  "60": { words: 170, scenes: 3 },
  "180": { words: 480, scenes: 5 },
  "300": { words: 800, scenes: 7 },
  "600": { words: 1550, scenes: 10 },
};

export function buildScript(input: TemplateInput): OutputBlock[] {
  const topic = str(input.topic, "your topic");
  const lang = str(input.language, "en");
  const style = str(input.style, "educational");
  const duration = str(input.duration, "60");
  const audience = str(input.audience, "everyone");
  const budget = DURATION_BUDGET[duration] ?? DURATION_BUDGET["60"];
  const te = lang === "te";

  const main = te
    ? [
        `ముందుగా ${topic} అంటే ఏమిటో స్పష్టంగా వివరించండి.`,
        `${topic} యొక్క ముఖ్యమైన 3 అంశాలను ఒక్కొక్కటిగా చెప్పండి.`,
        `ప్రతి అంశానికి ఒక ఉదాహరణ ఇవ్వండి.`,
        `${audience} కోసం ఇది ఎందుకు ఉపయోగమో చెప్పండి.`,
        `చివరగా ప్రధానాంశాలను సారాంశీకరించండి.`,
      ]
    : [
        `Open with a clear definition of ${topic}.`,
        `Walk through the 3 key aspects of ${topic}, one at a time.`,
        `Give a short example for each point.`,
        `Explain why this matters to ${audience}.`,
        `Wrap up with a quick recap of the main points.`,
      ];

  const scenes: string[] = [];
  for (let i = 0; i < budget.scenes; i++) {
    scenes.push(
      te
        ? `Scene ${i + 1}: ${topic} అంశాన్ని దృశ్యమానంగా చూపండి — ${style} శైలిలో.`
        : `Scene ${i + 1}: Visually illustrate ${topic} — ${style} style.`,
    );
  }

  return [
    {
      title: "Hook",
      text: te
        ? `${topic} గురించి ఈ వీడియో మీ ఊహలను మార్చేస్తుంది.`
        : `${cap(topic)} is about to change how you see things.`,
    },
    { title: "Introduction", text: te ? `హాయ్! ఈ వీడియోలో ${topic} గురించి చర్చిస్తాం. ${audience} అందరికీ ఇది ఉపయోగకరం.` : `Hi! In this video we're talking about ${topic} — something that matters to ${audience}.` },
    { title: "Main Content", text: main.join("\n\n") },
    { title: "Scene Suggestions", text: scenes.join("\n") },
    {
      title: "Voice-over",
      text: te
        ? `సహజమైన మాట్లాడే భాషలో, క్రమంగా వేగంతో: "${cap(topic)} అనేది మీ రోజువారీ జీవితాన్ని ప్రభావితం చేసే విషయం. మనం లోతుగా అర్థం చేసుకుందాం..."`
        : `Natural spoken tone, measured pace: "At its heart, ${topic} is something that touches everyday life. Let's understand it properly..."`,
    },
    { title: "CTA", text: te ? `ఇలాంటి మరిన్ని వీడియోల కోసం సబ్స్క్రైబ్ చేయండి.` : `Subscribe for more videos like this one.` },
  ];
}

/* ------------------------------------------------------------------- seo */

export function buildSeo(input: TemplateInput): OutputBlock[] {
  const keyword = str(input.keyword, "your keyword");
  const topic = str(input.topic, keyword);
  const platform = str(input.platform, "youtube");
  const lang = str(input.language, "en");
  const te = lang === "te";

  return [
    { title: "SEO Title", text: te ? `${cap(topic)} — ${cap(keyword)} పూర్తి గైడ్` : `${cap(topic)} — The Complete Guide to ${cap(keyword)}` },
    { title: "Meta Description", text: te ? `${cap(topic)} గురించి సంక్షిప్తంగా. ${cap(keyword)}, చిట్కాలు మరియు ఉదాహరణలు — ఒకే చోట.` : `Learn about ${topic} and master ${keyword}. Practical tips, examples and a clear step-by-step guide in one place.` },
    { title: "YouTube Description", text: te ? `ఈ వీడియోలో ${topic} గురించి వివరంగా చూస్తాం. సమయం దాచకుండా, స్పష్టంగా.` : `In this video we go deep on ${topic}. Straight to the point, no fluff, with practical examples you can use today.` },
    { title: "Keywords", text: [keyword, topic, `${keyword} ${platform}`, `how to ${keyword}`, `${keyword} guide`, `${keyword} tips`].join(", ") },
    { title: "Tags", text: [`${keyword}`, `${topic}`, `${keyword} tutorial`, `${platform} growth`, `${keyword} examples`].join(", ") },
    { title: "Hashtags", text: `#${keyword.replace(/\s+/g, "")} #${platform} #content` },
    { title: "Note", text: "SEO suggestions are generated estimates and do not guarantee rankings." },
  ];
}

/* --------------------------------------------------------- video prompts */

const CAMERAS = ["wide establishing shot", "close-up", "medium shot", "over-the-shoulder", "aerial drone", "slow dolly-in", "handheld tracking", "low angle hero shot"];
const LIGHTING = ["golden hour glow", "soft diffused light", "dramatic rim lighting", "moody low-key light", "neon accents", "volumetric god rays", "candlelit warm scene", "cool moonlight"];
const MOVEMENT = ["static tripod", "smooth pan", "push-in", "crane up", "orbit around subject", "snorricam vibe", "rack focus", "slow zoom"];

export function buildVideoPrompt(input: TemplateInput): OutputBlock[] {
  const story = str(input.story, "a journey");
  const style = str(input.visualStyle, "cinematic");
  const ratio = str(input.aspectRatio, "16:9");
  const cameraStyle = str(input.cameraStyle, "cinematic");
  const lighting = str(input.lighting, "golden hour");
  const lang = str(input.language, "en");
  const duration = Number(input.duration ?? 60);
  const sceneCount = Math.max(2, Math.min(12, Math.round(duration / 20)));

  const scenes: OutputBlock[] = [];
  for (let i = 0; i < sceneCount; i++) {
    const cam = rnd(CAMERAS);
    const mov = rnd(MOVEMENT);
    const light = rnd(LIGHTING);
    scenes.push({
      title: `Scene ${i + 1}`,
      text: [
        `Visual: ${style} depiction of ${story} — ${i === 0 ? "opening moment" : i === sceneCount - 1 ? "climax/resolution" : "story development"}.`,
        `Character: ${i === 0 ? `protagonist introduced` : `character in action`}, ${i % 2 === 0 ? "expressing emotion" : "moving through the scene"}.`,
        `Environment: ${i % 3 === 0 ? "wide, atmospheric location" : i % 3 === 1 ? "intimate setting" : "dynamic urban/natural backdrop"}.`,
        `Camera: ${cam}, ${cameraStyle} framing.`,
        `Movement: ${mov}.`,
        `Lighting: ${light}${i === 0 ? " (matches " + lighting + ")" : ""}.`,
        `Mood: ${i < sceneCount / 3 ? "establishing" : i < (sceneCount * 2) / 3 ? "rising tension" : "emotional payoff"}.`,
        `Voice-over (${lang === "te" ? "Telugu" : "English"}): narrate the development of ${story} in this beat.`,
      ].join("\n"),
    });
  }
  return [
    { title: "Story Bible", text: `Story: ${story}\nVisual style: ${style}\nAspect ratio: ${ratio}\nCamera style: ${cameraStyle}\nLighting: ${lighting}\nLanguage: ${lang === "te" ? "Telugu" : "English"}` },
    ...scenes,
  ];
}

/* ----------------------------------------------------------------- bible */

export function buildBibleStory(input: TemplateInput): OutputBlock[] {
  const topic = str(input.topic, "David and Goliath");
  const lang = str(input.language, "en");
  const te = lang === "te";
  return [
    { title: "Title", text: te ? `${cap(topic)} — ఒక నిజ కథ` : `${cap(topic)} — A Faith Story` },
    { title: "Outline", text: te ? `1. సమయం & స్థలం\n2. ప్రధాన పాత్రలు\n3. సవాలు / సంఘటన\n4. విశ్వాస అడుగు\n5. దేవుని బలం\n6. పాఠం` : `1. Time & Setting\n2. Main Characters\n3. The Challenge\n4. The Step of Faith\n5. God's Power\n6. The Lesson` },
    {
      title: "Retelling",
      text: te
        ? `ప్రాచీన కాలంలో, ${topic} కథ జరిగింది. నేటి బాషలో, సహజమైన తెలుగులో ఈ కథను చెప్పుకుందాం. కథలో ముఖ్యమైన విశ్వాస పాఠాన్ని నొక్కి చెప్పండి. (ఈ కంటెంట్ కథ రూపకల్పన; లేఖన వాక్యాలను వాడినప్పుడు అనువాదాన్ని సూచించండి.)`
        : `Long ago, the story of ${topic} happened. Retell it in vivid, natural language, walking through each beat and drawing out the faith lesson. (This is a story outline; when quoting Scripture, name the translation used.)`,
    },
    {
      title: "Faith Lesson",
      text: te
        ? `విశ్వాసం అంటే దేవునిపై నమ్మకం — సవాలు ఎంత పెద్దదైనా. ఈ కథ ద్వారా ప్రజలు ప్రోత్సాహం పొందాలి.`
        : `Faith means trusting God even when the challenge is huge. Use this story to encourage your audience to take their own step of faith.`,
    },
  ];
}

export function buildVerseExplanation(input: TemplateInput): OutputBlock[] {
  const verse = str(input.verse, "");
  const translation = str(input.translation, "KJV");
  const lang = str(input.language, "en");
  const te = lang === "te";
  const base = verse
    ? `Quote (${translation}): "${verse}"`
    : `No verse pasted by the user.`;
  return [
    { title: "Your Selected Verse", text: base },
    {
      title: "Context",
      text: te
        ? `ఈ వాక్యం ఏ అధ్యాయం/పరిస్థితిలో ఉందో వివరించండి. నేపథ్యం లేకుండా వాక్యాన్ని తప్పుగా అర్థం చేసుకునే అవకాశం ఉంది.`
        : `Describe the immediate context of this verse (who spoke, to whom, and why). Avoid reading it in isolation.`,
    },
    {
      title: "Meaning",
      text: te
        ? `వాక్యంలోని ముఖ్య పదాలను సరళ తెలుగులో వివరించండి.`
        : `Break down the key words and the plain meaning of the verse in simple language.`,
    },
    {
      title: "Application",
      text: te
        ? `ఈ వాక్యం నేటి జీవితానికి ఎలా వర్తిస్తుందో ఒక ఆచరణాత్మక ఉదాహరణతో చెప్పండి.`
        : `Give one practical way this verse applies to everyday life today.`,
    },
    {
      title: "Disclaimer",
      text: "The quote above is exactly what you pasted, credited to its translation. We never invent Bible quotations. Always verify against your printed Bible.",
    },
  ];
}

export function buildPrayer(input: TemplateInput): OutputBlock[] {
  const topic = str(input.topic, "peace");
  const lang = str(input.language, "en");
  const te = lang === "te";
  return [
    {
      title: "Prayer",
      text: te
        ? `సర్వశక్తిమంతుడైన దేవా, ${topic} విషయంలో నీ మార్గదర్శకత్వం కోసం ప్రార్థిస్తున్నాము. నీ కృపను, శాంతిని మాకు అనుగ్రహించు. నీ చిత్తమే మా జీవితాల్లో నెరవేరును గాక. ఆమేన్.`
        : `Almighty God, we come before you regarding ${topic}. Grant us wisdom, peace and your guiding presence. Let your will be done in our lives. Amen.`,
    },
    {
      title: "Prayer Points",
      text: te
        ? `1. ${topic} విషయంలో జ్ఞానం కోసం\n2. భయం విడిచి నమ్మకం\n3. వ్యక్తులు / పరిస్థితుల కోసం శాంతి`
        : `1. Wisdom regarding ${topic}\n2. Trust over fear\n3. Peace for the people and situations involved`,
    },
  ];
}

export function buildSermonOutline(input: TemplateInput): OutputBlock[] {
  const topic = str(input.topic, "Grace");
  const lang = str(input.language, "en");
  const te = lang === "te";
  return [
    { title: "Sermon Title", text: te ? `${cap(topic)} — నేటి పాఠం` : `${cap(topic)} — Today's Message` },
    {
      title: "Outline",
      text: te
        ? `పరిచయం: ${topic} ఎందుకు ముఖ్యం\n\n1. పాయింట్ 1 — ${topic} అంటే ఏమిటి\n2. పాయింట్ 2 — లేఖన ఉదాహరణలు\n3. పాయింట్ 3 — జీవిత అనువర్తనం\n\nముగింపు: తీర్మానం + ప్రార్థన`
        : `Introduction: Why ${topic} matters\n\n1. Point 1 — What ${topic} means\n2. Point 2 — Scriptural examples\n3. Point 3 — Life application\n\nConclusion: Challenge + prayer`,
    },
    {
      title: "Application Question",
      text: te
        ? `మీ జీవితంలో ${topic} అనే దాన్ని ఈ వారం ఎలా అమలు చేస్తారు?`
        : `How will you live out ${topic} this week?`,
    },
  ];
}

export function buildChristianScript(input: TemplateInput): OutputBlock[] {
  return buildScript({ ...input, style: "christian" });
}

export function buildChristianThumbnail(input: TemplateInput): OutputBlock[] {
  const topic = str(input.topic, "God's love");
  const lang = str(input.language, "en");
  const te = lang === "te";
  return [
    {
      title: "Image Prompt",
      text: te
        ? `${topic} — ఉదయించే సూర్యుడి వెలుతురు, పర్వతాలు, శాంతి, సినిమాటిక్, ప్రొఫెషనల్ YouTube థంబ్నెయిల్, కనీసం టెక్స్ట్`
        : `${topic} — golden sunrise over mountains, peaceful atmosphere, cinematic, professional YouTube thumbnail, minimal text`,
    },
    {
      title: "Thumbnail Text",
      text: te ? `${cap(topic)} | విశ్వాసం` : `${cap(topic)} | FAITH`,
    },
  ];
}

/* ------------------------------------------------------- thumbnail concept */

export function buildThumbnailConcept(input: TemplateInput): OutputBlock[] {
  const title = str(input.videoTitle, "Your Video");
  const topic = str(input.mainTopic, title);
  const emotion = str(input.emotion, "powerful");
  const style = str(input.style, "christian");
  const language = str(input.language, "en");
  const character = str(input.character, "");
  const background = str(input.background, "");

  const emotionWords: Record<string, string> = {
    joyful: "bright expressive face, open smile",
    emotional: "teary eyes, tender expression",
    powerful: "strong pose, confident gaze",
    hopeful: "looking up, soft glow on face",
    serious: "focused, intense stare",
    calm: "peaceful expression, relaxed posture",
  };
  const feel = emotionWords[emotion] ?? emotionWords.powerful;

  const styleHints: Record<string, string> = {
    christian: "golden light, serene landscape, subtle cross motif",
    gaming: "neon accents, controller, dynamic motion lines",
    tech: "clean product shot, circuit/interface elements",
    vlog: "lifestyle scene, natural candid moment",
    music: "stage lights, mic silhouette, concert energy",
    education: "clean workspace, book/board, organized layout",
    news: "breaking-news style, bold color blocks",
    cinematic: "anamorphic look, dramatic contrast",
    emotional: "soft focus, heartfelt atmosphere",
    business: "suit, skyline, confident professional look",
  };
  const hint = styleHints[style] ?? styleHints.christian;

  const colorSchemes: Record<string, string[]> = {
    christian: ["gold (#F5B301) + deep blue (#0B2A5B)", "warm cream + burgundy"],
    gaming: ["cyan (#22D3EE) + magenta (#E879F9)", "electric purple + black"],
    tech: ["white + blue (#3B82F6) + dark gray", "steel blue + white"],
    vlog: ["warm orange (#F97316) + teal", "peach + cream"],
    music: ["violet (#8B5CF6) + gold", "stage blue + white"],
    education: ["green (#22C55E) + white + navy", "blackboard green + cream"],
    news: ["red (#DC2626) + white + black", "bold red + navy"],
    cinematic: ["teal + orange blockbuster", "amber + charcoal"],
    emotional: ["soft pink + lavender", "rose + warm gray"],
    business: ["navy (#1E3A8A) + gold", "dark blue + white"],
  };
  const [colors] = colorSchemes[style] ?? colorSchemes.christian;

  const charLine = character ? `Character: ${character}. ` : "";
  const bgLine = background ? `Background: ${background}. ` : "";

  return [
    {
      title: "Concept",
      text: [
        `Emotion: ${emotion} with a ${feel}.`,
        `${charLine}${bgLine}Focus on ONE main subject; keep composition bold and clean.`,
        `Language of any text: ${language === "te" ? "Telugu" : language === "hi" ? "Hindi" : "English"}.`,
      ].join("\n"),
    },
    {
      title: "Thumbnail Text Suggestions",
      text: [
        `Main: ${title.length > 34 ? title.slice(0, 31) + "..." : title}`,
        "Alternative: SHOCK/EMOTION word (e.g. MUST WATCH, TRUTH, AMAZING) + 3-4 words",
        "Max 4 words on the image; big, bold, high contrast.",
      ].join("\n"),
    },
    {
      title: "Layout Suggestion",
      text: "Rule of thirds: subject on one side (left/right), text block on the opposite side. 1280×720 canvas, safe margins ~100px. No more than 30% of the frame covered by text.",
    },
    {
      title: "Color Suggestion",
      text: colors,
    },
    {
      title: "Image Generation Prompt",
      text: `${topic}, ${hint}, ${feel}, 1280x720 professional YouTube thumbnail, high contrast, sharp focus, vibrant colors, minimal text. ${charLine}${bgLine}`.trim(),
    },
  ];
}

/* -------------------------------------------------------------- registry */

export function runTemplate(tool: string, input: TemplateInput): OutputBlock[] {
  switch (tool) {
    case "lyrics":
      return buildLyrics(input);
    case "christian-song":
      return buildChristianSong(input);
    case "caption":
      return buildCaption(input);
    case "youtube":
      return buildYoutube(input);
    case "script":
      return buildScript(input);
    case "seo":
      return buildSeo(input);
    case "video-prompt":
      return buildVideoPrompt(input);
    case "bible-story":
      return buildBibleStory(input);
    case "bible-verse":
      return buildVerseExplanation(input);
    case "prayer":
      return buildPrayer(input);
    case "sermon":
      return buildSermonOutline(input);
    case "christian-script":
      return buildChristianScript(input);
    case "christian-thumbnail":
      return buildChristianThumbnail(input);
    case "thumbnail":
      return buildThumbnailConcept(input);
    default:
      return [
        {
          title: "Result",
          text: `Template for "${tool}" is not implemented yet.`,
        },
      ];
  }
}