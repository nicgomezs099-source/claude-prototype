/* ============================================================================
   OUT OF ORDER  —  game.js
   Vanilla JavaScript. No frameworks, no build step.

   Everything is wrapped in one IIFE so we don't leak variables onto `window`.
   Sections grow as the game is built:

     DATA          content items + daily themes + categories + icons
     STATE         one plain object describing the current run
     HELPERS       small reusable functions (dates, RNG, DOM)
     THEME         getDailyTheme() + applyTheme()
     SHELF         renderShelf()  (decorative category tapes on the Home page)
     DAILY RUN     generateDailyRun()            (Stage 2)
     ROUND FLOW    startRound / renderChallenge  (Stage 2)
     MECHANICS     Timeline / Which Came First / Odd One Out / Quote /
                   Pixel Scene / Insert (Insert kept for a future Encore)
     SCORING       speed bonus + round score     (Stage 2-3)
     STREAK/HEAT   updateStreak / updateHeat     (Stage 3)
     POWER-UPS     +5 sec / reveal               (Stage 3)
     FEEDBACK      showRoundFeedback             (Stage 2-3)
     RESULTS       endGame / copyScore           (Stage 3)
     STORAGE       localStorage personal best
     INIT          initGame()
   ========================================================================== */
(function () {
  "use strict";


  /* ==========================================================================
     DATA  —  INLINE SVG ICON SET
     No icon font, no network requests. Category icons are Phosphor-style
     (256 viewBox, fill: currentColor so they tint with the spine / poster).
     ======================================================================== */
  var ICONS = {
    timeTravel: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M200,75.64V40a16,16,0,0,0-16-16H72A16,16,0,0,0,56,40V76a16.07,16.07,0,0,0,6.4,12.8L114.67,128,62.4,167.2A16.07,16.07,0,0,0,56,180v36a16,16,0,0,0,16,16H184a16,16,0,0,0,16-16V180.36a16.09,16.09,0,0,0-6.35-12.77L141.27,128l52.38-39.59A16.09,16.09,0,0,0,200,75.64ZM184,40V64H72V40Zm0,176H72V180l56-42,56,42.35Z"/></svg>',
    fantasy:    '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M216,216H200V115.31L211.31,104A15.86,15.86,0,0,0,216,92.69V48a16,16,0,0,0-16-16H180a8,8,0,0,0-8,8V64H148V40a8,8,0,0,0-8-8H116a8,8,0,0,0-8,8V64H84V40a8,8,0,0,0-8-8H56A16,16,0,0,0,40,48V92.69A15.86,15.86,0,0,0,44.69,104L56,115.31V216H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16ZM112,168a16,16,0,0,1,32,0v48H112Z"/></svg>',
    mystery:    '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M256,120a8,8,0,0,1-8,8H8a8,8,0,0,1,0-16H35.92l47.5-65.41a16,16,0,0,1,25.31-.72l12.85,14.9.2.23a7.95,7.95,0,0,0,12.44,0l.2-.23,12.85-14.9a16,16,0,0,1,25.31.72L220.08,112H248A8,8,0,0,1,256,120Zm-76,24a36,36,0,0,0-35.77,32H111.77a36,36,0,1,0-1.83,16h36.12A36,36,0,1,0,180,144Z"/></svg>',
    sitcom:     '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M16,100V72A16,16,0,0,1,32,56h84a4,4,0,0,1,4,4v76H64a32,32,0,0,0-32-32H20A4,4,0,0,1,16,100Zm208,4h12a4,4,0,0,0,4-4V72a16,16,0,0,0-16-16H140a4,4,0,0,0-4,4v76h56A32,32,0,0,1,224,104Zm8,16h-8a16,16,0,0,0-16,16v8a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8v-8a16,16,0,0,0-16-16H24A16,16,0,0,0,8,136v32a16,16,0,0,0,16,16h8v15.73A8.18,8.18,0,0,0,39.47,208,8,8,0,0,0,48,200V184H208v15.73a8.17,8.17,0,0,0,7.47,8.25,8,8,0,0,0,8.53-8V184h8a16,16,0,0,0,16-16V136A16,16,0,0,0,232,120Z"/></svg>',
    animation:  '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M128,16a88.1,88.1,0,0,0-88,88c0,23.43,9.4,49.42,25.13,69.5,12.08,15.41,26.5,26,41.91,31.09L96.65,228.85A8,8,0,0,0,104,240h48a8,8,0,0,0,7.35-11.15L149,204.59c15.4-5.07,29.83-15.68,41.91-31.09C206.6,153.42,216,127.43,216,104A88.1,88.1,0,0,0,128,16Zm49.32,87.89A8.52,8.52,0,0,1,176,104a8,8,0,0,1-7.88-6.68,41.29,41.29,0,0,0-33.43-33.43,8,8,0,1,1,2.64-15.78,57.5,57.5,0,0,1,46.57,46.57A8,8,0,0,1,177.32,103.89Z"/></svg>',
    scifi:      '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M128,16a96.11,96.11,0,0,0-96,96c0,24,12.56,55.06,33.61,83,21.18,28.15,44.5,45,62.39,45s41.21-16.81,62.39-45c21.05-28,33.61-59,33.61-83A96.11,96.11,0,0,0,128,16ZM64,116a12,12,0,0,1,12-12,36,36,0,0,1,36,36,12,12,0,0,1-12,12A36,36,0,0,1,64,116Zm80,84H112a8,8,0,0,1,0-16h32a8,8,0,0,1,0,16Zm12-48a12,12,0,0,1-12-12,36,36,0,0,1,36-36,12,12,0,0,1,12,12A36,36,0,0,1,156,152Z"/></svg>',
    horror:     '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M128,24a96.11,96.11,0,0,0-96,96v96a8,8,0,0,0,13.07,6.19l24.26-19.85L93.6,222.19a8,8,0,0,0,10.13,0L128,202.34l24.27,19.85a8,8,0,0,0,10.13,0l24.27-19.85,24.26,19.85A8,8,0,0,0,224,216V120A96.11,96.11,0,0,0,128,24ZM100,128a12,12,0,1,1,12-12A12,12,0,0,1,100,128Zm56,0a12,12,0,1,1,12-12A12,12,0,0,1,156,128Z"/></svg>',
    film:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 12h18"/></svg>'
  };


  /* ==========================================================================
     DATA  —  DAILY THEMES  ("VHS collection editions")
     A theme changes the PRESENTATION only (accent colours + artwork + flavour
     text), never the mechanics. getDailyTheme() picks one per calendar day
     (dayNumber % THEMES.length); the shelf also lets you switch between them.

     Two editions are built for now — Horror and Sci-Fi. To add another, drop
     an object here, add a `body.theme-<id>` palette in style.css section 02,
     and its shelf spine automatically becomes a switch button.
     ======================================================================== */
  /* Order here decides which theme falls on which calendar day (see
     getDailyTheme() below) — day-2 (even dayNumber) is always THEMES[0].
     Sci-Fi listed first so today lands on Sci-Fi for presentation day. */
  var THEMES = [
    {
      id: "sci-fi", name: "Sci-Fi", bodyClass: "theme-sci-fi",
      initial: "S", icon: "scifi", tapeCode: "T-120",
      motifs: "Starships · Aliens · Distant Worlds",
      hero: "assets/images/themes/sci-fi.jpg"
    },
    {
      id: "horror", name: "Horror", bodyClass: "theme-horror",
      initial: "H", icon: "horror", tapeCode: "E-180",
      motifs: "Do you want to play a game?",
      hero: "assets/images/themes/horror.jpg"
    }
  ];


  /* ==========================================================================
     DATA  —  MY ARCHIVE COLLECTIBLES  (Beta)
     Unlocked by spending Archive Tokens on a Mystery Tape (see
     openMysteryTape()) — in array order, so the first Mystery Tape you open
     always reveals Neo, the second always reveals the Lamp. Only 2 exist in
     this Beta build; the rest of the 12-slot shelf stays locked "coming
     soon" — never claim the archive is "complete".
     ======================================================================== */
  var COLLECTIBLES = [
    { id: "neo",  name: "Neo",      hint: "The Matrix",   image: "assets/images/collectibles/neo.png" },
    { id: "lamp", name: "The Lamp", hint: "Wish granted", image: "assets/images/collectibles/lamp.png" }
  ];
  var MYSTERY_TAPE_COST = 50;   // Archive Tokens needed to open one
  var ARCHIVE_SLOTS = 12;   // total shelf size the grid always shows


  /* ==========================================================================
     DATA  —  ARCHIVE CATEGORIES (decorative shelf on the Home page)
     The shelf shows the whole "archive"; the daily theme is just tonight's tape.
     `ink: true` means the tape colour is light, so its text must be dark.
     ======================================================================== */
  var CATEGORIES = [
    { name: "Time Travel",        color: "#E2544F", icon: "timeTravel" },
    { name: "Magic & Fantasy",    color: "#F28A2E", icon: "fantasy" },
    { name: "Mystery & Thriller", color: "#FFD54A", icon: "mystery", ink: true },
    { name: "Sitcoms",            color: "#25B6D2", icon: "sitcom" },
    { name: "Animation",          color: "#008A8E", icon: "animation" },
    { name: "Sci-Fi",             color: "#7A4FB5", icon: "scifi" },
    { name: "Horror",             color: "#1B1B1B", icon: "horror" }
  ];


  /* ==========================================================================
     DATA  —  CONTENT ITEMS  (Movies & TV across several decades)

     // Verify release-year data before final submission.

     `themes`  : which editions (Horror / Sci-Fi) this title belongs to. Every
                 round only pulls from the ACTIVE theme's titles, so a Horror
                 run never shows a Sci-Fi-only title and vice versa.
     `image`   : card artwork is looked up by id at
                 assets/images/cards/<id>.png  (see cardArtSrc()).
                 Drop a file there and it replaces the CSS fallback.
     `focus`   : optional object-position for cropping to the card window.
     `versionLabel` : optional — disambiguates a remake/reboot/format when a
                 title alone could mean more than one thing, e.g.
                 { title: "Dune", versionLabel: "Villeneuve Film", year: 2021 }.
                 Shown next to the title (never the year) only when present;
                 no current item needs one yet. See titleWithVersion().
     ======================================================================== */
  var CONTENT_ITEMS = [
    // ---- general (themes: []) — not Horror or Sci-Fi, so these sit unused
    // while the game only has those two editions. Kept for a future 3rd
    // "general" theme rather than thrown away. ----
    { id: "the-simpsons",         title: "The Simpsons",              type: "Series", year: 1989, category: "Animation", themes: [] },
    { id: "seinfeld",             title: "Seinfeld",                  type: "Series", year: 1989, category: "Sitcom",    themes: [] },
    { id: "the-lion-king",        title: "The Lion King",             type: "Movie",  year: 1994, category: "Animation", themes: [], focus: "28% center" },
    { id: "forrest-gump",         title: "Forrest Gump",              type: "Movie",  year: 1994, category: "Drama",     themes: [] },
    { id: "friends",              title: "Friends",                   type: "Series", year: 1994, category: "Sitcom",    themes: [] },
    { id: "toy-story",            title: "Toy Story",                 type: "Movie",  year: 1995, category: "Animation", themes: [] },
    { id: "titanic",              title: "Titanic",                   type: "Movie",  year: 1997, category: "Drama",     themes: [] },
    { id: "the-sopranos",         title: "The Sopranos",              type: "Series", year: 1999, category: "Drama",     themes: [] },
    { id: "gladiator",            title: "Gladiator",                 type: "Movie",  year: 2000, category: "Action",    themes: [] },
    { id: "shrek",                title: "Shrek",                     type: "Movie",  year: 2001, category: "Animation", themes: [] },
    { id: "spirited-away",        title: "Spirited Away",             type: "Movie",  year: 2001, category: "Animation", themes: [] },
    { id: "harry-potter",         title: "Harry Potter and the Sorcerer's Stone", type: "Movie", year: 2001, category: "Fantasy", themes: [] },
    { id: "lotr-fellowship",      title: "The Lord of the Rings: Fellowship",      type: "Movie", year: 2001, category: "Fantasy", themes: [] },
    { id: "finding-nemo",         title: "Finding Nemo",              type: "Movie",  year: 2003, category: "Animation", themes: [] },
    { id: "pirates-caribbean",    title: "Pirates of the Caribbean",  type: "Movie",  year: 2003, category: "Adventure", themes: [] },
    { id: "the-office",           title: "The Office",                type: "Series", year: 2005, category: "Sitcom",    themes: [] },
    { id: "the-dark-knight",      title: "The Dark Knight",           type: "Movie",  year: 2008, category: "Action",    themes: [] },
    { id: "breaking-bad",         title: "Breaking Bad",              type: "Series", year: 2008, category: "Drama",     themes: [] },
    { id: "toy-story-3",          title: "Toy Story 3",               type: "Movie",  year: 2010, category: "Animation", themes: [] },
    { id: "game-of-thrones",      title: "Game of Thrones",           type: "Series", year: 2011, category: "Fantasy",   themes: [] },
    { id: "frozen",               title: "Frozen",                    type: "Movie",  year: 2013, category: "Animation", themes: [] },
    { id: "inside-out",           title: "Inside Out",                type: "Movie",  year: 2015, category: "Animation", themes: [] },
    { id: "la-la-land",           title: "La La Land",                type: "Movie",  year: 2016, category: "Musical",   themes: [] },
    { id: "the-crown",            title: "The Crown",                 type: "Series", year: 2016, category: "Drama",     themes: [] },
    { id: "ted-lasso",            title: "Ted Lasso",                 type: "Series", year: 2020, category: "Comedy",    themes: [] },
    { id: "barbie",               title: "Barbie",                    type: "Movie",  year: 2023, category: "Comedy",    themes: [] },
    { id: "oppenheimer",          title: "Oppenheimer",               type: "Movie",  year: 2023, category: "Drama",     themes: [] },

    // ---- SCI-FI ----
    { id: "star-wars",            title: "Star Wars",                 type: "Movie",  year: 1977, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "alien",                title: "Alien",                     type: "Movie",  year: 1979, category: "Sci-Fi", themes: ["sci-fi", "horror"] },
    { id: "blade-runner",         title: "Blade Runner",              type: "Movie",  year: 1982, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "et",                   title: "E.T. the Extra-Terrestrial", type: "Movie", year: 1982, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "back-to-the-future",   title: "Back to the Future",        type: "Movie",  year: 1985, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "terminator-2",         title: "Terminator 2: Judgment Day", type: "Movie", year: 1991, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "jurassic-park",        title: "Jurassic Park",             type: "Movie",  year: 1993, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "the-matrix",           title: "The Matrix",                type: "Movie",  year: 1999, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "lost",                 title: "Lost",                      type: "Series", year: 2004, category: "Mystery", themes: ["sci-fi"] },
    { id: "the-incredibles",      title: "The Incredibles",           type: "Movie",  year: 2004, category: "Animation", themes: ["sci-fi"] },
    { id: "iron-man",             title: "Iron Man",                  type: "Movie",  year: 2008, category: "Action", themes: ["sci-fi"] },
    { id: "wall-e",               title: "WALL·E",               type: "Movie",  year: 2008, category: "Animation", themes: ["sci-fi"] },
    { id: "avatar",               title: "Avatar",                    type: "Movie",  year: 2009, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "inception",            title: "Inception",                 type: "Movie",  year: 2010, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "black-mirror",         title: "Black Mirror",              type: "Series", year: 2011, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "the-avengers",         title: "The Avengers",              type: "Movie",  year: 2012, category: "Action", themes: ["sci-fi"] },
    { id: "interstellar",         title: "Interstellar",              type: "Movie",  year: 2014, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "arrival",              title: "Arrival",                   type: "Movie",  year: 2016, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "the-mandalorian",      title: "The Mandalorian",           type: "Series", year: 2019, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "everything-everywhere", title: "Everything Everywhere All at Once", type: "Movie", year: 2022, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "dune",                 title: "Dune",                      type: "Movie",  year: 2021, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "space-odyssey",        title: "2001: A Space Odyssey",     type: "Movie",  year: 1968, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "close-encounters",     title: "Close Encounters of the Third Kind", type: "Movie", year: 1977, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "predator",             title: "Predator",                  type: "Movie",  year: 1987, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "robocop",              title: "RoboCop",                   type: "Movie",  year: 1987, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "total-recall",         title: "Total Recall",              type: "Movie",  year: 1990, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "independence-day",     title: "Independence Day",          type: "Movie",  year: 1996, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "men-in-black",         title: "Men in Black",              type: "Movie",  year: 1997, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "minority-report",      title: "Minority Report",           type: "Movie",  year: 2002, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "war-of-the-worlds",    title: "War of the Worlds",         type: "Movie",  year: 2005, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "district-9",           title: "District 9",                type: "Movie",  year: 2009, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "rick-and-morty",       title: "Rick and Morty",            type: "Series", year: 2013, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "ex-machina",           title: "Ex Machina",                type: "Movie",  year: 2014, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "edge-of-tomorrow",     title: "Edge of Tomorrow",          type: "Movie",  year: 2014, category: "Sci-Fi", themes: ["sci-fi"] },
    { id: "guardians-galaxy",     title: "Guardians of the Galaxy",   type: "Movie",  year: 2014, category: "Sci-Fi", themes: ["sci-fi"] },

    // ---- HORROR ----
    { id: "jaws",                 title: "Jaws",                      type: "Movie",  year: 1975, category: "Horror", themes: ["horror"] },
    { id: "halloween",            title: "Halloween",                 type: "Movie",  year: 1978, category: "Horror", themes: ["horror"] },
    { id: "the-shining",          title: "The Shining",               type: "Movie",  year: 1980, category: "Horror", themes: ["horror"] },
    { id: "poltergeist",          title: "Poltergeist",               type: "Movie",  year: 1982, category: "Horror", themes: ["horror"] },
    { id: "a-nightmare-elm-street", title: "A Nightmare on Elm Street", type: "Movie", year: 1984, category: "Horror", themes: ["horror"] },
    { id: "scream",               title: "Scream",                    type: "Movie",  year: 1996, category: "Horror", themes: ["horror"] },
    { id: "the-sixth-sense",      title: "The Sixth Sense",           type: "Movie",  year: 1999, category: "Horror", themes: ["horror"] },
    { id: "the-conjuring",        title: "The Conjuring",             type: "Movie",  year: 2013, category: "Horror", themes: ["horror"] },
    { id: "get-out",              title: "Get Out",                   type: "Movie",  year: 2017, category: "Horror", themes: ["horror"] },
    { id: "it",                   title: "It",                        type: "Movie",  year: 2017, category: "Horror", themes: ["horror"] },
    { id: "a-quiet-place",        title: "A Quiet Place",             type: "Movie",  year: 2018, category: "Horror", themes: ["horror"] },
    { id: "hereditary",           title: "Hereditary",               type: "Movie",  year: 2018, category: "Horror", themes: ["horror"] },
    { id: "us",                   title: "Us",                        type: "Movie",  year: 2019, category: "Horror", themes: ["horror"] },
    { id: "parasite",             title: "Parasite",                  type: "Movie",  year: 2019, category: "Thriller", themes: ["horror"] },
    { id: "the-walking-dead",     title: "The Walking Dead",          type: "Series", year: 2010, category: "Horror", themes: ["horror"] },
    { id: "american-horror-story", title: "American Horror Story",    type: "Series", year: 2011, category: "Horror", themes: ["horror"] },
    { id: "the-exorcist",         title: "The Exorcist",              type: "Movie",  year: 1973, category: "Horror", themes: ["horror"] },
    { id: "carrie",               title: "Carrie",                    type: "Movie",  year: 1976, category: "Horror", themes: ["horror"] },
    { id: "childs-play",          title: "Child's Play",              type: "Movie",  year: 1988, category: "Horror", themes: ["horror"] },
    { id: "silence-of-the-lambs", title: "The Silence of the Lambs",  type: "Movie",  year: 1991, category: "Thriller", themes: ["horror"] },
    { id: "the-ring",             title: "The Ring",                  type: "Movie",  year: 2002, category: "Horror", themes: ["horror"] },
    { id: "twenty-eight-days-later", title: "28 Days Later",          type: "Movie",  year: 2002, category: "Horror", themes: ["horror"] },
    { id: "insidious",            title: "Insidious",                 type: "Movie",  year: 2010, category: "Horror", themes: ["horror"] },
    { id: "the-babadook",         title: "The Babadook",              type: "Movie",  year: 2014, category: "Horror", themes: ["horror"] },
    { id: "it-follows",           title: "It Follows",                type: "Movie",  year: 2014, category: "Horror", themes: ["horror"] },
    { id: "midsommar",            title: "Midsommar",                 type: "Movie",  year: 2019, category: "Horror", themes: ["horror"] },
    { id: "ready-or-not",         title: "Ready or Not",              type: "Movie",  year: 2019, category: "Horror", themes: ["horror"] },
    { id: "barbarian",            title: "Barbarian",                 type: "Movie",  year: 2022, category: "Horror", themes: ["horror"] },
    { id: "m3gan",                title: "M3GAN",                     type: "Movie",  year: 2022, category: "Horror", themes: ["horror"] },
    { id: "smile",                title: "Smile",                     type: "Movie",  year: 2022, category: "Horror", themes: ["horror"] },

    // ---- both horror + sci-fi ----
    { id: "stranger-things",      title: "Stranger Things",           type: "Series", year: 2016, category: "Sci-Fi", themes: ["sci-fi", "horror"], focus: "center 62%" },
    { id: "the-last-of-us",       title: "The Last of Us",            type: "Series", year: 2023, category: "Drama", themes: ["sci-fi", "horror"] },
    { id: "squid-game",           title: "Squid Game",                type: "Series", year: 2021, category: "Thriller", themes: ["horror"] },
    { id: "wednesday",            title: "Wednesday",                 type: "Series", year: 2022, category: "Mystery", themes: ["horror"] }
  ];

  /* ==========================================================================
     DATA  —  QUOTE CHALLENGES  ("Name That Movie")
     Show a famous line, pick which title it is from.

     // Verify quotes and attribution before final submission.

     `answer` must be one of `options`. `themes` works the same as content items.
     ======================================================================== */
  var QUOTE_CHALLENGES = [
    // ---- sci-fi ----
    { id: "q-empire",   quote: "No, I am your father.",
      answer: "The Empire Strikes Back", options: ["The Empire Strikes Back", "Star Trek", "Guardians of the Galaxy"],
      themes: ["sci-fi"], year: 1980 },
    { id: "q-terminator", quote: "I'll be back.",
      answer: "The Terminator", options: ["The Terminator", "RoboCop", "Total Recall"],
      themes: ["sci-fi"], year: 1984 },
    { id: "q-bttf",     quote: "Roads? Where we're going, we don't need roads.",
      answer: "Back to the Future", options: ["Back to the Future", "Bill & Ted's Excellent Adventure", "Flight of the Navigator"],
      themes: ["sci-fi"], year: 1985 },
    { id: "q-matrix",   quote: "There is no spoon.",
      answer: "The Matrix", options: ["The Matrix", "Inception", "Tron"],
      themes: ["sci-fi"], year: 1999 },
    { id: "q-et",       quote: "E.T. phone home.",
      answer: "E.T. the Extra-Terrestrial", options: ["E.T. the Extra-Terrestrial", "Close Encounters of the Third Kind", "Flight of the Navigator"],
      themes: ["sci-fi"], year: 1982 },
    { id: "q-aliens",   quote: "Game over, man! Game over!",
      answer: "Aliens", options: ["Aliens", "Predator", "Starship Troopers"],
      themes: ["sci-fi"], year: 1986 },

    // ---- horror ----
    { id: "q-shining",  quote: "Here's Johnny!",
      answer: "The Shining", options: ["The Shining", "Misery", "The Silence of the Lambs"],
      themes: ["horror"], year: 1980 },
    { id: "q-jaws",     quote: "You're gonna need a bigger boat.",
      answer: "Jaws", options: ["Jaws", "The Meg", "Deep Blue Sea"],
      themes: ["horror"], year: 1975 },
    { id: "q-poltergeist", quote: "They're here.",
      answer: "Poltergeist", options: ["Poltergeist", "The Conjuring", "Insidious"],
      themes: ["horror"], year: 1982 },
    { id: "q-scream",   quote: "Do you like scary movies?",
      answer: "Scream", options: ["Scream", "I Know What You Did Last Summer", "Halloween"],
      themes: ["horror"], year: 1996 },
    { id: "q-elm",      quote: "Whatever you do, don't fall asleep.",
      answer: "A Nightmare on Elm Street", options: ["A Nightmare on Elm Street", "Friday the 13th", "Child's Play"],
      themes: ["horror"], year: 1984 },
    { id: "q-sixth",    quote: "I see dead people.",
      answer: "The Sixth Sense", options: ["The Sixth Sense", "The Others", "Stir of Echoes"],
      themes: ["horror"], year: 1999 },

    // ---- general / wildcard ----
    { id: "q-joker",    quote: "Why so serious?",
      answer: "The Dark Knight", options: ["The Dark Knight", "Joker", "Batman Begins"],
      themes: [], year: 2008 },
    { id: "q-nemo",     quote: "Just keep swimming.",
      answer: "Finding Nemo", options: ["Finding Nemo", "Shark Tale", "The Little Mermaid"],
      themes: [], year: 2003 },
    { id: "q-buzz",     quote: "To infinity and beyond!",
      answer: "Toy Story", options: ["Toy Story", "Buzz Lightyear", "The Incredibles"],
      themes: [], year: 1995 },
    { id: "q-got",      quote: "Winter is coming.",
      answer: "Game of Thrones", options: ["Game of Thrones", "The Lord of the Rings", "Vikings"],
      themes: [], year: 2011 }
  ];

  /* ==========================================================================
     DATA  —  ODD ONE OUT  ("Find the Impostor")
     4 titles (as CONTENT_ITEMS ids); 3 share the relationship in `prompt`,
     `answer` is the one that doesn't. The relationship must be a SPECIFIC,
     checkable fact (medium, decade, etc.) — never a subjective vibe.
     ======================================================================== */
  var ODD_ONE_OUT = [
    { id: "ooo-scifi-1", themes: ["sci-fi"],
      prompt: "Three are movies. One is a TV series.",
      answer: "the-mandalorian", items: ["the-matrix", "blade-runner", "star-wars", "the-mandalorian"] },
    { id: "ooo-scifi-2", themes: ["sci-fi"],
      prompt: "Three are TV series. One is a movie.",
      answer: "avatar", items: ["black-mirror", "lost", "rick-and-morty", "avatar"] },
    { id: "ooo-scifi-3", themes: ["sci-fi"],
      prompt: "Three came out in the 2010s or later. One is from the 1980s.",
      answer: "back-to-the-future", items: ["interstellar", "arrival", "dune", "back-to-the-future"] },
    { id: "ooo-scifi-4", themes: ["sci-fi"],
      prompt: "Three came out before 2000. One came out after.",
      answer: "everything-everywhere", items: ["jurassic-park", "terminator-2", "total-recall", "everything-everywhere"] },

    { id: "ooo-horror-1", themes: ["horror"],
      prompt: "Three are movies. One is a TV series.",
      answer: "the-walking-dead", items: ["the-shining", "halloween", "scream", "the-walking-dead"] },
    { id: "ooo-horror-2", themes: ["horror"],
      prompt: "Three are TV series. One is a movie.",
      answer: "it", items: ["american-horror-story", "the-walking-dead", "wednesday", "it"] },
    { id: "ooo-horror-3", themes: ["horror"],
      prompt: "Three came out in the 2010s. One is from an earlier decade.",
      answer: "the-shining", items: ["get-out", "hereditary", "midsommar", "the-shining"] },
    { id: "ooo-horror-4", themes: ["horror"],
      prompt: "Three came out in the 1970s. One came out much later.",
      answer: "it", items: ["jaws", "halloween", "the-exorcist", "it"] }
  ];

  /* ==========================================================================
     DATA  —  PIXEL SCENE  ("Recognize This Scene?")
     One large supplied pixel-art image + 3 title options. Tests visual
     recognition, not chronology — NEVER generate the art in CSS, only real
     supplied files under assets/images/scenes/.

     Only 2 scenes exist per theme so far — a Daily Run needs 3 Pixel Scene
     rounds, so the 3rd always falls back to an extra Quote round instead of
     repeating a scene within the same run (see nextScene() in
     generateDailyRun()). Drop more entries here as artwork arrives; once a
     theme has 3+, every Pixel Scene slot fills for real.
     ======================================================================== */
  var PIXEL_SCENES = [
    { id: "scene-it-cornfield", image: "assets/images/scenes/it-cornfield.png",
      answer: "It", options: ["It", "Halloween", "Scream"], themes: ["horror"] },
    { id: "scene-conjuring-closeup", image: "assets/images/scenes/conjuring-closeup.png",
      answer: "The Conjuring", options: ["It", "The Conjuring", "Hereditary"], themes: ["horror"] },
    { id: "scene-back-to-the-future", image: "assets/images/scenes/back-to-the-future-01.png",
      answer: "Back to the Future", options: ["Back to the Future", "E.T. the Extra-Terrestrial", "Close Encounters of the Third Kind"], themes: ["sci-fi"] },
    { id: "scene-inception", image: "assets/images/scenes/inception-top.png",
      answer: "Inception", options: ["Inception", "Interstellar", "Arrival"], themes: ["sci-fi"] }
  ];


  /* Which SVG icon represents a genre (falls back to a film-strip icon). */
  var GENRE_ICON = {
    Animation: "animation", "Sci-Fi": "scifi", Fantasy: "fantasy",
    Horror: "horror", Sitcom: "sitcom", Mystery: "mystery", Thriller: "mystery"
  };

  /* Card top-strip colour by genre (the strip never hints at the correct
     chronological order — genre and release year are unrelated). */
  var GENRE_COLOR = {
    Animation: "#008A8E",
    "Sci-Fi":  "#7A4FB5",
    Fantasy:   "#F28A2E",
    Horror:    "#9E2B25",
    Sitcom:    "#25B6D2",
    Comedy:    "#F2A93B",
    Drama:     "#3B5675",
    Action:    "#E2544F",
    Adventure: "#B7791F",
    Musical:   "#C65B9C",
    Mystery:   "#C9A227",
    Thriller:  "#7A6A1E"
  };
  function genreColor(category) { return GENRE_COLOR[category] || "#E2544F"; }

  var HEAT_LABEL = { calm: "Calm", warm: "Warm", hot: "Hot", onfire: "On Fire" };


  /* ==========================================================================
     STATE  —  one plain object describing the current run
     ======================================================================== */
  var gameState = {
    round: 0,                // 1..10
    score: 0,
    streak: 0,               // consecutive correct answers
    bestStreak: 0,
    heat: "calm",            // calm | warm | hot | onfire
    doubleDown: false,       // reset every round
    timeRemaining: 0,        // seconds left on the soft timer
    correctCount: 0,
    doubleDownsWon: 0,
    fastestAnswer: null,     // fewest seconds taken to answer a round
    powerUps: { extraTime: 0, reveal: 0 },   // charges currently held
    run: [],                 // the 10 generated rounds
    roundResults: []         // one {type, state, wildcard} per Daily Run round, for the Results breakdown
  };

  // once a power-up has been unlocked it stays available (a later streak reset
  // does not take the charge away) — this just stops it being granted twice.
  var powerUpsUnlocked = { extraTime: false, reveal: false };

  /* Encore Mode — optional bonus play after the Daily Run. Separate from
     gameState: the Daily Run's score/stats stay exactly as they were when
     Round 10 ended, since that's the official, comparable score. */
  var ENCORE_LIVES = 3;
  var ENCORE_STAGE_EVERY = 4;         // rounds played before the next difficulty stage
  var ENCORE_TOKENS_PER_CORRECT = 2;
  var encoreState = {
    active: false,
    lives: 0,
    score: 0,
    tokensEarned: 0,
    stage: 1,                // 1 = 3-card Timeline, 2 = 4-card, 3 = 5-card + Insert
    roundsPlayed: 0
  };

  var timerId = null;        // setInterval handle for the soft timer
  var countdownId = null;    // setTimeout handle for the 3-2-1 intro
  var answered = false;      // has the current round been locked in?
  var counting = false;      // is the 3-2-1 intro running?
  var revealing = false;     // is the player picking a card for REVEAL?
  var runDate = null;        // the Date this run was generated for

  // per-round answer state (reset in startRound)
  var insertChoice = null;      // slot index      (INSERT — kept for a future Encore mode)
  var quoteChoice = null;       // chosen title     (QUOTE rounds)
  var wcfChoice = null;         // chosen item id   (WHICH CAME FIRST rounds)
  var oooChoice = null;         // chosen item id   (ODD ONE OUT rounds)
  var pixelSceneChoice = null;  // chosen title     (PIXEL SCENE rounds)
  var revealedYearIds = [];     // ids whose year the REVEAL power-up has shown


  /* ==========================================================================
     HELPERS
     ======================================================================== */

  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $all(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  /* Whole-day number for a date, counted from a fixed reference day.
     Using the LOCAL calendar parts means "today" matches the player's clock. */
  function dayNumber(date) {
    var reference = Date.UTC(2024, 0, 1);
    var day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((day - reference) / 86400000);
  }

  /* Human date like "Wed · Sep 2". */
  function formatToday(date) {
    var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return weekdays[date.getDay()] + " · " + months[date.getMonth()] + " " + date.getDate();
  }

  /* Short tape-style date like "SEP 02". */
  function formatTapeDate(date) {
    var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return months[date.getMonth()] + " " + ("0" + date.getDate()).slice(-2);
  }

  /* Deterministic pseudo-random generator (mulberry32).
     Same seed -> same sequence, so a given date always builds the same run. */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }


  /* ==========================================================================
     THEME
     ======================================================================== */

  /* Pick today's theme deterministically. Checked in order:
       1. "?theme=<id>" URL param        — always works, handy for the class demo
       2. the Beta Theme switcher's pick — only possible in ?beta=true mode
       3. the date                       — what every normal player sees
     Normal players never see #1 or #2 as a button; only the calendar
     decides their theme. */
  function getDailyTheme(date) {
    var forced = new URLSearchParams(window.location.search).get("theme");
    if (forced) {
      for (var i = 0; i < THEMES.length; i++) {
        if (THEMES[i].id === forced) return THEMES[i];
      }
    }
    var betaPick = getBetaThemeOverride();
    if (betaPick) {
      for (var j = 0; j < THEMES.length; j++) {
        if (THEMES[j].id === betaPick) return THEMES[j];
      }
    }
    var d = date || new Date();
    var index = ((dayNumber(d) % THEMES.length) + THEMES.length) % THEMES.length;
    return THEMES[index];
  }

  /* Load a real image over the CSS poster fallback. If it 404s, remove it and
     the CSS poster stays — so there is never a broken image. `focus` is an
     optional object-position (e.g. "center 40%") for cropping. */
  function loadPosterImage(posterEl, src, focus) {
    if (!posterEl || !src) return;
    var img = new Image();
    img.className = "poster__img";
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    if (focus) img.style.objectPosition = focus;
    img.onload = function () { posterEl.appendChild(img); };
    img.onerror = function () { /* keep the CSS fallback */ };
    img.src = src;
  }

  /* Apply a theme to the page. Safe to call again (used by the shelf switch):
     it swaps the body class, refreshes all text/art, and marks the active
     spine button. */
  function applyTheme(theme, date) {
    var body = document.body;

    // swap the theme class (remove whichever one was on before)
    THEMES.forEach(function (t) { body.classList.remove(t.bodyClass); });
    body.classList.add(theme.bodyClass);

    $all("[data-theme-name]").forEach(function (el) { el.textContent = theme.name; });
    $all("[data-theme-motifs]").forEach(function (el) { el.textContent = theme.motifs; });
    $all("[data-today-date]").forEach(function (el) { el.textContent = formatToday(date); });
    $all("[data-tape-code]").forEach(function (el) { el.textContent = theme.tapeCode; });
    $all("[data-tape-date]").forEach(function (el) { el.textContent = formatTapeDate(date); });
    $all("[data-artifact-date]").forEach(function (el) { el.textContent = formatTapeDate(date); });

    $all("[data-poster-initial]").forEach(function (el) { el.textContent = theme.initial; });
    $all("[data-poster-icon]").forEach(function (el) { el.innerHTML = ICONS[theme.icon] || ICONS.film; });
    $all('[data-poster-role="theme"]').forEach(function (el) {
      var old = el.querySelector(".poster__img");   // clear a previous edition's art
      if (old) { old.parentNode.removeChild(old); }
      loadPosterImage(el, theme.hero);
    });

    // mark which shelf tape is the one actually playing right now — the
    // shelf itself is decorative (see renderShelf()); this is the only
    // thing on it that changes.
    $all("[data-theme-tape]").forEach(function (spine) {
      var isPlaying = spine.getAttribute("data-theme-tape") === theme.id;
      spine.classList.toggle("spine--today", isPlaying);
      var tag = $("[data-spine-tag]", spine);
      if (tag) tag.textContent = isPlaying ? "Playing Today" : "VHS";
    });

    // "Start today's run" must launch the SAME edition Home is showing right
    // now — otherwise picking Sci-Fi here and pressing Play could still land
    // on whatever edition game.html falls back to (today's date rotation).
    $all("[data-start-run]").forEach(function (a) { a.setAttribute("href", "game.html?theme=" + theme.id); });
  }


  /* ==========================================================================
     BETA MODE  —  a Horror/Sci-Fi switcher for user testing only
     Normal players get exactly one theme a day, chosen by the calendar —
     see getDailyTheme(). Adding "?beta=true" to the URL reveals a small,
     clearly-labelled switcher (renderBetaThemeSwitcher()) so a tester can
     see both complete editions without waiting for the calendar.
     ======================================================================== */
  var BETA_THEME_KEY = "outOfOrderBetaTheme";

  function isBetaMode() {
    return new URLSearchParams(window.location.search).get("beta") === "true";
  }

  /* the tester's manual pick, or null outside beta mode / before any pick.
     Kept in sessionStorage (not localStorage) — it's a per-visit testing
     aid, not something that should outlive the tab or affect a normal run. */
  function getBetaThemeOverride() {
    if (!isBetaMode()) return null;
    try { return window.sessionStorage.getItem(BETA_THEME_KEY); } catch (e) { return null; }
  }

  function setBetaThemeOverride(themeId) {
    try { window.sessionStorage.setItem(BETA_THEME_KEY, themeId); } catch (e) { /* ignore */ }
  }

  /* Console helper for testers: clears the beta theme pick, the collection,
     tokens-era personal-best record, and Beta My Archive progress, so the
     next run starts completely fresh. Run resetBetaData() from devtools. */
  function resetBetaData() {
    try {
      window.sessionStorage.removeItem(BETA_THEME_KEY);
      window.localStorage.removeItem(BEST_KEY);
      window.localStorage.removeItem(COLLECTION_KEY);
    } catch (e) { /* ignore — nothing to clear */ }
    return "Beta data reset. Reload the page.";
  }
  window.resetBetaData = resetBetaData;   // the only thing this game puts on `window` — a devtools convenience

  /* Build (once) and keep in sync the small "Beta Theme" switcher shown
     only in ?beta=true mode — Home page only, before a run starts. */
  function renderBetaThemeSwitcher(date) {
    var box = $("[data-beta-theme]");
    if (!box || !isBetaMode()) return;
    box.hidden = false;

    function refreshButtons() {
      var current = getDailyTheme(date).id;
      $all("[data-beta-theme-btn]", box).forEach(function (btn) {
        btn.setAttribute("aria-pressed", String(btn.getAttribute("data-beta-theme-btn") === current));
      });
    }

    $all("[data-beta-theme-btn]", box).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-beta-theme-btn");
        setBetaThemeOverride(id);
        var theme = THEMES.filter(function (t) { return t.id === id; })[0];
        if (theme) applyTheme(theme, date);
        refreshButtons();
      });
    });

    refreshButtons();
  }

  /* Find the theme whose name matches a shelf category (case-insensitive). */
  function themeForCategory(name) {
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].name.toLowerCase() === name.toLowerCase()) return THEMES[i];
    }
    return null;
  }


  /* ==========================================================================
     SHELF  —  category tapes on the Home page
     Every spine is purely decorative — normal players can't pick a theme,
     only see that a rotating catalogue exists. The one matching today's
     edition gets a "Playing Today" tag and stands out visually (see
     applyTheme(), which flips that on/off, and the Beta Theme switcher for
     testers who DO need to change it — section 25/28 of the redesign).
     ======================================================================== */
  function renderShelf(date) {
    var shelf = $("[data-shelf]");
    if (!shelf) return;

    CATEGORIES.forEach(function (cat) {
      var theme = themeForCategory(cat.name);
      var spine = document.createElement("div");

      spine.className = "spine" + (cat.ink ? " spine--ink" : "");
      spine.style.setProperty("--spine-color", cat.color);
      spine.innerHTML =
        '<span class="spine__icon" aria-hidden="true">' + (ICONS[cat.icon] || ICONS.film) + '</span>' +
        '<span class="spine__title">' + cat.name + '</span>' +
        '<span class="spine__tag" data-spine-tag>VHS</span>';

      if (theme) spine.setAttribute("data-theme-tape", theme.id);

      shelf.appendChild(spine);
    });
  }


  /* ==========================================================================
     STORAGE  —  personal best (safe if localStorage is unavailable)
     We keep a small record {score, correct, streak} so the Home page can show
     detail, but the read/write API matches the shared prototype module.
     ======================================================================== */
  var BEST_KEY = "outOfOrderPersonalBest";

  function loadBestRecord() {
    try {
      var raw = window.localStorage.getItem(BEST_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null; // private mode / storage disabled — the game still works
    }
  }

  /* the best score as a plain number (0 when there is no record) */
  function getPersonalBest() {
    var best = loadBestRecord();
    return best && typeof best.score === "number" ? best.score : 0;
  }

  /* save only when it beats the stored score; returns true on a new best */
  function savePersonalBest(record) {
    try {
      if (record.score > getPersonalBest()) {
        window.localStorage.setItem(BEST_KEY, JSON.stringify(record));
        return true;
      }
    } catch (err) {
      /* ignore — nothing to persist to */
    }
    return false;
  }

  /* ==========================================================================
     STORAGE  —  My Archive collectibles (safe if localStorage is unavailable)
     A plain { id: true } map — once unlocked, a collectible stays unlocked.
     ======================================================================== */
  var COLLECTION_KEY = "outOfOrderCollection";

  function loadCollection() {
    try {
      var raw = window.localStorage.getItem(COLLECTION_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      return {};
    }
  }

  function saveCollection(unlocked) {
    try { window.localStorage.setItem(COLLECTION_KEY, JSON.stringify(unlocked)); }
    catch (err) { /* ignore — nothing to persist to */ }
  }

  function hasLockedCollectible() {
    var unlocked = loadCollection();
    return COLLECTIBLES.some(function (c) { return !unlocked[c.id]; });
  }

  /* ==========================================================================
     STORAGE  —  Archive Tokens (the game's one and only currency)
     ======================================================================== */
  var TOKENS_KEY = "outOfOrderTokens";

  function loadTokens() {
    try {
      var raw = window.localStorage.getItem(TOKENS_KEY);
      var n = raw ? parseInt(raw, 10) : 0;
      return isNaN(n) ? 0 : n;
    } catch (err) {
      return 0;
    }
  }

  function saveTokens(n) {
    try { window.localStorage.setItem(TOKENS_KEY, String(Math.max(0, n))); }
    catch (err) { /* ignore — nothing to persist to */ }
  }

  /* add `n` tokens to the balance and return the new total */
  function addTokens(n) {
    var total = loadTokens() + n;
    saveTokens(total);
    return total;
  }

  /* ---- calculateRunTokens() -------------------------------------------
     Simple on purpose: a flat completion reward, a small bonus per correct
     answer, and a bigger one-time bonus for a new Personal Best. */
  function calculateRunTokens(correctCount, isNewBest) {
    var tokens = 25;                    // completion reward
    tokens += correctCount * 5;         // performance bonus — up to +50 for 10/10
    if (isNewBest) tokens += 15;        // new Personal Best bonus
    return tokens;
  }

  /* Spend a Mystery Tape (MYSTERY_TAPE_COST tokens) to reveal the next
     locked collectible, in COLLECTIBLES order — not random, so a tester
     always sees a payoff instead of "nothing" (there are only 2 items in
     this Beta). Returns the newly-unlocked collectible, or null if the
     balance is short or nothing is left to find. */
  function openMysteryTape() {
    var balance = loadTokens();
    if (balance < MYSTERY_TAPE_COST) return null;

    var unlocked = loadCollection();
    var next = COLLECTIBLES.filter(function (c) { return !unlocked[c.id]; })[0];
    if (!next) return null;

    saveTokens(balance - MYSTERY_TAPE_COST);
    unlocked[next.id] = true;
    saveCollection(unlocked);
    return next;
  }

  /* Render the 12-slot "My Archive" shelf on the Home page: the 2 real
     collectibles (locked/unlocked) plus locked "coming soon" placeholders
     filling the rest. Never says the archive is complete — this is a Beta
     with only 2 items to find. */
  function renderCollectionGrid() {
    var grid = $("[data-collection-grid]");
    if (!grid) return;

    var unlocked = loadCollection();
    var html = "";
    var foundCount = 0;

    COLLECTIBLES.forEach(function (c) {
      var got = !!unlocked[c.id];
      if (got) foundCount += 1;
      html += got
        ? '<div class="collection-slot collection-slot--unlocked">' +
            '<img class="collection-slot__img" src="' + c.image + '" alt="' + c.name + '">' +
            '<span class="collection-slot__label">' + c.name + '</span>' +
          '</div>'
        : '<div class="collection-slot collection-slot--locked">' +
            '<span class="collection-slot__mark" aria-hidden="true">?</span>' +
            '<span class="collection-slot__label">Coming soon</span>' +
          '</div>';
    });
    for (var i = COLLECTIBLES.length; i < ARCHIVE_SLOTS; i++) {
      html +=
        '<div class="collection-slot collection-slot--locked">' +
          '<span class="collection-slot__mark" aria-hidden="true">?</span>' +
          '<span class="collection-slot__label">Coming soon</span>' +
        '</div>';
    }
    grid.innerHTML = html;

    text("[data-collection-status]",
      foundCount + " Beta item" + (foundCount === 1 ? "" : "s") + " found — more coming soon.");
    text("[data-tokens-home-balance]", loadTokens().toLocaleString());
  }

  /* ==========================================================================
     DAILY SPOTLIGHT  —  "Memory of the Day"  (from the shared engine)
     One title, rotated by the day number, with an MMDD archive id. No server.
     ======================================================================== */
  var SPOTLIGHT = CONTENT_ITEMS;   // rotate through the whole bank

  function spotlightOfDay(date) {
    var d = date || new Date();
    var n = Math.floor(d.getTime() / 86400000);
    var idx = ((n % SPOTLIGHT.length) + SPOTLIGHT.length) % SPOTLIGHT.length;
    var mmdd = ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
    return { title: SPOTLIGHT[idx], archiveId: mmdd };
  }

  function renderSpotlight() {
    if (!$("[data-spotlight]")) return;
    var s = spotlightOfDay(new Date());
    $all("[data-spotlight-title]").forEach(function (el) { el.textContent = s.title.title; });
    $all("[data-spotlight-meta]").forEach(function (el) { el.textContent = s.title.type; });  // year stays hidden
    $all("[data-spotlight-id]").forEach(function (el) { el.textContent = s.archiveId; });
  }

  /* Show the personal best on the home page. */
  function renderPersonalBest() {
    var box = $("[data-personal-best]");
    if (!box) return;

    var best = loadBestRecord();
    if (!best || typeof best.score !== "number") return; // keep the "No record yet" markup

    box.innerHTML =
      '<p class="best__score">' + best.score.toLocaleString() + ' pts</p>' +
      '<p class="best__hint">' + (best.correct || 0) + ' / 10 correct · best streak ×' + (best.streak || 0) + '</p>';
  }


  /* ==========================================================================
     GAME ENGINE  —  the daily run
     ======================================================================== */

  function itemById(id) {
    for (var i = 0; i < CONTENT_ITEMS.length; i++) {
      if (CONTENT_ITEMS[i].id === id) return CONTENT_ITEMS[i];
    }
    return null;
  }

  function cardArtSrc(item) { return "assets/images/cards/" + item.id + ".png"; }

  /* first meaningful letter of a title (skip a leading "The " / "A " / "An ") */
  function titleInitial(title) {
    return title.replace(/^(the|a|an)\s+/i, "").charAt(0).toUpperCase();
  }

  /* ---- titleWithVersion() -------------------------------------------------
     A title, plus its `versionLabel` when the item has one — e.g. a remake,
     a reboot, or a title that exists as both a film and a series ("Dune"
     tagged versionLabel: "Villeneuve Film"). Only items that actually need
     disambiguating carry a versionLabel; everything else renders exactly
     as before. Never reveals the year. */
  function titleWithVersion(item) {
    return item.title + (item.versionLabel
      ? ' <span class="version-label">(' + item.versionLabel + ')</span>'
      : "");
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* speak a short message to screen readers via the polite live region */
  function announce(message) {
    var live = $("[data-live]");
    if (live) live.textContent = message;
  }

  /* ---- presentOrder() (from the shared engine) --------------------------
     Deterministic re-order of a title list so it is stable but visibly NOT in
     year order. No RNG — same input always gives the same presentation.     */
  function presentOrder(items) {
    var sorted = items.slice().sort(function (a, b) { return a.year - b.year; });
    var out = sorted.slice();
    for (var i = 0; i < out.length; i++) {
      var j = (i * 2 + 1) % out.length;
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    var isSorted = out.every(function (t, i) { return i === 0 || out[i - 1].year <= t.year; });
    if (isSorted) out.reverse();
    return out;
  }

  /* Round SHAPE: which challenge type, timer, size.
     STAGE B (post user-testing): 2 TIMELINE · 2 QUOTE · 3 PIXEL SCENE ·
     2 ODD ONE OUT · 1 WHICH CAME FIRST. Before/After and Insert no longer
     appear in the Daily Run (see MECHANIC comments below for why each was
     kept or removed). Types are mixed so the same kind of round never
     shows up twice in a row, and round 1 opens on something easy.         */
  var ROUND_PLAN = [
    { type: "pixel-scene",  seconds: 18 },
    { type: "order",        seconds: 25, cards: 3 },
    { type: "quote",        seconds: 15 },
    { type: "odd-one-out",  seconds: 18 },
    { type: "pixel-scene",  seconds: 18 },
    { type: "which-first",  seconds: 15 },
    { type: "order",        seconds: 25, cards: 3 },
    { type: "quote",        seconds: 15 },
    { type: "odd-one-out",  seconds: 18 },
    { type: "pixel-scene",  seconds: 18 }
  ];

  /* seeded array shuffle */
  function shuffleArr(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* pick two titles for a WHICH CAME FIRST round: the pair with the widest
     year gap from a small batch, so the comparison is answerable (no ties). */
  function pickWidestGapPair(batch, rng) {
    var best = [batch[0], batch[1]];
    var bestGap = -1;
    for (var a = 0; a < batch.length; a++) {
      for (var b = a + 1; b < batch.length; b++) {
        var g = Math.abs(batch[a].year - batch[b].year);
        if (g > bestGap) { bestGap = g; best = [batch[a], batch[b]]; }
      }
    }
    return rng() < 0.5 ? best : [best[1], best[0]];   // randomise which one renders left/right
  }

  /* ---- Daily Theme content ------------------------------------------------
     getThemeChallengePool() = every title tagged with the active theme.
     A Horror run never shows a Sci-Fi-only title (or vice versa) — the
     "Archive Wildcard" rounds below pull from the GENERAL pool instead
     (themes: []), never from the other edition, so the theme still always
     means something.                                                        */
  function getThemeChallengePool(themeId) {
    return CONTENT_ITEMS.filter(function (it) { return it.themes.indexOf(themeId) !== -1; });
  }

  /* pick which 3 of the round-plan's "content" rounds (Order / Quote /
     Which Came First — the only types with a general-content fallback) are
     Archive Wildcards today. Odd One Out and Pixel Scene are never
     wildcards; they don't have a general-content pool to draw from. */
  function selectWildcardRounds(rng) {
    var eligible = [];
    ROUND_PLAN.forEach(function (plan, idx) {
      if (plan.type === "order" || plan.type === "quote" || plan.type === "which-first") eligible.push(idx);
    });
    var picks = shuffleArr(eligible, rng).slice(0, Math.min(3, eligible.length));
    var map = {};
    picks.forEach(function (idx) { map[idx] = true; });
    return map;
  }

  /* ---- generateDailyRun() ----------------------------------------------
     Same round SHAPE for everyone every day; the DATE + the active theme
     seed which titles fill each round, and which 3 rounds are Archive
     Wildcards (general content — 70% themed / 30% wildcard, per round 27
     of the redesign brief).                                                 */
  function generateDailyRun(date) {
    var themeId = getDailyTheme(date).id;
    var rng = mulberry32(dayNumber(date) * 2654435761 + stringSeed(themeId));
    var wildRounds = selectWildcardRounds(rng);

    var pool      = shuffleArr(getThemeChallengePool(themeId), rng);
    var wildPool  = shuffleArr(CONTENT_ITEMS.filter(function (it) { return it.themes.length === 0; }), rng);
    var qPool     = shuffleArr(QUOTE_CHALLENGES.filter(function (q) { return q.themes.indexOf(themeId) !== -1; }), rng);
    var wildQPool = shuffleArr(QUOTE_CHALLENGES.filter(function (q) { return q.themes.length === 0; }), rng);
    var scenePool = shuffleArr(PIXEL_SCENES.filter(function (s) { return s.themes.indexOf(themeId) !== -1; }), rng);
    var oooPool   = shuffleArr(ODD_ONE_OUT.filter(function (s) { return s.themes.indexOf(themeId) !== -1; }), rng);
    var pi = 0, wi = 0, qi = 0, wqi = 0, sci = 0, ooi = 0;

    function nextItem(wild) {
      if (wild) { if (wi >= wildPool.length) wi = 0; return wildPool[wi++]; }
      if (pi >= pool.length) pi = 0;   // safety net — the themed pools are sized not to need this
      return pool[pi++];
    }
    function takeItems(n, wild) {
      var out = [];
      for (var i = 0; i < n; i++) { var it = nextItem(wild); if (it) out.push(it); }
      return out;
    }
    /* like takeItems(), but for Timeline (order) rounds specifically: two
       cards sharing a release year makes "oldest -> newest" ambiguous (which
       one goes first?), which confused testers. Skips any item whose year
       is already picked, so every card in the round is a different year.
       `tries` caps how far it'll search before giving up (defensive only —
       our pools span enough decades that this should never actually bite). */
    function takeItemsDistinctYears(n, wild) {
      var out = [];
      var usedYears = {};
      var tries = n * 8;
      while (out.length < n && tries > 0) {
        tries--;
        var it = nextItem(wild);
        if (!it) break;
        if (usedYears[it.year]) continue;   // same year as a card we already have — skip it
        usedYears[it.year] = true;
        out.push(it);
      }
      return out;
    }
    function nextQuote(wild) {
      if (wild) { if (wqi >= wildQPool.length) wqi = 0; return wildQPool[wqi++]; }
      if (qi >= qPool.length) qi = 0;
      return qPool[qi++];
    }
    /* unlike the other pools, this one does NOT wrap around — with only a
       couple of scenes per theme so far, wrapping would show the same
       scene twice in one run. Once exhausted, the caller falls back to an
       extra (themed) Quote round instead (see below). */
    function nextScene() {
      if (sci >= scenePool.length) return null;
      return scenePool[sci++];
    }
    function nextOddOneOutSet() {
      if (!oooPool.length) return null;
      if (ooi >= oooPool.length) ooi = 0;
      return oooPool[ooi++];
    }
    function buildOddOneOutRound() {
      var set = nextOddOneOutSet();
      if (!set) return { type: "quote", quote: nextQuote(false) || QUOTE_CHALLENGES[0] };  // last-resort fallback
      return { type: "odd-one-out", set: set, items: shuffleArr(set.items.map(itemById), rng) };
    }

    return ROUND_PLAN.map(function (plan, idx) {
      var wild = !!wildRounds[idx];
      var extra;

      if (plan.type === "quote") {
        extra = { type: "quote", quote: nextQuote(wild) || QUOTE_CHALLENGES[0] };
      } else if (plan.type === "which-first") {
        var pair = pickWidestGapPair(takeItems(3, wild), rng);
        extra = { type: "which-first", itemA: pair[0], itemB: pair[1] };
      } else if (plan.type === "odd-one-out") {
        extra = buildOddOneOutRound();   // never a wildcard — see selectWildcardRounds()
        wild = false;
      } else if (plan.type === "pixel-scene") {
        // once this theme's scenes run out (still just 2 each today) ->
        // fall back to an extra themed Quote round instead of repeating one
        var scene = nextScene();
        extra = scene ? { type: "pixel-scene", scene: scene } : { type: "quote", quote: nextQuote(false) || QUOTE_CHALLENGES[0] };
        wild = false;   // Pixel Scene is never a wildcard either
      } else if (plan.type === "insert") {
        // kept for a future Encore mode — not reachable from ROUND_PLAN today
        var set = takeItemsDistinctYears(plan.line + 1, wild).slice().sort(function (a, b) { return a.year - b.year; });
        var k = 1 + Math.floor(rng() * Math.max(1, set.length - 2));
        var card = set[k];
        var line = set.filter(function (it) { return it !== card; });
        extra = {
          type: "insert", timeline: line, card: card,
          correctSlot: line.filter(function (it) { return it.year < card.year; }).length
        };
      } else {
        // distinct years only — two cards from the same year make "oldest
        // -> newest" ambiguous (per user testing feedback)
        extra = { type: "order", items: presentOrder(takeItemsDistinctYears(plan.cards, wild)) };
      }

      extra.seconds = plan.seconds;
      extra.theme = themeId;
      extra.wildcard = wild;
      return extra;
    });
  }


  /* ==========================================================================
     ROUND FLOW
     ======================================================================== */

  function startRound() {
    var round = gameState.run[gameState.round - 1];

    gameState.doubleDown = false;
    gameState.timeRemaining = round.seconds;
    answered = false;
    revealing = false;

    $("[data-feedback]").hidden = true;
    $("[data-challenge]").hidden = false;
    $("[data-challenge]").classList.remove("challenge--no-bonus");

    renderHud();
    renderChallenge(round);
    renderPowerups();
    resetDoubleDownButton();

    // a short "get ready" count, then the soft timer starts
    runCountdown(startTimer);
  }

  /* ---- 10-1 intro --------------------------------------------------------
     A full-screen "Get ready" pop-up covers the whole page — the round's
     cards/options are already rendered underneath (renderChallenge() ran
     right before this), so the challenge title and help text are already
     set; this just mirrors them onto the countdown so nobody is caught off
     guard by a new round type. One full second per number, then it
     disappears and `done` runs (starts the soft timer). */
  function runCountdown(done) {
    if (countdownId) window.clearTimeout(countdownId);
    counting = true;
    setChallengeControls(true);        // disable Lock / power-ups / Double Down

    var title = $("[data-challenge-instruction]").textContent;
    var desc = $("[data-challenge-help]").textContent;
    text("[data-countdown-title]", title);
    text("[data-countdown-desc]", desc);
    announce("Next challenge: " + title + ". " + desc);

    var overlay = $("[data-round-countdown]");
    var el = $("[data-countdown]");
    overlay.hidden = false;

    var sequence = ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
    var i = 0;
    var step = 1000;   // one second per number

    function tick() {
      if (i < sequence.length) {
        el.textContent = sequence[i];
        el.classList.remove("round-countdown__num--pop");
        void el.offsetWidth;             // restart the pop animation
        el.classList.add("round-countdown__num--pop");
        announce(sequence[i]);
        i += 1;
        countdownId = window.setTimeout(tick, step);
      } else {
        counting = false;
        overlay.hidden = true;
        setChallengeControls(false);
        refreshMoveButtons($("[data-order-list]"));
        done();
      }
    }
    tick();
  }

  /* enable / disable the round's controls in one place */
  function setChallengeControls(disabled) {
    $("[data-submit]").disabled = disabled || answered || !canLock();
    $("[data-double-down]").disabled = disabled || answered;
    $all("[data-powerup]").forEach(function (b) {
      b.disabled = disabled || answered || gameState.powerUps[b.getAttribute("data-powerup")] < 1;
    });
    // in-challenge controls (cards, before/after, slots)
    $all("[data-challenge-body] button").forEach(function (b) { b.disabled = disabled || answered; });
    refreshMoveButtons($("[data-order-list]"));   // re-apply first/last disabling for ORDER
  }

  /* ORDER can be locked anytime; the others need a choice first */
  function canLock() {
    var round = currentRound();
    if (round.type === "insert") return insertChoice !== null;
    if (round.type === "quote") return quoteChoice !== null;
    if (round.type === "which-first") return wcfChoice !== null;
    if (round.type === "odd-one-out") return oooChoice !== null;
    if (round.type === "pixel-scene") return pixelSceneChoice !== null;
    return true;   // "order" (Timeline) can always be locked
  }

  function currentRound() { return gameState.run[gameState.round - 1]; }

  function renderChallenge(round) {
    var body = $("[data-challenge-body]");
    body.innerHTML = "";
    body.className = "challenge__body challenge__body--" + round.type;

    insertChoice = null;
    quoteChoice = null;
    wcfChoice = null;
    oooChoice = null;
    pixelSceneChoice = null;
    revealedYearIds = [];

    var roundNum = encoreState.active ? encoreState.roundsPlayed + 1 : gameState.round;
    var nn = ("0" + roundNum).slice(-2);
    var tag = (encoreState.active ? "Encore" : (round.type === "quote" ? "Quote Archive" : "Today's Archive")) + " · Round " + nn;
    text("[data-challenge-tag]", tag);

    // Odd One Out and Pixel Scene are always on-theme (no general-content
    // pool exists for them yet), so only the other types can be wildcards.
    var badge = $("[data-challenge-badge]");
    if (badge) {
      badge.textContent = round.wildcard ? "Archive Wildcard" : "Themed Round";
      badge.classList.toggle("challenge__badge--wildcard", !!round.wildcard);
    }

    if (round.type === "order") renderOrder(round, body);
    else if (round.type === "insert") renderInsert(round, body);
    else if (round.type === "quote") renderQuote(round, body);
    else if (round.type === "which-first") renderWhichCameFirst(round, body);
    else if (round.type === "odd-one-out") renderOddOneOut(round, body);
    else if (round.type === "pixel-scene") renderPixelSceneChallenge(round, body);
  }

  function renderHud() {
    if (encoreState.active) {
      text("[data-hud-round-label]", "Lives");
      text("[data-hud-round]", "♥".repeat(encoreState.lives) + "♡".repeat(ENCORE_LIVES - encoreState.lives));
      text("[data-hud-score]", encoreState.score.toLocaleString());
    } else {
      text("[data-hud-round-label]", "Round");
      text("[data-hud-round]", ("0" + gameState.round).slice(-2) + " / 10");
      text("[data-hud-score]", gameState.score.toLocaleString());
    }
    text("[data-hud-streak]", "×" + gameState.streak);
    text("[data-hud-heat]", HEAT_LABEL[gameState.heat]);
    updateTimerDisplay();   // also draws the time-remaining bar (below)
  }

  function text(selector, value) {
    var el = $(selector);
    if (el) el.textContent = value;
  }


  /* ==========================================================================
     MECHANIC 01  —  ORDER  (oldest -> newest)
     ======================================================================== */

  /* small reusable helpers ------------------------------------------------ */

  /* the CSS-fallback poster contents (icon + initial); a real image loads
     over it via loadPosterImage() */
  function posterInner(item) {
    return '<span class="poster__icon" aria-hidden="true">' +
             (ICONS[GENRE_ICON[item.category]] || ICONS.film) + '</span>' +
           '<span class="poster__initial" aria-hidden="true">' +
             titleInitial(item.title) + '</span>';
  }

  /* a hidden "release year" tag, keyed by id so REVEAL / feedback can show it */
  function yearTag(item) {
    return '<span class="year-tag" data-year-for="' + item.id + '" hidden>' +
             '<span class="year-tag__badge">◎ Revealed</span>' + item.year +
           '</span>';
  }

  function renderOrder(round, body) {
    text("[data-challenge-instruction]", "Oldest → Newest");
    text("[data-submit]", "Submit Answer ✓");
    text("[data-challenge-count]", round.items.length + " Cards");
    text("[data-challenge-help]", "Drag the cards, or use Earlier / Later, to run oldest → newest  ·  Enter to submit");

    // persistent direction guide — user testing showed the "Oldest → Newest"
    // heading alone wasn't enough; this sits right above the cards for as
    // long as the round is on screen.
    var direction = document.createElement("div");
    direction.className = "timeline-direction";
    direction.setAttribute("aria-hidden", "true");   // the heading + help text already say this to screen readers
    direction.innerHTML =
      '<span class="timeline-direction__end">Oldest · First</span>' +
      '<span class="timeline-direction__line"><span class="timeline-direction__arrow">&rarr;</span></span>' +
      '<span class="timeline-direction__end">Newest · Latest</span>';
    body.appendChild(direction);

    var list = document.createElement("ol");
    list.className = "order-list";
    list.setAttribute("data-order-list", "");
    list.setAttribute("aria-label", "Titles to arrange, oldest to newest");
    round.items.forEach(function (item, index) { list.appendChild(buildCard(item, index)); });
    body.appendChild(list);

    refreshMoveButtons(list);
    $("[data-submit]").disabled = false;
  }

  function buildCard(item, index) {
    var li = document.createElement("li");
    li.className = "order-card";
    li.setAttribute("data-id", item.id);
    li.setAttribute("draggable", "true");
    li.setAttribute("tabindex", "0");
    li.setAttribute("aria-roledescription", "Draggable card. Use arrow keys, or the Earlier and Later buttons, to move it.");
    li.style.setProperty("--card-color", genreColor(item.category));

    li.innerHTML =
      '<div class="order-card__meta">' +
        '<span class="order-card__type">' + item.type + '</span>' +
        '<span class="order-card__code">O.O. ' + ("0" + (index + 1)).slice(-2) + '</span>' +
      '</div>' +
      '<div class="order-card__art poster" data-card-art>' + posterInner(item) +
        '<span class="order-card__mark" data-card-mark aria-hidden="true"></span>' +
      '</div>' +
      '<p class="order-card__title">' + titleWithVersion(item) + '</p>' +
      yearTag(item) +
      '<div class="order-card__controls">' +
        '<button type="button" class="order-card__move" data-move="earlier">' +
          '<span aria-hidden="true">↑</span> Earlier</button>' +
        '<button type="button" class="order-card__move" data-move="later">' +
          '<span aria-hidden="true">↓</span> Later</button>' +
      '</div>';

    loadPosterImage($(".order-card__art", li), cardArtSrc(item), item.focus);

    $('[data-move="earlier"]', li).addEventListener("click", function () { moveCard(li, "earlier"); });
    $('[data-move="later"]', li).addEventListener("click", function () { moveCard(li, "later"); });

    li.addEventListener("keydown", function (e) {
      if (answered || counting) return;
      if (revealing && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); doReveal(li); return; }
      if (revealing) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); moveCard(li, "earlier"); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); moveCard(li, "later"); }
      if (e.key === "Enter") { e.preventDefault(); lockAnswer(false); }
    });
    li.addEventListener("click", function () { if (revealing) doReveal(li); });

    li.addEventListener("dragstart", onDragStart);
    li.addEventListener("dragover", onDragOver);
    li.addEventListener("drop", function (e) { e.preventDefault(); });
    li.addEventListener("dragend", onDragEnd);

    return li;
  }

  /* move a card one slot earlier / later and keep focus on it */
  function moveCard(card, direction) {
    if (answered || counting) return;
    var list = card.parentNode;
    if (direction === "earlier" && card.previousElementSibling) {
      list.insertBefore(card, card.previousElementSibling);
    } else if (direction === "later" && card.nextElementSibling) {
      list.insertBefore(card.nextElementSibling, card);
    }
    refreshMoveButtons(list);
    card.focus();
  }

  /* disable Earlier on the first card and Later on the last card */
  function refreshMoveButtons(list) {
    if (!list) return;
    var cards = $all(".order-card", list);
    cards.forEach(function (card, i) {
      $('[data-move="earlier"]', card).disabled = answered || (i === 0);
      $('[data-move="later"]', card).disabled = answered || (i === cards.length - 1);
    });
  }

  // ---- drag helpers ----
  var draggingCard = null;

  function onDragStart(e) {
    if (answered || counting) { e.preventDefault(); return; }
    draggingCard = this;
    this.classList.add("order-card--dragging");
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", this.getAttribute("data-id")); } catch (x) {}
  }

  function onDragEnd() {
    if (draggingCard) draggingCard.classList.remove("order-card--dragging");
    draggingCard = null;
    refreshMoveButtons($("[data-order-list]"));
  }

  function onDragOver(e) {
    if (!draggingCard) return;
    e.preventDefault();
    var list = $("[data-order-list]");
    var after = cardAfterPoint(list, e.clientX, e.clientY);
    if (after === null) list.appendChild(draggingCard);
    else list.insertBefore(draggingCard, after);
  }

  /* which card should the dragged card go *before*, given the pointer position */
  function cardAfterPoint(list, x, y) {
    var others = $all(".order-card:not(.order-card--dragging)", list);
    if (!others.length) return null;

    // vertical layout on mobile, horizontal on desktop
    var vertical = others.length > 1 &&
      others[1].getBoundingClientRect().top - others[0].getBoundingClientRect().top > 5;

    var closest = null;
    var closestDist = Number.NEGATIVE_INFINITY;
    others.forEach(function (card) {
      var box = card.getBoundingClientRect();
      var offset = vertical
        ? y - box.top - box.height / 2
        : x - box.left - box.width / 2;
      if (offset < 0 && offset > closestDist) { closestDist = offset; closest = card; }
    });
    return closest;
  }


  /* ==========================================================================
     MECHANIC 02  —  WHICH CAME FIRST
     Two titles, one question, always the same: which came out first? No
     "reference/comparison" framing, no Before/After tag to interpret —
     tap the title, then Submit Answer. Replaces the old Before/After round
     (user testing found the reference/comparison framing confusing).
     ======================================================================== */

  function renderWhichCameFirst(round, body) {
    text("[data-challenge-instruction]", "Which Came First?");
    text("[data-submit]", "Submit Answer ✓");
    text("[data-challenge-count]", "2 Titles");
    text("[data-challenge-help]", "Tap the title that came out first  ·  keys 1 / 2");

    body.innerHTML =
      '<div class="wcf__row">' +
        wcfCard(round.itemA, 1) +
        wcfCard(round.itemB, 2) +
      '</div>';

    loadPosterImage($('[data-wcf-card="' + round.itemA.id + '"] .poster', body), cardArtSrc(round.itemA), round.itemA.focus);
    loadPosterImage($('[data-wcf-card="' + round.itemB.id + '"] .poster', body), cardArtSrc(round.itemB), round.itemB.focus);

    $all("[data-wcf-card]", body).forEach(function (btn) {
      var id = btn.getAttribute("data-wcf-card");
      btn.addEventListener("click", function () { setWcfChoice(id); });
    });

    $("[data-submit]").disabled = true;   // enabled once a choice is made
  }

  function wcfCard(item, num) {
    return '<button type="button" class="wcf-card" data-wcf-card="' + item.id + '"' +
             ' style="--card-color:' + genreColor(item.category) + '" aria-pressed="false">' +
             '<div class="wcf-card__art poster" data-card-art>' + posterInner(item) +
               '<span class="wcf-card__mark" data-wcf-mark aria-hidden="true"></span>' +
             '</div>' +
             '<p class="wcf-card__title"><span class="card-num" aria-hidden="true">' + num + '</span>' +
               titleWithVersion(item) + '</p>' +
             '<p class="meta wcf-card__cat">' + item.category + '</p>' +
             yearTag(item) +
           '</button>';
  }

  function setWcfChoice(id) {
    if (answered || counting) return;
    wcfChoice = id;
    $all("[data-wcf-card]").forEach(function (btn) {
      var on = btn.getAttribute("data-wcf-card") === id;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("wcf-card--on", on);
    });
    $("[data-submit]").disabled = false;
    $("[data-submit]").focus();
    announce(itemById(id).title + " selected.");
  }

  function checkWhichCameFirst() {
    var round = currentRound();
    if (!wcfChoice) return false;
    var earlier = round.itemA.year <= round.itemB.year ? round.itemA : round.itemB;
    return wcfChoice === earlier.id;
  }

  /* keyboard 1 / 2 for which-came-first cards */
  function wcfKey(n) {
    if (answered || counting || currentRound().type !== "which-first") return;
    var btn = $all("[data-wcf-card]")[n - 1];
    if (btn && !btn.disabled) setWcfChoice(btn.getAttribute("data-wcf-card"));
  }


  /* ==========================================================================
     MECHANIC 03  —  INSERT
     Drop the loose card into the correct gap of an ordered timeline.
     ======================================================================== */

  function renderInsert(round, body) {
    text("[data-challenge-instruction]", "Where Does It Fit?");
    text("[data-submit]", "Submit Answer ✓");
    text("[data-challenge-count]", "Timeline");
    text("[data-challenge-help]",
      "Tap a gap to drop " + round.card.title + " into the timeline  ·  oldest → newest  ·  number keys pick a gap");

    var html =
      '<div class="insert-card">' +
        '<span class="meta">Place this card</span>' +
        '<div class="insert-card__body">' +
          '<div class="insert-card__art poster" data-card-art style="--card-color:' + genreColor(round.card.category) + '">' +
            posterInner(round.card) + '</div>' +
          '<div class="insert-card__info">' +
            '<p class="insert-card__title">' + titleWithVersion(round.card) + '</p>' +
            '<p class="meta">' + round.card.category + '</p>' +
            yearTag(round.card) +
          '</div>' +
        '</div>' +
      '</div>' +
      '<ol class="insert-timeline" aria-label="Timeline, oldest to newest">';

    for (var s = 0; s <= round.timeline.length; s++) {
      html +=
        '<li class="insert-timeline__gap">' +
          '<button type="button" class="insert-slot" data-slot="' + s + '" aria-label="Insert at position ' + (s + 1) + '">' +
            '<span aria-hidden="true">+</span></button>' +
        '</li>';
      if (s < round.timeline.length) {
        var it = round.timeline[s];
        html +=
          '<li class="insert-item" style="--card-color:' + genreColor(it.category) + '">' +
            '<div class="insert-item__art poster" data-card-art>' + posterInner(it) + '</div>' +
            '<p class="insert-item__title">' + titleWithVersion(it) + '</p>' +
            yearTag(it) +
          '</li>';
      }
    }
    html += '</ol>';
    body.innerHTML = html;

    loadPosterImage($(".insert-card__art", body), cardArtSrc(round.card), round.card.focus);
    round.timeline.forEach(function (it, i) {
      loadPosterImage($all(".insert-item__art", body)[i], cardArtSrc(it), it.focus);
    });

    $all("[data-slot]", body).forEach(function (btn) {
      btn.addEventListener("click", function () { setInsertChoice(parseInt(btn.getAttribute("data-slot"), 10)); });
    });

    $("[data-submit]").disabled = true;
  }

  function setInsertChoice(slot) {
    if (answered || counting) return;
    insertChoice = slot;
    $all("[data-slot]").forEach(function (btn) {
      btn.classList.toggle("insert-slot--on", parseInt(btn.getAttribute("data-slot"), 10) === slot);
    });
    $("[data-submit]").disabled = false;
    $("[data-submit]").focus();
    announce("Gap " + (slot + 1) + " selected.");
  }

  function checkInsertAnswer() {
    return insertChoice === currentRound().correctSlot;
  }

  /* keyboard 1-9 for insert gap slots */
  function insertKey(n) {
    if (answered || counting || currentRound().type !== "insert") return;
    var btn = $all("[data-slot]")[n - 1];
    if (btn && !btn.disabled) setInsertChoice(parseInt(btn.getAttribute("data-slot"), 10));
  }


  /* ==========================================================================
     MECHANIC 04  —  QUOTE  ("Name That Movie")
     Show a famous line, pick which of 3 titles it is from.
     ======================================================================== */

  /* stable per-quote option order (so the answer is not always first) */
  function stringSeed(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h || 1;
  }

  function renderQuote(round, body) {
    var q = round.quote;
    text("[data-challenge-instruction]", "Name That Movie");
    text("[data-submit]", "Submit Answer ✓");
    text("[data-challenge-count]", "Quote");
    text("[data-challenge-help]", "Which Movie or Series is this line from?  ·  keys 1 / 2 / 3");

    var opts = shuffleArr(q.options, mulberry32(stringSeed(q.id)));

    var html =
      '<blockquote class="quote">' +
        '<span class="quote__mark" aria-hidden="true">&ldquo;</span>' +
        q.quote +
        '<span class="quote__mark" aria-hidden="true">&rdquo;</span>' +
      '</blockquote>' +
      '<ul class="quote-options" aria-label="Answer options">';
    opts.forEach(function (title, i) {
      html +=
        '<li><button type="button" class="quote-option" data-quote-opt="' + i + '" aria-pressed="false">' +
          '<span class="quote-option__letter" aria-hidden="true">' + (i + 1) + '</span>' +
          '<span class="quote-option__title">' + title + '</span>' +
        '</button></li>';
    });
    html += '</ul>';
    body.innerHTML = html;

    // store the shuffled titles on the buttons for checking
    $all("[data-quote-opt]", body).forEach(function (btn) {
      var title = opts[parseInt(btn.getAttribute("data-quote-opt"), 10)];
      btn.setAttribute("data-quote-title", title);
      btn.addEventListener("click", function () { setQuoteChoice(title); });
    });

    $("[data-submit]").disabled = true;
  }

  function setQuoteChoice(title) {
    if (answered || counting) return;
    quoteChoice = title;
    $all("[data-quote-opt]").forEach(function (btn) {
      var on = btn.getAttribute("data-quote-title") === title;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("quote-option--on", on);
    });
    $("[data-submit]").disabled = false;
    $("[data-submit]").focus();
    announce(title + " selected.");
  }

  /* keyboard 1 / 2 / 3 for quote options */
  function quoteKey(n) {
    if (answered || counting || currentRound().type !== "quote") return;
    var btn = $all("[data-quote-opt]")[n - 1];
    if (btn && !btn.disabled) setQuoteChoice(btn.getAttribute("data-quote-title"));
  }

  function checkQuoteAnswer() {
    return quoteChoice === currentRound().quote.answer;
  }


  /* ==========================================================================
     MECHANIC 05  —  ODD ONE OUT  ("Find the Impostor")
     4 titles; 3 share the relationship named in round.set.prompt, one is
     the impostor. Tap the one that doesn't belong, then Submit Answer.
     ======================================================================== */

  function renderOddOneOut(round, body) {
    text("[data-challenge-instruction]", "Odd One Out");
    text("[data-submit]", "Submit Answer ✓");
    text("[data-challenge-count]", "4 Titles");
    text("[data-challenge-help]", round.set.prompt + " Tap the one that doesn't belong.  ·  keys 1 / 2 / 3 / 4");

    var html = '<div class="ooo__grid">';
    round.items.forEach(function (item, i) { html += oooCard(item, i + 1); });
    html += '</div>';
    body.innerHTML = html;

    round.items.forEach(function (item) {
      loadPosterImage($('[data-ooo-card="' + item.id + '"] .poster', body), cardArtSrc(item), item.focus);
    });

    $all("[data-ooo-card]", body).forEach(function (btn) {
      var id = btn.getAttribute("data-ooo-card");
      btn.addEventListener("click", function () { setOooChoice(id); });
    });

    $("[data-submit]").disabled = true;
  }

  function oooCard(item, num) {
    return '<button type="button" class="ooo-card" data-ooo-card="' + item.id + '"' +
             ' style="--card-color:' + genreColor(item.category) + '" aria-pressed="false">' +
             '<div class="ooo-card__art poster" data-card-art>' + posterInner(item) +
               '<span class="ooo-card__mark" data-ooo-mark aria-hidden="true"></span>' +
             '</div>' +
             '<p class="ooo-card__title"><span class="card-num" aria-hidden="true">' + num + '</span>' +
               titleWithVersion(item) + '</p>' +
           '</button>';
  }

  function setOooChoice(id) {
    if (answered || counting) return;
    oooChoice = id;
    $all("[data-ooo-card]").forEach(function (btn) {
      var on = btn.getAttribute("data-ooo-card") === id;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("ooo-card--on", on);
    });
    $("[data-submit]").disabled = false;
    $("[data-submit]").focus();
    announce(itemById(id).title + " selected.");
  }

  function checkOddOneOutAnswer() {
    return oooChoice === currentRound().set.answer;
  }

  /* keyboard 1-4 for odd-one-out cards */
  function oooKey(n) {
    if (answered || counting || currentRound().type !== "odd-one-out") return;
    var btn = $all("[data-ooo-card]")[n - 1];
    if (btn && !btn.disabled) setOooChoice(btn.getAttribute("data-ooo-card"));
  }


  /* ==========================================================================
     MECHANIC 06  —  PIXEL SCENE  ("Recognize This Scene?")
     One large supplied pixel-art image, 3 title options — same shape as
     QUOTE, just an image instead of a line of dialogue. Tests visual
     recognition, not chronology.
     ======================================================================== */

  function renderPixelSceneChallenge(round, body) {
    var scene = round.scene;
    text("[data-challenge-instruction]", "Recognize This Scene?");
    text("[data-submit]", "Submit Answer ✓");
    text("[data-challenge-count]", "Pixel Scene");
    text("[data-challenge-help]", "Which Movie or Series is this from?  ·  keys 1 / 2 / 3");

    var opts = shuffleArr(scene.options, mulberry32(stringSeed(scene.id)));

    var html =
      '<div class="pixel-scene">' +
        '<img class="pixel-scene__img" src="' + scene.image + '" alt="">' +
      '</div>' +
      '<ul class="pixel-scene-options" aria-label="Answer options">';
    opts.forEach(function (title, i) {
      html +=
        '<li><button type="button" class="pixel-scene-opt" data-scene-opt="' + i + '" aria-pressed="false">' +
          '<span class="pixel-scene-opt__letter" aria-hidden="true">' + (i + 1) + '</span>' +
          '<span class="pixel-scene-opt__title">' + title + '</span>' +
        '</button></li>';
    });
    html += '</ul>';
    body.innerHTML = html;

    $all("[data-scene-opt]", body).forEach(function (btn) {
      var title = opts[parseInt(btn.getAttribute("data-scene-opt"), 10)];
      btn.setAttribute("data-scene-title", title);
      btn.addEventListener("click", function () { setPixelSceneChoice(title); });
    });

    $("[data-submit]").disabled = true;
  }

  function setPixelSceneChoice(title) {
    if (answered || counting) return;
    pixelSceneChoice = title;
    $all("[data-scene-opt]").forEach(function (btn) {
      var on = btn.getAttribute("data-scene-title") === title;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("pixel-scene-opt--on", on);
    });
    $("[data-submit]").disabled = false;
    $("[data-submit]").focus();
    announce(title + " selected.");
  }

  /* keyboard 1 / 2 / 3, shared with QUOTE */
  function sceneKey(n) {
    if (answered || counting || currentRound().type !== "pixel-scene") return;
    var btn = $all("[data-scene-opt]")[n - 1];
    if (btn && !btn.disabled) setPixelSceneChoice(btn.getAttribute("data-scene-title"));
  }

  function checkPixelSceneAnswer() {
    return pixelSceneChoice === currentRound().scene.answer;
  }


  /* ==========================================================================
     TIMER
     Counting down never shows a harsh "GAME OVER". But when it reaches 0 the
     round DOES close: whatever the player has picked so far is locked in
     (nothing picked = an incorrect round) and the feedback pop-up appears.
     ======================================================================== */

  function startTimer() {
    stopTimer();
    updateTimerDisplay();
    timerId = window.setInterval(function () {
      if (gameState.timeRemaining > 0) {
        gameState.timeRemaining--;
        updateTimerDisplay();
      } else {
        stopTimer();
        lockAnswer(true);   // time's up — end the round with what we have
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerId) { window.clearInterval(timerId); timerId = null; }
  }

  function updateTimerDisplay() {
    var t = gameState.timeRemaining;
    text("[data-hud-timer]", "00:" + ("0" + t).slice(-2));
    var bonus = calculateSpeedBonus(t);
    text("[data-hud-speed]", bonus > 0 ? "+" + bonus : "No speed bonus");
    var challenge = $("[data-challenge]");
    if (challenge) challenge.classList.toggle("challenge--no-bonus", t === 0);

    // big time-remaining bar: drains from full to empty, turns red at ≤3s
    var round = currentRound();
    var fill = $("[data-progress-fill]");
    if (fill && round) {
      var pct = round.seconds > 0 ? Math.max(0, (t / round.seconds) * 100) : 0;
      fill.style.width = pct + "%";
      fill.classList.toggle("rprogress__fill--danger", t <= 3);
    }
  }

  /* ---- calculateSpeedBonus() --------------------------------------------
     Rounds now run anywhere from 15 to 30 seconds, so the bonus is based on
     the SHARE of the round's own clock left, not a fixed number of seconds —
     answering in the fastest quarter of a 30s round pays the same as
     answering in the fastest quarter of a 15s round.                        */
  function calculateSpeedBonus(secondsLeft) {
    var total = currentRound().seconds;
    var share = total > 0 ? secondsLeft / total : 0;
    if (share >= 0.75) return 100;
    if (share >= 0.5)  return 75;
    if (share >= 0.25) return 50;
    if (share > 0)     return 25;
    return 0;
  }


  /* ==========================================================================
     POWER-UPS  —  +5 SEC (streak ×3)  ·  REVEAL (streak ×6)
     ======================================================================== */

  function unlockPowerUps() {
    if (gameState.streak >= 3 && !powerUpsUnlocked.extraTime) {
      powerUpsUnlocked.extraTime = true;
      gameState.powerUps.extraTime += 1;
      announce("Power-up unlocked: plus 5 seconds.");
    }
    if (gameState.streak >= 6 && !powerUpsUnlocked.reveal) {
      powerUpsUnlocked.reveal = true;
      gameState.powerUps.reveal += 1;
      announce("Power-up unlocked: reveal a release year.");
    }
    renderPowerups();
  }

  function renderPowerups() {
    $all("[data-powerup]").forEach(function (btn) {
      var key = btn.getAttribute("data-powerup");
      var charges = gameState.powerUps[key];
      var countEl = $("[data-powerup-count]", btn);
      if (countEl) countEl.textContent = charges;
      btn.classList.toggle("powerup--ready", charges > 0);
      btn.disabled = answered || charges < 1;
    });
  }

  function useExtraTime() {
    if (answered || counting || gameState.powerUps.extraTime < 1) return;
    gameState.powerUps.extraTime -= 1;
    gameState.timeRemaining += 5;
    if (!timerId) startTimer();     // timer had hit zero — bring it back
    updateTimerDisplay();
    renderPowerups();
    announce("Added 5 seconds. " + gameState.timeRemaining + " seconds left.");
  }

  /* REVEAL: ORDER -> pick a card ; WHICH CAME FIRST + INSERT -> show the one
     hidden year that matters ; QUOTE / PIXEL SCENE -> remove one wrong
     answer ; ODD ONE OUT -> remove one item that isn't the impostor. */
  function useReveal() {
    if (answered || counting || gameState.powerUps.reveal < 1) return;
    var round = currentRound();

    if (round.type === "order") {
      revealing = true;
      $("[data-order-list]").classList.add("order-list--revealing");
      text("[data-challenge-help]", "Reveal: pick one card to show its release year.");
      announce("Pick a card to reveal its release year.");
    } else if (round.type === "which-first") {
      spendReveal(round.itemB.id);
    } else if (round.type === "insert") {
      spendReveal(round.card.id);
    } else if (round.type === "quote") {
      var wrongQuote = $all("[data-quote-opt]").filter(function (b) {
        return b.getAttribute("data-quote-title") !== round.quote.answer &&
               !b.classList.contains("quote-option--out");
      });
      if (wrongQuote.length) {
        gameState.powerUps.reveal -= 1;
        wrongQuote[0].classList.add("quote-option--out");
        wrongQuote[0].disabled = true;
        renderPowerups();
        announce("One wrong answer removed.");
      }
    } else if (round.type === "pixel-scene") {
      var wrongScene = $all("[data-scene-opt]").filter(function (b) {
        return b.getAttribute("data-scene-title") !== round.scene.answer &&
               !b.classList.contains("pixel-scene-opt--out");
      });
      if (wrongScene.length) {
        gameState.powerUps.reveal -= 1;
        wrongScene[0].classList.add("pixel-scene-opt--out");
        wrongScene[0].disabled = true;
        renderPowerups();
        announce("One wrong answer removed.");
      }
    } else if (round.type === "odd-one-out") {
      var notImpostor = $all("[data-ooo-card]").filter(function (b) {
        return b.getAttribute("data-ooo-card") !== round.set.answer &&
               !b.classList.contains("ooo-card--out");
      });
      if (notImpostor.length) {
        gameState.powerUps.reveal -= 1;
        notImpostor[0].classList.add("ooo-card--out");
        notImpostor[0].disabled = true;
        renderPowerups();
        announce("One item removed from consideration.");
      }
    }
  }

  /* click handler for a card while REVEAL is active (ORDER only) */
  function doReveal(card) {
    if (!revealing) return;
    revealing = false;
    $("[data-order-list]").classList.remove("order-list--revealing");
    text("[data-challenge-help]", "Drag the cards, or use Earlier / Later, to run oldest → newest  ·  Enter to submit");
    spendReveal(card.getAttribute("data-id"));
  }

  function spendReveal(id) {
    gameState.powerUps.reveal -= 1;
    revealedYearIds.push(id);
    var tag = $('[data-year-for="' + id + '"]');
    if (tag) { tag.hidden = false; tag.classList.add("year-tag--power"); }
    renderPowerups();
    var item = itemById(id);
    announce(item.title + " was released in " + item.year + ".");
  }


  /* ==========================================================================
     DOUBLE DOWN  ×2   (correct -> doubled, wrong -> 0 + streak reset)
     ======================================================================== */

  function toggleDoubleDown() {
    if (answered || counting) return;
    gameState.doubleDown = !gameState.doubleDown;
    var btn = $("[data-double-down]");
    btn.setAttribute("aria-pressed", String(gameState.doubleDown));
    btn.classList.toggle("btn--double-active", gameState.doubleDown);
    text("[data-dd-label]", gameState.doubleDown ? "Double Down active" : "Double Down ×2");
  }

  function resetDoubleDownButton() {
    var btn = $("[data-double-down]");
    if (!btn) return;
    btn.setAttribute("aria-pressed", "false");
    btn.classList.remove("btn--double-active");
    text("[data-dd-label]", "Double Down ×2");
  }


  /* ==========================================================================
     LOCK ANSWER  —  check, score, feed back  (all three challenge types)
     ======================================================================== */

  /* ---- calculateTimelineAccuracy() -----------------------------------------
     Timeline scoring is no longer all-or-nothing. Read the cards in their
     current order and check every PAIR of cards (not just neighbours) —
     for 3 cards, that's A-B, A-C, B-C, so 3 relationships total. Returns
     how many of those pairs are in the right oldest→newest order.          */
  function calculateTimelineAccuracy() {
    var cards = $all(".order-card", $("[data-order-list]"));
    var years = cards.map(function (card) { return itemById(card.getAttribute("data-id")).year; });
    var total = 0, correct = 0;
    for (var i = 0; i < years.length; i++) {
      for (var j = i + 1; j < years.length; j++) {
        total++;
        if (years[i] <= years[j]) correct++;
      }
    }
    return { correct: correct, total: total };
  }

  /* ---- calculatePartialTimelineScore() -------------------------------------
     3-card Timeline has exactly 3 relationships. Being one pair away from
     perfect should still feel like "almost", so credit is front-loaded
     toward a perfect order rather than a straight percentage.
     (4/5-card Timeline is Encore-only for now and doesn't use this table.) */
  var TIMELINE_SCORE_BY_CORRECT = { 3: 100, 2: 60, 1: 30, 0: 0 };
  function calculatePartialTimelineScore(accuracy) {
    if (accuracy.total === 3) return TIMELINE_SCORE_BY_CORRECT[accuracy.correct];
    return Math.round((accuracy.correct / accuracy.total) * 100);   // fallback for other sizes
  }

  /* run the right checker for the current round's type (ORDER uses partial
     accuracy instead — see calculateTimelineAccuracy()) */
  function checkAnswer(round) {
    if (round.type === "insert") return checkInsertAnswer();
    if (round.type === "quote") return checkQuoteAnswer();
    if (round.type === "which-first") return checkWhichCameFirst();
    if (round.type === "odd-one-out") return checkOddOneOutAnswer();
    if (round.type === "pixel-scene") return checkPixelSceneAnswer();
    return null;   // "order" is handled separately in lockAnswer()
  }

  /* ---- calculateRoundScore() -----------------------------------------------
     `basePoints` is 100 for a correct before-after/insert/quote, 0 for a
     wrong one, or the 100/60/30/0 partial-Timeline score. Double Down only
     multiplies the result AFTER that base (and any speed bonus) is set. */
  function calculateRoundScore(basePoints, speedBonus, doubleDown) {
    if (!basePoints) {
      return 0;
    }

    var score = basePoints + speedBonus;

    if (doubleDown) {
      score = score * 2;
    }

    return score;
  }

  function updateStreak(wasCorrect) {
    gameState.streak = wasCorrect ? gameState.streak + 1 : 0;
    if (gameState.streak > gameState.bestStreak) gameState.bestStreak = gameState.streak;
  }

  function updateHeat() {
    var s = gameState.streak;
    gameState.heat = s >= 7 ? "onfire" : s >= 5 ? "hot" : s >= 3 ? "warm" : "calm";
    document.body.classList.remove("heat-calm", "heat-warm", "heat-hot", "heat-onfire");
    document.body.classList.add("heat-" + gameState.heat);
  }

  function lockAnswer(force) {
    // `force` is true only when the timer runs out. A normal click needs a
    // valid choice first (canLock); a time-out locks in whatever is there.
    if (answered || counting) return;
    if (!force && !canLock()) return;
    answered = true;
    revealing = false;
    stopTimer();

    var round = currentRound();
    var speedBonus = calculateSpeedBonus(gameState.timeRemaining);

    // Timeline (order) rounds get partial credit; every other type is still
    // a plain right/wrong check. `isCorrect` always means "full credit" —
    // that's what keeps a streak alive and counts toward Personal Best —
    // a partial Timeline still scores points but doesn't extend the streak.
    var accuracy = null, basePoints, isCorrect;
    if (round.type === "order") {
      accuracy = calculateTimelineAccuracy();
      basePoints = calculatePartialTimelineScore(accuracy);
      isCorrect = accuracy.correct === accuracy.total;
    } else {
      isCorrect = checkAnswer(round);
      basePoints = isCorrect ? 100 : 0;
    }
    var roundScore = calculateRoundScore(basePoints, speedBonus, gameState.doubleDown);

    if (encoreState.active) {
      // Encore has its own tiny stat set — the Daily Run's score/stats
      // stay exactly as they were when Round 10 ended.
      encoreState.score += roundScore;
      encoreState.roundsPlayed += 1;
      if (isCorrect) {
        encoreState.tokensEarned += ENCORE_TOKENS_PER_CORRECT;
      } else {
        encoreState.lives -= 1;   // the only way a life is lost
      }
      if (encoreState.stage < 3 && encoreState.roundsPlayed % ENCORE_STAGE_EVERY === 0) {
        encoreState.stage += 1;
      }
    } else {
      gameState.score += roundScore;
      if (isCorrect) {
        gameState.correctCount += 1;
        if (gameState.doubleDown) gameState.doubleDownsWon += 1;
      }
      var resultState = "incorrect";
      if (round.type === "order") {
        resultState = accuracy.correct === accuracy.total ? "correct" : (accuracy.correct > 0 ? "partial" : "incorrect");
      } else if (isCorrect) {
        resultState = "correct";
      }
      gameState.roundResults.push({ type: round.type, state: resultState, wildcard: !!round.wildcard });

      var answerSeconds = round.seconds - gameState.timeRemaining;
      if (isCorrect && (gameState.fastestAnswer === null || answerSeconds < gameState.fastestAnswer)) {
        gameState.fastestAnswer = answerSeconds;
      }
    }
    updateStreak(isCorrect);
    updateHeat();
    unlockPowerUps();

    renderHud();
    showRoundFeedback(round, isCorrect, speedBonus, roundScore, basePoints, accuracy);
  }


  /* ==========================================================================
     FEEDBACK
     ======================================================================== */

  function showRoundFeedback(round, isCorrect, speedBonus, roundScore, basePoints, accuracy) {
    // lock the whole challenge body + reveal every year
    $all("[data-challenge-body] button").forEach(function (b) { b.disabled = true; });
    $all("[data-challenge-body] [draggable]").forEach(function (el) { el.setAttribute("draggable", "false"); });
    $all("[data-year-for]").forEach(function (el) { el.hidden = false; });
    $("[data-submit]").disabled = true;
    revealing = false;
    if ($("[data-order-list]")) $("[data-order-list]").classList.remove("order-list--revealing");
    renderPowerups();

    // type-specific marking
    var correctSequence;
    if (round.type === "order") correctSequence = revealOrder(round);
    else if (round.type === "insert") correctSequence = revealInsert(round);
    else if (round.type === "which-first") correctSequence = revealWhichCameFirst(round);
    else if (round.type === "odd-one-out") correctSequence = revealOddOneOut(round);
    else if (round.type === "pixel-scene") correctSequence = revealPixelScene(round);
    else correctSequence = revealQuote(round);

    // Timeline rounds have 3 states (correct / partial / incorrect); every
    // other type stays the original 2 (correct / incorrect).
    var state = "incorrect";
    if (round.type === "order") {
      state = accuracy.correct === accuracy.total ? "correct" : (accuracy.correct > 0 ? "partial" : "incorrect");
    } else if (isCorrect) {
      state = "correct";
    }

    // the shared archive verification pop-up
    var fb = $("[data-feedback]");
    fb.className = "feedback feedback--" + state;
    fb.hidden = false;

    // anything short of a clean pass gives the pop-up a brief VHS-tracking wobble
    if (state !== "correct") {
      var box = $(".feedback__box", fb);
      if (box) {
        box.classList.add("feedback__box--wrong");
        window.setTimeout(function () { box.classList.remove("feedback__box--wrong"); }, 500);
      }
    }

    var markByState = { correct: "✓", partial: "±", incorrect: "✕" };
    text("[data-feedback-mark]", markByState[state]);

    var titleText = round.type === "order"
      ? TIMELINE_FEEDBACK_TITLE[accuracy.correct]
      : (isCorrect ? FEEDBACK_TITLE[round.type] : FEEDBACK_TITLE_WRONG[round.type]);
    text("[data-feedback-title]", titleText);
    text("[data-feedback-stamp]", state === "correct" ? "Archive verified" : "Please rewind");

    // Timeline: "2 / 3 relationships correct". Odd One Out: explain WHY —
    // this is the "teach, don't just grade" moment the redesign asked for.
    var subtitle = $("[data-feedback-subtitle]");
    if (subtitle) {
      if (round.type === "order") {
        subtitle.hidden = false;
        subtitle.textContent = accuracy.correct + " / " + accuracy.total + " relationships correct";
      } else if (round.type === "odd-one-out") {
        subtitle.hidden = false;
        subtitle.textContent = itemById(round.set.answer).title + " is the impostor — " + round.set.prompt;
      } else {
        subtitle.hidden = true;
      }
    }

    var timeline = $("[data-feedback-timeline]");
    timeline.innerHTML = "";
    correctSequence.forEach(function (it) {
      var li = document.createElement("li");
      li.innerHTML = '<span>' + titleWithVersion(it) + '</span><strong>' + it.year + '</strong>';
      timeline.appendChild(li);
    });

    text("[data-bd-base]", "+" + basePoints);
    text("[data-bd-speed]", basePoints > 0 ? "+" + speedBonus : "+0");
    $("[data-bd-dd-row]").hidden = !gameState.doubleDown;
    text("[data-bd-total]", "+" + roundScore);

    text("[data-feedback-streak]", isCorrect ? "Streak ×" + gameState.streak : "Streak reset");
    text("[data-next]", gameState.round >= 10 ? "See results →" : "Next challenge →");

    var announceMsg;
    if (round.type === "order") {
      announceMsg = titleText + ". " + accuracy.correct + " of " + accuracy.total + " relationships correct. ";
    } else if (round.type === "odd-one-out") {
      announceMsg = (isCorrect ? "Correct. " : "Wrong. ") + subtitle.textContent + ". ";
    } else {
      announceMsg = isCorrect ? "Correct. " : "Out of order. ";
    }
    announce(announceMsg + "Round score " + roundScore + ". Streak " + gameState.streak + ".");

    // move focus into the pop-up so keyboard players land on "Next challenge"
    var next = $("[data-next]");
    if (next) next.focus();
  }

  /* "order" isn't here — Timeline always uses TIMELINE_FEEDBACK_TITLE below now. */
  var FEEDBACK_TITLE = {
    "insert": "Slotted in",
    "quote": "Nice catch",
    "which-first": "Called it",
    "odd-one-out": "Spotted it",
    "pixel-scene": "Good eye"
  };
  var FEEDBACK_TITLE_WRONG = {
    "insert": "Wrong slot",
    "quote": "Wrong tape",
    "which-first": "Wrong call",
    "odd-one-out": "Blended in",
    "pixel-scene": "Not quite"
  };

  /* Timeline feedback title, keyed by how many of the 3 relationships were
     correct — see calculateTimelineAccuracy(). */
  var TIMELINE_FEEDBACK_TITLE = {
    3: "Perfect order",
    2: "Almost there",
    1: "Partial match",
    0: "Out of order"
  };

  /* mark the quote options; return the correct title (with its year) for the strip */
  function revealQuote(round) {
    var q = round.quote;
    $all("[data-quote-opt]").forEach(function (btn) {
      var title = btn.getAttribute("data-quote-title");
      if (title === q.answer) btn.classList.add("quote-option--right");
      else if (title === quoteChoice) btn.classList.add("quote-option--wrong");
    });
    return [{ title: q.answer, year: q.year }];
  }

  /* mark each ORDER card ✓ / ✕ where it sits (no rearranging); return the
     correct oldest→newest sequence for the feedback strip */
  function revealOrder(round) {
    var sorted = round.items.slice().sort(function (a, b) { return a.year - b.year; });
    var cards = $all(".order-card", $("[data-order-list]"));
    cards.forEach(function (card, i) {
      card.classList.add("order-card--locked");
      var right = sorted[i] && sorted[i].id === card.getAttribute("data-id");
      card.classList.add(right ? "order-card--right" : "order-card--wrong");
      var mark = $("[data-card-mark]", card);
      if (mark) mark.textContent = right ? "✓" : "✕";
    });
    return sorted;
  }

  /* highlight the correct INSERT slot; return the full sorted timeline */
  function revealInsert(round) {
    $all("[data-slot]").forEach(function (btn) {
      var s = parseInt(btn.getAttribute("data-slot"), 10);
      if (s === round.correctSlot) { btn.classList.add("insert-slot--right"); btn.textContent = "✓"; }
      else if (s === insertChoice) { btn.classList.add("insert-slot--wrong"); btn.textContent = "✕"; }
    });
    var full = round.timeline.concat([round.card]).sort(function (a, b) { return a.year - b.year; });
    return full;
  }

  /* mark the earlier title (✓/right) and, if different, the player's own
     wrong pick (✕); return both titles in year order */
  function revealWhichCameFirst(round) {
    var earlier = round.itemA.year <= round.itemB.year ? round.itemA : round.itemB;
    var later   = round.itemA.year <= round.itemB.year ? round.itemB : round.itemA;
    $all("[data-wcf-card]").forEach(function (btn) {
      var id = btn.getAttribute("data-wcf-card");
      var mark = $("[data-wcf-mark]", btn);
      if (id === earlier.id) { btn.classList.add("wcf-card--right"); if (mark) mark.textContent = "✓"; }
      else if (id === wcfChoice) { btn.classList.add("wcf-card--wrong"); if (mark) mark.textContent = "✕"; }
    });
    return [earlier, later];
  }

  /* mark the impostor (✓/right — it WAS the correct thing to tap) and, if
     different, the player's own wrong pick (✕). No chronological order to
     show, so the explanation lives in the feedback subtitle instead. */
  function revealOddOneOut(round) {
    $all("[data-ooo-card]").forEach(function (btn) {
      var id = btn.getAttribute("data-ooo-card");
      var mark = $("[data-ooo-mark]", btn);
      if (id === round.set.answer) { btn.classList.add("ooo-card--right"); if (mark) mark.textContent = "✓"; }
      else if (id === oooChoice) { btn.classList.add("ooo-card--wrong"); if (mark) mark.textContent = "✕"; }
    });
    return [];
  }

  /* mark the correct Pixel Scene option, same pattern as QUOTE. No
     chronological row to show — this challenge is about recognition, not
     dates, so the highlighted option is the only reveal it needs. */
  function revealPixelScene(round) {
    var scene = round.scene;
    $all("[data-scene-opt]").forEach(function (btn) {
      var title = btn.getAttribute("data-scene-title");
      if (title === scene.answer) btn.classList.add("pixel-scene-opt--right");
      else if (title === pixelSceneChoice) btn.classList.add("pixel-scene-opt--wrong");
    });
    return [];
  }

  function goToNextRound() {
    if (encoreState.active) {
      if (encoreState.lives <= 0) { endEncoreMode(); return; }
      gameState.run = [generateEncoreRound()];
      gameState.round = 1;
      startRound();
      $("[data-challenge]").scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      return;
    }
    if (gameState.round >= 10) { endGame(); return; }
    gameState.round += 1;
    startRound();
    $("[data-challenge]").scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }


  /* ==========================================================================
     RESULTS
     ======================================================================== */

  /* Performance title from accuracy % (matches the shared prototype module). */
  function performanceTitle(correct, totalRounds) {
    var pct = totalRounds ? (correct / totalRounds) * 100 : 0;
    if (pct >= 91) return "Culture Archivist";
    if (pct >= 71) return "Screen Legend";
    if (pct >= 51) return "Movie Buff";
    if (pct >= 31) return "Casual Viewer";
    return "Extra";
  }

  function endGame() {
    stopTimer();
    if (countdownId) window.clearTimeout(countdownId);
    counting = false;
    $("[data-challenge]").hidden = true;
    $("[data-feedback]").hidden = true;
    $("[data-round-countdown]").hidden = true;
    var exit = $("[data-exit-row]");
    if (exit) exit.hidden = true;

    text("[data-results-score]", gameState.score.toLocaleString());
    text("[data-results-correct]", gameState.correctCount + " / 10");
    text("[data-results-streak]", "×" + gameState.bestStreak);
    text("[data-results-dd]", gameState.doubleDownsWon);
    text("[data-results-fastest]", gameState.fastestAnswer === null ? "—" : gameState.fastestAnswer + "s");
    text("[data-results-award]", performanceTitle(gameState.correctCount, 10));
    text("[data-artifact-score]", "SCORE " + gameState.score);

    // round-by-round breakdown — icon + text + colour, same convention as
    // every other correctness state in the game
    var breakdown = $("[data-results-breakdown]");
    if (breakdown) {
      var markByState = { correct: "✓", partial: "±", incorrect: "✕" };
      breakdown.innerHTML = gameState.roundResults.map(function (r, i) {
        return '<li class="results__breakdown-item results__breakdown-item--' + r.state + '"' +
          ' title="Round ' + (i + 1) + ' — ' + r.type + ': ' + r.state + '">' +
          '<span aria-hidden="true">' + markByState[r.state] + '</span>' +
          '<span class="sr-only">Round ' + (i + 1) + ', ' + r.type + ': ' + r.state + '</span>' +
        '</li>';
      }).join("");
    }

    var isNewBest = savePersonalBest({
      score: gameState.score,
      correct: gameState.correctCount,
      streak: gameState.bestStreak
    });
    var badge = $("[data-new-best]");
    if (badge) badge.hidden = !isNewBest;

    // Run Reward — Archive Tokens for completing today's tape
    var tokensEarned = calculateRunTokens(gameState.correctCount, isNewBest);
    var balance = addTokens(tokensEarned);
    text("[data-tokens-earned]", tokensEarned);
    text("[data-tokens-balance]", balance.toLocaleString());

    var mysteryBox = $("[data-mystery-tape]");
    if (mysteryBox) mysteryBox.hidden = !(balance >= MYSTERY_TAPE_COST && hasLockedCollectible());

    // in case a Mystery Tape was opened on THIS results screen already
    // (re-entering endGame() never happens in practice, but keep it tidy)
    var unlockedBox = $("[data-results-unlocked]");
    if (unlockedBox) unlockedBox.hidden = true;

    var results = $("[data-results]");
    results.hidden = false;
    results.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    announce("Daily run complete. " + gameState.score + " points, " +
      gameState.correctCount + " of 10 correct. Earned " + tokensEarned + " Archive Tokens.");
  }

  /* "Open Tape ->" on the Results screen — spend a Mystery Tape, show what
     it revealed, refresh the balance/prompt for next time. */
  function handleOpenMysteryTape() {
    var revealed = openMysteryTape();
    if (!revealed) return;

    text("[data-tokens-balance]", loadTokens().toLocaleString());
    var mysteryBox = $("[data-mystery-tape]");
    if (mysteryBox) mysteryBox.hidden = !(loadTokens() >= MYSTERY_TAPE_COST && hasLockedCollectible());

    var unlockedBox = $("[data-results-unlocked]");
    if (unlockedBox) {
      unlockedBox.hidden = false;
      var itemsEl = $("[data-results-unlocked-items]");
      if (itemsEl) {
        itemsEl.innerHTML =
          '<div class="unlocked-item">' +
            '<img class="unlocked-item__img" src="' + revealed.image + '" alt="">' +
            '<span class="unlocked-item__name">' + revealed.name + '</span>' +
          '</div>';
      }
      unlockedBox.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
    }
    announce("Mystery Tape opened — new in My Archive: " + revealed.name + ".");
  }


  /* ==========================================================================
     ENCORE MODE  —  optional bonus play after the Daily Run, 3 lives
     Not date-seeded or comparable like the Daily Run — every Encore round
     is picked fresh, so replaying Encore never looks the same twice. It
     reuses the Daily Run's mechanics, scoring, and power-ups wholesale;
     only the round SOURCE and the win/lose condition are different.
     ======================================================================== */

  /* like takeItemsDistinctYears() in generateDailyRun(), but self-contained
     (no shared pool cursor) since Encore doesn't care about exhausting a
     pool across many rounds — a fresh shuffle each call is enough. */
  function randomItemsDistinctYears(pool, n, rng) {
    var shuffled = shuffleArr(pool, rng);
    var out = [], usedYears = {};
    for (var i = 0; i < shuffled.length && out.length < n; i++) {
      if (usedYears[shuffled[i].year]) continue;
      usedYears[shuffled[i].year] = true;
      out.push(shuffled[i]);
    }
    return out;
  }

  /* how many Timeline cards the current Encore stage uses — gradual, per
     the redesign brief ("do not use 5-card Timeline immediately") */
  function encoreCardCount() {
    if (encoreState.stage >= 3) return 5;
    if (encoreState.stage === 2) return 4;
    return 3;
  }

  /* Build one Encore round: same theme as today, a random challenge type
     (Insert joins the mix at stage 3 — it's otherwise Daily-Run-only-
     reachable through Encore, per the redesign brief), fresh content each
     time. Timer table matches section 12 of the redesign brief exactly. */
  function generateEncoreRound() {
    var themeId = getDailyTheme(runDate).id;
    var seed = ((Date.now() % 2147483647) ^ ((encoreState.roundsPlayed + 1) * 2654435761)) | 0;
    var rng = mulberry32(seed);

    var pool = getThemeChallengePool(themeId);
    var qPool = QUOTE_CHALLENGES.filter(function (q) { return q.themes.indexOf(themeId) !== -1; });
    var oooPool = ODD_ONE_OUT.filter(function (s) { return s.themes.indexOf(themeId) !== -1; });
    var scenePool = PIXEL_SCENES.filter(function (s) { return s.themes.indexOf(themeId) !== -1; });

    var types = ["order", "quote", "which-first"];
    if (oooPool.length) types.push("odd-one-out");
    if (scenePool.length) types.push("pixel-scene");
    if (encoreState.stage >= 3) types.push("insert");
    var type = types[Math.floor(rng() * types.length)];

    var cards = encoreCardCount();
    var extra;

    if (type === "quote") {
      extra = { type: "quote", quote: shuffleArr(qPool, rng)[0] || QUOTE_CHALLENGES[0], seconds: 15 };
    } else if (type === "which-first") {
      var pair = pickWidestGapPair(randomItemsDistinctYears(pool, 3, rng), rng);
      extra = { type: "which-first", itemA: pair[0], itemB: pair[1], seconds: 15 };
    } else if (type === "odd-one-out") {
      var set = shuffleArr(oooPool, rng)[0];
      extra = { type: "odd-one-out", set: set, items: shuffleArr(set.items.map(itemById), rng), seconds: 18 };
    } else if (type === "pixel-scene") {
      extra = { type: "pixel-scene", scene: shuffleArr(scenePool, rng)[0], seconds: 18 };
    } else if (type === "insert") {
      var lineSet = randomItemsDistinctYears(pool, cards + 1, rng).sort(function (a, b) { return a.year - b.year; });
      var k = 1 + Math.floor(rng() * Math.max(1, lineSet.length - 2));
      var card = lineSet[k];
      var timeline = lineSet.filter(function (it) { return it !== card; });
      extra = {
        type: "insert", timeline: timeline, card: card,
        correctSlot: timeline.filter(function (it) { return it.year < card.year; }).length,
        seconds: 25
      };
    } else {
      extra = {
        type: "order", items: presentOrder(randomItemsDistinctYears(pool, cards, rng)),
        seconds: cards === 5 ? 45 : (cards === 4 ? 35 : 25)
      };
    }

    extra.theme = themeId;
    extra.wildcard = false;
    return extra;
  }

  function startEncoreMode() {
    encoreState.active = true;
    encoreState.lives = ENCORE_LIVES;
    encoreState.score = 0;
    encoreState.tokensEarned = 0;
    encoreState.stage = 1;
    encoreState.roundsPlayed = 0;

    $("[data-results]").hidden = true;
    var exit = $("[data-exit-row]");
    if (exit) exit.hidden = false;

    gameState.run = [generateEncoreRound()];
    gameState.round = 1;
    startRound();
    $("[data-challenge]").scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }

  function endEncoreMode() {
    stopTimer();
    if (countdownId) window.clearTimeout(countdownId);
    counting = false;
    encoreState.active = false;

    $("[data-challenge]").hidden = true;
    $("[data-feedback]").hidden = true;
    $("[data-round-countdown]").hidden = true;
    var exit = $("[data-exit-row]");
    if (exit) exit.hidden = true;

    var balance = addTokens(encoreState.tokensEarned);   // Encore's own small token trickle — same one currency
    text("[data-encore-score]", encoreState.score.toLocaleString());
    text("[data-encore-rounds]", String(encoreState.roundsPlayed));
    text("[data-encore-tokens]", "+" + encoreState.tokensEarned);
    text("[data-encore-balance]", balance.toLocaleString());

    var panel = $("[data-encore-results]");
    panel.hidden = false;
    panel.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    announce("Encore over. " + encoreState.score + " points across " + encoreState.roundsPlayed + " rounds.");
  }

  function copyScore() {
    var summary = "OUT OF ORDER\nDaily Run\n\n" +
      gameState.score + " pts\n" +
      gameState.correctCount + "/10 correct\n" +
      "Best streak ×" + gameState.bestStreak + "\n\nCan you beat it?";
    var done = function () { var c = $("[data-copied]"); if (c) c.hidden = false; };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary).then(done, function () { fallbackCopy(summary, done); });
    } else {
      fallbackCopy(summary, done);
    }
  }

  function fallbackCopy(str, done) {
    var ta = document.createElement("textarea");
    ta.value = str;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }


  /* ==========================================================================
     WIRING  —  connect the fixed buttons once
     ======================================================================== */
  function wireGameControls() {
    on("[data-submit]", "click", function () { lockAnswer(false); });
    on("[data-next]", "click", goToNextRound);

    // the feedback pop-up: Escape also advances to the next challenge
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("[data-feedback]").hidden) {
        e.preventDefault();
        goToNextRound();
      }
    });

    // keyboard shortcut: number keys 1-9 pick an option/card/gap for every
    // "pick one" challenge type. ORDER (Timeline) is reordered with the
    // arrow keys instead (see buildCard's own keydown handler).
    document.addEventListener("keydown", function (e) {
      if (answered || counting) return;

      // Enter submits once the Submit Answer button has focus (it's
      // auto-focused right after a choice is made — see setWcfChoice() etc.
      // below). Written as a direct call rather than relying on the
      // browser's own "Enter activates the focused button" behavior, so it
      // works the same way as ORDER's own Enter handling in buildCard().
      if (e.key === "Enter") {
        if (document.activeElement === $("[data-submit]") && canLock()) {
          e.preventDefault();
          lockAnswer(false);
        }
        return;
      }

      if (e.key.length !== 1 || e.key < "1" || e.key > "9") return;
      var n = parseInt(e.key, 10);
      var t = currentRound().type;
      if (t === "quote") { e.preventDefault(); quoteKey(n); }
      else if (t === "pixel-scene") { e.preventDefault(); sceneKey(n); }
      else if (t === "which-first") { e.preventDefault(); wcfKey(n); }
      else if (t === "odd-one-out") { e.preventDefault(); oooKey(n); }
      else if (t === "insert") { e.preventDefault(); insertKey(n); }
    });
    on("[data-double-down]", "click", toggleDoubleDown);
    on("[data-copy-score]", "click", copyScore);
    on("[data-open-tape]", "click", handleOpenMysteryTape);
    on("[data-start-encore]", "click", startEncoreMode);

    $all("[data-powerup]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("data-powerup") === "extraTime") useExtraTime();
        else useReveal();
      });
    });
  }

  function on(selector, event, handler) {
    var el = $(selector);
    if (el) el.addEventListener(event, handler);
  }


  /* ==========================================================================
     NAV  —  hamburger toggle for the shared nav (mobile only; the CSS keeps
     the links always visible above the mobile breakpoint, so this is a
     no-op on desktop no matter its state).
     ======================================================================== */
  function wireNav() {
    var toggle = $("[data-nav-toggle]");
    var links = $("[data-nav-links]");
    if (!toggle || !links) return;

    function closeMenu() {
      links.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
    }

    toggle.addEventListener("click", function () {
      var opening = links.hidden;
      links.hidden = !opening;
      toggle.setAttribute("aria-expanded", String(opening));
      toggle.textContent = opening ? "✕" : "☰";
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !links.hidden) { closeMenu(); toggle.focus(); }
    });
  }


  /* ==========================================================================
     INIT
     ======================================================================== */
  function initGame() {
    wireNav();

    var today = new Date();
    var theme = getDailyTheme(today);

    if (document.body.classList.contains("page-home")) {
      renderShelf(today);        // build the shelf first...
      renderSpotlight();
      renderPersonalBest();
      renderCollectionGrid();
      renderBetaThemeSwitcher(today);   // no-op unless ?beta=true
    }

    applyTheme(theme, today);     // ...then apply the theme so it can mark the active spine

    if (document.body.classList.contains("page-game")) {
      runDate = today;
      gameState.run = generateDailyRun(today);
      gameState.round = 1;
      wireGameControls();
      startRound();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGame);
  } else {
    initGame();
  }

})();
