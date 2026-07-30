import { Button, announce } from '@weather-demo/ui';
import { useVisitorContext } from '../context/visitor-context';
import { copy } from '../copy';

/** Header privacy control (spec 006 FR-008). Always rendered and always enabled, even when
 * nothing is stored — the alternatives (conditional rendering, `disabled`) both remove the
 * control from the keyboard tab sequence at the exact moment a visitor might reach for it, and
 * conditional rendering specifically would unmount the just-pressed button and drop focus to
 * `<body>`. Feedback is given either way so a no-op press never reads as broken. */
export function ForgetPreferencesButton() {
  const { forgetAll } = useVisitorContext();

  return (
    <Button
      variant="secondary"
      className="px-2 py-1 text-xs"
      onPress={() => {
        const hadSomething = forgetAll();
        announce(hadSomething ? copy.preferencesForgotten : copy.preferencesNothingToForget);
      }}
    >
      Forget my saved preferences
    </Button>
  );
}
