import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';
import { useApiResource } from './useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, loading, error } = useApiResource<LeaderboardResponse>('/api/leaderboard', getJson<LeaderboardResponse>);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {loading && <p role="status">Loading leaderboard...</p>}
      {error && <p role="alert">Unable to load leaderboard: {error}</p>}
      {data && data.leaderboard.length === 0 && <p>No leaderboard scores yet.</p>}
      {data && data.leaderboard.length > 0 && (
        <ol className="list-group list-group-numbered">
          {data.leaderboard.map((entry) => (
            <li className="list-group-item" key={`${entry.rank}-${entry.teamName}`}>
              {entry.teamName}: {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    </CapabilityCard>
  );
}
