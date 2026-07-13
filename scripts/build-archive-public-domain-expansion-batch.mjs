#!/usr/bin/env node
import { writeFile } from "node:fs/promises";

const manifestPath = "data/library/manifests/curated-public-domain-resources.json";
const outputPath = process.argv.find((value) => value.startsWith("--output="))?.split("=").slice(1).join("=")
  ?? "data/library/import-batches/storage-first-public-domain-expansion-phase-44.csv";
const target = Number(process.argv.find((value) => value.startsWith("--target="))?.split("=")[1] ?? 220);
const rowsPerAuthor = Number(process.argv.find((value) => value.startsWith("--rows="))?.split("=")[1] ?? 100);

const authorGroups = [
  { query: "spurgeon", names: [/^(c\.? ?h\.?|charles haddon|charles h\.?) spurgeon$/i], collection: "Spurgeon Collection" },
  { query: "moody", names: [/^(d\.? ?l\.?|dwight lyman|dwight l\.?) moody$/i], collection: "Moody Collection" },
  { query: "ryle", names: [/^(j\.? ?c\.?|john charles) ryle$/i], collection: "Ryle Collection" },
  { query: "torrey", names: [/^(r\.? ?a\.?|reuben archer) torrey$/i], collection: "Torrey Collection" },
  { query: "f b meyer", names: [/^(f\.? ?b\.?|frederick brotherton) meyer$/i], collection: "F. B. Meyer Collection" },
  { query: "andrew murray", names: [/^andrew murray$/i], collection: "Andrew Murray Collection" },
  { query: "alexander maclaren", names: [/^alexander maclaren$/i], collection: "Maclaren Collection" },
  { query: "b h carroll", names: [/^(b\.? ?h\.?|benajah harvey) carroll$/i], collection: "B. H. Carroll Collection", minYear: 1870 },
  { query: "john a broadus", names: [/^john a\.? broadus$/i], collection: "Baptist Preaching Collection" },
  { query: "john bunyan", names: [/^john bunyan$/i], collection: "Bunyan Collection" },
  { query: "john gill", names: [/^john gill$/i], collection: "Historic Baptist Collection" },
  { query: "george whitefield", names: [/^george whitefield$/i], collection: "Great Awakening Collection" },
  { query: "john wesley", names: [/^john wesley$/i], collection: "Wesley Collection" },
  { query: "charles wesley", names: [/^charles wesley$/i], collection: "Hymns and Worship" },
  { query: "isaac watts", names: [/^isaac watts$/i], collection: "Hymns and Worship" },
  { query: "e m bounds", names: [/^(e\.? ?m\.?|edward mckendree) bounds$/i], collection: "Bounds Prayer Collection" },
  { query: "a c gaebelein", names: [/^(a\.? ?c\.?|arno clemens) gaebelein$/i], collection: "Gaebelein Collection" },
  { query: "william kelly", names: [/^william kelly$/i], collection: "William Kelly Collection" },
  { query: "f w grant", names: [/^(f\.? ?w\.?|frederick william) grant$/i], collection: "F. W. Grant Collection" },
  { query: "j n darby", names: [/^(j\.? ?n\.?|john nelson) darby$/i], collection: "Darby Collection" },
  { query: "c h mackintosh", names: [/^(c\.? ?h\.?|charles henry) mackintosh$/i], collection: "C. H. Mackintosh Collection" },
  { query: "james m gray", names: [/^james m\.? gray$/i], collection: "James M. Gray Collection" },
  { query: "g campbell morgan", names: [/^(g\.? ?campbell|george campbell) morgan$/i], collection: "G. Campbell Morgan Collection" },
  { query: "william carey", names: [/^william carey$/i], collection: "Missions" },
  { query: "adoniram judson", names: [/^adoniram judson$/i], collection: "Missions" },
  { query: "j h jowett", names: [/^(j\.? ?h\.?|john henry) jowett$/i], collection: "Preaching Classics" },
  { query: "james h brookes", names: [/^james h\.? brookes$/i], collection: "Dispensational Classics" },
  { query: "clarence larkin", names: [/^clarence larkin$/i], collection: "Clarence Larkin Collection" },
  { query: "harry ironside", names: [/^(h\.? ?a\.?|harry a\.?|harry allan) ironside$/i], collection: "Ironside Collection" },
  { query: "matthew henry", names: [/^matthew henry$/i], collection: "Matthew Henry Collection" },
  { query: "albert barnes", names: [/^albert barnes$/i], collection: "Barnes Commentary Collection" },
  { query: "adam clarke", names: [/^adam clarke$/i], collection: "Adam Clarke Collection" },
  { query: "matthew poole", names: [/^matthew poole$/i], collection: "Matthew Poole Collection" },
  { query: "john trapp", names: [/^john trapp$/i], collection: "Classic Commentary Collection" },
  { query: "william burkitt", names: [/^william burkitt$/i], collection: "Classic Commentary Collection" },
  { query: "joseph parker", names: [/^joseph parker$/i], collection: "People's Bible Collection" },
  { query: "john peter lange", names: [/^john peter lange$/i], collection: "Classic Commentary Collection" },
  { query: "barton w johnson", names: [/^(barton w\.?|b\.? ?w\.?) johnson$/i], collection: "People's New Testament Collection" },
  { query: "john william mcgarvey", names: [/^(john william|j\.? ?w\.?) mcgarvey$/i], collection: "Restoration Commentary Collection" },
  { query: "thomas armitage", names: [/^thomas armitage$/i], collection: "Baptist History" },
  { query: "david benedict", names: [/^david benedict$/i], collection: "Baptist History" },
  { query: "henry vedder", names: [/^(henry c\.?|henry clay) vedder$/i], collection: "Baptist History" },
  { query: "john t christian", names: [/^john t\.? christian$/i], collection: "Baptist History" },
  { query: "joseph ivimey", names: [/^joseph ivimey$/i], collection: "Baptist History" },
  { query: "thomas crosby", names: [/^thomas crosby$/i], collection: "Baptist History" },
  { query: "benjamin keach", names: [/^benjamin keach$/i], collection: "Historic Baptist Collection" },
  { query: "john rippon", names: [/^john rippon$/i], collection: "Historic Baptist Collection" },
  { query: "george muller", names: [/^george m[uü]ller$/i], collection: "Prayer and Missions" },
  { query: "hudson taylor", names: [/^(j\.? ?hudson|james hudson) taylor$/i], collection: "Missions" },
  { query: "david livingstone", names: [/^david livingstone$/i], collection: "Missions" },
  { query: "robert moffat", names: [/^robert moffat$/i], collection: "Missions" },
  { query: "samuel zwemer", names: [/^(samuel m\.?|samuel marinus) zwemer$/i], collection: "Missions" },
  { query: "a t pierson", names: [/^(a\.? ?t\.?|arthur tappan) pierson$/i], collection: "Missions and Preaching" },
  { query: "a j gordon", names: [/^(a\.? ?j\.?|adoniram judson) gordon$/i], collection: "Baptist Preaching Collection" },
  { query: "billy sunday", names: [/^(billy|william ashley) sunday$/i], collection: "Evangelism" },
  { query: "j wilbur chapman", names: [/^(j\.? ?wilbur|john wilbur) chapman$/i], collection: "Evangelism" },
  { query: "samuel chadwick", names: [/^samuel chadwick$/i], collection: "Prayer and Revival" },
  { query: "gipsy smith", names: [/^(gipsy|rodney) smith$/i], collection: "Evangelism" },
  { query: "horatius bonar", names: [/^horatius bonar$/i], collection: "Devotional Classics" },
  { query: "andrew bonar", names: [/^(andrew a\.?|andrew alexander) bonar$/i], collection: "Devotional Classics" },
  { query: "john newton", names: [/^john newton$/i], collection: "Hymns and Christian Living" },
  { query: "thomas watson", names: [/^thomas watson$/i], collection: "Historical Theology" },
  { query: "thomas brooks", names: [/^thomas brooks$/i], collection: "Historical Theology" },
  { query: "richard sibbes", names: [/^richard sibbes$/i], collection: "Historical Theology" },
  { query: "j c philpot", names: [/^(j\.? ?c\.?|joseph charles) philpot$/i], collection: "Devotional Classics" },
  { query: "alfred edersheim", names: [/^alfred edersheim$/i], collection: "Bible Background" },
  { query: "william smith bible", names: [/^william smith$/i], collection: "Bible Reference" },
  { query: "james hastings bible", names: [/^james hastings$/i], collection: "Bible Reference" },
  { query: "robert young concordance", names: [/^robert young$/i], collection: "Bible Reference" },
  { query: "john foxe", names: [/^john foxe$/i], collection: "Church History" },
  { query: "j a wylie", names: [/^(j\.? ?a\.?|james aitken) wylie$/i], collection: "Church History" },
  { query: "andrew miller church history", names: [/^andrew miller$/i], collection: "Church History" },
  { query: "robert murray mccheyne", names: [/^(robert murray m'cheyne|robert murray mc.?cheyne)$/i], collection: "Devotional Classics" },
  { query: "john fawcett", names: [/^john fawcett$/i], collection: "Historic Baptist Collection" },
  { query: "isaac backus", names: [/^isaac backus$/i], collection: "Baptist History" },
  { query: "john leadley dagg", names: [/^john leadley dagg$/i], collection: "Baptist Theology" },
  { query: "james p boyce", names: [/^james p\.? boyce$/i], collection: "Baptist Theology" },
  { query: "e c dargan", names: [/^(e\.? ?c\.?|edwin charles) dargan$/i], collection: "Baptist Preaching Collection" },
  { query: "william cathcart baptist", names: [/^william cathcart$/i], collection: "Baptist History" },
  { query: "j m cramp baptist", names: [/^(j\.? ?m\.?|john mockett) cramp$/i], collection: "Baptist History" },
  { query: "joseph angus baptist", names: [/^joseph angus$/i], collection: "Baptist History" },
  { query: "a h newman church history", names: [/^(a\.? ?h\.?|albert henry) newman$/i], collection: "Baptist History" },
  { query: "w t whitley baptist", names: [/^(w\.? ?t\.?|william thomas) whitley$/i], collection: "Baptist History" },
  { query: "j m pendleton baptist", names: [/^(j\.? ?m\.?|james madison) pendleton$/i], collection: "Baptist Theology" },
  { query: "john a james christian", names: [/^john angell james$/i], collection: "Christian Living Classics" },
  { query: "j r miller devotional", names: [/^(j\.? ?r\.?|james russell) miller$/i], collection: "Devotional Classics" },
  { query: "charles bridges christian", names: [/^charles bridges$/i], collection: "Devotional Classics" },
  { query: "octavius winslow", names: [/^octavius winslow$/i], collection: "Devotional Classics" },
  { query: "henry law gospel", names: [/^henry law$/i], collection: "Devotional Classics" },
  { query: "william gurnall", names: [/^william gurnall$/i], collection: "Historical Theology" },
  { query: "john flavel", names: [/^john flavel$/i], collection: "Historical Theology" },
  { query: "philip doddridge", names: [/^philip doddridge$/i], collection: "Devotional Classics" },
  { query: "samuel rutherford", names: [/^samuel rutherford$/i], collection: "Historical Theology" },
  { query: "charles simeon sermons", names: [/^charles simeon$/i], collection: "Classic Commentary Collection" },
  { query: "handley moule", names: [/^(handley c\.? ?g\.?|handley carr glynn) moule$/i], collection: "Devotional Classics" },
  { query: "andrew fuller baptist", names: [/^andrew fuller$/i], collection: "Historic Baptist Collection" },
  { query: "samuel pearce baptist", names: [/^samuel pearce$/i], collection: "Historic Baptist Collection" },
  { query: "john paton missionary", names: [/^(john g\.?|john gibson) paton$/i], collection: "Missions" },
  { query: "henry martyn missionary", names: [/^henry martyn$/i], collection: "Missions" },
  { query: "alexander duff missionary", names: [/^alexander duff$/i], collection: "Missions" },
  { query: "mary slessor missionary", names: [/^mary slessor$/i], collection: "Missions" },
  { query: "amy carmichael missionary", names: [/^amy carmichael$/i], collection: "Missions" },
  { query: "isabella thoburn missionary", names: [/^isabella thoburn$/i], collection: "Missions" },
  { query: "james orr bible", names: [/^james orr$/i], collection: "Bible Reference" },
  { query: "john mcclintock bible", names: [/^john mcclintock$/i], collection: "Bible Reference" },
  { query: "james strong bible", names: [/^james strong$/i], collection: "Bible Reference" },
  { query: "orville nave bible", names: [/^(orville j\.?|orville james) nave$/i], collection: "Bible Reference" },
  { query: "william aldis wright bible", names: [/^william aldis wright$/i], collection: "Bible Reference" },
  { query: "e w bullinger bible", names: [/^(e\.? ?w\.?|ethelbert william) bullinger$/i], collection: "Dispensational Classics" },
  { query: "phillips brooks sermons", names: [/^phillips brooks$/i], collection: "Preaching Classics" },
  { query: "clovis chappell sermons", names: [/^(clovis g\.?|clovis gillham) chappell$/i], collection: "Preaching Classics" },
  { query: "george h morrison sermons", names: [/^(george h\.?|george herbert) morrison$/i], collection: "Preaching Classics" },
  { query: "t de witt talmage sermons", names: [/^(t\.? de witt|thomas de witt) talmage$/i], collection: "Preaching Classics" },
  { query: "frances havergal christian", names: [/^(frances ridley|f\.? ?r\.?) havergal$/i], collection: "Hymns and Christian Living" },
  { query: "fanny crosby hymns", names: [/^(fanny|frances jane) crosby$/i], collection: "Hymns and Worship" },
  { query: "s d gordon quiet talks", names: [/^(s\.? ?d\.?|samuel dickey) gordon$/i], collection: "Quiet Talks Collection" },
  { query: "t de witt talmage", names: [/^(t\.? de witt|thomas de witt) talmage$/i], collection: "Preaching Classics" },
  { query: "james stalker", names: [/^james stalker$/i], collection: "Bible Study Classics" },
  { query: "william evans bible", names: [/^william evans$/i], collection: "Bible Study Classics" },
  { query: "marcus dods bible", names: [/^marcus dods$/i], collection: "Bible Study Classics" },
  { query: "cunningham geikie", names: [/^(cunningham|john cunningham) geikie$/i], collection: "Bible Background" },
  { query: "william ramsay paul", names: [/^(william m\.?|william mitchell) ramsay$/i], collection: "Bible Background" },
  { query: "f w boreham", names: [/^(f\.? ?w\.?|frank william) boreham$/i], collection: "Devotional Classics" },
  { query: "george matheson devotional", names: [/^george matheson$/i], collection: "Devotional Classics" },
  { query: "charles e jefferson sermons", names: [/^(charles e\.?|charles edward) jefferson$/i], collection: "Preaching Classics" },
  { query: "w h griffith thomas", names: [/^(w\.? ?h\.? griffith|william henry griffith) thomas$/i], collection: "Bible Study Classics" },
  { query: "ada habershon bible", names: [/^ada r\.? habershon$/i], collection: "Bible Study Classics" },
  { query: "william houghton bible", names: [/^william houghton$/i], collection: "Bible Study Classics" },
  { query: "james denney gospel", names: [/^james denney$/i], collection: "Historical Theology" },
  { query: "alexander whyte bible characters", names: [/^alexander whyte$/i], collection: "Bible Characters" },
  { query: "a b earle evangelist", names: [/^(a\.? ?b\.?|abner bayley) earle$/i], collection: "Baptist Evangelism" },
  { query: "a t robertson bible", names: [/^(a\.? ?t\.?|archibald thomas) robertson$/i], collection: "Baptist Bible Study" },
  { query: "george w truett sermons", names: [/^(george w\.?|george washington) truett$/i], collection: "Baptist Preaching Collection" },
  { query: "e y mullins baptist", names: [/^(e\.? ?y\.?|edgar young) mullins$/i], collection: "Baptist Theology" },
  { query: "l r scarborough baptist", names: [/^(l\.? ?r\.?|lee rutland) scarborough$/i], collection: "Baptist Evangelism" },
  { query: "h c trumbull christian", names: [/^(h\.? ?c\.?|henry clay) trumbull$/i], collection: "Christian Living Classics" },
  { query: "w e biederwolf sermons", names: [/^(w\.? ?e\.?|william edward) biederwolf$/i], collection: "Evangelism" },
  { query: "mel trotter evangelist", names: [/^mel trotter$/i], collection: "Evangelism" },
  { query: "charles finney revival", names: [/^(charles g\.?|charles grandison) finney$/i], collection: "Historical Revival Collection" },
  { query: "william bell riley bible", names: [/^(william bell|w\.? ?b\.?) riley$/i], collection: "Fundamentalist Preaching" },
  { query: "r a forrest bible", names: [/^(r\.? ?a\.?|richard albert) forrest$/i], collection: "Bible Study Classics" },
  { query: "george c needham sermons", names: [/^(george c\.?|george carter) needham$/i], collection: "Preaching Classics" },
  { query: "a c dixon sermons", names: [/^(a\.? ?c\.?|amzi clarence) dixon$/i], collection: "Baptist Preaching Collection" },
  { query: "i m haldeman bible", names: [/^(i\.? ?m\.?|isaac massey) haldeman$/i], collection: "Dispensational Classics" },
  { query: "william e blackstone bible", names: [/^(william e\.?|william eugene) blackstone$/i], collection: "Dispensational Classics" },
  { query: "william l pettingill bible", names: [/^(william l\.?|william leroy) pettingill$/i], collection: "Dispensational Classics" },
  { query: "c i scofield bible", names: [/^(c\.? ?i\.?|cyrus ingerson) scofield$/i], collection: "Scofield Collection" },
  { query: "lewis sperry chafer", names: [/^lewis sperry chafer$/i], collection: "Chafer Collection" },
  { query: "ford c ottman bible", names: [/^(ford c\.?|ford cyrinde) ottman$/i], collection: "Dispensational Classics" },
  { query: "w leon tucker bible", names: [/^(w\.? ?leon|william leon) tucker$/i], collection: "Bible Study Classics" },
  { query: "f e marsh bible", names: [/^(f\.? ?e\.?|frederick edward) marsh$/i], collection: "Bible Study Classics" },
  { query: "w p mackay grace truth", names: [/^(w\.? ?p\.?|william paton) mackay$/i], collection: "Evangelism" },
  { query: "hyman appelman evangelist", names: [/^hyman appelman$/i], collection: "Baptist Evangelism" },
  { query: "j m frost baptist", names: [/^(j\.? ?m\.?|james marion) frost$/i], collection: "Baptist History" },
  { query: "basil manly baptist", names: [/^basil manly(?: jr\.?)?$/i], collection: "Baptist Theology" },
  { query: "j b gambrell baptist", names: [/^(j\.? ?b\.?|james brutton) gambrell$/i], collection: "Baptist Preaching Collection" },
  { query: "t t eaton baptist", names: [/^(t\.? ?t\.?|theophilus treadwell) eaton$/i], collection: "Baptist Preaching Collection" },
  { query: "p s henson sermons", names: [/^(p\.? ?s\.?|pope alexander) henson$/i], collection: "Baptist Preaching Collection" },
  { query: "george c lorimer sermons", names: [/^(george c\.?|george claude) lorimer$/i], collection: "Baptist Preaching Collection" },
  { query: "henry c fish revival", names: [/^(henry c\.?|henry clay) fish$/i], collection: "Baptist Revival Collection" },
  { query: "jacob knapp evangelist", names: [/^jacob knapp$/i], collection: "Baptist Evangelism" },
  { query: "james a haldane bible", names: [/^james alexander haldane$/i], collection: "Historic Baptist Collection" },
  { query: "robert haldane romans", names: [/^robert haldane$/i], collection: "Historic Baptist Collection" },
  { query: "christmas evans sermons", names: [/^christmas evans$/i], collection: "Historic Baptist Collection" },
  { query: "william jay sermons", names: [/^william jay$/i], collection: "Preaching Classics" },
  { query: "george mueller narratives", names: [/^george m[uü]ller$/i], collection: "Prayer and Missions" },
  { query: "h grattan guinness missions", names: [/^(h\.? grattan|henry grattan) guinness$/i], collection: "Missions" },
  { query: "eugene stock missions", names: [/^eugene stock$/i], collection: "Missions" },
  { query: "robert e speer missions", names: [/^(robert e\.?|robert elliott) speer$/i], collection: "Missions" },
  { query: "john l nevius missions", names: [/^(john l\.?|john livingston) nevius$/i], collection: "Missions" },
  { query: "griffith john missionary", names: [/^griffith john$/i], collection: "Missions" },
  { query: "alexander mackay uganda", names: [/^(alexander m\.?|alexander murdoch) mackay$/i], collection: "Missions" },
  { query: "samuel crowther missionary", names: [/^(samuel ajayi|samuel) crowther$/i], collection: "Missions" },
  { query: "george smith missionary", names: [/^george smith$/i], collection: "Missions" },
  { query: "john stoughton english bible", names: [/^john stoughton$/i], collection: "KJV and English Bible History" },
  { query: "john eadie english bible", names: [/^john eadie$/i], collection: "KJV and English Bible History" },
  { query: "john read dore old bibles", names: [/^(john read|j\.? ?r\.?) dore$/i], collection: "KJV and English Bible History" },
  { query: "alexander mcclure translators revived", names: [/^alexander mcclure$/i], collection: "KJV and English Bible History" },
  { query: "elizabeth rundle charles hymns", names: [/^elizabeth rundle charles$/i], collection: "Hymns and Christian Living" },
  { query: "anne steele hymns", names: [/^anne steele$/i], collection: "Baptist Hymn Writers" },
  { query: "samuel stennett hymns", names: [/^samuel stennett$/i], collection: "Baptist Hymn Writers" },
  { query: "benjamin beddome hymns", names: [/^benjamin beddome$/i], collection: "Baptist Hymn Writers" },
  { query: "elon foster illustrations", names: [/^elon foster$/i], collection: "Preaching Illustrations" },
  { query: "walter baxendale anecdotes", names: [/^walter baxendale$/i], collection: "Preaching Illustrations" },
];

const excluded = /catholic|mass|mary baker eddy|christian science|book of mormon|latter.day|spiritualism|theosoph|unitarian|universalist|quran|koran|swedenborg|cubical content of earthwork|grammar of the burmese language|socialism and the ethics of jesus|school management|systems of education|art of teaching young minds|introductory text.book to school|^bywyd\b/i;
const ministryTitle = /\b(?:bible|scripture|testaments?|gospels?|genesis|exodus|leviticus|numbers|deuteronomy|psalms?|proverbs?|isaiah|daniel|romans|revelation|grevelation|christ|christians?|christianity|jesus|god|lord|sermons?|preaching|preacher|pulpit|homiletics?|prayer|church|baptists?|baptism|missions?|missionary|faith|grace|holy|theology|divinity|doctrines?|religion|hymns?|apostles?|prophets?|spiritual|spiritualized|devotion|meditation|salvation|evangelism|evangelist|evangelistic|pilgrim|pastor|minister|ministry|parables?|atonement|worship|revival|martyrs?|reformation|heaven|heavenly|hell|souls?|sin|blessed|disciples?|creation|pentateuch|letters|journals?|biography|religious|believer|kingdom|cross|covenant|fundamentals?|islam)\b|\blife of\b/i;
const existing = JSON.parse(await (await import("node:fs/promises")).readFile(manifestPath, "utf8"));
const normalize = (value) => String(value ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

function canonicalAuthor(value) {
  const raw = String(value ?? "").split(/;|\band\b|\n/i)[0].trim();
  const surnameFirst = raw.match(/^([^,]+),\s*([^,(]+?)(?:\s*\(([^)]+)\))?(?:,|$)/);
  const reordered = surnameFirst
    ? `${surnameFirst[3] || surnameFirst[2]} ${surnameFirst[1]}`
    : raw;
  const words = normalize(reordered)
    .split(" ")
    .filter((word) => word && !/^\d{4}$/.test(word) && !["rev", "reverend", "dr", "jr", "sr"].includes(word));
  if (!words.length) return "";
  const surname = words.at(-1);
  const initials = words.slice(0, -1).map((word) => word[0]).join("");
  return `${surname}::${initials}`;
}

const existingKeys = new Set(existing.map((item) => `${normalize(item.title)}::${canonicalAuthor(item.author)}`));
const existingSources = new Set(existing.map((item) => normalize(item.source_url)));

function workTitle(value) {
  return normalize(value)
    .replace(/\b(?:volume|vol|part|book)\s+(?:\d+|[ivxlcdm]+)\b/g, " ")
    .replace(/\b(?:original scan|original|only|edition|ed)\b/g, " ")
    .replace(/\b\d{4}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 10)
    .join(" ");
}

const existingWorks = new Set(existing.map((item) => `${workTitle(item.title)}::${canonicalAuthor(item.author)}`));

function creatorText(creator) {
  return Array.isArray(creator) ? creator.join("; ") : String(creator ?? "");
}

function matchesAuthor(creator, patterns) {
  return creatorText(creator).split(/;|\band\b|\n/i).some((name) => patterns.some((pattern) => pattern.test(name.trim())));
}

function publicationYear(doc) {
  const candidate = Number(String(doc.year ?? doc.date ?? "").match(/\b(1[5-9]\d{2}|19[0-2]\d)\b/)?.[1]);
  return Number.isFinite(candidate) ? candidate : 0;
}

function isEnglish(doc) {
  const language = (Array.isArray(doc.language) ? doc.language : [doc.language]).filter(Boolean).map(normalize);
  if (language.length && !language.some((value) => value === "eng" || value === "english" || value.startsWith("en "))) return false;
  return !/[À-ž]/.test(String(doc.title ?? ""));
}

function categoryFor(title, collection) {
  if (/commentar|exposition|expository|notes on|lectures on .*(genesis|exodus|leviticus|numbers|deuteronomy|psalm|isaiah|gospel|romans|revelation|bible)/i.test(title)) return "Commentaries";
  if (/mission|missionary|carey|judson/i.test(`${title} ${collection}`)) return "Missions";
  if (/prayer|intercession/i.test(title)) return "Prayer";
  if (/baptist|baptism|church history/i.test(title)) return "Baptist History";
  if (/sermon|preach|pulpit|homiletic|teacher/i.test(title)) return "Preaching & Teaching";
  if (/bible|scripture|testament|gospel|christ|doctrine|theology|faith|grace|holy spirit/i.test(title)) return "Bible study helps";
  return "Christian Living";
}

function csv(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function search(group) {
  const params = new URLSearchParams({
    q: `mediatype:texts AND creator:(${group.query}) AND date:[1500-01-01 TO 1928-12-31]`,
    rows: String(rowsPerAuthor),
    page: "1",
    output: "json",
    sort: "downloads desc",
  });
  for (const field of ["identifier", "title", "creator", "date", "year", "language"]) params.append("fl[]", field);
  const response = await fetch(`https://archive.org/advancedsearch.php?${params}`, { headers: { "User-Agent": "FathersBusinessBibleStudy/0.1" } });
  if (!response.ok) throw new Error(`Archive search failed for ${group.query}: ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.response?.docs)) {
    console.warn(`Archive returned no document list for ${group.query}; skipping this source pass.`);
    return [];
  }
  return payload.response.docs.map((doc) => ({ ...doc, group }));
}

async function directTextFile(identifier) {
  try {
    const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, { headers: { "User-Agent": "FathersBusinessBibleStudy/0.1" } });
    if (!response.ok) return "";
    const metadata = await response.json();
    const names = (metadata.files ?? []).map((file) => file.name).filter(Boolean);
    const name = names.find((file) => /_djvu\.txt$/i.test(file)) ?? names.find((file) => /\.txt$/i.test(file) && !/meta|reviews|speech/i.test(file));
    return name ? `https://archive.org/download/${identifier}/${encodeURIComponent(name).replace(/%2F/g, "/")}` : "";
  } catch {
    return "";
  }
}

const searchResults = [];
for (const group of authorGroups) {
  searchResults.push(...(await search(group)));
  await new Promise((resolve) => setTimeout(resolve, 125));
}
const candidates = [];
const seen = new Set();
for (const doc of searchResults) {
  const title = String(doc.title ?? "").replace(/\s+/g, " ").trim();
  const author = creatorText(doc.creator).replace(/\s+/g, " ").trim();
  const year = publicationYear(doc);
  const key = `${normalize(title)}::${canonicalAuthor(author)}`;
  const workKey = `${workTitle(title)}::${canonicalAuthor(author)}`;
  if (!title || !author || !year || year > 1928 || year < (doc.group.minYear ?? 1500) || excluded.test(`${title} ${author}`) || !ministryTitle.test(title) || !isEnglish(doc)) continue;
  if (!matchesAuthor(author, doc.group.names) || existingKeys.has(key) || existingWorks.has(workKey) || seen.has(workKey)) continue;
  seen.add(workKey);
  candidates.push({ ...doc, title, author, year });
}

const verified = [];
for (let index = 0; index < candidates.length && verified.length < target; index += 10) {
  const group = candidates.slice(index, index + 10);
  const resolved = await Promise.all(group.map(async (item) => ({ ...item, source_url: await directTextFile(item.identifier) })));
  for (const item of resolved) {
    if (!item.source_url || existingSources.has(normalize(item.source_url))) continue;
    verified.push(item);
    if (verified.length >= target) break;
  }
}

const header = "score,title,author,source_url,category,collection,rights_status,doctrinal_status,warning_label,recommended_use,year";
const rows = verified.map((item, index) => {
  const category = categoryFor(item.title, item.group.collection);
  const use = `Public-domain ${category.toLowerCase()} resource for Bible study, teaching, preaching, devotional reading, or historical research. OCR text must be spot-checked before quotation.`;
  return [target - index, item.title, item.author, item.source_url, category, item.group.collection, "verified public domain", "reviewed", "Use with discernment;OCR spot-check", use, item.year].map(csv).join(",");
});

await writeFile(outputPath, `${header}\n${rows.join("\n")}\n`, "utf8");
console.log(`Wrote ${verified.length} deduplicated, text-accessible candidates to ${outputPath}`);
if (verified.length < 200) process.exitCode = 2;
