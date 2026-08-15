import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import midiFile from "midi-file";

const { parseMidi } = midiFile;
const root = process.cwd();
const hymns = [
  {
    id: "amazing-grace",
    title: "Amazing Grace",
    lyricist: "John Newton",
    lyricYear: 1779,
    tune: "New Britain",
    scriptureReferences: ["1 Chronicles 17:16-17", "Ephesians 2:8-9"],
    stanzas: [
      "Amazing grace! (how sweet the sound!)\nThat saved a wretch like me!\nI once was lost, but now am found,—\nWas blind, but now I see.",
      "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed!",
      "Through many dangers, toils, and snares.\nI have already come;\n'Tis grace has brought me safe thus far,\nAnd grace will lead me home.",
      "The Lord has promised good to me,—\nHis word my hope secures;\nHe will my shield and portion be\nAs long as life endures.",
      "Yes, when this flesh and heart shall fail,\nAnd mortal life shall cease,\nI shall possess, within the veil,\nA life of joy and peace.",
      "The earth shall soon dissolve like snow,\nThe sun forbear to shine;\nBut God, who call'd me here below,\nWill be for ever mine.",
    ],
    refrain: null,
    textSourceUrl: "https://en.wikisource.org/wiki/Amazing_Grace",
    textRights: "Public domain; text checked against the validated 1840 Olney Hymns edition.",
    midiFile: "amazing-grace.mid",
    midiSha256: "cc4cbec98afe0776d35e26333103e0bab7e7b078f2928c96022e0f42bd2a10f5",
    rdfFile: "amazing-grace.rdf",
    rdfSha256: "2d405cc5c2cd4298ecbca8be30431910aa293a0c2b9e7c8bf93ef8a50e5c0240",
    musicSourceUrl: "https://www.mutopiaproject.org/ftp/Traditional/amazing-mutopia/",
    musicRights: "Creative Commons Attribution-ShareAlike 3.0",
    musicAttribution: "Traditional tune; arrangement by Breizh Partitions, typeset 2012 for the Mutopia Project.",
    reviewedAt: "2026-08-14",
  },
  {
    id: "fairest-lord-jesus",
    title: "Fairest Lord Jesus",
    lyricist: "Joseph A. Seiss, translator",
    lyricYear: 1873,
    tune: "Crusader's Hymn",
    scriptureReferences: ["Colossians 1:16-17", "Revelation 5:12-13"],
    stanzas: [
      "Fairest Lord Jesus,\nRuler of all nature,\nO Thou of God and man the Son,\nThee will I cherish, Thee will I honor,\nThou, my soul's glory, joy, and crown.",
      "Fair are the meadows,\nFairer still the woodlands,\nRobed in the blooming garb of spring;\nJesus is fairer, Jesus is purer,\nWho makes the woeful heart to sing.",
      "Fair is the sunshine,\nFairer still the moonlight,\nAnd all the twinkling starry host;\nJesus shines brighter, Jesus shines purer\nThan all the angels Heav'n can boast.",
      "All fairest beauty, heavenly and earthly,\nWondrously, Jesus, is found in Thee;\nNone can be nearer, fairer or dearer,\nThan Thou, my Savior, art to me.",
      "Beautiful Savior! Lord of all the nations!\nSon of God and Son of Man!\nGlory and honor, praise, adoration,\nNow and for evermore be Thine.",
    ],
    refrain: null,
    textSourceUrl: "https://hymnary.org/media/fetch/109275",
    textRights: "Public domain; text checked against the Hymnary/Cyber Hymnal public-domain sheet.",
    midiFile: "fairest-lord-jesus.mid",
    midiSha256: "4f0a4d20d66dbe9c65711decd3a5a372bcff8b465aa87a3f3a3851a3c8541d2b",
    rdfFile: "fairest-lord-jesus.rdf",
    rdfSha256: "ee17c6ac5e8f8a5c2ed17fcfa583f39fdc9f3ae434f08cdd8ffe3d5843f837cb",
    musicSourceUrl: "https://www.mutopiaproject.org/ftp/Traditional/crusaders_hymn/",
    musicRights: "Public Domain",
    musicAttribution: "Traditional Silesian tune; public-domain SATB file maintained by Steve Dunlop for the Mutopia Project.",
    reviewedAt: "2026-08-14",
  },
  {
    id: "this-is-my-fathers-world",
    title: "This Is My Father's World",
    lyricist: "Maltbie D. Babcock",
    lyricYear: 1901,
    tune: "Terra Beata",
    scriptureReferences: ["Psalm 24:1", "Psalm 96:11-12"],
    stanzas: [
      "This is my Father's world, and to my listening ears\nAll nature sings, and round me rings the music of the spheres.\nThis is my Father's world: I rest me in the thought\nOf rocks and trees, of skies and seas;\nHis hand the wonders wrought.",
      "This is my Father's world, the birds their carols raise,\nThe morning light, the lily white, declare their Maker's praise.\nThis is my Father's world: He shines in all that's fair;\nIn the rustling grass I hear Him pass;\nHe speaks to me everywhere.",
      "This is my Father's world. O let me ne'er forget\nThat though the wrong seems oft so strong, God is the ruler yet.\nThis is my Father's world: the battle is not done:\nJesus Who died shall be satisfied,\nAnd earth and Heav'n be one.",
      "This is my Father's world, dreaming, I see His face.\nI ope my eyes, and in glad surprise cry, “The Lord is in this place.”\nThis is my Father's world, from the shining courts above,\nThe Beloved One, His Only Son,\nCame—a pledge of deathless love.",
      "This is my Father's world, should my heart be ever sad?\nThe lord is King—let the heavens ring. God reigns—let the earth be glad.\nThis is my Father's world. Now closer to Heaven bound,\nFor dear to God is the earth Christ trod.\nNo place but is holy ground.",
      "This is my Father's world. I walk a desert lone.\nIn a bush ablaze to my wondering gaze God makes His glory known.\nThis is my Father's world, a wanderer I may roam\nWhate'er my lot, it matters not,\nMy heart is still at home.",
    ],
    refrain: null,
    textSourceUrl: "https://en.wikisource.org/wiki/This_is_my_Father%E2%80%99s_World",
    textRights: "Public domain worldwide; text checked against the 1901 text.",
    midiFile: "this-is-my-fathers-world.mid",
    midiSha256: "99f1e0d54e69197982e58edb2fcec341599e910fd0c9b9b8dc533c2415cf9409",
    rdfFile: "this-is-my-fathers-world.rdf",
    rdfSha256: "d5522c650b59e9b63fb6653423711578695ff986b7702bc023809d98a435d0ca",
    musicSourceUrl: "https://www.mutopiaproject.org/ftp/Traditional/terra_beata/",
    musicRights: "Public Domain",
    musicAttribution: "Traditional tune; public-domain SATB file maintained by Steve Dunlop for the Mutopia Project.",
    reviewedAt: "2026-08-14",
  },
  {
    id: "o-god-our-help-in-ages-past",
    title: "O God, Our Help in Ages Past",
    lyricist: "Isaac Watts",
    lyricYear: 1719,
    tune: "St. Anne",
    scriptureReferences: ["Psalm 90:1-4", "Psalm 90:12"],
    stanzas: [
      "O God, our help in ages past,\nOur hope for years to come,\nOur shelter from the stormy blast,\nAnd our eternal home.",
      "Under the shadow of Thy throne\nThy saints have dwelt secure;\nSufficient is Thine arm alone,\nAnd our defence is sure.",
      "Before the hills in order stood,\nOr earth received her frame,\nFrom everlasting Thou art God,\nTo endless years the same.",
      "A thousand ages in Thy sight\nAre like an evening gone;\nShort as the watch that ends the night\nBefore the rising sun.",
      "Time, like an ever-rolling stream,\nBears all its sons away;\nThey fly forgotten, as a dream\nDies at the opening day.",
      "O God, our help in ages past,\nOur hope for years to come,\nBe Thou our guard while life shall last,\nAnd our eternal home.",
    ],
    refrain: null,
    textSourceUrl: "https://en.wikisource.org/wiki/The_Canadian_Soldiers%27_Song_Book/O_God%2C_Our_Help_in_Ages_Past",
    textRights: "Public domain; text checked line by line against The Canadian Soldiers' Song Book, hymn 154.",
    midiFile: "st_anne.mid",
    midiSha256: "45908040246ba48da3244679674fcf87fa29cce0fb2cc304dc3fb9bc7444014d",
    rdfFile: "st_anne.rdf",
    rdfSha256: "a219e2e0a24d3c07c23453b1959788188a660318dbed913a26bbfab6c7babaf6",
    musicSourceUrl: "https://www.mutopiaproject.org/ftp/CroftW/st_anne/",
    musicRights: "Public Domain",
    musicAttribution: "Tune by William Croft, 1708; public-domain SATB file maintained by Steve Dunlop for the Mutopia Project.",
    reviewedAt: "2026-08-15",
  },
  {
    id: "praise-to-the-lord-the-almighty",
    title: "Praise to the Lord, the Almighty",
    lyricist: "Joachim Neander; translated by Catherine Winkworth",
    lyricYear: 1863,
    tune: "Lobe den Herren",
    scriptureReferences: ["Psalm 103:1-5", "Psalm 150:6"],
    stanzas: [
      "Praise to the Lord, the Almighty, the King of creation!\nO my soul, praise Him, for He is thy health and salvation!\nAll ye who hear,\nNow to His temple draw near,\nJoining me in glad adoration.",
      "Praise to the Lord, who o'er all things so wondrously reigneth,\nShelters thee under His wings, yea, so gently sustaineth;\nHast thou not seen\nHow thy desires e'er have been\nGranted in what He ordaineth?",
      "Praise to the Lord, who hath fearfully, wondrously made thee,\nGiven thee health, and doth lovingly lead thee and aid thee;\nWhat need or grief\nHath ever failed of relief?\nWings of His mercy did shade thee.",
      "Praise to the Lord, who doth prosper thy work and defend thee;\nSurely, His goodness and mercy here daily attend thee;\nPonder anew\nWhat the Almighty can do,\nIf with His love He befriend thee.",
      "Praise to the Lord! O let all that is in me adore Him!\nAll that hath life and breath, come now with praises before Him!\nLet the Amen\nSound from His people again:\nGladly for aye we adore Him.",
    ],
    refrain: null,
    textSourceUrl: "https://hymnary.org/hymn/CHCS1898/167",
    textRights: "Public domain; text checked line by line against Christian Hymns (1898), hymn 167.",
    midiFile: "lobe_den_Herren.mid",
    midiSha256: "2ceaccb73d5b35b7ea8033426eac6f602113eb3a1bfbd2c722f9e53693e17af6",
    rdfFile: "lobe_den_Herren.rdf",
    rdfSha256: "149dc055ef280b74c42d727d93e38fe67447bb508a6c03914ba4141d2cd8b1b9",
    musicSourceUrl: "https://www.mutopiaproject.org/ftp/Anonymous/lobe_den_Herren/",
    musicRights: "Public Domain",
    musicAttribution: "Anonymous German tune, 1665; public-domain SATB file maintained by Steve Dunlop for the Mutopia Project.",
    reviewedAt: "2026-08-15",
  },
  {
    id: "it-is-well-with-my-soul",
    title: "It Is Well with My Soul",
    lyricist: "Horatio G. Spafford",
    lyricYear: 1873,
    tune: "Ville du Havre",
    scriptureReferences: ["Psalm 46:1-3", "Colossians 2:13-14", "1 Thessalonians 4:16-17"],
    stanzas: [
      "When peace, like a river, attendeth my way,\nWhen sorrows like sea billows roll;\nWhatever my lot, Thou hast taught me to say,\nIt is well, it is well with my soul.",
      "Though Satan should buffet, though trials should come,\nLet this blest assurance control,\nThat Christ has regarded my helpless estate,\nAnd hath shed His own blood for my soul.",
      "My sin—oh, the bliss of this glorious thought!—\nMy sin, not in part but the whole,\nIs nailed to the cross, and I bear it no more;\nPraise the Lord, praise the Lord, O my soul!",
      "And, Lord, haste the day when the faith shall be sight,\nThe clouds be rolled back as a scroll;\nThe trump shall resound and the Lord shall descend;\nEven so—it is well with my soul.",
    ],
    refrain: "It is well with my soul,\nIt is well, it is well with my soul.",
    textSourceUrl: "https://hymnary.org/media/fetch/146502",
    textRights: "Public domain; text checked against the Hymnary public-domain VILLE DU HAVRE score.",
    midiFile: "villeduh.mid",
    midiSha256: "e20b3a41f78b611aaa77e17bf28173eb0c3f9d7421b7996dd877035330df52e8",
    rdfFile: "villeduh.rdf",
    rdfSha256: "dac4141a27de41b331fa151ac9c68070dbf9c0e99166e68a2a0671758f83d144",
    musicSourceUrl: "https://www.mutopiaproject.org/ftp/BlissPP/villeduh/",
    musicRights: "Public Domain",
    musicAttribution: "Tune by Philip P. Bliss, 1876; public-domain SATB file maintained by Steve Dunlop for the Mutopia Project.",
    reviewedAt: "2026-08-15",
  },
];

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function midiNotes(hymn) {
  const sourcePath = resolve(root, "data", "hymns", "sources", hymn.midiFile);
  const parsed = parseMidi(await readFile(sourcePath));
  const ticksPerBeat = parsed.header.ticksPerBeat;
  const tempo = parsed.tracks.flat().find((event) => event.type === "setTempo")?.microsecondsPerBeat ?? 1000000;
  const secondsPerTick = tempo / 1000000 / ticksPerBeat;
  const notes = [];

  for (const track of parsed.tracks) {
    let tick = 0;
    const activeNotes = new Map();
    for (const event of track) {
      tick += event.deltaTime;
      if (event.type === "noteOn" && event.velocity > 0) {
        const key = String(event.noteNumber);
        const starts = activeNotes.get(key) ?? [];
        starts.push({ tick, velocity: event.velocity });
        activeNotes.set(key, starts);
      } else if (event.type === "noteOff" || (event.type === "noteOn" && event.velocity === 0)) {
        const key = String(event.noteNumber);
        const starts = activeNotes.get(key);
        const start = starts?.shift();
        if (!start) continue;
        notes.push({
          midi: event.noteNumber,
          time: round(start.tick * secondsPerTick),
          duration: round(Math.max((tick - start.tick) * secondsPerTick, 0.05)),
          velocity: round(start.velocity / 127),
        });
      }
    }
  }

  notes.sort((a, b) => a.time - b.time || a.midi - b.midi);
  const firstTime = notes[0]?.time ?? 0;
  for (const note of notes) note.time = round(note.time - firstTime);
  return notes;
}

async function main() {
  const prepared = [];
  for (const hymn of hymns) {
    const midi = await readFile(resolve(root, "data", "hymns", "sources", hymn.midiFile));
    const rdfBuffer = await readFile(resolve(root, "data", "hymns", "sources", hymn.rdfFile));
    const rdf = rdfBuffer.toString("utf8");
    if (sha256(midi) !== hymn.midiSha256 || sha256(rdfBuffer) !== hymn.rdfSha256) {
      throw new Error("Source checksum mismatch for " + hymn.title);
    }
    if (!rdf.includes("<mp:licence>" + hymn.musicRights + "</mp:licence>")) {
      throw new Error("Music rights mismatch for " + hymn.title);
    }
    const notes = await midiNotes(hymn);
    prepared.push({
      ...hymn,
      notes,
      durationSeconds: round(Math.max(...notes.map((note) => note.time + note.duration), 0)),
    });
  }

  const outputPath = resolve(root, "data", "hymns", "verified-hymns.json");
  await writeFile(outputPath, JSON.stringify(prepared, null, 2) + "\n");
  console.log("Prepared " + prepared.length + " hymns at " + outputPath);
}

await main();
