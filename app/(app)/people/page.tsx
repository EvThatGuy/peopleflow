import { PageHeader } from '@/components/layout/page-header';
import { PeopleDirectory } from '@/components/people/people-directory';

export default function PeoplePage() {
  return (
    <div className="mx-auto max-w-[1320px] px-6 pb-16 pt-8">
      <PageHeader
        title="People"
        description="Everyone in your organization. Filter by department, location, or status."
      />
      <div className="mt-7">
        <PeopleDirectory />
      </div>
    </div>
  );
}
