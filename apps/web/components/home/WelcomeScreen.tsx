type Props = {
  onStart: () => void;
};

/** First screen: the brand card, then one action into the cabinet. */
export function WelcomeScreen({ onStart }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07041a] text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/sonogyn-avatar.png"
        alt="SonoGyn Pro. Интеллектуальная платформа для врачей."
        className="min-h-0 w-full flex-1 object-contain object-center"
      />
      <div className="px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={onStart}
          className="mx-auto block h-14 w-full max-w-sm rounded-2xl bg-white text-base font-semibold text-[#07041a]"
        >
          Начать
        </button>
      </div>
    </div>
  );
}
