import type { Metadata } from "next";
import Link from "next/link";
import PublicInfoPage from "@/components/PublicInfoPage";

const doctrineConcernHref =
  "/feedback?category=Resource%20issue&context=Doctrinal%20basis%20or%20resource%20review";

export const metadata: Metadata = {
  title: "Doctrinal Basis",
  description:
    "The working doctrinal basis used to review resources in Father's Business Bible Study.",
  alternates: { canonical: "/doctrine" },
};

export default function DoctrinePage() {
  return (
    <PublicInfoPage
      eyebrow="Scripture-first review"
      title="A clear basis for a carefully reviewed library."
      intro="Scripture is the final authority. This working doctrinal basis states how Father's Business Bible Study reviews, labels, recommends, and restricts supporting books, commentary, lessons, sermons, and media."
    >
      <section>
        <h2>Scripture</h2>
        <p>
          The Bible is the inspired, preserved, authoritative Word of God and the final rule for faith and practice.
          Scripture quotations and primary reading in the app use the King James Bible. Study tools must support the
          Bible text rather than quietly correcting or undermining it.
        </p>
      </section>

      <section>
        <h2>God and Jesus Christ</h2>
        <p>
          There is one true and living God, eternally existing in three persons: the Father, the Son, and the Holy
          Ghost. The Lord Jesus Christ is the eternal Son of God, fully God and fully man. He was born of a virgin,
          lived without sin, died as the substitutionary sacrifice for sinners, rose bodily from the dead, ascended
          to the Father, and will return.
        </p>
      </section>

      <section>
        <h2>The Gospel and salvation</h2>
        <p>
          All people are sinful and accountable to God. Christ died for our sins, was buried, and rose again.
          Salvation is by grace through faith in the Lord Jesus Christ, not by works, sacraments, church membership,
          baptism, or personal merit. The believer has eternal life in Christ and is kept by the power of God.
        </p>
      </section>

      <section>
        <h2>The local church</h2>
        <p>
          The local church is central to worship, discipleship, preaching, fellowship, missions, ordinances, and
          Christian service. The app&apos;s working position is believer&apos;s baptism by immersion and the Lord&apos;s
          Supper as a memorial ordinance. Neither ordinance is a means of salvation.
        </p>
      </section>

      <section>
        <h2>Interpretation and future events</h2>
        <p>
          The app is Baptist-friendly and dispensational-friendly, keeps Israel and the Church distinct, and favors
          a literal, premillennial understanding of prophecy. Prophecy resources should distinguish clear doctrine
          from inference and avoid date-setting, sensationalism, and needless speculation.
        </p>
      </section>

      <section>
        <h2>Creation and Christian living</h2>
        <p>
          God created the heavens and the earth, and man was created in the image of God. Christian living should be
          marked by faith, prayer, holiness, obedience, love, local church faithfulness, family responsibility,
          evangelism, missions, service, humility, and growth in Scripture.
        </p>
      </section>

      <section>
        <h2>How differences are handled</h2>
        <p>
          A public-domain date or a respected name does not automatically make a resource suitable. Human reviewers
          compare each resource with this basis and may mark it Core Library, Recommended, Historical Collection,
          Comparative Study, Needs Review, or Do Not Include.
        </p>
        <p>
          Differences on secondary matters do not automatically disqualify a historically useful work. Perspective
          and caution labels explain why it is included and where readers should exercise discernment. Inclusion is
          not blanket endorsement of every conclusion in a resource.
        </p>
      </section>

      <section>
        <h2>Human review remains required</h2>
        <p>
          Automation may help organize candidate material, but it does not create doctrine or grant approval.
          Trusted study data requires human review, source evidence, rights evidence, perspective notes, and a clear
          recommended use.
        </p>
        <div className="public-info-actions">
          <Link href="/partners">Review the author partnership path</Link>
          <Link href="/rights">Read the content-rights policy</Link>
          <Link href={doctrineConcernHref}>Report a doctrinal or resource concern</Link>
        </div>
      </section>
    </PublicInfoPage>
  );
}
