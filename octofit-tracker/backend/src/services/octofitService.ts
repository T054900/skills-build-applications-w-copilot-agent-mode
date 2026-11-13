import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectIdString(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError('Activity must be an object', 400);

  const { userId, teamId, type, minutes } = input;
  if (
    !isObjectIdString(userId) ||
    !isObjectIdString(teamId) ||
    typeof type !== 'string' ||
    type.trim().length === 0 ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw httpError('Activity requires valid userId, teamId, type, and positive minutes', 400);
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw httpError('Activity user or team was not found', 404);

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError('Team must be an object', 400);

  const { name, mascot } = input;
  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof mascot !== 'string' ||
    mascot.trim().length === 0
  ) {
    throw httpError('Team requires a name and mascot', 400);
  }

  const memberInput = input.members === undefined ? [] : input.members;
  if (!Array.isArray(memberInput)) throw httpError('Team members must be an array', 400);
  const memberIds: string[] = [];
  for (const memberId of memberInput) {
    if (!isObjectIdString(memberId)) {
      throw httpError('Team members must contain valid user IDs', 400);
    }
    memberIds.push(memberId);
  }

  const uniqueMemberIds = [...new Set(memberIds)];
  if (
    uniqueMemberIds.length > 0 &&
    (await User.countDocuments({ _id: { $in: uniqueMemberIds } })) !== uniqueMemberIds.length
  ) {
    throw httpError('One or more team members were not found', 404);
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMemberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map(({ _id, name }) => ({
      teamName: name,
      totalPoints: totalsByTeam.get(_id.toString()) ?? 0,
      rank: 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError('User was not found', 404);

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean(),
    Workout.find().sort({ title: 1 }).lean(),
  ]);
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  const goalMatches = workouts.filter((workout) => workout.focus.trim().toLowerCase() === goalFocus);
  if (goalMatches.length > 0) {
    return goalMatches.map((workout) => ({
      ...workout,
      reason: `Supports your ${user.fitnessGoal} fitness goal.`,
    }));
  }

  if (!recentActivity) return [];
  const activityFocus = recentActivity.type.trim().toLowerCase();
  return workouts
    .filter((workout) => workout.focus.trim().toLowerCase() === activityFocus)
    .map((workout) => ({
      ...workout,
      reason: `Builds on your recent ${recentActivity.type} activity.`,
    }));
}

export { User };
