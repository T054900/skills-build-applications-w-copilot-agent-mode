import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';
import { useApiResource } from './useApiResource.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const { data, loading, error } = useApiResource<ActivityResponse>('/api/activities', getJson<ActivityResponse>);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {loading && <p role="status">Loading activities...</p>}
      {error && <p role="alert">Unable to load activities: {error}</p>}
      {data && data.activities.length === 0 && <p>No activities yet.</p>}
      {data && data.activities.length > 0 && (
        <ul className="list-group">
          {data.activities.map((activity, index) => (
            <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
              <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
