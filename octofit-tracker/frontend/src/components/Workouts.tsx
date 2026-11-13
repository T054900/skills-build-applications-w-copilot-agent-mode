import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';
import { useApiResource } from './useApiResource.js';

type Workout = {
  _id?: string;
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};
type WorkoutResponse = { suggestions: Workout[] };
const userEmail = 'mona@example.com';

export default function Workouts() {
  const path = `/api/workouts/suggestions/${encodeURIComponent(userEmail)}`;
  const { data, loading, error } = useApiResource<WorkoutResponse>(path, getJson<WorkoutResponse>);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {loading && <p role="status">Loading workout suggestions...</p>}
      {error && <p role="alert">Unable to load workout suggestions: {error}</p>}
      {data && data.suggestions.length === 0 && <p>No workout suggestions available.</p>}
      {data && data.suggestions.length > 0 && (
        <ul className="list-group">
          {data.suggestions.map((workout, index) => (
            <li className="list-group-item" key={workout._id ?? `${workout.title}-${index}`}>
              <strong>{workout.title}</strong>
              {workout.focus && <span> — {workout.focus}</span>}
              {workout.minutes !== undefined && <span>, {workout.minutes} minutes</span>}
              {workout.difficulty && <span>, {workout.difficulty}</span>}
              {workout.reason && <p className="mb-0">{workout.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
