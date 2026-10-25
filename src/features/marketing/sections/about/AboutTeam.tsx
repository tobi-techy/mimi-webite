import { MediaSplit } from "@/components/ui/MediaSplit";
import { Heading, Label, Lead } from "@/components/ui/Text";
import { founder } from "@/features/marketing/content/about";

export function AboutTeam() {
  return (
    <MediaSplit id="about-team" photo={founder.photo}>
      <Label>03 / Team</Label>
      <Heading size="d2" reveal>
        {founder.name}
      </Heading>
      <p className="x-mono">{founder.role}</p>
      <Lead style={{ marginTop: "16px" }}>{founder.bio}</Lead>
      <div className="x-btns" style={{ marginTop: "24px" }}>
        <a className="x-tlink" href={founder.link.href} target="_blank" rel="noopener">
          {founder.link.label}
        </a>
      </div>
    </MediaSplit>
  );
}
