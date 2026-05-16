/**
 * SampleData.js — Tolkien/Arda Sample Dataset
 * Last Modified: 2026-05-15
 *
 * World-agnostic sample dataset following the data contract schemas.
 * Used for development auto-load. All strings come from data, not the engine.
 *
 * Master Scale (TU) reference for Arda:
 *   T₀ = 0 → First Year of the Lamps
 *   Years of the Lamps: VY 1–3500 → TU 0–33,537 (1 VY = 9.582 solar years)
 *   Years of the Trees:  VY 3501–4580 → TU 33,547–43,886
 *   First Age (solar):   FA 1–590 → TU 43,887–44,477
 *   Second Age (solar):  SA 1–3441 → TU 44,478–47,919
 *   Third Age (solar):   TA 1–3021 → TU 47,920–50,941
 */

const SAMPLE_DATASET = {
    world_config: {
        world_name: "Arda",
        time_systems: [
            { id: "solar", name: "Solar Year", abbreviation: "SY", base_unit: 1 },
            { id: "valian", name: "Valian Year", conversion_factor: 9.582 }
        ],
        epochs: [
            {
                id: "lamps",
                label: "Years of the Lamps",
                start_tu: 0,
                end_tu: 33537,
                primary_system: "valian",
                color: "#e6def4",
                ruler: {
                    label: "Lamps Year (Valian)",
                    abbreviation: "YL",
                    conversion_factor: 9.582
                }
            },
            {
                id: "trees",
                label: "Years of the Trees",
                start_tu: 33538,
                end_tu: 43886,
                primary_system: "valian",
                color: "#d8e8de",
                ruler: {
                    label: "Trees Year (Valian)",
                    abbreviation: "YT",
                    conversion_factor: 9.582
                }
            },
            {
                id: "first_age",
                label: "First Age",
                start_tu: 43887,
                end_tu: 44477,
                primary_system: "solar",
                color: "#f0e5d1",
                ruler: {
                    label: "First Age Year",
                    abbreviation: "FA",
                    conversion_factor: 1
                }
            },
            {
                id: "second_age",
                label: "Second Age",
                start_tu: 44478,
                end_tu: 47919,
                primary_system: "solar",
                color: "#dce6ec",
                ruler: {
                    label: "Second Age Year",
                    abbreviation: "SA",
                    conversion_factor: 1
                }
            },
            {
                id: "third_age",
                label: "Third Age",
                start_tu: 47920,
                end_tu: 50941,
                primary_system: "solar",
                color: "#e6e4eb",
                ruler: {
                    label: "Third Age Year",
                    abbreviation: "TA",
                    conversion_factor: 1
                }
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
            lifespan: { start_tu: 0, departure_tu: 44477 }
        },
        {
            id: "char_sauron",
            name: "Sauron",
            metadata: { race: "Ainur", subrace: "Maia", color: "#ff4500" },
            lifespan: { start_tu: 0, departure_tu: 50941 }
        },
        {
            id: "char_feanor",
            name: "Fëanor",
            metadata: { race: "Elf", subrace: "Noldor", color: "#ffd700" },
            lifespan: { start_tu: 36407, death_tu: 43892 }
        },
        {
            id: "char_galadriel",
            name: "Galadriel",
            metadata: { race: "Elf", subrace: "Noldor/Teleri", color: "#EEDD82" },
            lifespan: { start_tu: 37940, departure_tu: 50941 }
        },
        {
            id: "char_elrond",
            name: "Elrond",
            metadata: { race: "Half-elven", subrace: "Peredhel", color: "#6495ED" },
            lifespan: { start_tu: 44430, departure_tu: 50941 }
        },
        {
            id: "char_gilgalad",
            name: "Gil-galad",
            metadata: { race: "Elf", subrace: "Noldor", color: "#4682B4" },
            lifespan: { start_tu: 44200, death_tu: 47919 }
        },
        {
            id: "char_isildur",
            name: "Isildur",
            metadata: { race: "Man", subrace: "Dúnedain", color: "#C0C0C0" },
            lifespan: { start_tu: 47659, death_tu: 47922 }
        },
        {
            id: "char_aragorn",
            name: "Aragorn II Elessar",
            metadata: { race: "Man", subrace: "Dúnedain", color: "#E8E8E8" },
            lifespan: { start_tu: 50851, death_tu: 50941 }
        },
        {
            id: "char_gandalf",
            name: "Gandalf (Olórin)",
            metadata: { race: "Ainur", subrace: "Maia (Istar)", color: "#F5F5DC" },
            lifespan: { start_tu: 0, departure_tu: 50941 }
        },
        {
            id: "char_durin",
            name: "Durin the Deathless",
            metadata: { race: "Dwarf", subrace: "Longbeard", color: "#B87333" },
            lifespan: { start_tu: 43887, death_tu: 44100, is_approximate: true }
        },
        {
            id: "char_earendil",
            name: "Eärendil",
            metadata: { race: "Half-elven", subrace: "Peredhel", color: "#FFD700" },
            lifespan: { start_tu: 44390, departure_tu: 44477 }
        },
        {
            id: "char_ungoliant",
            name: "Ungoliant",
            metadata: { race: "Spirit", subrace: "Dark Spirit", color: "#2d0a2e" },
            lifespan: { start_tu: 0, death_tu: 43900, is_approximate: true }
        }
    ],

    events: [
        // ── Years of the Lamps ──
        {
            id: "evt_creation_arda",
            title: "Creation of Arda",
            description: "The Ainur enter Eä and begin shaping the world according to the Music.",
            time_extent: { start: 0, end: 0, is_approximate: true },
            lane_id: "lane_valinor",
            participants: ["char_morgoth"],
            type: "creation",
            importance: 10
        },
        {
            id: "evt_destruction_lamps",
            title: "Destruction of the Lamps",
            description: "Melkor destroys the Two Lamps, Illuin and Ormal, reshaping the world.",
            time_extent: { start: 33537, end: 33537, is_approximate: false },
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
            time_extent: { start: 33538, end: 33538, is_approximate: false },
            lane_id: "lane_valinor",
            participants: [],
            type: "creation",
            importance: 9
        },
        {
            id: "evt_awakening_elves",
            title: "Awakening of the Elves",
            description: "The Firstborn of Ilúvatar awaken at Cuiviénen under the stars.",
            time_extent: { start: 34500, end: 34500, is_approximate: true },
            lane_id: "lane_rhovanion",
            participants: [],
            type: "birth",
            importance: 10
        },
        {
            id: "evt_birth_feanor",
            title: "Birth of Fëanor",
            description: "Curufinwë Fëanáro is born in Tirion, the mightiest of the Noldor.",
            time_extent: { start: 36407, end: 36407, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_feanor"],
            type: "birth",
            importance: 8
        },
        {
            id: "evt_creation_silmarils",
            title: "Creation of the Silmarils",
            description: "Fëanor captures the light of the Two Trees in three perfect jewels.",
            time_extent: { start: 38000, end: 38000, is_approximate: true },
            lane_id: "lane_valinor",
            participants: ["char_feanor"],
            type: "creation",
            importance: 10
        },
        {
            id: "evt_darkening_valinor",
            title: "The Darkening of Valinor",
            description: "Morgoth and Ungoliant destroy the Two Trees. The Silmarils are stolen.",
            time_extent: { start: 43380, end: 43380, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_morgoth", "char_ungoliant"],
            type: "catastrophe",
            importance: 10
        },
        {
            id: "evt_oath_feanor",
            title: "The Oath of Fëanor",
            description: "Fëanor and his sons swear the terrible Oath to recover the Silmarils.",
            time_extent: { start: 43381, end: 43381, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_feanor"],
            type: "political",
            importance: 9
        },
        {
            id: "evt_flight_noldor",
            title: "Flight of the Noldor",
            description: "The Noldor depart Valinor in pursuit of Morgoth. Kinslaying at Alqualondë.",
            time_extent: { start: 43382, end: 43385, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_feanor", "char_galadriel"],
            type: "migration",
            importance: 9
        },
        {
            id: "evt_crossing_helcaraxe",
            title: "Crossing of the Helcaraxë",
            description: "Fingolfin's host crosses the Grinding Ice to reach Middle-earth.",
            time_extent: { start: 43385, end: 43886, is_approximate: true },
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
            time_extent: { start: 43887, end: 43887, is_approximate: false },
            lane_id: "lane_valinor",
            participants: [],
            type: "creation",
            importance: 9
        },
        {
            id: "evt_death_feanor",
            title: "Death of Fëanor",
            description: "Fëanor is slain by Balrogs during the Dagor-nuin-Giliath.",
            time_extent: { start: 43892, end: 43892, is_approximate: false },
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
            time_extent: { start: 43907, end: 43907, is_approximate: false },
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
            time_extent: { start: 44002, end: 44052, is_approximate: false },
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
            time_extent: { start: 44013, end: 44113, is_approximate: false },
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
            time_extent: { start: 43947, end: 43947, is_approximate: false },
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
            time_extent: { start: 44020, end: 44020, is_approximate: false },
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
            time_extent: { start: 44359, end: 44359, is_approximate: false },
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
            time_extent: { start: 44397, end: 44397, is_approximate: false },
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
            time_extent: { start: 44442, end: 44442, is_approximate: false },
            lane_id: "lane_valinor",
            participants: ["char_earendil"],
            type: "migration",
            importance: 9
        },
        {
            id: "evt_war_of_wrath",
            title: "War of Wrath",
            description: "The Host of Valinor overthrows Morgoth. Beleriand is broken and sinks.",
            time_extent: { start: 44445, end: 44477, is_approximate: false },
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
            time_extent: { start: 44510, end: 44510, is_approximate: false },
            lane_id: "lane_numenor",
            participants: [],
            type: "founding",
            importance: 8
        },
        {
            id: "evt_forging_rings",
            title: "Forging of the Rings of Power",
            description: "Sauron, disguised as Annatar, helps the Elven-smiths forge the Rings.",
            time_extent: { start: 46078, end: 46178, is_approximate: false },
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
            time_extent: { start: 46178, end: 46178, is_approximate: false },
            lane_id: "lane_mordor",
            participants: ["char_sauron"],
            type: "creation",
            importance: 10
        },
        {
            id: "evt_fall_numenor",
            title: "Downfall of Númenor",
            description: "Ar-Pharazôn assails Valinor; Númenor is destroyed by divine intervention.",
            time_extent: { start: 47697, end: 47697, is_approximate: false },
            lane_id: "lane_numenor",
            participants: ["char_sauron"],
            type: "catastrophe",
            importance: 10
        },
        {
            id: "evt_founding_gondor",
            title: "Founding of Gondor and Arnor",
            description: "Elendil and his sons establish the Realms in Exile.",
            time_extent: { start: 47698, end: 47698, is_approximate: false },
            lane_id: "lane_gondor",
            participants: ["char_isildur"],
            type: "founding",
            importance: 9
        },
        {
            id: "evt_last_alliance",
            title: "War of the Last Alliance",
            description: "Elves and Men unite against Sauron. Siege of Barad-dûr.",
            time_extent: { start: 47912, end: 47919, is_approximate: false },
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
            time_extent: { start: 47922, end: 47922, is_approximate: false },
            lane_id: "lane_rhovanion",
            participants: ["char_isildur"],
            type: "death",
            importance: 8
        },
        {
            id: "evt_istari_arrive",
            title: "Arrival of the Istari",
            description: "The five Wizards arrive in Middle-earth, sent by the Valar.",
            time_extent: { start: 48920, end: 48920, is_approximate: true },
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
            time_extent: { start: 50430, end: 50430, is_approximate: false },
            lane_id: "lane_rohan",
            participants: [],
            type: "founding",
            importance: 7
        },
        {
            id: "evt_bilbo_journey",
            title: "Bilbo's Journey to Erebor",
            description: "Bilbo Baggins finds the One Ring in the depths of the Misty Mountains.",
            time_extent: { start: 50861, end: 50861, is_approximate: false },
            lane_id: "lane_rhovanion",
            participants: ["char_gandalf"],
            type: "quest",
            importance: 8
        },
        {
            id: "evt_fellowship_departs",
            title: "The Fellowship Departs Rivendell",
            description: "Nine companions set out from Rivendell to destroy the One Ring.",
            time_extent: { start: 50937.98, end: 50937.98, is_approximate: false },
            lane_id: "lane_eriador",
            participants: ["char_gandalf", "char_aragorn"],
            type: "quest",
            importance: 9
        },
        {
            id: "evt_battle_pelennor",
            title: "Battle of the Pelennor Fields",
            description: "The siege of Minas Tirith is broken by the Rohirrim and Aragorn.",
            time_extent: { start: 50938.21, end: 50938.21, is_approximate: false },
            lane_id: "lane_gondor",
            participants: ["char_aragorn"],
            type: "battle",
            importance: 9
        },
        {
            id: "evt_destruction_ring",
            title: "Destruction of the One Ring",
            description: "The One Ring is destroyed in the fires of Mount Doom. Sauron falls.",
            time_extent: { start: 50938.24, end: 50938.24, is_approximate: false },
            lane_id: "lane_mordor",
            participants: ["char_sauron", "char_gandalf", "char_aragorn"],
            type: "catastrophe",
            importance: 10
        },
        {
            id: "evt_coronation_aragorn",
            title: "Coronation of King Elessar",
            description: "Aragorn is crowned King of the Reunited Kingdom.",
            time_extent: { start: 50938.37, end: 50938.37, is_approximate: false },
            lane_id: "lane_gondor",
            participants: ["char_aragorn"],
            type: "political",
            importance: 9
        },
        {
            id: "evt_departure_ringbearers",
            title: "Departure of the Ring-bearers",
            description: "Gandalf, Galadriel, and the Ring-bearers depart from the Grey Havens.",
            time_extent: { start: 50941, end: 50941, is_approximate: false },
            lane_id: "lane_eriador",
            participants: ["char_gandalf", "char_galadriel", "char_elrond"],
            type: "migration",
            importance: 9
        }
    ]
};

export default SAMPLE_DATASET;
