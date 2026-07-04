# Webster 1828 Text Quality Audit

Generated: 2026-07-04T23:26:57.101Z

This audit looks for scan/OCR patterns in the structured Webster 1828 data. It does not change Webster's wording. It helps us decide which entries need reviewed overlays or safe display-time cleanup before users rely on them for Bible study.

## Summary

- Webster base entries: 57,561
- Reviewed overlays: 58
- Entries with any quality flag: 22,331
- Entries with high/medium quality flags: 4,246

## Pattern Counts

| Pattern | Severity | Entries |
| --- | --- | ---: |
| Split the/that/this OCR | high | 2,305 |
| Split wh- words | high | 731 |
| Replacement marks or black boxes | high | 1,512 |
| Known common OCR substitutions | medium | 46 |
| Sacred name spacing | medium | 1 |
| Hyphenated scan line breaks | low | 20,800 |

## Priority Doctrine And Study Words

| Word | Entries | Flagged | Reviewed overlay | Flags |
| --- | ---: | ---: | --- | --- |
| atonement | 1 | 1 | no | split_the, split_wh_words, hyphenated_scan_breaks |
| baptism | 1 | 1 | no | hyphenated_scan_breaks |
| believe | 2 | 2 | yes | split_the, split_wh_words, hyphenated_scan_breaks, known_common_ocr |
| charity | 1 | 1 | no | replacement_marks, hyphenated_scan_breaks |
| church | 2 | 1 | no | hyphenated_scan_breaks |
| covenant | 3 | 1 | no | hyphenated_scan_breaks |
| faith | 1 | 1 | no | split_the, split_wh_words, hyphenated_scan_breaks |
| grace | 2 | 2 | no | hyphenated_scan_breaks, split_the |
| hell | 1 | 1 | no | hyphenated_scan_breaks |
| holy | 0 | 0 | yes | - |
| judgment | 1 | 1 | no | split_the, replacement_marks, hyphenated_scan_breaks |
| justification | 1 | 1 | no | hyphenated_scan_breaks |
| mercy | 1 | 1 | no | hyphenated_scan_breaks |
| prayer | 0 | 0 | yes | - |
| prophecy | 1 | 1 | no | hyphenated_scan_breaks |
| repentance | 1 | 1 | no | hyphenated_scan_breaks |
| righteousness | 1 | 1 | no | hyphenated_scan_breaks |
| salvation | 0 | 0 | yes | - |
| sanctification | 0 | 0 | yes | - |
| sin | 3 | 3 | no | hyphenated_scan_breaks, split_the, replacement_marks |
| truth | 0 | 0 | yes | - |

## Top Cleanup Queue

