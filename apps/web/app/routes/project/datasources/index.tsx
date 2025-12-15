import { Skeleton } from '@qwery/ui/skeleton';

import { useWorkspace } from '~/lib/context/workspace-context';
import { useGetDatasourcesByProjectId } from '~/lib/queries/use-get-datasources';

import { ListDatasources } from '../_components/list-datasources';
import pathsConfig, { createPath } from '~/config/paths.config';
import { Navigate, useParams } from 'react-router';

export default function ProjectDatasourcesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { repositories, workspace } = useWorkspace();
  const datasources = useGetDatasourcesByProjectId(
    repositories.datasource,
    workspace.projectId as string,
  );

  const hasDatasources = datasources.data?.length ?? 0 > 0;

  if (!datasources.isLoading && !hasDatasources) {
    return <Navigate to={createPath(pathsConfig.app.availableSources, slug)} />;
  }

  return (
    <div className="p-2 lg:p-4">
      {datasources.isLoading && <Skeleton className="h-10 w-full" />}

      {!datasources.isLoading && hasDatasources && (
        <ListDatasources datasources={datasources.data || []} />
      )}
    </div>
  );
}
