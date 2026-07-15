#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import verses1769 from "es-kjv/json/verses-1769.js";

const authorArg = valueFor("--author");
const sourceArg = valueFor("--source");
const refsArg = valueFor("--refs");
const outputArg = valueFor("--output");
const prunePublicConflicts = process.argv.includes("--prune-public-conflicts");
const dryRun = process.argv.includes("--dry-run");

if (!authorArg || !sourceArg || !refsArg || !outputArg) {
  console.error("Usage: node scripts/create-commentary-source-batch.mjs --author=Barnes --source=studylight-bnb --refs=\"John 1-5\" --output=data/imports/file.json [--prune-public-conflicts]");
  process.exit(1);
}

const bookOrder = Array.from(new Set(Object.keys(verses1769).map((reference) => reference.replace(/ \d+:\d+$/, ""))));
const verseEndByChapter = new Map();
for (const reference of Object.keys(verses1769)) {
  const match = reference.match(/^(.+) (\d+):(\d+)$/);
  if (!match) continue;
  const [, book, chapterRaw, verseRaw] = match;
  const key = `${book} ${Number(chapterRaw)}`;
  verseEndByChapter.set(key, Math.max(verseEndByChapter.get(key) ?? 0, Number(verseRaw)));
}

const sources = {
  "studylight-bnb": {
    author: "Albert Barnes",
    resourceTitle: "Barnes' Notes on the Bible",
    sourceTitle: "Barnes' Notes on the Whole Bible",
    abbr: "bnb",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Barnes died in 1870; source pages cite the work as 1870.",
    rightsBasis: "Public-domain StudyLight chapter pages for Barnes' Notes on the Whole Bible. Preserve chapter URL and do not mix with modern edited editions.",
    recommendedUse: "Use as a concise explanatory comparison after reading the KJV text and primary study helps.",
  },
  "studylight-acc": {
    author: "Adam Clarke",
    resourceTitle: "Adam Clarke's Commentary on the Bible",
    sourceTitle: "Clarke's Commentary",
    abbr: "acc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Source pages cite Clarke's commentary as 1832.",
    rightsBasis: "Public-domain StudyLight chapter pages for Clarke's Commentary. Preserve chapter URL and do not mix with modern edited editions.",
    recommendedUse: "Use as a Methodist historical comparison with visible discernment labels; keep Scripture primary.",
  },
  "studylight-mpc": {
    author: "Matthew Poole",
    resourceTitle: "Poole's English Annotations on the Holy Bible",
    sourceTitle: "Poole's Annotations",
    abbr: "mpc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Text Courtesy of BibleSupport.com. Used by Permission. Source pages cite Poole's annotations as 1685.",
    rightsBasis: "Public-domain StudyLight chapter pages for Matthew Poole's English Annotations. Preserve chapter URL and BibleSupport permission note; do not mix with modern edited editions.",
    recommendedUse: "Use as a concise Puritan-era explanatory comparison after reading the KJV text and primary study helps.",
  },
  "studylight-tpc": {
    author: "Joseph S. Exell and H. D. M. Spence-Jones",
    resourceTitle: "The Pulpit Commentary",
    sourceTitle: "The Pulpit Commentary",
    abbr: "tpc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Text Courtesy of BibleSupport.com. Used by Permission. Source pages cite The Pulpit Commentary as 1897.",
    rightsBasis: "Public-domain StudyLight chapter pages for The Pulpit Commentary. Preserve chapter URL and BibleSupport permission note; do not mix with modern edited editions.",
    recommendedUse: "Use as a larger homiletic and expository comparison source for teaching and preaching preparation.",
  },
  "studylight-tbi": {
    author: "Joseph S. Exell",
    resourceTitle: "The Biblical Illustrator",
    sourceTitle: "The Biblical Illustrator",
    abbr: "tbi",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Text Courtesy of BibleSupport.com. Used by Permission. Source pages cite The Biblical Illustrator as 1905-1909.",
    rightsBasis: "Public-domain StudyLight chapter pages for The Biblical Illustrator. Preserve chapter URL and BibleSupport permission note; do not mix with modern edited editions.",
    recommendedUse: "Use as a preaching and teaching illustration source, secondary to Scripture and doctrinally reviewed commentary.",
  },
  "studylight-isn": {
    author: "H. A. Ironside",
    resourceTitle: "Ironside's Notes on Selected Books",
    sourceTitle: "Ironside's Notes on Selected Books",
    abbr: "isn",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Text Courtesy of BibleSupport.com. Used by Permission.",
    rightsBasis: "Public-domain StudyLight chapter pages for Ironside's Notes on Selected Books. Preserve chapter URL and BibleSupport permission note; do not mix with modern edited editions.",
    recommendedUse: "Use as a clear expository and preaching-oriented comparison voice after reading the KJV text and reviewed cross references.",
  },
  "studylight-gcm": {
    author: "G. Campbell Morgan",
    resourceTitle: "Morgan's Exposition on the Whole Bible",
    sourceTitle: "Morgan's Exposition on the Bible",
    abbr: "gcm",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. Text Courtesy of BibleSupport.com. Used by Permission.",
    rightsBasis: "Public-domain StudyLight chapter pages for Morgan's Exposition on the Bible. Preserve chapter URL and BibleSupport permission note; do not mix with modern edited editions.",
    recommendedUse: "Use as a concise expository overview for pastors and teachers, especially for tracing the chapter's flow before consulting larger homiletic works.",
  },
  "studylight-wen": {
    author: "John Wesley",
    resourceTitle: "Wesley's Explanatory Notes on the Whole Bible",
    sourceTitle: "Wesley's Explanatory Notes",
    abbr: "wen",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain and are a derivative of an electronic edition available on the Christian Classics Ethereal Library Website. Source pages cite Wesley's Explanatory Notes on the Whole Bible as 1765.",
    rightsBasis: "Public-domain StudyLight chapter pages for Wesley's Explanatory Notes. Preserve chapter URL and CCEL derivative note; do not mix with modern edited editions.",
    recommendedUse: "Use as compact Methodist historical notes after the KJV text, with doctrinal discernment labels visible.",
  },
  "studylight-phc": {
    author: "Walter Baxendale",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Ruth",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Ruth volume identifies Walter Baxendale as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on Ruth. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for sermon outlines, teaching structure, applications, and historical homiletical comparison after reading the KJV text.",
  },
  "studylight-phc-ecclesiastes": {
    author: "Thomas H. Leale",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Ecclesiastes",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Ecclesiastes volume identifies Thomas H. Leale as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on Ecclesiastes. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for sermon outlines, teaching structure, applications, and historical homiletical comparison after reading the KJV text.",
  },
  "studylight-phc-song-of-solomon": {
    author: "Thomas Robinson",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on the Song of Solomon",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Song of Solomon volume identifies Thomas Robinson as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on the Song of Solomon. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for sermon outlines, teaching structure, devotional applications, and historical homiletical comparison after reading the KJV text. Compare allegorical conclusions carefully with Scripture.",
  },
  "studylight-phc-minor-prophets": {
    author: "James Wolfendale",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on the Minor Prophets",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Minor Prophets volume identifies James Wolfendale as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on the Minor Prophets. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for prophetic-book teaching structure, sermon outlines, applications, and historical homiletical comparison after reading the KJV text and cross references.",
  },
  "studylight-phc-job": {
    author: "Thomas Robinson",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Job",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Job volume identifies Thomas Robinson as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on Job. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching structure, sermon outlines, pastoral applications, and historical homiletical comparison after reading the KJV text and cross references.",
  },
  "studylight-phc-judges": {
    author: "J. P. Millar",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Judges",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Judges volume identifies Rev. J. P. Millar as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on Judges. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for historical-book teaching structure, sermon outlines, practical applications, and homiletical comparison after reading the KJV text and cross references.",
  },
  "studylight-phc-lamentations": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Lamentations",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Lamentations volume identifies Rev. George Barlow as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on Lamentations. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching lament, judgment, hope, prayer, sermon structure, and pastoral application after reading the KJV text and cross references.",
  },
  "studylight-phc-hebrews": {
    author: "Robert Tuck",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Hebrews",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Hebrews volume identifies Rev. Robert Tuck as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on Hebrews. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christ's priesthood, covenant themes, faith, endurance, sermon structure, and pastoral application after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-james": {
    author: "Robert Tuck",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on James",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The James volume identifies Rev. Robert Tuck as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on James. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for practical teaching on trials, faith and works, speech, prayer, sermon structure, and Christian conduct after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-1-peter": {
    author: "Robert Tuck",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 1 Peter",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The 1 Peter volume identifies Rev. Robert Tuck as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on 1 Peter. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christian hope, holiness, suffering, pastoral care, sermon structure, and practical conduct after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-2-peter": {
    author: "Robert Tuck",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 2 Peter",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The 2 Peter volume identifies Rev. Robert Tuck as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on 2 Peter. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christian growth, false teaching, prophecy, Christ's return, sermon structure, and practical conduct after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-philippians": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Philippians",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Philippians volume identifies Rev. George Barlow as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on Philippians. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christian joy, humility, service, perseverance, contentment, sermon structure, and practical conduct after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-colossians": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Colossians",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Colossians volume identifies Rev. George Barlow as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on Colossians. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christ's preeminence, spiritual fullness, Christian conduct, family relationships, sermon structure, and practical application after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-ephesians": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Ephesians",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Ephesians volume identifies Rev. George Barlow as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on Ephesians. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching salvation by grace, the church, Christian unity, practical conduct, family relationships, spiritual warfare, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-galatians": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Galatians",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The Galatians volume identifies Rev. George Barlow as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on Galatians. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching justification by faith, Christian liberty, the law and grace, spiritual fruit, practical conduct, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-1-thessalonians": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 1 Thessalonians",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The 1 Thessalonians volume identifies Rev. George Barlow as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on 1 Thessalonians. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christian testimony, sanctification, pastoral care, Christ's return, comfort, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-2-thessalonians": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 2 Thessalonians",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The 2 Thessalonians volume identifies Rev. George Barlow as author and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages for the Preacher's Complete Homiletical Commentary on 2 Thessalonians. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching perseverance, Christ's return, the day of the Lord, doctrinal stability, Christian work, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-1-timothy": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 1 Timothy",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. George Barlow as author of the 1 Timothy commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on 1 Timothy. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for pastoral teaching, church order, sound doctrine, prayer, Christian character, ministry leadership, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-2-timothy": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 2 Timothy",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. George Barlow as author of the 2 Timothy commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on 2 Timothy. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for pastoral endurance, Scripture, discipleship, faithful ministry, false teaching, Christian service, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-titus": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Titus",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. George Barlow as author of the Titus commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Titus. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for church leadership, sound doctrine, grace, good works, Christian conduct, pastoral instruction, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-philemon": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Philemon",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. George Barlow as author of the Philemon commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter page and title page for the Preacher's Complete Homiletical Commentary on Philemon. Preserve the chapter URL and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching forgiveness, reconciliation, Christian brotherhood, practical grace, pastoral appeal, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-1-john": {
    author: "Robert Tuck",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 1 John",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Robert Tuck as author of the 1 John commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on 1 John. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching fellowship, assurance, obedience, love, discernment, Christ's person, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-2-john": {
    author: "Robert Tuck",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 2 John",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Robert Tuck as author of the 2 John commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter page and title page for the Preacher's Complete Homiletical Commentary on 2 John. Preserve the chapter URL and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching truth, love, obedience, doctrinal discernment, Christian hospitality, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-3-john": {
    author: "Robert Tuck",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 3 John",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Robert Tuck as author of the 3 John commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter page and title page for the Preacher's Complete Homiletical Commentary on 3 John. Preserve the chapter URL and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching faithful service, hospitality, church leadership, Christian testimony, practical truth, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-jude": {
    author: "Robert Tuck",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Jude",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Robert Tuck as author of the Jude commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter page and title page for the Preacher's Complete Homiletical Commentary on Jude. Preserve the chapter URL and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching discernment, false teachers, contending for the faith, Christian perseverance, mercy, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-revelation": {
    author: "Robert Tuck",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Revelation",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Robert Tuck as author of the Revelation commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Revelation. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christ's glory, the churches, worship, judgment, perseverance, prophecy, final victory, and sermon structure after reading the KJV text and cross references. Label interpretive positions and compare prophetic conclusions carefully with Scripture.",
  },
  "studylight-phc-romans": {
    author: "W. Burrows",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Romans",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. Burrows, M.A., as author of the Romans commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Romans. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching the gospel, sin, justification by faith, sanctification, Israel, Christian service, church unity, practical conduct, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-1-corinthians": {
    author: "Henry J. Foster",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 1 Corinthians",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Henry J. Foster as author of the Corinthian commentaries and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and shared Corinthian volume title page for the Preacher's Complete Homiletical Commentary on 1 Corinthians. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching church unity, discipline, Christian liberty, spiritual gifts, love, worship, resurrection, practical conduct, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-2-corinthians": {
    author: "Henry J. Foster",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on 2 Corinthians",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Henry J. Foster as author of the Corinthian commentaries and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and shared Corinthian volume title page for the Preacher's Complete Homiletical Commentary on 2 Corinthians. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching comfort, ministry, Christian character, reconciliation, separation, giving, spiritual conflict, apostolic service, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-acts": {
    author: "Thomas Whitelaw",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Acts",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The 1892 Funk & Wagnalls catalog and volume record identify Rev. Thomas Whitelaw as author of the Acts commentary.",
    rightsBasis: "Public-domain StudyLight chapter pages plus the 1892 volume catalog attribution for the Preacher's Complete Homiletical Commentary on Acts. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching the early church, the Holy Spirit's ministry, evangelism, missions, persecution, conversion, apostolic preaching, church growth, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-matthew": {
    author: "W. Sunderland Lewis and Henry M. Booth",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Matthew",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. Sunderland Lewis, M.A., and Rev. Henry M. Booth as joint authors of the Matthew commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Matthew. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christ's person and kingdom, discipleship, the Sermon on the Mount, parables, miracles, the cross, resurrection, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-mark": {
    author: "John Henry Burn",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Mark",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. John Henry Burn, B.D., as author of the Mark commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Mark. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christ's servant ministry, discipleship, miracles, opposition, the cross, resurrection, evangelism, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-luke": {
    author: "J. Willcock",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Luke",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. J. Willcock, B.D., as author of the Luke commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Luke. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christ's humanity and saving mission, prayer, compassion, parables, discipleship, the cross, resurrection, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-john": {
    author: "W. Frank Scott",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on John",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. Frank Scott as author of the John commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on John. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Christ's deity, the new birth, belief, eternal life, the signs, the upper-room teaching, the cross, resurrection, pastoral application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-genesis-exell": {
    author: "Joseph S. Exell",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Genesis, Chapters 1-8",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Joseph S. Exell, M.A., as author of Genesis chapters 1-8 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Genesis 1-8. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching creation, the fall, the promise of redemption, early human history, the flood, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-genesis-leale": {
    author: "Thomas H. Leale",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Genesis, Chapters 9-50",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Thomas H. Leale, A.K.C., as author of Genesis chapters 9-50 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Genesis 9-50. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching the nations, Abrahamic promises, the patriarchs, providence, covenant history, Joseph, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-exodus": {
    author: "Joseph S. Exell",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Exodus",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Joseph S. Exell, M.A., as author of the Exodus commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Exodus. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching redemption, the Passover, deliverance, the law, covenant responsibility, the tabernacle, worship, God's presence, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-leviticus": {
    author: "W. Harvey Jellie with Frederick W. Brown",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Leviticus",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. Harvey Jellie as author of the Leviticus commentary, assisted in the homiletics by Rev. Frederick W. Brown, and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Leviticus. Preserve chapter URLs and both contributor names; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching holiness, sacrifice, priesthood, cleansing, worship, the feasts, covenant responsibility, practical application, and sermon structure after reading the KJV text and cross references. Compare typological and interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-numbers": {
    author: "William Jones",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Numbers",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. William Jones, D.D., as author of the Numbers commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Numbers. Preserve chapter URLs and do not mix with modern edited editions.",
    recommendedUse: "Use for teaching wilderness testing, faith, rebellion, priestly service, God's guidance, covenant responsibility, preparation for the land, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-deuteronomy": {
    author: "James Wolfendale",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Deuteronomy",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. James Wolfendale as author of the Deuteronomy commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Deuteronomy. Preserve chapter URLs and do not substitute StudyLight's generic editor label for the title-page author; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching covenant renewal, obedience, remembrance, worship, leadership, blessings and judgments, preparation for the land, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-joshua": {
    author: "F. G. Marchant",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Joshua",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. F. G. Marchant as author of the Joshua commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Joshua. Preserve chapter URLs and do not substitute StudyLight's generic editor label for the title-page author; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching courage, obedience, conquest, covenant faithfulness, inheritance, leadership, memorials, worship, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-samuel": {
    author: "W. Harris",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on the First and Second Books of Samuel",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. Harris as author of the commentary on the First and Second Books of Samuel and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on the First and Second Books of Samuel. Preserve chapter URLs and do not substitute StudyLight's generic editor label for the title-page author; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching prayer, prophetic ministry, spiritual leadership, kingship, obedience, failure, repentance, covenant faithfulness, David's preparation and reign, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-kings": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on the First and Second Books of Kings",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. George Barlow as author of the commentary on the First and Second Books of Kings and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on the First and Second Books of Kings. Preserve chapter URLs and do not substitute StudyLight's generic editor label for the title-page author; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching Solomon, the temple, the divided kingdom, Elijah, Elisha, prophetic ministry, revival, idolatry, judgment, covenant faithfulness, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-chronicles": {
    author: "James Wolfendale",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on the First and Second Books of Chronicles",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. James Wolfendale as author of the commentary on the First and Second Books of Chronicles and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on the First and Second Books of Chronicles. Preserve chapter URLs and do not substitute StudyLight's generic editor label for the title-page author; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching biblical history, genealogies, Davidic worship, temple preparation, priestly service, the kings of Judah, revival, judgment, restoration, covenant faithfulness, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-ezra": {
    author: "William Jones",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Ezra",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. William Jones, D.D., as author of the Ezra commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Ezra. Preserve chapter URLs and do not substitute StudyLight's generic editor label for the title-page author; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching return from captivity, rebuilding worship and the temple, opposition, providence, prayer, Scripture, separation, reform, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-nehemiah": {
    author: "W. H. Booth, J. H. Goodman, and S. Gregory",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Nehemiah",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. H. Booth, Rev. J. H. Goodman, and Rev. S. Gregory as authors of the Nehemiah commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Nehemiah. Preserve chapter URLs and all three contributor names; do not substitute StudyLight's generic editor label for the title-page authors or mix with modern edited editions.",
    recommendedUse: "Use for teaching prayer, leadership, rebuilding, opposition, vigilance, justice, Scripture reading, confession, covenant renewal, worship, reform, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-esther": {
    author: "W. Burrows",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Esther",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. Burrows, M.A., as author of the Esther commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Esther. Preserve chapter URLs and do not substitute StudyLight's generic editor label for the title-page author; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching providence, courage, fasting, deliverance, reversal, faithful influence, the preservation of God's people, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-daniel": {
    author: "Thomas Robinson",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Daniel",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Thomas Robinson, D.D., as author of the Daniel commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Daniel. Preserve chapter URLs and do not substitute StudyLight's generic editor label for the title-page author; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching faithfulness in exile, prayer, God's sovereignty over kingdoms, prophecy, the Messiah, resurrection, final judgment, practical application, and sermon structure after reading the KJV text and cross references. Present prophetic conclusions as historical commentary and compare them carefully with Scripture.",
  },
  "studylight-phc-proverbs": {
    author: "W. Harris",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Proverbs",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. Harris as author of the Proverbs commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Proverbs. Preserve chapter URLs and do not substitute StudyLight's generic editor label for the title-page author; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching wisdom, the fear of the Lord, speech, diligence, family life, relationships, stewardship, purity, leadership, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-jeremiah": {
    author: "W. Harvey Jellie",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Jeremiah",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. Harvey Jellie as author of the Jeremiah commentary and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Jeremiah. Preserve chapter URLs and do not substitute StudyLight's generic editor label for the title-page author; do not mix with modern edited editions.",
    recommendedUse: "Use for teaching prophetic calling, repentance, covenant unfaithfulness, judgment, pastoral sorrow, courage, the righteous Branch, the new covenant, restoration, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-ezekiel-1-11": {
    author: "D. G. Watt",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Ezekiel",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. D. G. Watt, M.A., as author of Ezekiel chapters 1-11 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Ezekiel. Preserve chapter URLs and the documented chapters 1-11 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching God's glory, prophetic calling, the watchman's responsibility, judgment, idolatry, God's departing glory, restoration hope, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-ezekiel-12-29": {
    author: "Thomas H. Leale",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Ezekiel",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Thomas H. Leale, A.K.C., as author of Ezekiel chapters 12-29 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Ezekiel. Preserve chapter URLs and the documented chapters 12-29 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching personal responsibility, false prophecy, covenant unfaithfulness, repentance, judgment on Jerusalem and the nations, restoration hope, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-ezekiel-30-48": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Ezekiel",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. George Barlow as author of Ezekiel chapters 30-48 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Ezekiel. Preserve chapter URLs and the documented chapters 30-48 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching the watchman, the true Shepherd, Israel's restoration, the dry bones, Gog, the restored temple, worship, the river of life, practical application, and sermon structure after reading the KJV text and cross references. Present prophetic conclusions as historical commentary and compare them carefully with Scripture.",
  },
  "studylight-phc-psalms-1-25": {
    author: "W. L. Watkinson",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. L. Watkinson as author of Psalms 1-25 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 1-25 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching the blessed life, God's Anointed King, prayer, repentance, worship, creation, God's law, suffering, messianic prophecy, trust, the Shepherd, the King of glory, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-26-35": {
    author: "W. Forsyth",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. W. Forsyth as author of Psalms 26-35 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 26-35 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching integrity, worship, prayer, confidence in God, consecration, forgiveness, guidance, praise, creation, God's providence, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-36-38": {
    author: "Joseph S. Exell",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. Joseph S. Exell as author of Psalms 36-38 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 36-38 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching human sinfulness, God's mercy and faithfulness, delight in God, patient trust, repentance, suffering, prayer, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-39-50": {
    author: "William Jones",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. William Jones as author of Psalms 39-87 and Funk & Wagnalls as the 1892 publisher; this reviewed batch contains Psalms 39-50.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 39-87 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching life's brevity, prayer, hope, deliverance, spiritual longing, God's reign, refuge, worship, the city of God, providence, true riches, acceptable worship, repentance, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-51-65": {
    author: "William Jones",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. William Jones as author of Psalms 39-87 and Funk & Wagnalls as the 1892 publisher; this reviewed batch contains Psalms 51-65.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 39-87 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching confession, repentance, cleansing, forgiveness, trust, betrayal, prayer, justice, fear, praise, spiritual thirst, God's protection, worship, providence, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-66-75": {
    author: "William Jones",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. William Jones as author of Psalms 39-87 and Funk & Wagnalls as the 1892 publisher; this reviewed batch contains Psalms 66-75.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 39-87 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching praise, God's mighty works, answered prayer, righteous judgment, blessing, worship, the afflicted, sanctuary perspective, God's sovereignty, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-76-87": {
    author: "William Jones",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. William Jones as author of Psalms 39-87 and Funk & Wagnalls as the 1892 publisher; this reviewed batch contains Psalms 76-87.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 39-87 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching God's judgment, remembrance, covenant history, spiritual leadership, restoration, worship, prayer, pilgrimage, the city of God, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-88-99": {
    author: "William Jones",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. William Jones as author of Psalms 88-109 and Funk & Wagnalls as the 1892 publisher; this reviewed batch contains Psalms 88-99.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 88-109 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching lament, covenant promises, God's eternity, life's brevity, protection, worship, God's kingship, praise, righteous judgment, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-100-109": {
    author: "William Jones",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. William Jones as author of Psalms 88-109 and Funk & Wagnalls as the 1892 publisher; this reviewed batch contains Psalms 100-109.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 88-109 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching joyful worship, thanksgiving, God's mercy, holy leadership, prayer in affliction, creation, providence, covenant faithfulness, praise, deliverance, imprecatory prayer, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-110-120": {
    author: "J. W. Burn",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. J. W. Burn as author of Psalms 110-120 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 110-120 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching the Messiah's priest-kingship, praise, providence, redemption, the blessed life, deliverance, worship, God's law, pilgrimage, prayer, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-121-130": {
    author: "George Barlow",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. George Barlow as author of Psalms 121-130 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 121-130 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching God's preservation, worship, peace, trust, deliverance, family blessing, labour, repentance, waiting on God, redemption, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "studylight-phc-psalms-131-150": {
    author: "William Jones",
    resourceTitle: "The Preacher's Complete Homiletical Commentary on Psalms",
    sourceTitle: "The Preacher's Complete Homiletical Commentary",
    abbr: "phc",
    publicDomainStatus: "StudyLight chapter pages state: These files are public domain. The title page identifies Rev. William Jones as author of Psalms 131-150 and Funk & Wagnalls as the 1892 publisher.",
    rightsBasis: "Public-domain StudyLight chapter pages and title page for the Preacher's Complete Homiletical Commentary on Psalms. Preserve chapter URLs and the documented Psalms 131-150 authorship; do not substitute StudyLight's generic editor label or mix with modern edited editions.",
    recommendedUse: "Use for teaching humility, covenant hope, unity, worship, remembrance, thanksgiving, God's omniscience, deliverance, prayer, righteous living, universal praise, practical application, and sermon structure after reading the KJV text and cross references. Compare interpretive conclusions carefully with Scripture.",
  },
  "ccel-wesley-xml": {
    author: "John Wesley",
    resourceTitle: "Wesley's Notes on the Bible",
    sourceTitle: "Wesley's Notes on the Bible",
    sourceUrl: "https://www.ccel.org/ccel/w/wesley/notes.xml",
    xmlUrl: "https://www.ccel.org/ccel/w/wesley/notes.xml",
    publicDomainStatus: "CCEL XML metadata lists Wesley's Notes on the Bible as Public Domain.",
    rightsBasis: "Public-domain CCEL ThML/XML source for Wesley's Notes on the Bible. Preserve CCEL source URL and perspective labels.",
    recommendedUse: "Use as compact Methodist historical notes after the KJV text, with doctrinal discernment labels visible.",
  },
};

const source = sources[sourceArg];
if (!source) throw new Error(`Unsupported source: ${sourceArg}`);
if (authorArg !== source.author && authorArg.toLowerCase() !== source.author.toLowerCase()) {
  throw new Error(`Author/source mismatch. ${sourceArg} is configured for ${source.author}.`);
}

const targetRefs = parseReferenceList(refsArg);
const rows = sourceArg.startsWith("studylight")
  ? await buildStudyLightRows(source, targetRefs)
  : await buildWesleyRows(source, targetRefs);

const publicImportFiles = await findPublicCommentaryImportFiles();
const reviewedKeys = new Set(rows.map(publicKey));
const duplicateConflicts = [];
const prunedFiles = [];

for (const filePath of publicImportFiles) {
  if (path.resolve(filePath) === path.resolve(outputArg)) continue;
  const existingRows = JSON.parse(await readFile(filePath, "utf8"));
  if (!Array.isArray(existingRows)) continue;
  const keptRows = existingRows.filter((row) => !reviewedKeys.has(publicKey(row)));
  const removedCount = existingRows.length - keptRows.length;
  if (!removedCount) continue;
  duplicateConflicts.push({ filePath, removedCount });
  if (prunePublicConflicts && !dryRun) {
    await writeFile(filePath, `${JSON.stringify(keptRows, null, 2)}\n`);
    prunedFiles.push({ filePath, removedCount });
  }
}

if (duplicateConflicts.length && !prunePublicConflicts) {
  console.error("Duplicate public commentary conflicts found. Re-run with --prune-public-conflicts after reviewing removals.");
  console.table(duplicateConflicts);
  process.exit(1);
}

if (!dryRun) {
  await mkdir(path.dirname(outputArg), { recursive: true });
  await writeFile(outputArg, `${JSON.stringify(rows, null, 2)}\n`);
}

console.log(`${dryRun ? "Dry run OK" : "Created"} source commentary batch.`);
console.table({
  author: source.author,
  source: sourceArg,
  chapters: rows.length,
  output: outputArg,
  public_conflict_files: duplicateConflicts.length,
  pruned_files: prunedFiles.length,
});
if (duplicateConflicts.length) console.table(duplicateConflicts);

async function buildStudyLightRows(sourceConfig, references) {
  const rows = [];
  for (const reference of references) {
    const [book, chapterRaw] = splitChapterReference(reference);
    const chapter = Number(chapterRaw);
    const sourceUrl = `https://www.studylight.org/commentaries/eng/${sourceConfig.abbr}/${studyLightBookSlug(book)}-${chapter}.html`;
    const entryText = await fetchCompleteStudyLightCommentary(sourceConfig, sourceUrl);
    rows.push(buildRow({ sourceConfig, book, chapter, sourceUrl, entryText }));
  }
  return rows;
}

async function fetchCompleteStudyLightCommentary(sourceConfig, sourceUrl, attempts = 3) {
  const minimumLength = sourceConfig.abbr === "tbi" ? 1000 : 120;
  let lastLength = 0;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetchWithTransientRetry(sourceUrl);
    if (!response.ok) throw new Error(`Failed ${response.status}: ${sourceUrl}`);
    const html = await response.text();
    if (!/These files are public domain/i.test(html)) throw new Error(`Missing public-domain statement: ${sourceUrl}`);
    const entryText = normalizeText(cleanStudyLightText(htmlToText(extractStudyLightCommentary(html))));
    lastLength = entryText.length;
    if (lastLength >= minimumLength) return entryText;
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
  }

  throw new Error(`Incomplete commentary text extracted (${lastLength} characters): ${sourceUrl}`);
}

async function fetchWithTransientRetry(url, attempts = 3) {
  let response;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    response = await fetch(url);
    if (response.ok || response.status < 500 || attempt === attempts) return response;
    await new Promise((resolve) => setTimeout(resolve, attempt * 750));
  }
  return response;
}

async function buildWesleyRows(sourceConfig, references) {
  const response = await fetch(sourceConfig.xmlUrl);
  if (!response.ok) throw new Error(`Failed ${response.status}: ${sourceConfig.xmlUrl}`);
  const xml = await response.text();
  if (!/<DC\.Rights>Public Domain<\/DC\.Rights>/i.test(xml)) throw new Error("Missing CCEL public-domain rights statement in Wesley XML.");
  const chapterSections = extractWesleyChapterSections(xml);
  return references.map((reference) => {
    const [book, chapterRaw] = splitChapterReference(reference);
    const chapter = Number(chapterRaw);
    const entryText = chapterSections.get(`${book} ${chapter}`);
    if (!entryText) throw new Error(`Missing Wesley XML commentary section: ${book} ${chapter}`);
    return buildRow({
      sourceConfig,
      book,
      chapter,
      sourceUrl: `${sourceConfig.sourceUrl}#${slugify(book)}-${chapter}`,
      entryText,
    });
  });
}

function extractStudyLightCommentary(html) {
  const start = html.indexOf("<div class=\"commentaries-entries\">");
  const end = html.indexOf("<div class=\"clear-both copyright\">");
  if (start < 0 || end < start) return "";
  const commentaryArea = html.slice(start, end);
  const firstEntry = commentaryArea.indexOf("<div class=\"commentaries-entry-div\">");
  const entriesOnly = firstEntry >= 0 ? commentaryArea.slice(firstEntry) : commentaryArea;
  const navigationIndex = entriesOnly.search(/<div class="nav-links\b/i);
  const commentaryOnly = navigationIndex >= 0 ? entriesOnly.slice(0, navigationIndex) : entriesOnly;
  return commentaryOnly
    .replace(/<div class="return-to-top-div">[\s\S]*?<\/div>/gi, " ")
    .replace(/<div class="floating-resources">[\s\S]*?<\/div>\s*<\/div>/i, " ")
    .replace(/<div id="navigation"[\s\S]*?<\/div>\s*<\/div>/i, " ");
}

function extractWesleyChapterSections(xml) {
  const sections = new Map();
  const matches = Array.from(xml.matchAll(/<div3\b[^>]*>[\s\S]*?<scripCom\b[^>]*osisRef="Bible:([^."]+)\.(\d+)(?:\.\d+)?"[^>]*\/>[\s\S]*?(?=<div3\b|<\/div2>|<\/div1>)/g));
  const osisToBook = new Map(bookOrder.map((book) => [osisBook(book), book]));

  for (const match of matches) {
    const osis = match[1];
    const chapter = Number(match[2]);
    const book = osisToBook.get(osis);
    if (!book) continue;
    const entryText = normalizeText(htmlToText(match[0]));
    if (entryText) sections.set(`${book} ${chapter}`, entryText);
  }

  return sections;
}

function buildRow({ sourceConfig, book, chapter, sourceUrl, entryText }) {
  const verseEnd = verseEndByChapter.get(`${book} ${chapter}`) ?? 1;
  return {
    id: `${slugify(sourceConfig.author)}-${slugify(book)}-${chapter}-phase-3-reviewed`,
    reference: `${book} ${chapter}`,
    book,
    chapter,
    verse_start: 1,
    verse_end: verseEnd,
    author: sourceConfig.author,
    resource_title: sourceConfig.resourceTitle,
    source_title: sourceConfig.sourceTitle,
    source_url: sourceUrl,
    public_domain_status: sourceConfig.publicDomainStatus,
    rights_basis: sourceConfig.rightsBasis,
    recommended_use: sourceConfig.recommendedUse,
    entry_text: entryText,
    review_status: "Verified",
    import_status: "Public Verified",
    review_batch: "Commentary Expansion Phase 3",
    review_notes: "Chapter source, public-domain statement, and reference metadata reviewed for this expansion batch.",
  };
}

function valueFor(name) {
  const argument = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return argument?.slice(name.length + 1);
}

function parseReferenceList(value) {
  return value
    .split(",")
    .flatMap((part) => {
      const trimmed = part.trim();
      const match = trimmed.match(/^(.+?)\s+(\d+)(?:-(\d+))?$/);
      if (!match) throw new Error(`Invalid reference range: ${trimmed}`);
      const [, bookRaw, startRaw, endRaw] = match;
      const book = normalizeBookName(bookRaw);
      const start = Number(startRaw);
      const end = Number(endRaw ?? startRaw);
      const references = [];
      for (let chapter = start; chapter <= end; chapter += 1) references.push(`${book} ${chapter}`);
      return references;
    });
}

function normalizeBookName(value) {
  const compact = String(value).trim().replace(/\s+/g, " ").toLowerCase();
  const book = bookOrder.find((candidate) => candidate.toLowerCase() === compact);
  if (!book) throw new Error(`Unknown Bible book: ${value}`);
  return book;
}

function splitChapterReference(reference) {
  const match = reference.match(/^(.+) (\d+)$/);
  if (!match) throw new Error(`Invalid chapter reference: ${reference}`);
  return [match[1], match[2]];
}

function studyLightBookSlug(book) {
  if (book === "Solomon's Song") return "song-of-solomon";
  return book.toLowerCase().replace(/^\d /, (value) => value.trim()).replace(/\s+/g, "-");
}

function osisBook(book) {
  const special = {
    Genesis: "Gen",
    Exodus: "Exod",
    Leviticus: "Lev",
    Numbers: "Num",
    Deuteronomy: "Deut",
    Joshua: "Josh",
    Judges: "Judg",
    Ruth: "Ruth",
    "1 Samuel": "1Sam",
    "2 Samuel": "2Sam",
    "1 Kings": "1Kgs",
    "2 Kings": "2Kgs",
    "1 Chronicles": "1Chr",
    "2 Chronicles": "2Chr",
    Ezra: "Ezra",
    Nehemiah: "Neh",
    Esther: "Esth",
    Job: "Job",
    Psalms: "Ps",
    Proverbs: "Prov",
    Ecclesiastes: "Eccl",
    "Solomon's Song": "Song",
    Isaiah: "Isa",
    Jeremiah: "Jer",
    Lamentations: "Lam",
    Ezekiel: "Ezek",
    Daniel: "Dan",
    Hosea: "Hos",
    Joel: "Joel",
    Amos: "Amos",
    Obadiah: "Obad",
    Jonah: "Jonah",
    Micah: "Mic",
    Nahum: "Nah",
    Habakkuk: "Hab",
    Zephaniah: "Zeph",
    Haggai: "Hag",
    Zechariah: "Zech",
    Malachi: "Mal",
    Matthew: "Matt",
    Mark: "Mark",
    Luke: "Luke",
    John: "John",
    Acts: "Acts",
    Romans: "Rom",
    "1 Corinthians": "1Cor",
    "2 Corinthians": "2Cor",
    Galatians: "Gal",
    Ephesians: "Eph",
    Philippians: "Phil",
    Colossians: "Col",
    "1 Thessalonians": "1Thess",
    "2 Thessalonians": "2Thess",
    "1 Timothy": "1Tim",
    "2 Timothy": "2Tim",
    Titus: "Titus",
    Philemon: "Phlm",
    Hebrews: "Heb",
    James: "Jas",
    "1 Peter": "1Pet",
    "2 Peter": "2Pet",
    "1 John": "1John",
    "2 John": "2John",
    "3 John": "3John",
    Jude: "Jude",
    Revelation: "Rev",
  };
  if (special[book]) return special[book];
  return book.replace(/\s+/g, "");
}

async function findPublicCommentaryImportFiles() {
  const files = await readdir("data/imports");
  return files
    .filter((file) => file.endsWith(".json") && file.includes("commentary"))
    .map((file) => path.join("data/imports", file))
    .sort();
}

function publicKey(row) {
  return [row.book, row.chapter, row.verse_start, row.verse_end, row.author, row.resource_title].join("|");
}

function htmlToText(html) {
  return decodeEntities(String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li|tr|ol|ul)>/gi, "\n")
    .replace(/<[^>]+>/g, " "));
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&mdash;/gi, " - ")
    .replace(/&ndash;/gi, " - ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, " ");
}

function normalizeText(value) {
  return String(value)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cleanStudyLightText(value) {
  let text = String(value);
  const toolboxIndex = text.search(/Resource Toolbox/i);
  const firstVerseIndex = text.search(/\bVerse\s+1\b/i);
  const firstVersesIndex = text.search(/\bVerses\s+1\b/i);
  if (toolboxIndex >= 0 && firstVerseIndex > toolboxIndex && firstVerseIndex < 12000) {
    text = text.slice(firstVerseIndex);
  } else if (toolboxIndex >= 0 && firstVersesIndex > toolboxIndex && firstVersesIndex < 12000) {
    text = text.slice(firstVersesIndex);
  }
  return text
    .replace(/\bResource Toolbox\b/gi, " ")
    .replace(/\bPrint version\b/gi, " ")
    .replace(/\bOverview\b/gi, " ")
    .replace(/\bCopyright\b/gi, " ")
    .replace(/\bBibliography\b/gi, " ")
    .replace(/\bAdditional Authors\b/gi, " ")
    .replace(/return to ['"‘’]?\s*Top of Page\s*['"‘’]?/gi, " ")
    .replace(/\n\s*Footnotes:\s*$/i, " ");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