| Headword | Severity | Flags | Reviewed overlay | Sample |
| --- | --- | --- | --- | --- |
| A 'TRONIC | high | replacement_marks | no | A 'TRONIC, u. Tert&ining to Aaron, the ■Jrwish High P) icst, or to the priesthood of which he was the head. Doddridge. |
| A'GENCY | high | split_wh_words, hyphenated_scan_breaks | no | A'GENCY, «. [h.agens. See Act] 1. The quality of moving or of exerting power; tlic state of being in action; ac- A G G A G G A G G ijon; operation; instrumentality; as, the agency ot'provitlence in thf; natural world. U. The office of an agent, or factor; busi- ness of an agent entrusted witli the c |
| A'GENT | high | split_the, hyphenated_scan_breaks | no | A'GENT, >i. An actor; one that e.xerts pow- er, or has the power to act; as, a moral agent. 2. An active power or cause; tliat which has the power to produce an effect; as, heat is a powerful ag'cn^. 3. A substitute, deputy, or factor; one en- trusted with the business of another; an attorney; a min |
| A'IMLESS | high | split_wh_words, hyphenated_scan_breaks | no | A'IMLESS, a. Without aim. May. \IR, n. [Fr mV; L. acr; Gr. aj?p; It. ana; S[). ayre; Port, ar; Arm. tar, eer; Ir. aer W. atcyr; Ch. TIN; Syr.; ] ]; Eth. ^ _£ /J Ar. lj<. This word, in the Shemitic languages, falls under the root iix Heb. and Ch., to sliine. The radical sense to open, expand; whence  |
| A'IR-SACS | high | split_the, hyphenated_scan_breaks | no | A'IR-SACS, n. Air bags in birds, which are certain receptacles of air, or vesicles lodg- ed in the fleshy parts, in the hollow bones and in the abdomen, wldch all communi- cate with the lungs. These are supposed to render the body specifically lighter, and to supply tlie place of a muscular dia- phr |
| A'PHIS | high | split_the, hyphenated_scan_breaks | no | A'PHIS, n. In zoology, the puceron, vine fretter, or plant-louse; a genus of insects, belonging to the order of hemipters. The aphis is furnished with an inflected beak, and with feelers longer than the thorax. In tlie same species, some individuals have four erect wings, and others are entirely wit |
| A'REA | high | split_the, hyphenated_scan_breaks | no | A'REA, n. [L. I suspect this to be con- tracted from Ch. NJ'IX, an area or bed; Heb. njny; fi'om a root which signifies to reach, stretch, lay or spread.] 1. Any plain surface, as the floor of a room of a church or other building, or of tlie ground. 2. "The space or site on which a building stands;  |
| AB'ACIST | high | split_the, hyphenated_scan_breaks | no | AB'ACIST, n. [from abacus.] One that casts accoimts; a calculator. [JVot much ^ised.] ABACK' adv. [a and back, Sax. on bcec; at, on or towards the back. See Back.] Towards the back; on the back part; back- ward. In seamen's language it signifies tlie situation of the sails, when pressed back against |
| AB'BOTSHIP | high | split_the | no | AB'BOTSHIP, n. Tlie state of an abbot. |
| AB'DITORY | high | split_the | no | AB'DITORY, 71. A place for secreting or preserving goods. Cowel. ABDOMEN, or ABDOMEN, n. [L. per haps abdo and omentum.] I. Tiie lower belly, or that part of the body which lies between the thorax and the bottom of the pelvis. It is lined with membrane called peritoneum, and co tains the stomach, li |
| AB'LUENT | high | split_the | no | AB'LUENT, n. In medicine, that which thins, purifies or sweetens tlie blood. (^uincy. [See Diluent and Abstergent.] |
| AB'STINENTS | high | split_the | no | AB'STINENTS, a sect which appeared France and Spain in the third century, who opposed marriage, condemned the use of flesh meat, and placed tlie Holy Spirit in the class of created beings. |
| AB'STRAGT | high | split_the, split_wh_words, replacement_marks, hyphenated_scan_breaks | no | AB'STRAGT, a. [L. absiractus.] Separate distini't troni sonioil.iii!: fl>e. An abstract idea, in iiict.-i/ili\ -ir. i:i,i idea separated from a <-(iiii/il.-\ ohp ■,- i- iVom other ideas wliicli natm-iilly:ii-i-i>iiniaiiy it, as the so- lidity of marble contemplated apart fi-om its color or figure. E |
| ABACTOR | high | split_the, hyphenated_scan_breaks | no | ABACTOR, n. [Latin from abigo, ab and ago, to drive.] tn law, one tliat feloniously drives away or steals a herd or numbers of cattle at once, in distinction from one that steals a sheep or two. AB'ACUS n. [L. abacus, any thing flat, as a cupboard, a bench, a slate, a table or board for games; Gr. a |
| ABASED | high | split_the, hyphenated_scan_breaks | no | ABASED, pp. Reduced to a low state, humbled, degraded. In heraldry, it is used of tlie wings of eagles,, when the tops are turned downwards to- wards the point of the shield; or when the wings are shut, the natural way of bear- ing them being spread, with the top point- ing to the cJiief of the angl |
| ABDICATE | high | split_the, hyphenated_scan_breaks | no | ABDICATE, V. t. [L. abdico; ah and dico, to cieilioate, to bestow, but the literal jiri- iiiary sense (li dico is to send or thrust.] 1. In a g-ejiemi seijse, to relinquish, renounce, or abandon. Forster. 'J. To abandon an office or trust, without a formal resignation to those who confer- red it, or |
| ABINTEST'ATE | high | split_the, hyphenated_scan_breaks | no | ABINTEST'ATE, a. [L'. ah and intesla- ttis — dying without a will, from in and tc.<ilor, to bear witness; W. tyst; Arm, test, witness. See Test and Testify.] In tlie civil law, inheriting the estate of one dying without a will. |
| ABLAC'TATE | high | split_the | no | ABLAC'TATE, t-. t. [L. ablacto; from ab and lac, milk.] To wean from tlie breast. [LitUe used.] |
| ABOUT' | high | split_the, hyphenated_scan_breaks | no | ABOUT', prep. [Sax. abutan, onbutan, em- butan, about, around; on or emb, coincid- ing with Or. a^$i, and butan, without, [see but,] Uterally, around, on the outside.] 1. Around; on the exterior part or surface. Bind them about thy neck. Prov. iii. 3. Isa. 1. Hence,. 2. Near to iti place, with the s |
| ABOUT' | high | split_the, hyphenated_scan_breaks | no | ABOUT', ofrfi'. Near to in number or quantity There fill tliat day about three thousand men, Ex. xxxii. 2. Near to in quality or degree; as about as high, or as cold. 3. Here and there; around; in one place and another. Wandering about from house to house. 1. Tim. v. 4. Round, or the longest way, op |
| ABROACH | high | split_the, hyphenated_scan_breaks | no | ABROACH, adv. [See Broach.] Broached; letting out or yielding liquor, or in a posture for letting out; as a cask is abroach. Figuratively used by Shakespeare for setting loose, or in a state of being dif- fused, "Set miscliief abroach;" but tliis sense is unusual. |
| ABSTERG'ENT | high | split_the | no | ABSTERG'ENT, a. Wiping; cleansing. ABSTERg'ENT, n. A medicine which frees tlie body from obstructions, as soap; but the use of the word is nearly superseded by detergent, which see. |
| ABSTRACT'IVE | high | split_wh_words, hyphenated_scan_breaks | no | ABSTRACT'IVE,? a. Abstracted, or ABSTRA€TI"TIOUS, S drawn from other substances, particularly from vegetables, without fermentation. Cyc. AB'STRA€TLY, adv. Separately; absolute- ly; in a state or manner unconnected witli any thing else; as, matter abstractly con- sidered. |
| ABYSS' | high | split_the, hyphenated_scan_breaks | no | ABYSS', n. [Gr. ASvaaoi, bottomless, from a priv. and Svsio;, bottom. Ion. for 8v8os. See Bottojn.] A bottomless gulf; used also for a deep mass of waters, supposed by some to have encompassed the earth before the flood. Darkness was upon the face of the deep, oi abyss, as it is in the Septuagint. G |
| ACADE'MIAN | high | split_the, hyphenated_scan_breaks | no | ACADE'MIAN, n. A member of an acad emy; a student in a university or col A€ADEM'le, > a. Belonging to ar A€ADEM'l€AL, \ academy, or to a col lege or university — as academic studies; also noting what belongs to the school or philosophy of Plato — as the academic sect. A€ADEM'I€, n. One who belonged  |
| ACATALECTIC | high | split_wh_words | no | ACATALECTIC, n. [Gr. o.xa.ta%fixroi, not defective at the end, of xaTa and 7.rjyu to cease; Ir. lieghim.] A verse, wliich has the complete number of syllables without defect or superfluity. Johnson. |
| ACCELERA'TION | high | split_the, hyphenated_scan_breaks | no | ACCELERA'TION, n. The act ofincreas- ing velocity or progress; the state of being quickened in motion or action. Accelera- ted motion in mechanics and physics, is that which continually receives accessions of velocity; as, a falling body moves to- wards the earth with an acceleration of ve- locity.  |
| ACCENT | high | split_the, split_wh_words, hyphenated_scan_breaks | no | ACCENT, n. [L. accentus, tromad and fa- no, cantum, to sing; AV. canu; Corn, kann: h: canaim. Sec ikccend.] A C C A C C A C C I. Tlie modulation of the voice in reading or sjjealiiiig, as practiced by tlie ancient Greeks, wliich rendered tlieir rehearsal musical. More strictly, in English, '.'. A pa |
| ACCENTUATE | high | split_the, hyphenated_scan_breaks | no | ACCENTUATE, v. t. To mark or pro- nounce with an accent or \vith accents. A€CENTUA'TION, n. The act of placuig accents in writing, or of pronouncing them in speaking..\CCEPT', V. t. [L. accepto, from accipio, ad and capio, to take; Fr. accepter; Sj). aceptar; Port, aceiter; It. accettare. See Lat. c |
| ACCESS'ION | high | replacement_marks, hyphenated_scan_breaks | no | ACCESS'ION, n. [L. accessio.] A coming to; an acceding to and joining; as a king's accession to a confederacy. 2. Increase by something added; that which is added; augmentation; as an accession of wealth or territory. 3. Inlaw, a mode of acquiring property, by which the owner of a corporeal substanc |
| ACCESSORY | high | split_the, split_wh_words, hyphenated_scan_breaks | no | ACCESSORY, n. [L. Accessorius, fi-om ac cessus, accedo. See Accede. This word i accented on the first syllable on accoinit of/ the derivatives, which require a seconda ry accent on the third; but the natural accent of accessory is on the second sylla ble, and thus it is often pronounced b) good spea |
| ACCIDENT'AL | high | split_the, hyphenated_scan_breaks | no | ACCIDENT'AL, a. Happerung by chance, or rather imexpectedly; casual"; fortui- A C C tons; taking place not according to the usual course of tilings; opposed to that which is constant, regular, or intended; as an accidental visit. 2. Non-essential; not necessarily belonging to; as songs are accidenta |
| ACCLMULATION | high | split_the | no | ACCLMULATION, n. Thekct ofaccunni latiiig; tlie state of being accumulated; ai amassing; a collecting together; as ai: nccumulation of earth or of evils. •2. In tat', the concun-ence of several titles to the same thing, or of several circum stances to the same proof. Encyc. 3. In Universities, an ac |
| ACCOM'PANY | high | split_the, split_wh_words, hyphenated_scan_breaks | no | ACCOM'PANY, V. t. [Fr. accompagner; Sp, acompahar; Port, acompanhar. See Com- pany.] 1. To go with or attend as a companion or associate on a journey, walk, &c.; as a man accompanies his friend to church, or on a tour. 2. To be with as connected; to attend; as pain accompanies disease. A€€OM'PANY, V |
| ACCORP'ORATE | high | replacement_marks | no | ACCORP'ORATE, v. t. To unite; [JVot in use.] '" ' ■ ^ - - ACCC side, border, coast; G. kiiste; D. kust: Dan. kyst.] To approach; to draw near; to come side by side, or face to face. [JVo< in use.] 2. To speak first to; to address. Milton. Dryden, |
| ACCOURT | high | split_wh_words | no | ACCOURT, V. t. [See Court.] To entertain' witli courtesy. [Ao< used.] Spenser} |
| ACCURACY | high | split_wh_words, hyphenated_scan_breaks | no | ACCURACY, n. [L. accuratio, from accu- rare, to take care of; ad and curare, to take care; cxira, care. See Care.] 1. Exactness; exact conformity to truth; or to a rule or model; freedom from mistake; nicety; correctness; precision wliich re- sults from care. The accuracy of ideas or ophiions is con |
| ACCURATELY | high | replacement_marks, hyphenated_scan_breaks | no | ACCURATELY, adv. Exactly; in an accu- rate manner; with precision; without er- ror or defect; as a writing accurately copied. 9. Closely; so ' • ■ ■ ^ J- vial AC ACE 2. The charge of an offense or criiiif the declaration containing the charge. They set over his head his accusation, ] |
| ACCURS'ED | high | split_the, hyphenated_scan_breaks | no | ACCURS'ED, pp. or a. Doomed to destruc tion or misery: The city shall be accursed. John vi. 2. Separated fi-om the faithful; cast out of the church; excommunicated. I could wish myself accursed from Christ. St. Paul, \S. Worthy of the curse: detestable; exe- crable. Keep from tlie accursed tiling. J |
| ACCUS'TOMARILY | high | replacement_marks | no | ACCUS'TOMARILY, adv. AcconUng to custom or common practice. [See Cus- ■" '; used.], a. Ui [See Ciistoman/.] [Little used. |

## Guardrails

- Keep the original OCR file unchanged unless the source is re-imported from a better edition.
- Use reviewed overlays for doctrine-sensitive headwords.
- Use only conservative display cleanup for obvious OCR artifacts.
- Do not invent definitions when Webster data is missing or unclear.

