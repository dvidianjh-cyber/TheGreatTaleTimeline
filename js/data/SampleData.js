/**
 * SampleData.js — Tolkien/Arda Sample Dataset
 * Last Modified: 2026-05-18
 *
 * World-agnostic sample dataset following the data contract schemas.
 * Used for development auto-load. All strings come from data, not the engine.
 *
 * Master Scale (TU) reference for Arda:
 *   Years of the Lamps: VY 1–3500 → TU 1–33,537 (1 VY = 9.582 solar years)
 *   Years of the Trees:  VY 3501–4580 → TU 33,547–43,886
 *   First Age (solar):   FA 1–590 → TU 43,887–44,477
 *   Second Age (solar):  SA 1–3441 → TU 44,478–47,919
 *   Third Age (solar):   TA 1–3021 → TU 47,920–50,941
 */

const SAMPLE_DATASET = {
    world_config: {
        world_name: "Tolkein's Arda",
        time_systems: [
            { id: "solar", name: "Solar Year", abbreviation: "SY", isPrimary: true },
            { id: "valian", name: "Valian Year", abbreviation: "VY", conversion_factor: 9.582 }
        ],
        epochs: [
            {
                id: "lamps",
                label: "Years of the Lamps",
                start_tu: 1,
                end_tu: 33537,
                time_system: "valian",
                abbreviation: "YL",
                color: "#e6def4"
            },
            {
                id: "trees",
                label: "Years of the Trees",
                start_tu: 33538,
                end_tu: 43886,
                time_system: "valian",
                abbreviation: "YT",
                color: "#d8e8de"
            },
            {
                id: "first_age",
                label: "First Age",
                start_tu: 43887,
                end_tu: 44477,
                time_system: "solar",
                abbreviation: "FA",
                color: "#f0e5d1"
            },
            {
                id: "second_age",
                label: "Second Age",
                start_tu: 44478,
                end_tu: 47919,
                time_system: "solar",
                abbreviation: "SA",
                color: "#dce6ec"
            },
            {
                id: "third_age",
                label: "Third Age",
                start_tu: 47920,
                end_tu: 50941,
                time_system: "solar",
                abbreviation: "TA",
                color: "#e6e4eb"
            }
        ],
        rulers: [
            {
                label: "Lamps Year (Valian)",
                epoch: "lamps",
                visible: true
            },
            {
                label: "Trees Year (Valian)",
                epoch: "trees",
                visible: true
            },
            {
                label: "First Age Year",
                epoch: "first_age",
                visible: true
            },
            {
                label: "Second Age Year",
                epoch: "second_age",
                visible: true
            },
            {
                label: "Third Age Year",
                epoch: "third_age",
                visible: true
            }
        ]
    },

    lanes: [
        { id: "lane_valinor", label: "Valinor", color_hint: "#f4eedb", order: 0 },
        { id: "lane_beleriand", label: "Beleriand", color_hint: "#d6e3d8", order: 1, end_tu: 44477 },
        { id: "lane_numenor", label: "Númenor", color_hint: "#d0e0ed", order: 2, end_tu: 47919 },
        { id: "lane_eriador", label: "Eriador", color_hint: "#e2ebd9", order: 3 },
        { id: "lane_rhovanion", label: "Rhovanion", color_hint: "#ece5d3", order: 4 },
        { id: "lane_gondor", label: "Gondor", color_hint: "#f0f0f0", order: 5 },
        { id: "lane_mordor", label: "Mordor", color_hint: "#ebd1d1", order: 6 },
        { id: "lane_rohan", label: "Rohan", color_hint: "#e5eed9", order: 7 }
    ],

    entities: [
        {
            id: "char_morgoth",
            name: "Morgoth (Melkor)",
            metadata: { race: "Ainur", subrace: "Vala", color: "#1a0a2e" },
            lifespan: { start_tu: 1, departure_tu: 44477, departure_lane_id: "lane_beleriand" }
        },
        {
            id: "char_sauron",
            name: "Sauron",
            metadata: { race: "Ainur", subrace: "Maia", color: "#ff4500" },
            lifespan: { start_tu: 1, departure_tu: 50941, departure_lane_id: "lane_mordor" }
        },
        {
            id: "char_feanor",
            name: "Fëanor",
            metadata: { race: "Elf", subrace: "Noldor", color: "#ffd700" },
            lifespan: { start_tu: 36407, birth_lane_id: "lane_valinor", death_tu: 43892, death_lane_id: "lane_beleriand" }
        },
        {
            id: "char_galadriel",
            name: "Galadriel",
            metadata: { race: "Elf", subrace: "Noldor/Teleri", color: "#EEDD82" },
            lifespan: { start_tu: 37940, birth_lane_id: "lane_valinor", departure_tu: 50941, departure_lane_id: "lane_eriador" }
        },
        {
            id: "char_elrond",
            name: "Elrond",
            metadata: { race: "Half-elven", subrace: "Peredhel", color: "#6495ED" },
            lifespan: { start_tu: 44430, birth_lane_id: "lane_beleriand", departure_tu: 50941, departure_lane_id: "lane_eriador" }
        },
        {
            id: "char_gilgalad",
            name: "Gil-galad",
            metadata: { race: "Elf", subrace: "Noldor", color: "#4682B4" },
            lifespan: { start_tu: 44200, birth_lane_id: "lane_beleriand", death_tu: 47919, death_lane_id: "lane_mordor" }
        },
        {
            id: "char_isildur",
            name: "Isildur",
            metadata: { race: "Man", subrace: "Dúnedain", color: "#C0C0C0" },
            lifespan: { start_tu: 47659, birth_lane_id: "lane_numenor", death_tu: 47922, death_lane_id: "lane_rhovanion" }
        },
        {
            id: "char_aragorn",
            name: "Aragorn II Elessar",
            metadata: { race: "Man", subrace: "Dúnedain", color: "#E8E8E8" },
            lifespan: { date_unit: "TA", birth: 2932, birth_lane_id: "lane_eriador", death: 3022, death_lane_id: "lane_gondor" }
        },
        {
            id: "char_gandalf",
            name: "Gandalf (Olórin)",
            metadata: { race: "Ainur", subrace: "Maia (Istar)", color: "#F5F5DC" },
            lifespan: { start_tu: 1, departure_tu: 50941, departure_lane_id: "lane_eriador" }
        },
        {
            id: "char_durin",
            name: "Durin the Deathless",
            metadata: { race: "Dwarf", subrace: "Longbeard", color: "#B87333" },
            lifespan: { date_unit: "FA", birth: 1, birth_lane_id: "lane_rhovanion", death: 214, death_lane_id: "lane_rhovanion", is_approximate: true }
        },
        {
            id: "char_earendil",
            name: "Eärendil",
            metadata: { race: "Half-elven", subrace: "Peredhel", color: "#FFD700" },
            lifespan: { date_unit: "FA", birth: 504, birth_lane_id: "lane_beleriand", departure: 591, departure_lane_id: "lane_valinor" }
        },
        {
            id: "char_ungoliant",
            name: "Ungoliant",
            metadata: { race: "Spirit", subrace: "Dark Spirit", color: "#2d0a2e" },
            lifespan: { start_tu: 1, death_tu: 43900, death_lane_id: "lane_beleriand", is_approximate: true }
        }
    ],

    events: [
        // ── Years of the Lamps ──
        {
            id: "evt_creation_arda",
            title: "Creation of Arda",
            description: "The Ainur enter Eä and begin shaping the world according to the Music.",
            time_extent: { date_unit: "YL", start: 0, end: 0, is_approximate: true },
            lane_id: "lane_valinor",
            participants: ["char_morgoth"],
            type: "creation",
            importance: 10
        },
        {
            id: "evt_destruction_lamps",
            title: "Destruction of the Lamps",
            description: "Melkor destroys the Two Lamps, Illuin and Ormal, reshaping the world.",
            time_extent: { date_unit: "YL", start: 3500, end: 3500, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_morgoth"],
            type: "catastrophe",
            importance: 9
        },

        // ── Years of the Trees ──
        {
            id: "evt_two_trees",
            title: "Creation of the Two Trees",
            description: "Yavanna creates Telperion and Laurelin, the Two Trees of Valinor.",
            time_extent: { date_unit: "YL", start: 3500, end: 3500, is_approximate: false },
            lane_id: "lane_valinor",
            participants: [],
            type: "creation",
            importance: 9
        },
        {
            id: "evt_awakening_elves",
            title: "Awakening of the Elves",
            description: "The Firstborn of Ilúvatar awaken at Cuiviénen under the stars.",
            time_extent: { date_unit: "YT", start: 100.5, end: 100.5, is_approximate: true },
            lane_id: "lane_rhovanion",
            participants: [],
            type: "birth",
            importance: 10
        },
        {
            id: "evt_birth_feanor",
            title: "Birth of Fëanor",
            description: "Curufinwë Fëanáro is born in Tirion, the mightiest of the Noldor.",
            time_extent: { date_unit: "YT", start: 299.52, end: 299.52, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_feanor"],
            type: "birth",
            importance: 8
        },
        {
            id: "evt_creation_silmarils",
            title: "Creation of the Silmarils",
            description: "Fëanor captures the light of the Two Trees in three perfect jewels.",
            time_extent: { date_unit: "YT", start: 465.77, end: 465.77, is_approximate: true },
            lane_id: "lane_valinor",
            participants: ["char_feanor"],
            type: "creation",
            importance: 10
        },
        {
            id: "evt_darkening_valinor",
            title: "The Darkening of Valinor",
            description: "Morgoth and Ungoliant destroy the Two Trees. The Silmarils are stolen.",
            time_extent: { date_unit: "YT", start: 1027.24, end: 1027.24, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_morgoth", "char_ungoliant"],
            type: "catastrophe",
            importance: 10
        },
        {
            id: "evt_oath_feanor",
            title: "The Oath of Fëanor",
            description: "Fëanor and his sons swear the terrible Oath to recover the Silmarils.",
            time_extent: { date_unit: "YT", start: 1027.34, end: 1027.34, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_feanor"],
            type: "political",
            importance: 9
        },
        {
            id: "evt_flight_noldor",
            title: "Flight of the Noldor",
            description: "The Noldor depart Valinor in pursuit of Morgoth. Kinslaying at Alqualondë.",
            time_extent: { date_unit: "YT", start: 1027.45, end: 1027.76, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_feanor", "char_galadriel"],
            type: "migration",
            importance: 9
        },
        {
            id: "evt_crossing_helcaraxe",
            title: "Crossing of the Helcaraxë",
            description: "Fingolfin's host crosses the Grinding Ice to reach Middle-earth.",
            time_extent: { date_unit: "YT", start: 1027.76, end: 1079.94, is_approximate: true },
            lane_id: "lane_beleriand",
            sub_area: "Hithlum",
            participants: ["char_galadriel"],
            type: "migration",
            importance: 8
        },

        // ── First Age ──
        {
            id: "evt_sun_moon",
            title: "First Rising of the Sun and Moon",
            description: "The Sun and Moon are created from the last fruit and flower of the Trees.",
            time_extent: { date_unit: "FA", start: 1, end: 1, is_approximate: false },
            lane_id: "lane_valinor",
            participants: [],
            type: "creation",
            importance: 9
        },
        {
            id: "evt_death_feanor",
            title: "Death of Fëanor",
            description: "Fëanor is slain by Balrogs during the Dagor-nuin-Giliath.",
            time_extent: { date_unit: "FA", start: 6, end: 6, is_approximate: false },
            lane_id: "lane_beleriand",
            sub_area: "Hithlum",
            participants: ["char_feanor"],
            type: "death",
            importance: 8
        },
        {
            id: "evt_mereth_aderthad",
            title: "Mereth Aderthad",
            description: "The Feast of Reuniting held by Fingolfin near the Pools of Ivrin.",
            time_extent: { date_unit: "FA", start: 21, end: 21, is_approximate: false },
            lane_id: "lane_beleriand",
            sub_area: "Nan Tathren",
            participants: ["char_galadriel"],
            type: "political",
            importance: 7
        },
        {
            id: "evt_founding_nargothrond",
            title: "Founding of Nargothrond",
            description: "Finrod Felagund establishes the hidden realm of Nargothrond.",
            time_extent: { date_unit: "FA", start: 116, end: 166, is_approximate: false },
            lane_id: "lane_beleriand",
            sub_area: "Nargothrond",
            participants: [],
            type: "founding",
            importance: 8
        },
        {
            id: "evt_founding_gondolin",
            title: "Founding of Gondolin",
            description: "Turgon completes the hidden city of Gondolin in the valley of Tumladen.",
            time_extent: { date_unit: "FA", start: 127, end: 227, is_approximate: false },
            lane_id: "lane_beleriand",
            sub_area: "Gondolin",
            participants: [],
            type: "founding",
            importance: 9
        },
        {
            id: "evt_dagor_aglareb",
            title: "Dagor Aglareb",
            description: "The Glorious Battle: the Noldor defeat Morgoth's forces and begin the Siege of Angband.",
            time_extent: { date_unit: "FA", start: 61, end: 61, is_approximate: false },
            lane_id: "lane_beleriand",
            sub_area: "Ard-galen",
            participants: ["char_morgoth"],
            type: "battle",
            importance: 8
        },
        {
            id: "evt_test_stacking",
            title: "Overlapping Test Event",
            description: "An event created to test vertical stacking in the same lane.",
            time_extent: { date_unit: "FA", start: 134, end: 134, is_approximate: false },
            lane_id: "lane_beleriand",
            sub_area: "Doriath",
            participants: [],
            type: "political",
            importance: 0
        },
        {
            id: "evt_nirnaeth",
            title: "Nirnaeth Arnoediad",
            description: "The Battle of Unnumbered Tears — the catastrophic fifth battle of Beleriand.",
            time_extent: { date_unit: "FA", start: 473, end: 473, is_approximate: false },
            lane_id: "lane_beleriand",
            sub_area: "Anfauglith",
            participants: ["char_morgoth"],
            type: "battle",
            importance: 9
        },
        {
            id: "evt_fall_gondolin",
            title: "Fall of Gondolin",
            description: "Morgoth's armies destroy the hidden city of Gondolin.",
            time_extent: { date_unit: "FA", start: 511, end: 511, is_approximate: false },
            lane_id: "lane_beleriand",
            sub_area: "Gondolin",
            participants: ["char_morgoth"],
            type: "battle",
            importance: 9
        },
        {
            id: "evt_voyage_earendil",
            title: "Voyage of Eärendil",
            description: "Eärendil sails to Valinor bearing a Silmaril, pleading for aid.",
            time_extent: { date_unit: "FA", start: 556, end: 556, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_earendil"],
            type: "migration",
            importance: 9
        },
        {
            id: "evt_war_of_wrath",
            title: "War of Wrath",
            description: "The Host of Valinor overthrows Morgoth. Beleriand is broken and sinks.",
            time_extent: { date_unit: "FA", start: 559, end: 591, is_approximate: false },
            lane_id: "lane_beleriand",
            sub_area: "Beleriand West",
            participants: ["char_morgoth", "char_sauron"],
            type: "war",
            importance: 10
        },

        // ── Second Age ──
        {
            id: "evt_founding_numenor",
            title: "Founding of Númenor",
            description: "The island kingdom of Númenor is raised as a gift to the Edain.",
            time_extent: { date_unit: "SA", start: 33, end: 33, is_approximate: false },
            lane_id: "lane_numenor",
            participants: [],
            type: "founding",
            importance: 8
        },
        {
            id: "evt_forging_rings",
            title: "Forging of the Rings of Power",
            description: "Sauron, disguised as Annatar, helps the Elven-smiths forge the Rings.",
            time_extent: { date_unit: "SA", start: 1601, end: 1701, is_approximate: false },
            lane_id: "lane_eriador",
            sub_area: "Eregion",
            participants: ["char_sauron"],
            type: "creation",
            importance: 10
        },
        {
            id: "evt_one_ring",
            title: "Forging of the One Ring",
            description: "Sauron forges the One Ring in the fires of Mount Doom.",
            time_extent: { date_unit: "SA", start: 1701, end: 1701, is_approximate: false },
            lane_id: "lane_mordor",
            participants: ["char_sauron"],
            type: "creation",
            importance: 10
        },
        {
            id: "evt_fall_numenor",
            title: "Downfall of Númenor",
            description: "Ar-Pharazôn assails Valinor; Númenor is destroyed by divine intervention.",
            time_extent: { date_unit: "SA", start: 3220, end: 3220, is_approximate: false },
            lane_id: "lane_numenor",
            participants: ["char_sauron"],
            type: "catastrophe",
            importance: 10
        },
        {
            id: "evt_founding_gondor",
            title: "Founding of Gondor and Arnor",
            description: "Elendil and his sons establish the Realms in Exile.",
            time_extent: { date_unit: "SA", start: 3221, end: 3221, is_approximate: false },
            lane_id: "lane_gondor",
            participants: ["char_isildur"],
            type: "founding",
            importance: 9
        },
        {
            id: "evt_last_alliance",
            title: "War of the Last Alliance",
            description: "Elves and Men unite against Sauron. Siege of Barad-dûr.",
            time_extent: { date_unit: "SA", start: 3435, end: 3442, is_approximate: false },
            lane_id: "lane_mordor",
            participants: ["char_sauron", "char_gilgalad", "char_elrond", "char_isildur"],
            type: "war",
            importance: 10
        },

        // ── Third Age ──
        {
            id: "evt_isildur_death",
            title: "Disaster of the Gladden Fields",
            description: "Isildur is slain; the One Ring is lost in the River Anduin.",
            time_extent: { date_unit: "TA", start: 3, end: 3, is_approximate: false },
            lane_id: "lane_rhovanion",
            participants: ["char_isildur"],
            type: "death",
            importance: 8
        },
        {
            id: "evt_istari_arrive",
            title: "Arrival of the Istari",
            description: "The five Wizards arrive in Middle-earth, sent by the Valar.",
            time_extent: { date_unit: "TA", start: 1001, end: 1001, is_approximate: true },
            lane_id: "lane_eriador",
            sub_area: "Mithlond",
            participants: ["char_gandalf"],
            type: "migration",
            importance: 8
        },
        {
            id: "evt_founding_rohan",
            title: "Founding of Rohan",
            description: "Eorl the Young leads the Éothéod south; Rohan is established.",
            time_extent: { date_unit: "TA", start: 2511, end: 2511, is_approximate: false },
            lane_id: "lane_rohan",
            participants: [],
            type: "founding",
            importance: 7
        },
        {
            id: "evt_bilbo_journey",
            title: "Bilbo's Journey to Erebor",
            description: "Bilbo Baggins finds the One Ring in the depths of the Misty Mountains.",
            time_extent: { date_unit: "TA", start: 2942, end: 2942, is_approximate: false },
            lane_id: "lane_rhovanion",
            participants: ["char_gandalf"],
            type: "quest",
            importance: 8
        },
        {
            id: "evt_fellowship_departs",
            title: "The Fellowship Departs Rivendell",
            description: "Nine companions set out from Rivendell to destroy the One Ring.",
            time_extent: { date_unit: "TA", start: 3018.98, end: 3018.98, is_approximate: false },
            lane_id: "lane_eriador",
            participants: ["char_gandalf", "char_aragorn"],
            type: "quest",
            importance: 9
        },
        {
            id: "evt_battle_pelennor",
            title: "Battle of the Pelennor Fields",
            description: "The siege of Minas Tirith is broken by the Rohirrim and Aragorn.",
            time_extent: { date_unit: "TA", start: 3019.21, end: 3019.21, is_approximate: false },
            lane_id: "lane_gondor",
            participants: ["char_aragorn"],
            type: "battle",
            importance: 9
        },
        {
            id: "evt_destruction_ring",
            title: "Destruction of the One Ring",
            description: "The One Ring is destroyed in the fires of Mount Doom. Sauron falls.",
            time_extent: { date_unit: "TA", start: 3019.24, end: 3019.24, is_approximate: false },
            lane_id: "lane_mordor",
            participants: ["char_sauron", "char_gandalf", "char_aragorn"],
            type: "catastrophe",
            importance: 10
        },
        {
            id: "evt_coronation_aragorn",
            title: "Coronation of King Elessar",
            description: "Aragorn is crowned King of the Reunited Kingdom.",
            time_extent: { date_unit: "TA", start: 3019.37, end: 3019.37, is_approximate: false },
            lane_id: "lane_gondor",
            participants: ["char_aragorn"],
            type: "political",
            importance: 9
        },
        {
            id: "evt_departure_ringbearers",
            title: "Departure of the Ring-bearers",
            description: "Gandalf, Galadriel, and the Ring-bearers depart from the Grey Havens.",
            time_extent: { date_unit: "TA", start: 3022, end: 3022, is_approximate: false },
            lane_id: "lane_eriador",
            participants: ["char_gandalf", "char_galadriel", "char_elrond"],
            type: "migration",
            importance: 9
        }
    ]
};

export default SAMPLE_DATASET;
