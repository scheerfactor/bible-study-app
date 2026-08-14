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
    textSourceUrl: "https://en.wikisource.org/wiki/Amazing_Grace",
    textRights: "Public domain; text checked against the validated 1840 Olney Hymns edition.",
    midiFile: "amazing-grace.mid",
    rdfFile: "amazing-grace.rdf",
    musicSourceUrl: "https://www.mutopiaproject.org/ftp/Traditional/amazing-mutopia/",
    musicRights: "Creative Commons Attribution-ShareAlike 3.0",
    musicAttribution: "Traditional tune; arrangement by Breizh Partitions, typeset 2012 for the Mutopia Project.",
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
    textSourceUrl: "https://hymnary.org/media/fetch/109275",
    textRights: "Public domain; text checked against the Hymnary/Cyber Hymnal public-domain sheet.",
    midiFile: "fairest-lord-jesus.mid",
    rdfFile: "fairest-lord-jesus.rdf",
    musicSourceUrl: "https://www.mutopiaproject.org/ftp/Traditional/crusaders_hymn/",
    musicRights: "Public Domain",
    musicAttribution: "Traditional Silesian tune; public-domain SATB file maintained by Steve Dunlop for the Mutopia Project.",
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
    textSourceUrl: "https://en.wikisource.org/wiki/This_is_my_Father%E2%80%99s_World",
    textRights: "Public domain worldwide; text checked against the 1901 text.",
    midiFile: "this-is-my-fathers-world.mid",
    rdfFile: "this-is-my-fathers-world.rdf",
    musicSourceUrl: "https://www.mutopiaproject.org/ftp/Traditional/terra_beata/",
    musicRights: "Public Domain",
    musicAttribution: "Traditional tune; public-domain SATB file maintained by Steve Dunlop for the Mutopia Project.",
  },
];

function round(value) {
  return Math.round(value * 1000) / 1000;
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
    const rdf = await readFile(resolve(root, "data", "hymns", "sources", hymn.rdfFile), "utf8");
    if (!rdf.includes("<mp:licence>" + hymn.musicRights + "</mp:licence>")) {
      throw new Error("Music rights mismatch for " + hymn.title);
    }
    const notes = await midiNotes(hymn);
    prepared.push({
      ...hymn,
      notes,
      durationSeconds: round(Math.max(...notes.map((note) => note.time + note.duration), 0)),
      reviewedAt: "2026-08-14",
    });
  }

  const outputPath = resolve(root, "data", "hymns", "verified-hymns.json");
  await writeFile(outputPath, JSON.stringify(prepared, null, 2) + "\n");
  console.log("Prepared " + prepared.length + " hymns at " + outputPath);
}

await main();
