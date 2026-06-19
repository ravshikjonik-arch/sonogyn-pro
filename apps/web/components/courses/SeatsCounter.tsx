type SeatsCounterProps = {
  registered: number;
  maxSeats: number | null;
};

export function SeatsCounter({ registered, maxSeats }: SeatsCounterProps) {
  if (maxSeats == null) {
    return <p className="text-sm text-slate-500">Записано: {registered}</p>;
  }
  const remaining = Math.max(0, maxSeats - registered);
  return (
    <p className="text-sm">
      <span className="font-medium text-[var(--clinical-foreground)]">Мест: </span>
      {remaining > 0 ? (
        <span className="text-emerald-700">осталось {remaining} из {maxSeats}</span>
      ) : (
        <span className="text-red-600">мест нет ({registered}/{maxSeats})</span>
      )}
    </p>
  );
}
