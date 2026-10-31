// Seating-narration builder. Pure and unit-testable.
//
// Produces a spoken/caption script for the AI Voice Assistant from the ACTUAL
// computed showcase data — never hardcoded numbers. Every figure (guest count,
// capacity, arranged, available, tables, chairs, stage size, dimensions) comes
// from the SeatingStats / arrangement / dims the showcase already calculated.
//
// Supports English ("en") and Tamil ("ta"). Narration adapts to the event type
// (mandap vs. cake table vs. auditorium) and to the guest count (intimate →
// recommend-larger-venue), and it NEVER claims all guests are accommodated
// unless capacity actually supports it.

import type { EventEnvironment } from "./eventEnvironment";
import type { SeatingStats, ShowcaseArrangement } from "./showcaseSeating";

export type NarrationLang = "en" | "ta";

export type NarrationInput = {
  lang: NarrationLang;
  eventName: string;
  env: EventEnvironment;
  stats: SeatingStats;
  arrangement: ShowcaseArrangement;
  dims: { width: number; depth: number; isSample: boolean };
};

export type NarrationScript = {
  // Title line (shown as a caption heading and spoken first).
  title: string;
  // Ordered paragraphs — each is spoken and shown as a caption line.
  paragraphs: string[];
  // Convenience: the full spoken text (paragraphs joined).
  full: string;
  // Whether the arrangement can seat every guest (capacity >= guests).
  sufficient: boolean;
  // Extra seats needed when insufficient (0 when sufficient).
  seatsNeeded: number;
};

// Count real chairs placed in the scene (theatre rows). Round/rect tables
// contribute "dining seats", not loose chairs.
function countChairs(arrangement: ShowcaseArrangement): number {
  return arrangement.chairRows.reduce((s, r) => s + r.seats, 0);
}

function arrangementLabel(env: EventEnvironment, lang: NarrationLang): string {
  const en: Record<string, string> = {
    "banquet-round": "a round-table banquet layout",
    theatre: "an auditorium-style row layout",
    cluster: "relaxed lounge clusters",
    "u-shape": "a U-shaped table layout",
  };
  const ta: Record<string, string> = {
    "banquet-round": "வட்ட மேசை விருந்து அமைப்பு",
    theatre: "அரங்க வரிசை அமைப்பு",
    cluster: "நிதானமான கூட்ட அமைப்பு",
    "u-shape": "U வடிவ மேசை அமைப்பு",
  };
  return (lang === "ta" ? ta : en)[env.arrangement] ?? env.arrangement;
}

// Event-specific zone description. Keyed on the resolved eventKey so each event
// speaks about its own real features (mandap, cake table, auditorium, …).
function eventZones(env: EventEnvironment, lang: NarrationLang): string {
  const en: Record<string, string> = {
    "tamil-wedding":
      "The layout centres on a traditional mandap with seating for the bride and groom, guest rows facing the stage, flower-decoration zones around the mandap, a banana-leaf dining area, and clear walking paths between the rows.",
    "kerala-wedding":
      "The layout features a traditional stage framed by tall nilavilakku lamps, guest seating facing the couple, floral zones, a dining area, and open walking paths.",
    "north-indian-wedding":
      "The layout includes a grand central wedding mandap, stage seating for the couple, guest seating sections with space reserved near the front for close family and VIPs, a dining zone, and a clear pathway towards the stage.",
    "engagement-reception":
      "The layout presents the couple's stage with a decorative backdrop, family seating near the front, guest seating rows, a photography area beside the stage, the entrance, and dining arrangements along the side.",
    birthday:
      "The layout features the birthday stage with a cake table, a photo-booth backdrop, seating grouped for children and adults, and open activity space for games and movement.",
    community:
      "The layout uses auditorium-style seating facing a central stage, with a clear central aisle and open entry and exit access on both sides.",
    celebration:
      "The layout centres on a decorated stage, guest seating, a dining area, and clear walking paths around the room.",
  };
  const ta: Record<string, string> = {
    "tamil-wedding":
      "இந்த அமைப்பு பாரம்பரிய மண்டபத்தை மையமாகக் கொண்டது; மணமக்கள் இருக்கை, மேடையை நோக்கிய விருந்தினர் வரிசைகள், மலர் அலங்கார பகுதிகள், வாழை இலை உணவு பகுதி மற்றும் வரிசைகளுக்கு இடையே தெளிவான நடைபாதைகள் உள்ளன.",
    "kerala-wedding":
      "உயர்ந்த நிலைவிளக்குகளால் சூழப்பட்ட பாரம்பரிய மேடை, தம்பதியை நோக்கிய விருந்தினர் இருக்கை, மலர் பகுதிகள், உணவு பகுதி மற்றும் திறந்த நடைபாதைகள் இந்த அமைப்பில் உள்ளன.",
    "north-indian-wedding":
      "இந்த அமைப்பில் பிரம்மாண்டமான மைய திருமண மண்டபம், தம்பதிக்கான மேடை இருக்கை, முன்பகுதியில் நெருங்கிய குடும்பத்தினர் மற்றும் முக்கியஸ்தர்களுக்கு இடம், உணவு பகுதி மற்றும் மேடையை நோக்கிய தெளிவான பாதை உள்ளன.",
    "engagement-reception":
      "அலங்கார பின்னணியுடன் கூடிய தம்பதியின் மேடை, முன்பகுதியில் குடும்ப இருக்கை, விருந்தினர் வரிசைகள், மேடைக்கு அருகில் புகைப்பட பகுதி, நுழைவாயில் மற்றும் உணவு ஏற்பாடுகள் இந்த அமைப்பில் உள்ளன.",
    birthday:
      "கேக் மேசையுடன் கூடிய பிறந்தநாள் மேடை, புகைப்பட பின்னணி, குழந்தைகள் மற்றும் பெரியவர்களுக்கான இருக்கை, மற்றும் விளையாட்டுக்கான திறந்த இடம் இந்த அமைப்பில் உள்ளன.",
    community:
      "மைய மேடையை நோக்கிய அரங்க பாணி இருக்கை, தெளிவான மைய நடைபாதை மற்றும் இரு பக்கமும் திறந்த நுழைவு–வெளியேறு வசதி இதில் உள்ளன.",
    celebration:
      "அலங்கரிக்கப்பட்ட மேடை, விருந்தினர் இருக்கை, உணவு பகுதி மற்றும் அறையைச் சுற்றி தெளிவான நடைபாதைகள் இந்த அமைப்பில் உள்ளன.",
  };
  const table = lang === "ta" ? ta : en;
  return table[env.eventKey] ?? table.celebration;
}

