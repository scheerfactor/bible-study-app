# Webster 1828 Text Quality Audit

Generated: 2026-07-15T09:22:15.978Z

This audit looks for scan/OCR patterns in the structured Webster 1828 data. It does not change Webster's wording. It helps us decide which entries need reviewed overlays or safe display-time cleanup before users rely on them for Bible study.

## Summary

- Webster base entries: 58,428
- Reviewed overlays: 1,763
- Entries with any quality flag: 22,443
- Entries with high/medium quality flags: 4,255

## Pattern Counts

| Pattern | Severity | Entries |
| --- | --- | ---: |
| Split the/that/this OCR | high | 2,309 |
| Split wh- words | high | 731 |
| Replacement marks or black boxes | high | 1,515 |
| Known common OCR substitutions | medium | 46 |
| Sacred name spacing | medium | 1 |
| Hyphenated scan line breaks | low | 20,890 |

## Priority Doctrine And Study Words

| Word | Entries | Flagged | Reviewed overlay | Flags |
| --- | ---: | ---: | --- | --- |
| atonement | 1 | 1 | yes | split_the, split_wh_words, hyphenated_scan_breaks |
| adoption | 1 | 1 | yes | split_the, split_wh_words, hyphenated_scan_breaks |
| adversary | 2 | 1 | yes | hyphenated_scan_breaks |
| amen | 1 | 1 | yes | hyphenated_scan_breaks |
| baptism | 1 | 1 | yes | hyphenated_scan_breaks |
| baptize | 1 | 1 | yes | hyphenated_scan_breaks |
| believe | 2 | 2 | yes | split_the, split_wh_words, hyphenated_scan_breaks, known_common_ocr |
| blessing | 2 | 2 | yes | hyphenated_scan_breaks |
| charity | 1 | 1 | yes | replacement_marks, hyphenated_scan_breaks |
| church | 2 | 1 | yes | hyphenated_scan_breaks |
| christ | 1 | 1 | yes | hyphenated_scan_breaks |
| commentary | 2 | 1 | yes | hyphenated_scan_breaks |
| conversion | 1 | 1 | yes | hyphenated_scan_breaks |
| convert | 3 | 1 | yes | hyphenated_scan_breaks |
| covenant | 3 | 1 | yes | hyphenated_scan_breaks |
| damnation | 1 | 1 | yes | hyphenated_scan_breaks |
| dispensation | 1 | 1 | yes | split_the, hyphenated_scan_breaks |
| eternal | 2 | 1 | yes | hyphenated_scan_breaks |
| faith | 1 | 1 | yes | split_the, split_wh_words, hyphenated_scan_breaks |
| forgive | 1 | 1 | yes | split_the, replacement_marks |
| grace | 2 | 2 | yes | hyphenated_scan_breaks, split_the |
| glorification | 1 | 1 | yes | hyphenated_scan_breaks |
| hell | 1 | 1 | yes | hyphenated_scan_breaks |
| high-priest | 1 | 0 | yes | - |
| holy | 0 | 0 | yes | - |
| iniquity | 1 | 1 | yes | hyphenated_scan_breaks |
| judgment | 1 | 1 | yes | split_the, replacement_marks, hyphenated_scan_breaks |
| justification | 1 | 1 | yes | hyphenated_scan_breaks |
| intercessor | 1 | 1 | yes | hyphenated_scan_breaks |
| intercession | 0 | 0 | yes | - |
| mediator | 1 | 1 | yes | hyphenated_scan_breaks |
| mercy | 1 | 1 | yes | hyphenated_scan_breaks |
| messiah | 1 | 0 | yes | - |
| offering | 2 | 1 | yes | hyphenated_scan_breaks |
| ordinance | 1 | 1 | yes | hyphenated_scan_breaks |
| prayer | 0 | 0 | yes | - |
| preach | 2 | 0 | yes | - |
| preaching | 2 | 2 | yes | hyphenated_scan_breaks, split_the |
| prophecy | 1 | 1 | yes | hyphenated_scan_breaks |
| propitiation | 1 | 1 | yes | hyphenated_scan_breaks |
| reconcile | 0 | 0 | yes | - |
| repent | 3 | 1 | yes | hyphenated_scan_breaks |
| repentance | 1 | 1 | yes | hyphenated_scan_breaks |
| righteousness | 1 | 1 | yes | hyphenated_scan_breaks |
| salvation | 0 | 0 | yes | - |
| sanctification | 0 | 0 | yes | - |
| sermon | 3 | 2 | yes | hyphenated_scan_breaks |
| sin | 3 | 3 | yes | hyphenated_scan_breaks, split_the, replacement_marks |
| testimony | 2 | 1 | yes | replacement_marks, hyphenated_scan_breaks |
| text | 2 | 0 | yes | - |
| truth | 0 | 0 | yes | - |
| witness | 3 | 2 | yes | split_the, hyphenated_scan_breaks |

