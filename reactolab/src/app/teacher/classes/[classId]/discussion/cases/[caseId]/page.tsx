import DiscussionCaseEditor from "@/components/teacher/DiscussionCaseEditor";

export default function DiscussionCaseEditorPage({
  params,
  searchParams,
}: {
  params: { classId: string; caseId: string };
  searchParams: { template?: string };
}) {
  return (
    <DiscussionCaseEditor
      classId={params.classId}
      caseId={params.caseId}
      templateId={searchParams.template}
    />
  );
}
