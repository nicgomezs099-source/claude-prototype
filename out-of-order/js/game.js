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
     MECHANICS     order / before-after / insert (Stage 2-3)
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
  var THEMES = [
    {
      id: "horror", name: "Horror", bodyClass: "theme-horror",
      initial: "H", icon: "horror", tapeCode: "E-180",
      motifs: "Do you want to play a game?",
      hint: "Saw",
      hero: "assets/images/themes/horror.jpg"
    },
    {
      id: "sci-fi", name: "Sci-Fi", bodyClass: "theme-sci-fi",
      initial: "S", icon: "scifi", tapeCode: "T-120",
      motifs: "Starships · Aliens · Distant Worlds",
      hint: "Star Wars",
      hero: "assets/images/themes/sci-fi.jpg"
    }
  ];


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

     `themes`  : which Daily Themes this title belongs to (a title can be in
                 several).  [] = "archive wildcard" — appears on any day.
     `image`   : card artwork is looked up by id at
                 assets/images/cards/<id>.png  (see cardArtSrc()).
                 Drop a file there and it replaces the CSS fallback.
     `focus`   : optional object-position for cropping to the card window.
     ======================================================================== */
  var CONTENT_ITEMS = [
    // ---- general / archive wildcards (themes: []) ----
    { id: "the-simpsons",         title: "The Simpsons",              type: "Series", year: 1989, category: "Animation", themes: [] },
    { id: "seinfeld",             title: "Seinfeld",                  type: "Series", year: 1989, category: "Sitcom",    themes: [] },
    { id: "the-lion-king",        title: "The Lion King",             type: "Movie",  year: 1994, category: "Animation", themes: [], focus: "28% center" },
    { id: "forrest-gump",         title: "Forrest Gump",              type: "Movie",  year: 1994, category: "Drama",     themes: [] },
    { id: "friends",              title: "Friends",                   type: "Series", year: 1994, category: "Sitcom",    themes: [] },
    { id: "toy-story",            title: "Toy Story",                 type: "Movie",  year: 1995, category: "Animation", themes: [] },
    { id: "titanic",              title: "Titanic",                   type: "Movie",  year: 1997, category: "Drama",     themes: [] },
    { id: "the-sopranos",         title: "The Sopranos",              type: "Series", year: 1999, category: "Drama",     themes: [] },
    { id: "gladiator",            title: "Gladiator",                 type: "Movie",  year: 2000, category: "Action",    themes: [] },
    { id: "shrek",                title: "Shrek",                     type: "Movie",  year: 2001, category: "Animation", themes: [], focus: "center 34%" },
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
    run: []                  // the 10 generated rounds
  };

  // once a power-up has been unlocked it stays available (a later streak reset
  // does not take the charge away) — this just stops it being granted twice.
  var powerUpsUnlocked = { extraTime: false, reveal: false };

  var timerId = null;        // setInterval handle for the soft timer
  var countdownId = null;    // setTimeout handle for the 3-2-1 intro
  var answered = false;      // has the current round been locked in?
  var counting = false;      // is the 3-2-1 intro running?
  var revealing = false;     // is the player picking a card for REVEAL?
  var runDate = null;        // the Date this run was generated for

  // per-round answer state (reset in startRound)
  var baChoice = null;       // "before" | "after"  (BEFORE/AFTER rounds)
  var insertChoice = null;   // slot index          (INSERT rounds)
  var quoteChoice = null;    // chosen title        (QUOTE rounds)
  var revealedYearIds = [];  // ids whose year the REVEAL power-up has shown


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

  /* Pick today's theme deterministically.
     A "?theme=<id>" URL parameter can force any edition — handy for previewing
     and for the class demo. Without it, the theme is chosen by the date. */
  function getDailyTheme(date) {
    var forced = new URLSearchParams(window.location.search).get("theme");
    if (forced) {
      for (var i = 0; i < THEMES.length; i++) {
        if (THEMES[i].id === forced) return THEMES[i];
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
    $all("[data-theme-hint]").forEach(function (el) { el.textContent = theme.hint; });
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

    // reflect the active edition on the shelf switch buttons
    $all("[data-theme-switch]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-theme-switch") === theme.id));
    });
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
     One spine per category. A category that has a matching theme (Horror,
     Sci-Fi) is rendered as a <button> that switches the page to that edition;
     the rest are plain decorative tapes.
     ======================================================================== */
  function renderShelf(date) {
    var shelf = $("[data-shelf]");
    if (!shelf) return;

    CATEGORIES.forEach(function (cat) {
      var theme = themeForCategory(cat.name);
      var spine = document.createElement(theme ? "button" : "div");

      spine.className = "spine" + (cat.ink ? " spine--ink" : "") + (theme ? " spine--switch" : "");
      spine.style.setProperty("--spine-color", cat.color);
      spine.innerHTML =
        '<span class="spine__icon" aria-hidden="true">' + (ICONS[cat.icon] || ICONS.film) + '</span>' +
        '<span class="spine__title">' + cat.name + '</span>' +
        '<span class="spine__tag">VHS</span>';

      if (theme) {
        spine.type = "button";
        spine.setAttribute("data-theme-switch", theme.id);
        spine.setAttribute("aria-pressed", "false");
        spine.setAttribute("aria-label", "Switch to the " + cat.name + " edition");
        spine.addEventListener("click", function () { applyTheme(theme, date); });
      }

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
     4 ORDER · 2 BEFORE/AFTER · 2 INSERT · 2 QUOTE  (chronological stays 8/10). */
  var ROUND_PLAN = [
    { type: "order",        seconds: 12, cards: 3 },
    { type: "order",        seconds: 13, cards: 3 },
    { type: "quote",        seconds: 12 },
    { type: "before-after", seconds: 11 },
    { type: "insert",       seconds: 12, line: 3 },
    { type: "order",        seconds: 11, cards: 4 },
    { type: "quote",        seconds: 11 },
    { type: "insert",       seconds: 10, line: 4 },
    { type: "order",        seconds: 10, cards: 5 },
    { type: "before-after", seconds: 9 }
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

  /* pick two titles for a BEFORE/AFTER round: the pair with the widest year
     gap from a small batch, so the comparison is answerable (no ties). */
  function pickBeforeAfterPair(batch, rng) {
    var best = [batch[0], batch[1]];
    var bestGap = -1;
    for (var a = 0; a < batch.length; a++) {
      for (var b = a + 1; b < batch.length; b++) {
        var g = Math.abs(batch[a].year - batch[b].year);
        if (g > bestGap) { bestGap = g; best = [batch[a], batch[b]]; }
      }
    }
    return rng() < 0.5 ? best : [best[1], best[0]];   // randomise reference / comparison
  }

  /* ---- Daily Theme content ------------------------------------------------
     getThemeChallengePool() = every title tagged with the theme.
     A "wildcard" round pulls from titles OUTSIDE the theme instead — the
     70 / 30 mix (7 themed rounds, 3 wildcards) keeps the theme meaningful
     without punishing a player who is weak in one genre.                     */
  function getThemeChallengePool(themeId) {
    return CONTENT_ITEMS.filter(function (it) { return it.themes.indexOf(themeId) !== -1; });
  }

  /* pick 3 round numbers (from rounds 2-10) to be "archive wildcards" */
  function selectWildcardRounds(rng) {
    var picks = shuffleArr([2, 3, 4, 5, 6, 7, 8, 9, 10], rng).slice(0, 3);
    var map = {};
    picks.forEach(function (n) { map[n] = true; });
    return map;
  }

  /* ---- generateDailyRun() ----------------------------------------------
     Same round SHAPE for everyone every day; the DATE seeds which titles
     fill each round and which 3 rounds are wildcards.                        */
  function generateDailyRun(date) {
    var rng = mulberry32(dayNumber(date) * 2654435761);
    var themeId = getDailyTheme(date).id;
    var wildRounds = selectWildcardRounds(rng);

    // two pools that never overlap: themed titles vs everything else
    var themedItems = shuffleArr(getThemeChallengePool(themeId), rng);
    var otherItems  = shuffleArr(CONTENT_ITEMS.filter(function (it) { return it.themes.indexOf(themeId) === -1; }), rng);
    var themedQ     = shuffleArr(QUOTE_CHALLENGES.filter(function (q) { return q.themes.indexOf(themeId) !== -1; }), rng);
    var otherQ      = shuffleArr(QUOTE_CHALLENGES.filter(function (q) { return q.themes.indexOf(themeId) === -1; }), rng);
    var ti = 0, oi = 0, tq = 0, oq = 0;

    function nextItem(wild) {
      if (wild) return oi < otherItems.length ? otherItems[oi++] : themedItems[ti++];
      return ti < themedItems.length ? themedItems[ti++] : otherItems[oi++];
    }
    function takeItems(n, wild) {
      var out = [];
      for (var i = 0; i < n; i++) { var it = nextItem(wild); if (it) out.push(it); }
      return out;
    }
    function nextQuote(wild) {
      if (wild) return oq < otherQ.length ? otherQ[oq++] : themedQ[tq++];
      return tq < themedQ.length ? themedQ[tq++] : otherQ[oq++];
    }

    var rounds = ROUND_PLAN.map(function (plan, idx) {
      var wild = !!wildRounds[idx + 1];
      var extra;

      if (plan.type === "quote") {
        extra = { type: "quote", quote: nextQuote(wild) || QUOTE_CHALLENGES[0] };
      } else if (plan.type === "before-after") {
        var pair = pickBeforeAfterPair(takeItems(3, wild), rng);
        extra = { type: "before-after", reference: pair[0], comparison: pair[1] };
      } else if (plan.type === "insert") {
        var set = takeItems(plan.line + 1, wild).slice().sort(function (a, b) { return a.year - b.year; });
        var k = 1 + Math.floor(rng() * Math.max(1, set.length - 2));
        var card = set[k];
        var line = set.filter(function (it) { return it !== card; });
        extra = {
          type: "insert", timeline: line, card: card,
          correctSlot: line.filter(function (it) { return it.year < card.year; }).length
        };
      } else {
        extra = { type: "order", items: presentOrder(takeItems(plan.cards, wild)) };
      }

      extra.seconds = plan.seconds;
      extra.wildcard = wild;
      extra.theme = themeId;
      return extra;
    });

    // Round 1 = the ORDER teaching round (always on-theme, never a wildcard)
    var teaching = [itemById("the-lion-king"), itemById("shrek"), itemById("stranger-things")];
    if (teaching[0] && teaching[1] && teaching[2]) {
      rounds[0].items = presentOrder(teaching);
      rounds[0].wildcard = false;
    }

    return rounds;
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
    $("[data-challenge]").classList.remove("challenge--no-bonus", "challenge--wrong");

    renderHud();
    renderChallenge(round);
    renderPowerups();
    resetDoubleDownButton();

    // a short "get ready" count, then the soft timer starts
    runCountdown(startTimer);
  }

  /* ---- 3-2-1 intro ------------------------------------------------------
     Freezes interaction, counts 3 -> 2 -> 1 in the panel, then runs `done`. */
  function runCountdown(done) {
    if (countdownId) window.clearTimeout(countdownId);
    counting = true;
    var challenge = $("[data-challenge]");
    var el = $("[data-countdown]");
    challenge.classList.add("challenge--counting");
    setChallengeControls(true);        // disable Lock / power-ups / Double Down

    var sequence = ["3", "2", "1", "Go"];
    var i = 0;
    var step = prefersReducedMotion() ? 300 : 600;

    function tick() {
      if (i < sequence.length) {
        el.textContent = sequence[i];
        el.classList.remove("challenge__countdown--pop");
        void el.offsetWidth;             // restart the pop animation
        el.classList.add("challenge__countdown--pop");
        announce(sequence[i]);
        i += 1;
        countdownId = window.setTimeout(tick, step);
      } else {
        counting = false;
        challenge.classList.remove("challenge--counting");
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
    if (round.type === "before-after") return baChoice !== null;
    if (round.type === "insert") return insertChoice !== null;
    if (round.type === "quote") return quoteChoice !== null;
    return true;
  }

  function currentRound() { return gameState.run[gameState.round - 1]; }

  function renderChallenge(round) {
    var body = $("[data-challenge-body]");
    body.innerHTML = "";
    body.className = "challenge__body challenge__body--" + round.type;

    baChoice = null;
    insertChoice = null;
    quoteChoice = null;
    revealedYearIds = [];

    var nn = ("0" + gameState.round).slice(-2);
    var tag = (round.type === "quote" ? "Quote Archive" : "Today's Archive") + " · Round " + nn;
    if (round.wildcard) tag += "  ·  Archive Wildcard";
    text("[data-challenge-tag]", tag);

    if (round.type === "order") renderOrder(round, body);
    else if (round.type === "before-after") renderBeforeAfter(round, body);
    else if (round.type === "insert") renderInsert(round, body);
    else if (round.type === "quote") renderQuote(round, body);
  }

  function renderHud() {
    text("[data-hud-round]", ("0" + gameState.round).slice(-2) + " / 10");
    text("[data-hud-score]", gameState.score.toLocaleString());
    text("[data-hud-streak]", "×" + gameState.streak);
    text("[data-hud-heat]", HEAT_LABEL[gameState.heat]);
    var fill = $("[data-progress-fill]");
    if (fill) fill.style.width = (gameState.round / 10 * 100) + "%";
    updateTimerDisplay();
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
    text("[data-submit]", "Lock order ✓");
    text("[data-challenge-count]", round.items.length + " Cards");
    text("[data-challenge-help]", "Drag the cards, or use Earlier / Later, to run oldest → newest.");

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
      '<p class="order-card__title">' + item.title + '</p>' +
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
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); moveCard(li, "earlier"); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); moveCard(li, "later"); }
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
     MECHANIC 02  —  BEFORE / AFTER
     "Did the comparison title come BEFORE or AFTER the reference title?"
     ======================================================================== */

  function renderBeforeAfter(round, body) {
    text("[data-challenge-instruction]", "Before or After?");
    text("[data-submit]", "Lock answer ✓");
    text("[data-challenge-count]", "2 Titles");
    text("[data-challenge-help]",
      "Did " + round.comparison.title + " come before or after " +
      round.reference.title + "?  ·  ← / → keys");

    body.innerHTML =
      '<div class="ba__row">' +
        baCard(round.reference, "Reference", false) +
        '<div class="ba__vs"><span class="meta">Did it come…</span>' +
          '<span class="ba__q" aria-hidden="true">?</span></div>' +
        baCard(round.comparison, "Comparison", true) +
      '</div>' +
      '<div class="ba__choices">' +
        '<button type="button" class="ba__btn" data-ba="before" aria-pressed="false">' +
          '<span aria-hidden="true">←</span> Before</button>' +
        '<button type="button" class="ba__btn" data-ba="after" aria-pressed="false">' +
          'After <span aria-hidden="true">→</span></button>' +
      '</div>';

    loadPosterImage($('[data-ba-card="' + round.reference.id + '"] .poster', body), cardArtSrc(round.reference), round.reference.focus);
    loadPosterImage($('[data-ba-card="' + round.comparison.id + '"] .poster', body), cardArtSrc(round.comparison), round.comparison.focus);

    $all("[data-ba]", body).forEach(function (btn) {
      btn.addEventListener("click", function () { setBaChoice(btn.getAttribute("data-ba")); });
    });

    $("[data-submit]").disabled = true;   // enabled once a choice is made
  }

  function baCard(item, tag, highlight) {
    return '<div class="ba-card' + (highlight ? " ba-card--hi" : "") + '" data-ba-card="' + item.id + '"' +
             ' style="--card-color:' + genreColor(item.category) + '">' +
             '<span class="meta ba-card__tag">' + tag + '</span>' +
             '<div class="ba-card__art poster" data-card-art>' + posterInner(item) + '</div>' +
             '<p class="ba-card__title">' + item.title + '</p>' +
             '<p class="meta ba-card__cat">' + item.category + '</p>' +
             yearTag(item) +
           '</div>';
  }

  function setBaChoice(choice) {
    if (answered || counting) return;
    baChoice = choice;
    $all("[data-ba]").forEach(function (btn) {
      var on = btn.getAttribute("data-ba") === choice;
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("ba__btn--on", on);
    });
    $("[data-submit]").disabled = false;
    announce(choice === "before" ? "Before selected." : "After selected.");
  }

  function checkBeforeAfterAnswer() {
    var round = currentRound();
    if (!baChoice) return false;
    var want = round.comparison.year < round.reference.year ? "before" : "after";
    return baChoice === want;
  }


  /* ==========================================================================
     MECHANIC 03  —  INSERT
     Drop the loose card into the correct gap of an ordered timeline.
     ======================================================================== */

  function renderInsert(round, body) {
    text("[data-challenge-instruction]", "Where Does It Fit?");
    text("[data-submit]", "Lock answer ✓");
    text("[data-challenge-count]", "Timeline");
    text("[data-challenge-help]",
      "Tap a gap to drop " + round.card.title + " into the timeline  ·  oldest → newest");

    var html =
      '<div class="insert-card">' +
        '<span class="meta">Place this card</span>' +
        '<div class="insert-card__body">' +
          '<div class="insert-card__art poster" data-card-art style="--card-color:' + genreColor(round.card.category) + '">' +
            posterInner(round.card) + '</div>' +
          '<div class="insert-card__info">' +
            '<p class="insert-card__title">' + round.card.title + '</p>' +
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
            '<p class="insert-item__title">' + it.title + '</p>' +
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
    announce("Gap " + (slot + 1) + " selected.");
  }

  function checkInsertAnswer() {
    return insertChoice === currentRound().correctSlot;
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
    text("[data-submit]", "Lock answer ✓");
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
     TIMER  (soft — running out only costs the Speed Bonus)
     ======================================================================== */

  function startTimer() {
    stopTimer();
    updateTimerDisplay();
    timerId = window.setInterval(function () {
      if (gameState.timeRemaining > 0) {
        gameState.timeRemaining--;
        updateTimerDisplay();
      } else {
        stopTimer();   // 0 reached — no bonus, but the round does NOT end
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
    text("[data-hud-speed]", bonus > 0 ? "+" + bonus : "No bonus");
    var challenge = $("[data-challenge]");
    if (challenge) challenge.classList.toggle("challenge--no-bonus", t === 0);
  }

  /* ---- calculateSpeedBonus() -------------------------------------------- */
  function calculateSpeedBonus(secondsLeft) {
    if (secondsLeft >= 12) return 100;
    if (secondsLeft >= 8)  return 75;
    if (secondsLeft >= 4)  return 50;
    if (secondsLeft >= 1)  return 25;
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

  /* REVEAL: ORDER -> pick a card ; BEFORE/AFTER + INSERT -> show the one
     hidden year that matters ; QUOTE -> remove one wrong answer. */
  function useReveal() {
    if (answered || counting || gameState.powerUps.reveal < 1) return;
    var round = currentRound();

    if (round.type === "order") {
      revealing = true;
      $("[data-order-list]").classList.add("order-list--revealing");
      text("[data-challenge-help]", "Reveal: pick one card to show its release year.");
      announce("Pick a card to reveal its release year.");
    } else if (round.type === "before-after") {
      spendReveal(round.comparison.id);
    } else if (round.type === "insert") {
      spendReveal(round.card.id);
    } else if (round.type === "quote") {
      var wrong = $all("[data-quote-opt]").filter(function (b) {
        return b.getAttribute("data-quote-title") !== round.quote.answer &&
               !b.classList.contains("quote-option--out");
      });
      if (wrong.length) {
        gameState.powerUps.reveal -= 1;
        wrong[0].classList.add("quote-option--out");
        wrong[0].disabled = true;
        renderPowerups();
        announce("One wrong answer removed.");
      }
    }
  }

  /* click handler for a card while REVEAL is active (ORDER only) */
  function doReveal(card) {
    if (!revealing) return;
    revealing = false;
    $("[data-order-list]").classList.remove("order-list--revealing");
    text("[data-challenge-help]", "Drag the cards, or use Earlier / Later, to run oldest → newest.");
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

  /* ---- checkOrderAnswer() --------------------------------------------------
     Read the cards top-to-bottom / left-to-right and confirm the release
     years never go backwards.                                              */
  function checkOrderAnswer() {
    var cards = $all(".order-card", $("[data-order-list]"));
    var years = cards.map(function (card) {
      return itemById(card.getAttribute("data-id")).year;
    });
    for (var i = 1; i < years.length; i++) {
      if (years[i] < years[i - 1]) return false;
    }
    return true;
  }

  /* run the right checker for the current round's type */
  function checkAnswer(round) {
    if (round.type === "before-after") return checkBeforeAfterAnswer();
    if (round.type === "insert") return checkInsertAnswer();
    if (round.type === "quote") return checkQuoteAnswer();
    return checkOrderAnswer();
  }

  /* ---- calculateRoundScore() --------------------------------------------- */
  function calculateRoundScore(isCorrect, speedBonus, doubleDown) {
    if (!isCorrect) {
      return 0;
    }

    var score = 100 + speedBonus;

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

  function lockAnswer() {
    if (answered || counting || !canLock()) return;
    answered = true;
    revealing = false;
    stopTimer();

    var round = currentRound();
    var speedBonus = calculateSpeedBonus(gameState.timeRemaining);
    var isCorrect = checkAnswer(round);
    var roundScore = calculateRoundScore(isCorrect, speedBonus, gameState.doubleDown);

    gameState.score += roundScore;
    if (isCorrect) {
      gameState.correctCount += 1;
      if (gameState.doubleDown) gameState.doubleDownsWon += 1;
    }
    updateStreak(isCorrect);
    updateHeat();
    unlockPowerUps();

    var answerSeconds = round.seconds - gameState.timeRemaining;
    if (isCorrect && (gameState.fastestAnswer === null || answerSeconds < gameState.fastestAnswer)) {
      gameState.fastestAnswer = answerSeconds;
    }

    renderHud();
    showRoundFeedback(round, isCorrect, speedBonus, roundScore);
  }


  /* ==========================================================================
     FEEDBACK
     ======================================================================== */

  function showRoundFeedback(round, isCorrect, speedBonus, roundScore) {
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
    else if (round.type === "before-after") correctSequence = revealBeforeAfter(round);
    else if (round.type === "insert") correctSequence = revealInsert(round);
    else correctSequence = revealQuote(round);

    // a wrong answer gets a brief VHS-tracking wobble
    if (!isCorrect) {
      var challenge = $("[data-challenge]");
      challenge.classList.add("challenge--wrong");
      window.setTimeout(function () { challenge.classList.remove("challenge--wrong"); }, 500);
    }

    // the shared archive verification strip
    var fb = $("[data-feedback]");
    fb.className = "feedback " + (isCorrect ? "feedback--correct" : "feedback--incorrect");
    fb.hidden = false;
    text("[data-feedback-mark]", isCorrect ? "✓" : "✕");
    text("[data-feedback-title]", isCorrect ? FEEDBACK_TITLE[round.type] : FEEDBACK_TITLE_WRONG[round.type]);
    text("[data-feedback-stamp]", isCorrect ? "Archive verified" : "Please rewind");

    var timeline = $("[data-feedback-timeline]");
    timeline.innerHTML = "";
    correctSequence.forEach(function (it) {
      var li = document.createElement("li");
      li.innerHTML = '<span>' + it.title + '</span><strong>' + it.year + '</strong>';
      timeline.appendChild(li);
    });

    text("[data-bd-base]", isCorrect ? "+100" : "+0");
    text("[data-bd-speed]", isCorrect ? "+" + speedBonus : "+0");
    $("[data-bd-dd-row]").hidden = !gameState.doubleDown;
    text("[data-bd-total]", "+" + roundScore);

    text("[data-feedback-streak]", isCorrect ? "Streak ×" + gameState.streak : "Streak reset");
    text("[data-next]", gameState.round >= 10 ? "See results →" : "Next challenge →");

    announce((isCorrect ? "Correct. " : "Out of order. ") +
      "Round score " + roundScore + ". Streak " + gameState.streak + ".");

    fb.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
  }

  var FEEDBACK_TITLE = {
    "order": "Timeline locked",
    "before-after": "Called it",
    "insert": "Slotted in",
    "quote": "Nice catch"
  };
  var FEEDBACK_TITLE_WRONG = {
    "order": "Out of order",
    "before-after": "Wrong call",
    "insert": "Wrong slot",
    "quote": "Wrong tape"
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

  /* mark the correct BEFORE/AFTER button; return both titles in year order */
  function revealBeforeAfter(round) {
    var want = round.comparison.year < round.reference.year ? "before" : "after";
    $all("[data-ba]").forEach(function (btn) {
      var k = btn.getAttribute("data-ba");
      btn.classList.add(k === want ? "ba__btn--right" : "ba__btn--wrong");
    });
    return [round.reference, round.comparison].sort(function (a, b) { return a.year - b.year; });
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

  function goToNextRound() {
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
    var exit = $("[data-exit-row]");
    if (exit) exit.hidden = true;

    text("[data-results-score]", gameState.score.toLocaleString());
    text("[data-results-correct]", gameState.correctCount + " / 10");
    text("[data-results-streak]", "×" + gameState.bestStreak);
    text("[data-results-dd]", gameState.doubleDownsWon);
    text("[data-results-fastest]", gameState.fastestAnswer === null ? "—" : gameState.fastestAnswer + "s");
    text("[data-results-award]", performanceTitle(gameState.correctCount, 10));
    text("[data-artifact-score]", "SCORE " + gameState.score);

    var isNewBest = savePersonalBest({
      score: gameState.score,
      correct: gameState.correctCount,
      streak: gameState.bestStreak
    });
    var badge = $("[data-new-best]");
    if (badge) badge.hidden = !isNewBest;

    var results = $("[data-results]");
    results.hidden = false;
    results.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    announce("Daily run complete. " + gameState.score + " points, " +
      gameState.correctCount + " of 10 correct.");
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
    on("[data-submit]", "click", lockAnswer);
    on("[data-next]", "click", goToNextRound);
    // keyboard shortcuts: arrows for BEFORE/AFTER, 1-3 for QUOTE
    document.addEventListener("keydown", function (e) {
      if (answered || counting) return;
      var t = currentRound().type;
      if (t === "before-after") {
        if (e.key === "ArrowLeft") { e.preventDefault(); setBaChoice("before"); }
        if (e.key === "ArrowRight") { e.preventDefault(); setBaChoice("after"); }
      } else if (t === "quote") {
        if (e.key === "1" || e.key === "2" || e.key === "3") { e.preventDefault(); quoteKey(parseInt(e.key, 10)); }
      }
    });
    on("[data-double-down]", "click", toggleDoubleDown);
    on("[data-copy-score]", "click", copyScore);

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
     INIT
     ======================================================================== */
  function initGame() {
    var today = new Date();
    var theme = getDailyTheme(today);

    if (document.body.classList.contains("page-home")) {
      renderShelf(today);        // build the shelf first...
      renderSpotlight();
      renderPersonalBest();
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
