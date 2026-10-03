import { scientificTextSegments } from "@/lib/discussion";

export default function ScientificText({ text }: { text: string }) {
  return (
    <>
      {scientificTextSegments(text).map((segment, index) => {
        if (segment.script === "subscript") {
          return <sub key={index}>{segment.text}</sub>;
        }
        if (segment.script === "superscript") {
          return <sup key={index}>{segment.text}</sup>;
        }
        return <span key={index}>{segment.text}</span>;
      })}
    </>
  );
}
