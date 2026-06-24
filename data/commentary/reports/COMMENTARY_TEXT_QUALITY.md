# Commentary Text Quality Audit

This report flags imported commentary rows that likely contain website navigation, previous/next links, table-of-contents footers, or other non-commentary wrapper text. It does not prove the commentary text itself is invalid; it identifies rows that need cleanup or source review before quotation.

## Summary

- Commentary files scanned: 131
- Commentary rows scanned: 9759
- Rows with quality flags: 67
- Files with quality flags: 2

## Files With Flags

| File | Flagged Rows | Total Rows | Issue Types |
| --- | ---: | ---: | --- |
| `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json` | 66 | 1189 | table-footer: 65; previous-next-footer: 66; editorial-footer: 66 |
| `data/commentary/staging/matthew-henry-complete-commentary-needs-review.json` | 1 | 1189 | table-footer: 1; previous-next-footer: 1 |

## Sample Rows

### Genesis 50 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 50
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 50 Ge 50:1-26 . M OURNING FOR J ACOB. 1. Joseph fell upon his father's face, &c.--On him, as the principal member of the family, devolved the duty of closing the eyes of his venerable parent (compare

### Exodus 40 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 90
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 40 Ex 40:1-38 . T HE T ABERNACLE R EARED AND A NOINTED. 2. On the first day of the first month --From a careful consideration of the incidents recorded to have happened after the exodus ( Ex 12:

### Leviticus 27 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 117
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 27 Le 27:1-18 . C ONCERNING V OWS. 2-8. When a man shall make a singular vow, &c.--Persons have, at all times and in all places, been accustomed to present votive offerings, either from gratitude for

### Numbers 36 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 153
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 36 Nu 36:1-13 . T HE I NCONVENIENCE OF THE I NHERITANCE. 1. the chief fathers of the families of the children of Gilead --Being the tribal governors in Manasseh, they consulted Moses on a case that

### Deuteronomy 34 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 187
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 34 De 34:1-12 . M OSES FROM M OUNT N EBO V IEWS THE L AND. 1. Moses went up from the plains of Moab --This chapter appears from internal evidence to have been written subsequently to the death of

### Joshua 24 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 211
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 24 Jos 24:1 . J OSHUA A SSEMBLING THE T RIBES. 1. Joshua gathered all the tribes of Israel to Shechem --Another and final opportunity of dissuading the people against idolatry is here described as t

### Judges 21 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 232
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 21 Jud 21:1-15 . T HE P EOPLE B EWAIL T HE D ESOLATION OF I SRAEL. 2-5. the people came to the house of God, . . . and lifted up their voices, and wept sore --The characteristic fickleness of th

### Ruth 4 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 236
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 4 Ru 4:1-5 . B OAZ C ALLS INTO J UDGMENT THE N EXT K INSMAN. 1. Then went Boaz up to the gate of the city --a roofed building, unenclosed by walls; the place where, in ancient times, and in many

### 1 Samuel 31 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 267
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 31 1Sa 31:1-7 . S AUL H AVING L OST H IS A RMY AT G ILBOA, AND H IS S ONS B EING S LAIN, H E AND H IS A RMOR-BEARER K ILL T HEMSELVES. 1. Now the Philistines fought against Israe

### 2 Samuel 24 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 291
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 24 2Sa 24:1-9 . D AVID N UMBERS THE P EOPLE. 1-4. again the anger of the Lord was kindled against Israel, and he moved David against them to say, Go, number Israel and Judah --"Again" carries us bac

### 1 Kings 22 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 313
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 22 1Ki 22:1-36 . A HAB S LAIN AT R AMOTH-GILEAD. 1. continued three years without war between Syria and Israel --The disastrous defeat of Ben-hadad had so destroyed his army and exhausted the resour

### 2 Kings 25 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 338
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 25 2Ki 25:1-3 . J ERUSALEM A GAIN B ESIEGED. 1. Nebuchadnezzar . . . came . . . against Jerusalem --Incensed by the revolt of Zedekiah, the Assyrian despot determined to put an end to the perfidious

### 1 Chronicles 29 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 367
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 29 1Ch 29:1-9 . D AVID C AUSES THE P RINCES AND P EOPLE TO O FFER FOR THE H OUSE OF G OD. 1, 2. Solomon . . . is yet young and tender --Though Solomon was very young when he was raised to the

### 2 Chronicles 36 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 403
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 36 2Ch 36:1-4 . J EHOAHAZ, S UCCEEDING, I S D EPOSED BY P HARAOH. 1. the people of the land took Jehoahaz --Immediately after Josiah's overthrow and death, the people raised to the throne Shallum

### Ezra 10 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 413
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 10 Ezr 10:1-17 . E ZRA R EFORMS THE S TRANGE M ARRIAGES. 1. Now when Ezra had prayed --As this prayer was uttered in public, while there was a general concourse of the people at the time of the ev

### Nehemiah 13 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 426
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 13 Ne 13:1-9 . U PON THE R EADING OF THE L AW S EPARATION I S M ADE FROM THE M IXED M ULTITUDE. 1. On that day --This was not immediately consequent on the dedication of the city wall and ga

### Esther 10 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 436
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 10 Es 10:1-3 . A HASUERUS' G REATNESS. M ORDECAI'S A DVANCEMENT. 1. Ahasuerus laid a tribute --This passage being an appendix to the history, and improperly separated from the preceding chapter, it

### Job 42 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 478
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 42 Job 42:1-6 . J OB'S P ENITENT R EPLY. 2. In the first clause he owns God to be omnipotent over nature, as contrasted with his own feebleness, which God had proved ( Job 40:15; 41:34 ); in the s

### Psalms 150 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 628
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: PSALM 150 Ps 150:1-6 . This is a suitable doxology for the whole book, reciting the "place, theme, mode, and extent of God's high praise." 1. in his sanctuary --on earth. firmament of his power --which illustra

### Proverbs 31 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 659
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 31 Pr 31:1-31 . 1. On the title of this, the sixth part of the book, see Introduction . prophecy --(See on Pr 30:1 ). 2. What, my son? --that is, What shall I say? Repetitions denote earnestness.

### Ecclesiastes 12 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 671
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 12 Ec 12:1-14 . 1. As Ec 11:9, 10 showed what youths are to shun, so this verse shows what they are to follow. Creator --"Remember" that thou art not thine own, but God's property; for He has create

### Solomon's Song 8 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 679
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 8 So 8:1-14 . 1. He had been a brother already. Why, then, this prayer here? It refers to the time after His resurrection, when the previous outward intimacy with Him was no longer allowed, but it was i

### Isaiah 66 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 745
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 66 Isa 66:1-24 . T HE H UMBLE C OMFORTED, THE U NGODLY C ONDEMNED, AT THE L ORD'S A PPEARING: J ERUSALEM M ADE A J OY ON E ARTH. This closing chapter is the summary of Isaiah's prophecie

### Jeremiah 52 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 797
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 52 Jer 52:1-34 . W RITTEN BY S OME O THER THAN J EREMIAH (P ROBABLY E ZRA ) AS AN H ISTORICAL S UPPLEMENT TO THE P REVIOUS P ROPHECIES (See on Jer 51:64 ). Jeremiah, having already (

### Lamentations 5 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 802
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER (ELEGY) 5 La 5:1-22 . E PIPHONEMA, OR A C LOSING R ECAPITULATION OF THE C ALAMITIES T REATED IN THE P REVIOUS E LEGIES. 1. ( Ps 89:50, 51 ). 2. Our inheritance --"Thine inheritance" ( Ps 7

### Ezekiel 48 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 850
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 48 Eze 48:1-35 . A LLOTMENT OF THE L AND TO THE S EVERAL T RIBES. 1. Dan --The lands are divided into portions of ideal exactness, running alongside of each other, the whole breadth from west to eas

### Daniel 12 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 862
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 12 Da 12:1-13 . C ONCLUSION OF THE V ISION (T ENTH THROUGH T WELFTH C HAPTERS ) AND E PILOGUE TO THE B OOK. Compare Da 12:4, 13 ; as Da 12:6, 7 refer to Da 7:25 , that is, to the t

### Hosea 14 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 876
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 14 Ho 14:1-9 . G OD'S P ROMISE OF B LESSING, ON T HEIR R EPENTANCE: T HEIR A BANDONMENT OF I DOLATRY F ORETOLD: T HE C ONCLUSION OF THE W HOLE, THE J UST S HALL W ALK IN G OD'S

### Joel 3 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 879
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 3 Joe 3:1-21 . G OD'S V ENGEANCE ON I SRAEL'S F OES IN THE V ALLEY OF J EHOSHAPHAT. H IS B LESSING ON THE C HURCH. 1. bring again the captivity --that is, reverse it. The Jews restrict thi

### Amos 9 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 888
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 9 Am 9:1-15 . F IFTH AND L AST V ISION. None can escape the coming judgment in any hiding-place: for God is omnipresent and irresistible ( Am 9:1-6 ). As a kingdom, Israel shall perish as if it ne

### Obadiah 1 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 889
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 1 Ob 1-21 . D OOM OF E DOM FOR C RUELTY TO J UDAH, E DOM'S B ROTHER; R ESTORATION OF THE J EWS. 1. Obadiah --that is, servant of Jehovah; same as Abdeel and Arabic Abd-allah. We --I and my

### Jonah 4 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 893
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 4 Jon 4:1-11 . J ONAH F RETS AT G OD'S M ERCY TO N INEVEH: I S R EPROVED BY THE T YPE OF A G OURD. 1. angry --literally, "hot," probably, with grief or vexation, rather than anger [F AIR

### Micah 7 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 900
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 7 Mic 7:1-20 . T HE U NIVERSALITY OF THE C ORRUPTION; THE C HOSEN R EMNANT, D RIVEN FROM E VERY H UMAN C ONFIDENCE, T URNS TO G OD ; T RIUMPHS BY F AITH OVER H ER E NEMIES; I S

### Nahum 3 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 903
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 3 Na 3:1-19 . R EPETITION OF N INEVEH'S D OOM, WITH N EW F EATURES; THE C AUSE I S H ER T YRANNY, R APINE, AND C RUELTY: N O-AMMON'S F ORTIFICATIONS D ID N OT S AVE H ER; I T

### Habakkuk 3 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 906
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 3 Hab 3:1-19 . H ABAKKUK'S P RAYER TO G OD: G OD'S G LORIOUS R EVELATION OF H IMSELF AT S INAI AND AT G IBEON, A P LEDGE OF H IS I NTERPOSING A GAIN IN B EHALF OF I SRAEL AGAINST

### Zephaniah 3 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 909
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 3 Zep 3:1-20 . R ESUMPTION OF THE D ENUNCIATION OF J ERUSALEM, AS B EING U NREFORMED BY THE P UNISHMENT OF O THER N ATIONS: A FTER H ER C HASTISEMENT J EHOVAH W ILL I NTERPOSE FOR

### Haggai 2 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 911
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 2 Hag 2:1-9 . S ECOND P ROPHECY. The people, discouraged at the inferiority of this temple to Solomon's, are encouraged nevertheless to persevere, because God is with them, and this house by its conne

### Zechariah 14 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 925
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 14 Zec 14:1-21 . L AST S TRUGGLE WITH THE H OSTILE W ORLD -P OWERS: M ESSIAH -J EHOVAH S AVES J ERUSALEM AND D ESTROYS THE F OE, OF W HOM THE R EMNANT T URNS TO THE L ORD R EIGNING A

### Malachi 4 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 929
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 4 Mal 4:1-6 . G OD'S C OMING J UDGMENT: T RIUMPH OF THE G ODLY: R ETURN TO THE LAW THE B EST P REPARATION FOR J EHOVAH'S C OMING: E LIJAH'S P REPARATORY M ISSION OF R EFORMATION.

### Matthew 28 - Jamieson-Fausset-Brown

- File: `data/commentary/staging/jamieson-fausset-brown-complete-commentary-needs-review.json`
- Row: 957
- Flags: Table-of-contents footer, Previous/next footer, External editor footer
- Preview: CHAPTER 28 Mt 28:1-15 . G LORIOUS A NGELIC A NNOUNCEMENT ON THE F IRST D AY OF THE W EEK, THAT C HRIST I S R ISEN --H IS A PPEARANCE TO THE W OMEN --T HE G UARDS B RIBED TO G IVE A F ALSE

## Current Mitigation

The app normalizes commentary entries at load time and strips known navigation prefixes/footers from display, listening, export, and search contexts. Public import files are also cleaned when wrappers can be removed without changing commentary wording; staging files remain available for source review.
