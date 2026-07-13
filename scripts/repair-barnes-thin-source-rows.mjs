import fs from "node:fs";

const targets = [
  {
    file: "data/imports/barnes-reviewed-phase-5-exodus-commentary.json",
    id: "albert-barnes-exodus-36-phase-3-reviewed",
    action: "source-thin",
    verificationUrl: "https://sacred-texts.com/bib/cmt/barnes/exo036.htm",
  },
  {
    file: "data/imports/barnes-reviewed-phase-5-exodus-commentary.json",
    id: "albert-barnes-exodus-37-phase-3-reviewed",
    action: "quarantine",
    verificationUrl: "https://sacred-texts.com/bib/cmt/barnes/exo037.htm",
  },
  {
    file: "data/imports/barnes-reviewed-phase-5-exodus-commentary.json",
    id: "albert-barnes-exodus-39-phase-3-reviewed",
    action: "source-thin",
    verificationUrl: "https://sacred-texts.com/bib/cmt/barnes/exo039.htm",
  },
  {
    file: "data/imports/barnes-reviewed-historical-books-completion-commentary.json",
    id: "albert-barnes-2-chronicles-16-phase-3-reviewed",
    action: "repair",
    verificationUrl: "https://sacred-texts.com/bib/cmt/barnes/ch2016.htm",
    text: `Verse 1
This passage runs parallel with Kings (see the marginal reference).

Verse 3
Compare the 1 Kings 15:19 note.

Verse 4
Abel-maim - or, "Abel-beth-maachah" 1 Kings 15:20. It was one of the towns most exposed to attack when an invader entered Israel from the north, and was taken from Pekah by Tiglath-pileser 2 Kings 15:29.

Store cities - See 1 Kings 9:19 note.

Verse 7
The rebuke of Hanani and his imprisonment by Asa, omitted by the writer of Kings, are among the most important of the additions to Asa's history for which we are indebted to the author of Chronicles.

Escaped out of thine hand - Hanani means, "Hadst thou been faithful, and opposed in arms the joint host of Israel and Syria, instead of bribing the Syrian king to desert to thy side, the entire host would have been delivered into thy hand, as was Zerah's. But now it is escaped from thee. Thou hast lost a glorious opportunity."

Verse 9
From henceforth thou shalt have wars - As peace had been the reward of Asa's earlier faith 2 Chronicles 14:5; 2 Chronicles 15:5, so his want of faith was now to be punished by a period of war and disturbance.

Verse 10
In a prison house - Or, "in the stocks." Compare 1 Kings 22:26-27.

Verse 12
Yet in his disease he sought not ... - Rather, "and also in his disease he sought not." Not only in his war with Baasha, but also when attacked by illness, Asa placed undue reliance upon the aid of man.

Verse 14
The explanation of the plural - "sepulchres" - will be seen in 1 Kings 13:30 note.

The burning of spices in honor of a king at his funeral was customary (compare the marginal references).`,
  },
  {
    file: "data/imports/barnes-reviewed-historical-books-completion-commentary.json",
    id: "albert-barnes-nehemiah-9-phase-3-reviewed",
    action: "repair",
    verificationUrl: "https://sacred-texts.com/bib/cmt/barnes/neh009.htm",
    text: `Verse 1
The festival lasted from the 15th day of the 7th month to the first. The 22nd day was a day of solemn observance Nehemiah 8:18. One day seems to have been allowed the people for rest; and then the work of repentance, for which they had shown themselves ready Nehemiah 8:9, was taken in hand, and a general fast was proclaimed.

Verse 4
The Septuagint and the Vulgate remove the comma after "stairs." By the "stairs (or scaffold) of the Levites" is to be understood as an elevated platform from which they could the better address and lead the people (compare Nehemiah 8:4).

Verse 5
Stand up - The people had knelt to confess and to worship God Nehemiah 9:3. They were now to take the proper attitude for praise. Compare throughout the margin reference.

Verse 6
The host of heaven worshippeth thee - i. e the angels. See 1 Kings 22:19; Psalm 103:21.

Verse 17
In their rebellion - The Septuagint and several maunscripts have "in Egypt" (the words in the original differing by one letter only), and translate - "And appointed a captain to return to their bondage in Egypt." Compare the margin reference. The appointment of a leader is regarded here as made, whereas we are only told in the Book of Numbers that it was proposed.

Verse 22
Thou didst divide them into corners - i. e., parts of the holy land; or as some prefer "thou didst distribute them on all sides."

Verse 25
Became fat. - i. e., "grew proud," or "wanton" - a phrase only occurring here, in the margin reference, and in Jeremiah 5:28.

Delighted themselves - Rather, "luxuriated." The word in the original does not occur elsewhere; but cognate terms make the sense clear.

Verse 26
Slew thy prophets - Compare 1 Kings 18:4; 1 Kings 19:10; 2 Chronicles 24:21. Jewish tradition further affirms that more than one of the great prophets (e. g., Isaiah, Jeremiah, and Ezekiel) were martyred by their countrymen.

Verse 27
Thou gavest them saviours - See Judges 3:15 etc.

Verse 38
Seal unto it - The exact force of the phrase used is doubtful; but its general sense must be that the classes named took part in the sealing. It was usual in the East to authenticate covenants by appending the seals of those who were parties to them (see Jeremiah 32:10).`,
  },
];

for (const target of targets) {
  const payload = JSON.parse(fs.readFileSync(target.file, "utf8"));
  const entries = Array.isArray(payload) ? payload : payload.entries;
  const entry = entries.find((candidate) => candidate.id === target.id);
  if (!entry) throw new Error(`Missing Barnes target: ${target.id}`);

  entry.source_verification_url = target.verificationUrl;
  entry.review_batch = "Barnes Thin-Source Audit 2026-07-12";

  if (target.action === "source-thin") {
    entry.source_thin_verified = true;
    entry.review_notes =
      "Independent public-domain witness confirms this is a genuine brief cross-reference note; no missing commentary body was found.";
  } else if (target.action === "quarantine") {
    entry.review_status = "Needs Review";
    entry.import_status = "Staged";
    entry.source_recovery_status = "Parser-shifted neighboring note; no chapter-specific Barnes note verified.";
    entry.review_notes =
      "Removed from public import because the stored cross-reference belongs to a neighboring source page and no chapter-specific Barnes note was verified.";
  } else {
    entry.entry_text = target.text;
    entry.review_notes =
      "Recovered omitted public-domain commentary notes from an independent scan-derived witness; source wording and verse labels preserved without modernization.";
  }

  fs.writeFileSync(target.file, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`${target.action}: ${entry.reference}`);
}
