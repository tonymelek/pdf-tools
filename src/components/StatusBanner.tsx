export function StatusBanner({
  message,
  type,
}: {
  message: string
  type: 'error' | 'success'
}) {
  const classes =
    type === 'error'
      ? 'bg-danger-bg text-danger border border-red-200'
      : 'bg-success-bg text-success border border-green-200'

  return (
    <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${classes}`}>
      {message}
    </div>
  )
}
