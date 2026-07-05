# Accessibility

`expo-router-sticky-tabs` ships accessible defaults and respects platform settings.

## Roles & state

- The tab strip is `accessibilityRole="tablist"`.
- Each tab button is `accessibilityRole="tab"` with `accessibilityState={{ selected, disabled }}` and an `accessibilityLabel` from the tab title.
- Because tabs are real Expo Router routes, screen-reader focus, deep links and the back gesture behave like any other route.

## Reduce Motion

The library tracks `AccessibilityInfo.isReduceMotionEnabled()` and mirrors it into a `reducedMotion` shared value. When enabled:

- The indicator settles to the active tab instead of spring-tracking the finger.
- Header parallax/fade is neutralized.
- Pass `disableAnimation` to `<Tabs>` to force this everywhere.

## Large fonts / dynamic type

The header uses `dynamicHeight` measurement by default, so it re-measures when text scales up — content is never clipped behind the sticky tab bar because the list top inset tracks the measured height.

## VoiceOver / TalkBack

- Tabs are focusable and announce their selected state.
- `<Tabs.TabBar renderTab>` lets you supply fully custom, still-accessible tab buttons (the `accessibilityState` is provided to your renderer).

## Keyboard & web

Keyboard navigation and web a11y ride on Expo Router's routing; broader web support (including a web pager) is on the roadmap.

## Recommendations

- Provide meaningful `options.title` for every tab (used as the a11y label).
- If you render icon-only tabs, still set `title` so the label is announced.
- Test with VoiceOver (iOS), TalkBack (Android) and Reduce Motion on.