## Top Cleanup Queue

| Headword | Severity | Flags | Reviewed overlay | Sample |
| --- | --- | --- | --- | --- |
| A 'TRONIC | high | replacement_marks | no | A 'TRONIC, u. Tert&ining to Aaron, the ■Jrwish High P) icst, or to the priesthood of which he was the head. Doddridge. |
| A'IR-SACS | high | split_the, hyphenated_scan_breaks | no | A'IR-SACS, n. Air bags in birds, which are certain receptacles of air, or vesicles lodg- ed in the fleshy parts, in the hollow bones and in the abdomen, wldch all communi- cate with the lungs. These are supposed to render the body specifically lighter, and to supply tlie place of a muscular dia- phr |
| A'PHIS | high | split_the, hyphenated_scan_breaks | no | A'PHIS, n. In zoology, the puceron, vine fretter, or plant-louse; a genus of insects, belonging to the order of hemipters. The aphis is furnished with an inflected beak, and with feelers longer than the thorax. In tlie same species, some individuals have four erect wings, and others are entirely wit |
| AB'ACIST | high | split_the, hyphenated_scan_breaks | no | AB'ACIST, n. [from abacus.] One that casts accoimts; a calculator. [JVot much ^ised.] ABACK' adv. [a and back, Sax. on bcec; at, on or towards the back. See Back.] Towards the back; on the back part; back- ward. In seamen's language it signifies tlie situation of the sails, when pressed back against |
| AB'BOTSHIP | high | split_the | no | AB'BOTSHIP, n. Tlie state of an abbot. |
| AB'DITORY | high | split_the | no | AB'DITORY, 71. A place for secreting or preserving goods. Cowel. ABDOMEN, or ABDOMEN, n. [L. per haps abdo and omentum.] I. Tiie lower belly, or that part of the body which lies between the thorax and the bottom of the pelvis. It is lined with membrane called peritoneum, and co tains the stomach, li |
| AB'LUENT | high | split_the | no | AB'LUENT, n. In medicine, that which thins, purifies or sweetens tlie blood. (^uincy. [See Diluent and Abstergent.] |
| AB'STRAGT | high | split_the, split_wh_words, replacement_marks, hyphenated_scan_breaks | no | AB'STRAGT, a. [L. absiractus.] Separate distini't troni sonioil.iii!: fl>e. An abstract idea, in iiict.-i/ili\ -ir. i:i,i idea separated from a <-(iiii/il.-\ ohp ■,- i- iVom other ideas wliicli natm-iilly:ii-i-i>iiniaiiy it, as the so- lidity of marble contemplated apart fi-om its color or figure. E |
| ABACTOR | high | split_the, hyphenated_scan_breaks | no | ABACTOR, n. [Latin from abigo, ab and ago, to drive.] tn law, one tliat feloniously drives away or steals a herd or numbers of cattle at once, in distinction from one that steals a sheep or two. AB'ACUS n. [L. abacus, any thing flat, as a cupboard, a bench, a slate, a table or board for games; Gr. a |
| ABINTEST'ATE | high | split_the, hyphenated_scan_breaks | no | ABINTEST'ATE, a. [L'. ah and intesla- ttis — dying without a will, from in and tc.<ilor, to bear witness; W. tyst; Arm, test, witness. See Test and Testify.] In tlie civil law, inheriting the estate of one dying without a will. |
| ABLAC'TATE | high | split_the | no | ABLAC'TATE, t-. t. [L. ablacto; from ab and lac, milk.] To wean from tlie breast. [LitUe used.] |
| ABROACH | high | split_the, hyphenated_scan_breaks | no | ABROACH, adv. [See Broach.] Broached; letting out or yielding liquor, or in a posture for letting out; as a cask is abroach. Figuratively used by Shakespeare for setting loose, or in a state of being dif- fused, "Set miscliief abroach;" but tliis sense is unusual. |
| ABSTERG'ENT | high | split_the | no | ABSTERG'ENT, a. Wiping; cleansing. ABSTERg'ENT, n. A medicine which frees tlie body from obstructions, as soap; but the use of the word is nearly superseded by detergent, which see. |
| ABSTRACT'IVE | high | split_wh_words, hyphenated_scan_breaks | no | ABSTRACT'IVE,? a. Abstracted, or ABSTRA€TI"TIOUS, S drawn from other substances, particularly from vegetables, without fermentation. Cyc. AB'STRA€TLY, adv. Separately; absolute- ly; in a state or manner unconnected witli any thing else; as, matter abstractly con- sidered. |
| ACATALECTIC | high | split_wh_words | no | ACATALECTIC, n. [Gr. o.xa.ta%fixroi, not defective at the end, of xaTa and 7.rjyu to cease; Ir. lieghim.] A verse, wliich has the complete number of syllables without defect or superfluity. Johnson. |
| ACCLMULATION | high | split_the | no | ACCLMULATION, n. Thekct ofaccunni latiiig; tlie state of being accumulated; ai amassing; a collecting together; as ai: nccumulation of earth or of evils. •2. In tat', the concun-ence of several titles to the same thing, or of several circum stances to the same proof. Encyc. 3. In Universities, an ac |
| ACCORP'ORATE | high | replacement_marks | no | ACCORP'ORATE, v. t. To unite; [JVot in use.] '" ' ■ ^ - - ACCC side, border, coast; G. kiiste; D. kust: Dan. kyst.] To approach; to draw near; to come side by side, or face to face. [JVo< in use.] 2. To speak first to; to address. Milton. Dryden, |
| ACCOURT | high | split_wh_words | no | ACCOURT, V. t. [See Court.] To entertain' witli courtesy. [Ao< used.] Spenser} |
| ACCUS'TOMARILY | high | replacement_marks | no | ACCUS'TOMARILY, adv. AcconUng to custom or common practice. [See Cus- ■" '; used.], a. Ui [See Ciistoman/.] [Little used. |
| ACETOUS | high | split_the | no | ACETOUS, a. [See Acid.] Sour; hke or having the nature of vinegar. Acetous acid is the term used by chimists for dis tilled vinegar. Tliis acid, in union with different bases, forms salts called acetites. |
| ACETUM | high | split_the | no | ACETUM, n. [L. See Add.] Vmegar; a sour liquor, obtained from vegetables dis solved in boiUng water, and from ferment ed and spirituous liquors, by expositig tliem to heat and air. This is called the acid or acetous fermenta tion. A€HE, V. i. ake. [Sax. ace, ece; Gr. axtu. to aclie or be in pain; a; |
| ACHIE'VANCE | high | split_the, hyphenated_scan_breaks | no | ACHIE'VANCE, n. Performance. Ehjol..'VCIIIE'VE, v.t. [Fr.ac/ieucr, to finish; Ann. acchui; old Fr. cJicver, to come to the end, from Fr. chef, the head or end; old Eng. cheve; Sp. and Port, acabar, from cabo, end, cnpe. See Chief.] 1. To i)erform, or execute; to accomplisli; to finish, or carry on t |
| ACIDIM'ETER | high | split_the | no | ACIDIM'ETER, n. [Acid and Or. nitf^ov, measure.] All instrument for ascertaining tlie strength of acids. Ure. |
| ACIIERN'ER | high | replacement_marks, hyphenated_scan_breaks | no | ACIIERN'ER, n. A star of the first magni- tude m the southern extremity of the con- stellation Eridanus. 2. In botfiny, the trivial name of a species of A€H'ER!SET, n. An ancient measure of ■■ ■ " ■ corn, supposed to be about eight bushels. Encyc. |
| ACIPENSER | high | split_the, hyphenated_scan_breaks | no | ACIPENSER, a. In ichthyology, a genus of fishes, of the order of chondropterygii, having an obtuse head; the mouth under the head, retractile and without teeth. To this genus belong the sturgeon, ster- let, huso, &c. Cyc \CIT'LI, n. A name of the water hare, or great crested grebe or diver. Diet, of |
| ACRO'MION | high | split_the, split_wh_words | no | ACRO'MION, n. [Gr. axpos, highest, and u/ios, shoulder.] In anatomy, tliat part of the spine of the scapula, whicli receives the extreme pan of the clavicle. Quj'ncT/. A€RON'I€, I a. [Gr. axpos, extreme, and A€RON'I€AL, S rul, night.] (n astronomy, a term applied to tlie rising of a star at sun set, |
| ACTIE'AN | high | split_the, hyphenated_scan_breaks | no | ACTIE'AN, a. Pertaining to Acliaia in Greece, and a celebrated league or con- federacy established there. Tliis State lay on the gulf of Corinth, within Pelopon- nesus. |
| AD | high | split_the, hyphenated_scan_breaks | no | AD. A Latin preposition, signifying to. It is probably from Heb. Ch. Syr. Sam. Eth. nn«, Ar. 4^;;^, to come near, to approach; from which root we may also deduce at. In composition, the last letter is usually changed into the first letter of the word to which it is prefixed. Thus for addamo, the Rom |
| AD'ELING | high | replacement_marks, hyphenated_scan_breaks | no | AD'ELING, n. A title of honor, given by our Saxon ancestors to the children of princes, and to young nobles. It is com- posed of adel, or rather eeth^l, the Teuton- ic term for noble, illustrious, and ling. young, posterity. Spclman. Sw. adelig '; D. edel; Ger. e'del and adelig, noble; Sp. hidalgo.  |
| AD'ENOID | high | replacement_marks, hyphenated_scan_breaks | no | AD'ENOID, a. [Gr. oSjjv, a gland, and ttSoj, form.] In the form of a gland; glandiform; glan- dulous; appUed to the prostate glands ADENOLOg'ICAL, a. Pertaining to the doctrine of the glands. Encyc. ADENOL'OgY, n. [Gr. aS^v, a gland, and ■Kayo;, discourse. In anatomy, the doctrine of the glands, the |
| AD'HIL | high | split_the | no | AD'HIL, n. A star of the sixth magnitude, upon the garment of Andromeda, under tlie last star in her foot. Encyc. |
| AD'IPOUS | high | split_the, hyphenated_scan_breaks | no | AD'IPOUS, S fat. Qu. Ch. tffSa, to grow fat; Heb. and Ch., fat, gross, stupid; Ar. i.il9 ) fat, bulky.] at. The adipose membrane is the cellular membrane, containing tlie fat in its cells, and consisting of ductile membranes, con- nected by a sort of net-work. The adipose vein spreads itsell' on the |
| ADAMANT'INE | high | split_the | no | ADAMANT'INE, a. Made of adamant; ha- ving the quaUties of adamant; that cannot be broken, dissolved, or penetrated; as adamantine bonds, or chains. Adamantine Spar, a genus of earths, of three varieties. The color of the first is gra)', with shades of brown or green; the form when regular, a hexangu |
| ADDORS'ED | high | split_the | no | ADDORS'ED, a. [L. ad and dorsum, tlie baclv.] Ill heraldry, having the backs turned to each other, as beasts. |
| ADENOGRAPHY | high | split_wh_words | no | ADENOGRAPHY, n. [Gr. aS,.-, a gland and ypa^u, to describe.] That part of anatomy wliich treats of the glands. |
| ADHE'RENCY | high | split_the | no | ADHE'RENCY, n. The same as adherence. In tlie sense oi'that which adheres, not le- gitimate. Decay of Piety |
| ADHE'RER | high | split_the | no | ADHE'RER, n. One tliat adiieres; an ad- herent. |
| ADJUDGE' | high | split_the, hyphenated_scan_breaks | no | ADJUDGE', V. t. [Fr. adjuger, from juge, judge. See Judge.] To decide, or determine, in tlie case of a con- troverted question; to decree by a judicial opinion; used appropriately of courts of law and equity. The case was adjudged in Hilary term. The prize was adjudged to the victor; a criminal was  |
| ADJUNCTIVE | high | split_wh_words | no | ADJUNCTIVE, a. Joining; having the quality of joining..ADJUNCTIVE, n That which is joined \DJUN€'TIVELY, adv. In an adjunctive manner. ADJUN€T'LY, adv. In comiection witli; consequently. |
| ADKIVTIC | high | split_the | no | ADKIVTIC, n. The Venetian Gulf; a (/iill'ilial washes tlie eastern side of Italy. |

## Guardrails

- Keep the original OCR file unchanged unless the source is re-imported from a better edition.
- Use reviewed overlays for doctrine-sensitive headwords.
- Use only conservative display cleanup for obvious OCR artifacts.
- Do not invent definitions when Webster data is missing or unclear.