// Guest-count-adaptive note. Thresholds mirror the spec examples.
function guestScaleNote(guests: number, sufficient: boolean, lang: NarrationLang): string {
  const en = (): string => {
    if (guests <= 60) return "With a smaller guest list, this is an intimate seating arrangement with plenty of space to move around.";
    if (guests <= 120) return "This is a balanced seating arrangement with a comfortable walking area between sections.";
    if (guests <= 180) return "At this size, the seating is optimised into suitable rows and table groups to use the space well.";
    if (!sufficient) return "This is a large gathering. If the current venue cannot seat everyone comfortably, consider a larger venue layout.";
    return "This is a large gathering, and the layout is arranged to make the most of the available space.";
  };
  const ta = (): string => {
    if (guests <= 60) return "சிறிய விருந்தினர் பட்டியலுடன், இது நகர்வதற்கு நிறைய இடமுள்ள நெருக்கமான இருக்கை அமைப்பு.";
    if (guests <= 120) return "பிரிவுகளுக்கு இடையே வசதியான நடைபாதையுடன் கூடிய சமநிலையான இருக்கை அமைப்பு இது.";
    if (guests <= 180) return "இந்த அளவில், இடத்தை நன்கு பயன்படுத்த இருக்கைகள் பொருத்தமான வரிசைகள் மற்றும் மேசைக் குழுக்களாக அமைக்கப்பட்டுள்ளன.";
    if (!sufficient) return "இது ஒரு பெரிய கூட்டம். தற்போதைய அரங்கில் அனைவரையும் வசதியாக அமர்த்த முடியாவிட்டால், பெரிய அரங்க அமைப்பைக் கருத்தில் கொள்ளுங்கள்.";
    return "இது ஒரு பெரிய கூட்டம்; கிடைக்கும் இடத்தை சிறப்பாகப் பயன்படுத்த அமைப்பு ஏற்பாடு செய்யப்பட்டுள்ளது.";
  };
  return lang === "ta" ? ta() : en();
}

