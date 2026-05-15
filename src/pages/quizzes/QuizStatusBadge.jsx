import { Badge } from "../../components/ui/badge";

export default function QuizStatusBadge({ quiz }) {
  const now = new Date();
  const startDate = new Date(quiz.start_at);
  const endDate = new Date(quiz.end_at);

  if (quiz.is_paused) {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">
        Paused
      </Badge>
    );
  }
  if (now < startDate) {
    return <Badge variant="secondary">Upcoming</Badge>;
  }
  if (now > endDate) {
    return <Badge variant="outline">Ended</Badge>;
  }
  return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
}
