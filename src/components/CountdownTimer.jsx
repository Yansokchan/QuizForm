export default function CountdownTimer({ secondsLeft }) {
  const display = Math.max(0, secondsLeft)
  return <strong>{display}s</strong>
}