// Build the full narration script from live data.
export function buildNarration(input: NarrationInput): NarrationScript {
  const { lang, eventName, env, stats, arrangement, dims } = input;
  const guests = stats.guestCount;
  const chairs = countChairs(arrangement);
  const sufficient = stats.totalCapacity >= guests;
  const seatsNeeded = sufficient ? 0 : guests - stats.totalCapacity;
  const surplus = Math.max(0, stats.seatsArranged - guests);

  const paragraphs: string[] = [];

  if (lang === "ta") {
    const title = `${env.displayName} 3D இருக்கை முன்னோட்டத்திற்கு வரவேற்கிறோம்!`;

    paragraphs.push(`உங்கள் நிகழ்வு "${eventName}" — ${env.displayName}. இதில் ${guests} விருந்தினர்கள் உள்ளனர்.`);
    paragraphs.push(
      `${dims.isSample ? "மாதிரி அரங்கின் அளவு " : "அரங்கின் அளவு "}${dims.width} மீட்டர் அகலம் × ${dims.depth} மீட்டர் ஆழம். இது மொத்தம் ${stats.totalCapacity} இருக்கைகள் கொள்ளளவு கொண்டது; ${stats.seatsArranged} இருக்கைகள் அமைக்கப்பட்டு, ${stats.availableSeats} இருக்கைகள் மீதம் உள்ளன.`,
    );
    paragraphs.push(
      `${stats.tableCount} மேசைகள்${chairs > 0 ? ` மற்றும் ${chairs} நாற்காலிகள்` : ""} உள்ளன. மேடை ${stats.stage.width} மீட்டர் × ${stats.stage.depth} மீட்டர் அளவில் முன்பகுதியில் உள்ளது; நுழைவாயில் பின்பகுதியில் உள்ளது.`,
    );
    paragraphs.push(eventZones(env, lang));
    paragraphs.push(`இருக்கை அமைப்பு: ${arrangementLabel(env, lang)}.`);

    if (sufficient && surplus === 0) {
      paragraphs.push(`இந்த அமைப்பு ${guests} விருந்தினர்களையும் சரியாக அமர்த்தும் கொள்ளளவு கொண்டது.`);
    } else if (sufficient && surplus > 0) {
      paragraphs.push(
        `இந்த அமைப்பில் ${guests} விருந்தினர்களுக்கு போதுமான மொத்த கொள்ளளவு உள்ளது. ஆனால் ${surplus} இருக்கைகள் விருந்தினர் எண்ணிக்கையை விட அதிகம்; எனவே வசதி மற்றும் நடைபாதைக்காக அமைப்பை சரிசெய்யலாம்.`,
      );
    } else {
      paragraphs.push(
        `தற்போதைய கொள்ளளவு ${stats.totalCapacity} மட்டுமே; ${guests} விருந்தினர்களை அமர்த்த மேலும் ${seatsNeeded} இருக்கைகள் தேவை. பெரிய அரங்கு அல்லது கூடுதல் மேசைகளைக் கருத்தில் கொள்ளுங்கள்.`,
      );
    }

    paragraphs.push(guestScaleNote(guests, sufficient, lang));
    paragraphs.push("ஐசோமெட்ரிக், முன் மற்றும் மேல் பார்வைகளில் இந்த அமைப்பை நீங்கள் ஆராயலாம். இது உங்கள் தனிப்பயன் இருக்கை முன்னோட்டம்!");

    const full = [title, ...paragraphs].join(" ");
    return { title, paragraphs, full, sufficient, seatsNeeded };
  }

  // English
  const title = `Welcome to your ${env.displayName} 3D seating showcase!`;

  paragraphs.push(`Your event, "${eventName}", is a ${env.displayName} with ${guests} ${guests === 1 ? "guest" : "guests"}.`);
  paragraphs.push(
    `${dims.isSample ? "This sample venue measures " : "The venue measures "}${dims.width} metres wide by ${dims.depth} metres deep. It provides a total capacity of ${stats.totalCapacity} seats, with ${stats.seatsArranged} seats arranged and ${stats.availableSeats} ${stats.availableSeats === 1 ? "seat" : "seats"} remaining.`,
  );
  paragraphs.push(
    `There ${stats.tableCount === 1 ? "is" : "are"} ${stats.tableCount} ${stats.tableCount === 1 ? "table" : "tables"}${chairs > 0 ? ` and ${chairs} chairs` : ""}. The stage measures ${stats.stage.width} by ${stats.stage.depth} metres at the front, with the entrance at the back of the room.`,
  );
  paragraphs.push(eventZones(env, lang));
  paragraphs.push(`The seating follows ${arrangementLabel(env, lang)}.`);

  if (sufficient && surplus === 0) {
    paragraphs.push(`This arrangement has enough total capacity for all ${guests} guests.`);
  } else if (sufficient && surplus > 0) {
    paragraphs.push(
      `This arrangement has enough total capacity for ${guests} guests. However, ${surplus} arranged ${surplus === 1 ? "seat is" : "seats are"} above the guest count, so you can adjust the layout to improve comfort and walking space.`,
    );
  } else {
    paragraphs.push(
      `The current capacity is only ${stats.totalCapacity}, so ${seatsNeeded} more ${seatsNeeded === 1 ? "seat is" : "seats are"} needed to seat all ${guests} guests. Consider a larger venue or adding more tables.`,
    );
  }

  paragraphs.push(guestScaleNote(guests, sufficient, lang));
  paragraphs.push("You can explore the arrangement from the isometric, front and top views. This is your personalized seating preview!");

  const full = [title, ...paragraphs].join(" ");
  return { title, paragraphs, full, sufficient, seatsNeeded };
}
